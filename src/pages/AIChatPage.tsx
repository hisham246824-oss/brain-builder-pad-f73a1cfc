import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Bot, User, Sparkles, Image, Camera, X, Loader2, ChevronDown, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIChat } from '@/hooks/useAIChat';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatBackground } from '@/components/chat/ChatBackground';

const LOADING_MESSAGES = ['Analyzing...', 'Thinking...', 'Generating response...', 'Processing...'];

function TypingIndicator() {
  const [msgIndex, setMsgIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
      <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="bg-card/80 backdrop-blur-sm border border-border/30 rounded-2xl rounded-tl-md px-4 py-3">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-muted-foreground italic"
        >
          {LOADING_MESSAGES[msgIndex]}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function AIChatPage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const {
    messages, isSending, sendMessage,
    conversations, currentConversation, setCurrentConversation,
  } = useAIChat();

  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [visibleConvCount, setVisibleConvCount] = useState(3);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Auto-load last conversation on mount if none selected
  useEffect(() => {
    if (!currentConversation && conversations.length > 0) {
      setCurrentConversation(conversations[0]);
    }
  }, [conversations, currentConversation, setCurrentConversation]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && attachedImages.length === 0) || isSending) return;
    const message = input;
    const images = [...attachedImages];
    setInput('');
    setAttachedImages([]);
    await sendMessage(message, images.length > 0 ? images : undefined);
  }, [input, attachedImages, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        if (result) setAttachedImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const removeImage = (index: number) => setAttachedImages(prev => prev.filter((_, i) => i !== index));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center relative">
        <ChatBackground />
        <div className="relative z-10">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{t('signInToUse')} AI</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-120px)] -mx-4 md:-mx-6 -my-6 md:-my-8">
      <ChatBackground />
      
      {/* Top bar with recent chats & info */}
      <div className="relative z-10 px-[7%] pt-3 pb-1 flex items-center gap-2">
        <button
          onClick={() => { setShowRecentChats(!showRecentChats); setVisibleConvCount(3); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2 py-1"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", showRecentChats && "rotate-180")} />
          <span>{currentConversation?.title || t('aiStudyChat')}</span>
        </button>
        <button
          onClick={() => { setCurrentConversation(null as any); }}
          className="ml-auto text-xs text-primary hover:text-primary/80 font-medium"
        >
          + New Chat
        </button>
      </div>

      {/* Recent chats dropdown */}
      <AnimatePresence>
        {showRecentChats && conversations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 px-[7%] overflow-hidden"
          >
            <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-xl p-2 space-y-0.5">
              {conversations.slice(0, visibleConvCount).map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setCurrentConversation(conv); setShowRecentChats(false); }}
                  className={cn(
                    "w-full text-left text-sm px-3 py-2 rounded-lg transition-colors truncate",
                    currentConversation?.id === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                  )}
                >
                  {conv.title}
                </button>
              ))}
              {visibleConvCount < conversations.length && (
                <button
                  onClick={() => setVisibleConvCount(prev => prev + 3)}
                  className="w-full text-center text-xs text-primary py-1.5 hover:bg-muted/30 rounded-lg"
                >
                  <ChevronDown className="h-3 w-3 mx-auto" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="px-[7%]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mx-auto">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-foreground">{t('howCanIHelp')}</h2>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">{t('aiDesc')}</p>
              </motion.div>
            </div>
          ) : (
            <div className="py-6 space-y-5">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={cn("flex gap-3", message.role === 'user' ? "justify-end" : "justify-start")}
                >
                  {/* AI Avatar - left side */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center shadow-sm mt-1 bg-gradient-to-br from-primary to-primary/60">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}

                  {/* Message content */}
                  <div className={cn(
                    "max-w-[85%]",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                      : "px-1 py-1"
                  )}>
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {message.images.map((img, i) => (
                          <img key={i} src={img} alt={`Attached ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-border/50" />
                        ))}
                      </div>
                    )}

                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none" dir="auto">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            hr: () => <hr className="my-4 border-border/50" />,
                            h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
                            h4: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-1 text-foreground">{children}</h4>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                            li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            p: ({ children }) => <p className="my-2 text-sm leading-relaxed" dir="auto">{children}</p>,
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3">
                                <table className="min-w-full border border-border/50 rounded-lg text-sm">{children}</table>
                              </div>
                            ),
                            th: ({ children }) => <th className="border border-border/50 px-3 py-2 bg-muted/30 font-medium text-left">{children}</th>,
                            td: ({ children }) => <td className="border border-border/50 px-3 py-2">{children}</td>,
                            code: ({ className, children }) => {
                              const isInline = !className;
                              return isInline ? (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                              ) : (
                                <code className="block bg-muted/50 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2">{children}</code>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap" dir="auto">{message.content}</p>
                    )}
                  </div>

                  {/* User Avatar - right side */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center shadow-sm mt-1 bg-secondary border border-border/50">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isSending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="relative z-10 px-[7%] pb-4 pt-2">
        <AnimatePresence>
          {attachedImages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mb-2 p-2 bg-card/80 backdrop-blur-sm rounded-xl border border-border/30">
              {attachedImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Attached ${i + 1}`} className="h-16 w-16 rounded-lg object-cover border border-border/50" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end gap-0 bg-card/90 backdrop-blur-md rounded-full border border-border/50 shadow-soft px-2 py-1.5">
          <div className="relative">
            <button onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all shrink-0">
              <Plus className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute bottom-12 left-0 bg-card border border-border/50 rounded-xl shadow-soft p-1.5 min-w-[140px] z-20">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                    <Image className="h-4 w-4 text-primary" /><span>{t('uploadImage')}</span>
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted/50 rounded-lg transition-colors">
                    <Camera className="h-4 w-4 text-primary" /><span>{t('takePhoto')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('askAnything')}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-2.5 px-2 max-h-[120px] min-h-[40px] leading-relaxed"
            rows={1}
            dir="auto"
          />

          <button onClick={handleSend} disabled={(!input.trim() && attachedImages.length === 0) || isSending}
            className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-all",
              (input.trim() || attachedImages.length > 0) && !isSending
                ? "bg-foreground text-background shadow-md hover:opacity-90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rotate-[-45deg]" />}
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
      </div>
    </div>
  );
}
