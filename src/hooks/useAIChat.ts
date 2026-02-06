import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  images?: string[]; // base64 image data
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function useAIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useUserSettings();
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
      if (!error) setConversations(data || []);
      setIsLoading(false);
    };
    fetchConversations();
  }, [user]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!currentConversation) { setMessages([]); return; }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('conversation_id', currentConversation.id)
        .order('created_at', { ascending: true });
      if (data) {
        setMessages(data.map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
      }
    };
    fetchMessages();
  }, [currentConversation]);

  const createConversation = useCallback(async (title: string = 'New Chat') => {
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
  }, [user, toast]);

  const deleteConversation = useCallback(async (id: string) => {
    const { error } = await supabase.from('ai_chat_conversations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete conversation', variant: 'destructive' });
      return;
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversation, toast]);

  const renameConversation = useCallback(async (id: string, newTitle: string) => {
    const { error } = await supabase
      .from('ai_chat_conversations')
      .update({ title: newTitle })
      .eq('id', id);
    if (!error) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    if (!user || (!content.trim() && (!images || images.length === 0))) return;

    let conversation = currentConversation;
    if (!conversation) {
      conversation = await createConversation(content.slice(0, 50) || 'Image Analysis');
      if (!conversation) return;
    }

    setIsSending(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      images,
    };
    setMessages(prev => [...prev, userMessage]);

    // Save user message to database
    await supabase.from('ai_chat_messages').insert({
      conversation_id: conversation.id,
      user_id: user.id,
      role: 'user',
      content: images && images.length > 0 ? `${content}\n[${images.length} image(s) attached]` : content,
    });

    try {
      // Build messages for API - include images as multimodal content
      const apiMessages = [...messages, userMessage].map(m => {
        if (m.images && m.images.length > 0) {
          const contentParts: any[] = [];
          if (m.content) {
            contentParts.push({ type: 'text', text: m.content });
          }
          m.images.forEach(img => {
            contentParts.push({
              type: 'image_url',
              image_url: { url: img },
            });
          });
          return { role: m.role, content: contentParts };
        }
        return { role: m.role, content: m.content };
      });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          customPrompt: settings?.ai_custom_prompt || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get AI response');
      }

      // Stream the response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';
      let streamDone = false;

      const assistantId = crypto.randomUUID();

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { id: assistantId, role: 'assistant', content: assistantSoFar, created_at: new Date().toISOString() }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantSoFar += delta;
              setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
            }
          } catch { /* ignore */ }
        }
      }

      // Save AI message to database
      if (assistantSoFar) {
        await supabase.from('ai_chat_messages').insert({
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'assistant',
          content: assistantSoFar,
        });
      }

      // Update conversation title if first message
      if (messages.length === 0) {
        const title = content.slice(0, 50) || 'Image Analysis';
        await supabase
          .from('ai_chat_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversation.id);
        setConversations(prev =>
          prev.map(c => c.id === conversation!.id ? { ...c, title } : c)
        );
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [user, currentConversation, messages, settings, createConversation, toast]);

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    isLoading,
    isSending,
    createConversation,
    deleteConversation,
    renameConversation,
    sendMessage,
  };
}
