import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useAIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    
    const fetchConversations = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
      setIsLoading(false);
    };

    fetchConversations();
  }, [user]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages((data || []).map(m => ({
          ...m,
          role: m.role as 'user' | 'assistant'
        })));
      }
    };

    fetchMessages();
  }, [currentConversation]);

  const createConversation = async (title: string = 'New Chat') => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('ai_chat_conversations')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create conversation', variant: 'destructive' });
      return null;
    }

    setConversations(prev => [data, ...prev]);
    setCurrentConversation(data);
    setMessages([]);
    return data;
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('ai_chat_conversations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
      return;
    }

    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    let conversation = currentConversation;
    
    // Create new conversation if none exists
    if (!conversation) {
      conversation = await createConversation(content.slice(0, 50));
      if (!conversation) return;
    }

    setIsSending(true);

    // Add user message optimistically
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    await supabase.from('ai_chat_messages').insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'user',
      content,
    });

    try {
      // Call AI edge function
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const aiContent = response.data?.response || 'Sorry, I could not generate a response.';

      // Add AI message
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await supabase.from('ai_chat_messages').insert({
        conversation_id: conversation.id,
        user_id: user.id,
        role: 'assistant',
        content: aiContent,
      });

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        await supabase
          .from('ai_chat_conversations')
          .update({ title: content.slice(0, 50), updated_at: new Date().toISOString() })
          .eq('id', conversation.id);
        
        setConversations(prev => 
          prev.map(c => c.id === conversation!.id ? { ...c, title: content.slice(0, 50) } : c)
        );
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    isLoading,
    isSending,
    createConversation,
    deleteConversation,
    sendMessage,
  };
}
