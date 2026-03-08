import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Home, X, GraduationCap, Table2, Timer, BookA, Bot, Mail, Settings, Star, Heart, Zap, Crown, Flame, Rocket, Diamond, Info, ChevronUp, Trash2, MessageSquare, Pencil, Check, Lightbulb, ListTodo, Headphones } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAIChat } from '@/hooks/useAIChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { sidebarInfoMap } from '@/components/sidebar/SidebarInfoTooltips';
import { SidebarInfoModal } from '@/components/sidebar/SidebarInfoModal';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_NAV_ITEMS = [
  { id: 'home', to: '/', icon: Home },
  { id: 'materials', to: '/materials', icon: BookOpen },
  { id: 'vocabulary', to: '/vocabulary', icon: BookA },
  { id: 'ai-chat', to: '/ai-chat', icon: Bot },
  { id: 'table-creator', to: '/table-creator', icon: Table2 },
  { id: 'pomodoro', to: '/pomodoro', icon: Timer },
  { id: 'suggestions', to: '/suggestions', icon: Lightbulb },
  { id: 'todos', to: '/todos', icon: ListTodo },
  { id: 'messages', to: '/messages', icon: Mail },
];

const LABEL_KEYS: Record<string, string> = {
  home: 'home', materials: 'studyMaterials', vocabulary: 'vocabulary',
  'ai-chat': 'aiStudyChat', 'table-creator': 'createTable', pomodoro: 'pomodoroTimer',
  suggestions: 'suggestions', todos: 'todoList', messages: 'messages',
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, heart: Heart, zap: Zap, crown: Crown, flame: Flame, rocket: Rocket, diamond: Diamond,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary', red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
  pink: 'bg-pink-500', slate: 'bg-slate-500',
};

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { hasUnread, unreadCount } = useAdminMessages();
  const { settings } = useUserSettings();
  const { conversations, currentConversation, setCurrentConversation, deleteConversation, renameConversation } = useAIChat();
  
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const getSortedNavItems = () => {
    if (!settings?.sidebar_order || settings.sidebar_order.length === 0) return BASE_NAV_ITEMS;
    const orderMap = new Map(settings.sidebar_order.map((id, index) => [id, index]));
    return [...BASE_NAV_ITEMS].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? 999;
      const bIndex = orderMap.get(b.id) ?? 999;
      return aIndex - bIndex;
    });
  };

  const navItems = getSortedNavItems();
  const messagesItem = navItems.find(item => item.id === 'messages');
  const otherNavItems = navItems.filter(item => item.id !== 'messages');
  const messagesAtTop = hasUnread;

  const handleProfileClick = () => { navigate('/settings'); onClose(); };

  const IconComponent = settings?.avatar_icon ? ICON_MAP[settings.avatar_icon] : null;
  const avatarLetter = settings?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const avatarColorClass = COLOR_MAP[settings?.avatar_color || 'primary'] || 'bg-primary';

  const handleConversationClick = (conv: any) => {
    setCurrentConversation(conv);
    navigate('/ai-chat');
    onClose();
  };

  const handleStartRename = (id: string, title: string) => {
    setEditingConvId(id);
    setEditTitle(title);
  };

  const handleConfirmRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleAuthClick = () => {
    navigate('/auth');
    onClose();
  };

  const renderNavItem = (item: typeof BASE_NAV_ITEMS[0]) => {
    const isAiChat = item.id === 'ai-chat';
    const info = sidebarInfoMap[item.id];
    const label = t(LABEL_KEYS[item.id] || item.id);

    return (
      <li key={item.to} className="relative">
        <div className="flex items-center gap-0">
          <NavLink
            to={item.to}
            onClick={onClose}
            className="flex-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{label}</span>
          </NavLink>
          
          <div className="flex items-center gap-0.5 pr-1">
            {info && (
              <button
                onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === item.id ? null : item.id); }}
                className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
            {isAiChat && user && conversations.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowConversations(!showConversations); }}
                className={cn(
                  "p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all",
                  showConversations && "text-sidebar-foreground/70 bg-sidebar-accent/50"
                )}
              >
                <ChevronUp className={cn("h-3.5 w-3.5 transition-transform", showConversations ? "rotate-180" : "")} />
              </button>
            )}
          </div>
        </div>

        {/* Conversations panel for AI Chat */}
        <AnimatePresence>
          {isAiChat && showConversations && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-2 mb-2 overflow-hidden"
            >
              <ScrollArea className="max-h-48">
                <div className="space-y-0.5 px-2 py-1">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all text-xs",
                        currentConversation?.id === conv.id
                          ? "bg-sidebar-primary/10 text-sidebar-primary"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/80"
                      )}
                    >
                      <MessageSquare className="h-3 w-3 flex-shrink-0" />
                      
                      {editingConvId === conv.id ? (
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 bg-transparent border-b border-sidebar-foreground/30 outline-none text-xs py-0.5"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmRename(conv.id); }}
                          />
                          <button onClick={() => handleConfirmRename(conv.id)} className="p-0.5 hover:text-sidebar-primary">
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => handleConversationClick(conv)} className="flex-1 truncate text-left">
                            {conv.title}
                          </button>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartRename(conv.id, conv.title); }}
                              className="p-0.5 hover:text-sidebar-primary"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                              className="p-0.5 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </li>
    );
  };

  // Sidebar slide direction based on RTL
  const slideFrom = isRTL ? { x: '100%' } : { x: '-100%' };
  const slideTo = { x: 0 };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.aside
              initial={slideFrom}
              animate={slideTo}
              exit={slideFrom}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className={cn(
                "fixed top-0 z-50 h-full w-72 bg-sidebar shadow-soft gpu-accelerated will-change-transform",
                isRTL ? "right-0 rounded-l-3xl" : "left-0 rounded-r-3xl"
              )}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-sidebar-border p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
                      <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold text-sidebar-foreground">StudyHub</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                  <ul className="space-y-1">
                    {user && messagesAtTop && messagesItem && (
                      <motion.li
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: [1, 1.02, 1] }}
                        transition={{ scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
                      >
                        <div className="flex items-center gap-0">
                          <NavLink
                            to={messagesItem.to}
                            onClick={onClose}
                            className={cn("flex-1 relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all", "bg-primary/10 text-primary font-medium")}
                            activeClassName="bg-primary text-primary-foreground"
                          >
                            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}>
                              <Mail className="h-5 w-5" />
                            </motion.div>
                            <span>{t('messages')}</span>
                            {unreadCount > 0 && (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                                {unreadCount}
                              </span>
                            )}
                          </NavLink>
                          {sidebarInfoMap.messages && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveInfo(activeInfo === 'messages' ? null : 'messages'); }}
                              className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-all pr-1"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </motion.li>
                    )}

                    {otherNavItems.map(item => renderNavItem(item))}

                    {user && !messagesAtTop && messagesItem && renderNavItem(messagesItem)}
                  </ul>
                </nav>

                <div className="border-t border-sidebar-border p-4">
                  {user ? (
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium shrink-0", avatarColorClass)}>
                        {IconComponent ? <IconComponent className="h-5 w-5" /> : avatarLetter}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate text-sidebar-foreground">{settings?.display_name || t('myProfile')}</p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
                      </div>
                      <Settings className="h-5 w-5 shrink-0 text-sidebar-foreground/50" />
                    </button>
                  ) : (
                    <button
                      onClick={handleAuthClick}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">?</div>
                      <span>{t('signIn')}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {activeInfo && sidebarInfoMap[activeInfo] && (
        <SidebarInfoModal
          isOpen={true}
          onClose={() => setActiveInfo(null)}
          title={sidebarInfoMap[activeInfo].title}
          description={sidebarInfoMap[activeInfo].description}
          itemId={activeInfo}
        />
      )}
    </>
  );
}
