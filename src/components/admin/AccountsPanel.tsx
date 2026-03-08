import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, UserCircle, Shield, ShieldAlert, Trash2, ChevronRight, 
  Send, MessageSquare, Crown, Activity, BookOpen, Languages, 
  Clock, Eye, Globe, ArrowLeft, Ban, Unlock, ChevronDown, ChevronUp,
  Edit, X, Save, Mail, CheckCircle2, XCircle, Timer, ListTodo,
  UserCheck, UserX, Fingerprint, CalendarDays, MapPin, BarChart3,
  FileText, Zap, TrendingUp, Hash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  avatar_icon: string | null;
  role: string;
  is_online: boolean;
  is_blocked: boolean;
  blocked_until: string | null;
  block_reason: string | null;
  country: string | null;
  language: string | null;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', ar: 'العربية', fr: 'Français', zh: '中文',
  ja: '日本語', hi: 'हिन्दी', es: 'Español', pt: 'Português',
};

interface UserActivity {
  materials_count: number;
  lessons_count: number;
  vocabulary_count: number;
  suggestions_count: number;
  todos_count: number;
  total_visits: number;
  total_duration: number;
  last_active: string | null;
  most_visited_page: string | null;
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

interface AccountsPanelProps {
  users: User[];
  isLoading: boolean;
  onDeleteUser: (userId: string, password: string) => Promise<boolean>;
  onPromoteToAdmin: (userId: string, password: string) => Promise<boolean>;
  onDemoteFromAdmin: (userId: string) => Promise<boolean>;
  onSendBroadcast: (title: string, content: string) => Promise<boolean>;
  fetchUserActivity: (userId: string) => Promise<UserActivity>;
  onBlockUser: (userId: string, hours: number, reason: string) => Promise<boolean>;
  onUnblockUser: (userId: string) => Promise<boolean>;
  onSendPrivateMessage: (userId: string, title: string, content: string) => Promise<boolean>;
  onGetPrivateMessages: (userId: string) => Promise<PrivateMessage[]>;
  onUpdatePrivateMessage: (id: string, title: string, content: string) => Promise<boolean>;
  onDeletePrivateMessage: (id: string) => Promise<boolean>;
  onImpersonateUser?: (userId: string) => void;
}

const pageNameMap: Record<string, string> = {
  '/': 'Home', '/materials': 'Materials', '/vocabulary': 'Vocabulary',
  '/flashcards': 'Flashcards', '/pomodoro': 'Pomodoro', '/ai-chat': 'AI Chat',
  '/table-creator': 'Tables', '/messages': 'Messages', '/suggestions': 'Suggestions',
  '/settings': 'Settings', '/todos': 'To-Do List',
};

const AVATAR_COLORS: Record<string, string> = {
  primary: 'hsl(175, 60%, 35%)',
  blue: 'hsl(220, 70%, 50%)',
  purple: 'hsl(270, 60%, 55%)',
  pink: 'hsl(330, 70%, 55%)',
  red: 'hsl(0, 70%, 55%)',
  orange: 'hsl(25, 80%, 55%)',
  yellow: 'hsl(45, 80%, 50%)',
  green: 'hsl(145, 60%, 40%)',
  teal: 'hsl(175, 60%, 35%)',
  indigo: 'hsl(240, 60%, 55%)',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function BlockTimer({ blockedUntil }: { blockedUntil: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(blockedUntil).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [blockedUntil]);
  return <span className="font-mono text-destructive text-sm">{remaining}</span>;
}

export function AccountsPanel({
  users, isLoading, onDeleteUser, onPromoteToAdmin, onDemoteFromAdmin,
  onSendBroadcast, fetchUserActivity, onBlockUser, onUnblockUser,
  onSendPrivateMessage, onGetPrivateMessages, onUpdatePrivateMessage,
  onDeletePrivateMessage, onImpersonateUser,
}: AccountsPanelProps) {
  const { isSuperAdmin } = useUserRole();
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  
  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Promote
  const [promoteTarget, setPromoteTarget] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  
  // Block
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [showInlineBlock, setShowInlineBlock] = useState(false);
  const [blockHours, setBlockHours] = useState('24');
  const [blockReason, setBlockReason] = useState('');
  const blockFormRef = useRef<HTMLDivElement>(null);
  
  // Private Messages
  const [pmTarget, setPmTarget] = useState<User | null>(null);
  const [pmTitle, setPmTitle] = useState('');
  const [pmContent, setPmContent] = useState('');
  const [pmSending, setPmSending] = useState(false);
  const [pmHistory, setPmHistory] = useState<PrivateMessage[]>([]);
  const [showPmHistory, setShowPmHistory] = useState(false);
  const [editingPm, setEditingPm] = useState<string | null>(null);
  const [editPmTitle, setEditPmTitle] = useState('');
  const [editPmContent, setEditPmContent] = useState('');

  let filteredUsers = users.filter(u => {
    const matchesSearch = u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'online' && u.is_online) ||
      (filterStatus === 'offline' && !u.is_online) ||
      (filterStatus === 'blocked' && u.is_blocked);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Sort
  filteredUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'name') return (a.display_name || '').localeCompare(b.display_name || '');
    if (sortBy === 'active') return (b.last_sign_in_at || '').localeCompare(a.last_sign_in_at || '');
    return 0;
  });

  const handleViewActivity = useCallback(async (u: User) => {
    setViewingProfile(u);
    setActivityLoading(true);
    try {
      const activity = await fetchUserActivity(u.id);
      setUserActivity(activity);
    } catch { setUserActivity(null); }
    setActivityLoading(false);
  }, [fetchUserActivity]);

  const handleSendPM = async () => {
    if (!pmTarget || !pmContent.trim()) return;
    setPmSending(true);
    const success = await onSendPrivateMessage(pmTarget.id, pmTitle.trim(), pmContent.trim());
    if (success) {
      setPmTitle('');
      setPmContent('');
      // Refresh history
      const msgs = await onGetPrivateMessages(pmTarget.id);
      setPmHistory(msgs);
    }
    setPmSending(false);
  };

  const loadPmHistory = async (userId: string) => {
    const msgs = await onGetPrivateMessages(userId);
    setPmHistory(msgs);
    setShowPmHistory(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget || !deletePassword || deleteConfirmText !== 'DELETE') return;
    const success = await onDeleteUser(deleteTarget.id, deletePassword);
    if (success) {
      setDeleteTarget(null);
      setDeletePassword('');
      setDeleteConfirmText('');
      setViewingProfile(null);
    }
  };

  const handlePromoteUser = async () => {
    if (!promoteTarget || !adminPassword) return;
    const success = await onPromoteToAdmin(promoteTarget.id, adminPassword);
    if (success) { setPromoteTarget(null); setAdminPassword(''); }
  };

  const handleBlockUser = async () => {
    if (!blockTarget) return;
    await onBlockUser(blockTarget.id, parseInt(blockHours), blockReason);
    setBlockTarget(null);
    setBlockHours('24');
    setBlockReason('');
  };

  const getAvatarColor = (color: string | null) => AVATAR_COLORS[color || 'primary'] || AVATAR_COLORS.primary;

  const getRoleIcon = (role: string) => {
    if (role === 'super_admin') return <Crown className="h-3.5 w-3.5 text-yellow-500" />;
    if (role === 'admin') return <Shield className="h-3.5 w-3.5 text-blue-500" />;
    return null;
  };

  const getRoleBadge = (role: string) => {
    const colors = role === 'super_admin' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : role === 'admin' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-secondary text-muted-foreground border-border';
    const label = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User';
    return <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold', colors)}>{getRoleIcon(role)} {label}</span>;
  };

  const onlineCount = users.filter(u => u.is_online).length;
  const blockedCount = users.filter(u => u.is_blocked).length;

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />)}</div>;
  }

  // Full profile view
  if (viewingProfile) {
    const totalContent = userActivity ? userActivity.materials_count + userActivity.vocabulary_count + userActivity.lessons_count + userActivity.todos_count : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setViewingProfile(null); setUserActivity(null); setPmTarget(null); setShowPmHistory(false); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold text-foreground">User Profile</h2>
          <div className="ml-auto flex gap-2">
            {viewingProfile.is_online ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />Active Now</span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-muted-foreground" />Last seen {formatTimeAgo(viewingProfile.last_sign_in_at)}</span>
            )}
          </div>
        </div>

        {/* User header card */}
        <Card className="overflow-hidden">
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${getAvatarColor(viewingProfile.avatar_color)}, ${getAvatarColor(viewingProfile.avatar_color)}88)` }} />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ backgroundColor: getAvatarColor(viewingProfile.avatar_color) }}>
                  {viewingProfile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card", viewingProfile.is_online ? "bg-green-500" : "bg-muted-foreground")} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{viewingProfile.display_name || 'User'}</h3>
                <p className="text-xs text-muted-foreground font-mono">{viewingProfile.id.slice(0, 8)}...</p>
                <div className="mt-1 flex items-center gap-2">
                  {getRoleBadge(viewingProfile.role)}
                  {viewingProfile.is_blocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive border border-destructive/20">
                      <Ban className="h-3 w-3" /> Blocked
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1 justify-end"><CalendarDays className="h-3 w-3" /> Joined {new Date(viewingProfile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                {viewingProfile.country && (
                  <p className="flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" /> {viewingProfile.country}</p>
                )}
                {viewingProfile.avatar_color && (
                  <p className="flex items-center gap-1 justify-end">
                    <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: getAvatarColor(viewingProfile.avatar_color) }} />
                    Profile: {viewingProfile.avatar_color}
                  </p>
                )}
                {viewingProfile.language && (
                  <p className="flex items-center gap-1 justify-end">
                    <Globe className="h-3 w-3" /> {LANGUAGE_NAMES[viewingProfile.language] || viewingProfile.language}
                  </p>
                )}
              </div>
            </div>

            {viewingProfile.is_blocked && viewingProfile.blocked_until && (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 p-3">
                <Timer className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Account Blocked</p>
                  <p className="text-xs text-muted-foreground">{viewingProfile.block_reason || 'No reason provided'}</p>
                </div>
                <div className="ml-auto"><BlockTimer blockedUntil={viewingProfile.blocked_until} /></div>
                <Button variant="outline" size="sm" onClick={() => onUnblockUser(viewingProfile.id)} className="text-green-600">
                  <Unlock className="h-3.5 w-3.5 mr-1" /> Unblock
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Stats */}
        {activityLoading ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />)}
          </div>
        ) : userActivity ? (
          <>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              {[
                { label: 'Materials', value: userActivity.materials_count, icon: BookOpen, color: 'text-blue-500' },
                { label: 'Vocabulary', value: userActivity.vocabulary_count, icon: Languages, color: 'text-purple-500' },
                { label: 'Tasks', value: userActivity.todos_count, icon: ListTodo, color: 'text-orange-500' },
                { label: 'Page Visits', value: userActivity.total_visits, icon: Globe, color: 'text-green-500' },
                { label: 'Total Time', value: formatDuration(userActivity.total_duration), icon: Clock, color: 'text-teal-500' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="rounded-xl bg-secondary p-2.5"><stat.icon className={cn('h-5 w-5', stat.color)} /></div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Engagement bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Content Engagement</span>
                  <span className="text-xs text-muted-foreground">{totalContent} items created</span>
                </div>
                <Progress value={Math.min(totalContent * 5, 100)} className="h-2" />
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Activity Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Lessons Created</span><span className="font-semibold">{userActivity.lessons_count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Suggestions Sent</span><span className="font-semibold">{userActivity.suggestions_count}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Status</span>
                    <span className={cn("font-semibold", viewingProfile.is_online ? "text-green-600" : "text-muted-foreground")}>
                      {viewingProfile.is_online ? '🟢 Active' : '⚫ Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Activity</span><span className="font-semibold">{formatTimeAgo(userActivity.last_active)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Most Visited</span><span className="font-semibold">{pageNameMap[userActivity.most_visited_page || ''] || userActivity.most_visited_page || 'N/A'}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {/* Impersonate */}
                  {onImpersonateUser && viewingProfile.role !== 'super_admin' && (
                    <Button variant="outline" className="w-full justify-start gap-2 text-primary" onClick={() => onImpersonateUser(viewingProfile.id)}>
                      <Fingerprint className="h-4 w-4" /> Register as User
                    </Button>
                  )}
                  
                  {/* Private Message */}
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setPmTarget(viewingProfile); setShowPmHistory(false); }}>
                    <Mail className="h-4 w-4" /> Send Private Message
                  </Button>

                  {/* Block/Unblock */}
                  {viewingProfile.role !== 'super_admin' && (
                    viewingProfile.is_blocked ? (
                      <Button variant="outline" className="w-full justify-start gap-2 text-green-600" onClick={() => onUnblockUser(viewingProfile.id)}>
                        <Unlock className="h-4 w-4" /> Unblock User
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full justify-start gap-2 text-amber-600" onClick={() => {
                        setShowInlineBlock(true);
                        setTimeout(() => blockFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                      }}>
                        <Ban className="h-4 w-4" /> Block User
                      </Button>
                    )
                  )}

                  {isSuperAdmin && viewingProfile.role !== 'super_admin' && (
                    <>
                      {viewingProfile.role === 'admin' ? (
                        <Button variant="outline" className="w-full justify-start gap-2 text-orange-600" onClick={async () => {
                          const success = await onDemoteFromAdmin(viewingProfile.id);
                          if (success) setViewingProfile(null);
                        }}>
                          <ShieldAlert className="h-4 w-4" /> Revoke Admin Privileges
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full justify-start gap-2 text-blue-600" onClick={() => setPromoteTarget(viewingProfile)}>
                          <Shield className="h-4 w-4" /> Promote to Full Admin
                        </Button>
                      )}
                      <Button variant="destructive" className="w-full justify-start gap-2" onClick={() => setDeleteTarget(viewingProfile)}>
                        <Trash2 className="h-4 w-4" /> Delete Account Permanently
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Private Message Section */}
            {pmTarget && pmTarget.id === viewingProfile.id && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Private Message to {pmTarget.display_name || 'User'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input placeholder="Title (optional)" value={pmTitle} onChange={e => setPmTitle(e.target.value)} />
                  <Textarea placeholder="Write your private message..." value={pmContent} onChange={e => setPmContent(e.target.value)} className="min-h-[80px]" />
                  <div className="flex gap-2">
                    <Button onClick={handleSendPM} disabled={!pmContent.trim() || pmSending} className="gap-2 flex-1">
                      <Send className="h-4 w-4" />{pmSending ? 'Sending...' : 'Send Private Message'}
                    </Button>
                    <Button variant="outline" onClick={() => loadPmHistory(pmTarget.id)} className="gap-2">
                      <ChevronDown className="h-4 w-4" /> History
                    </Button>
                  </div>

                  {/* Message History */}
                  <AnimatePresence>
                    {showPmHistory && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">Sent Messages ({pmHistory.length})</p>
                          <Button variant="ghost" size="sm" onClick={() => setShowPmHistory(false)}><ChevronUp className="h-4 w-4" /></Button>
                        </div>
                        {pmHistory.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No messages sent to this user yet</p>
                        ) : pmHistory.map(msg => (
                          <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-secondary/50 p-3">
                            {editingPm === msg.id ? (
                              <div className="space-y-2">
                                <Input value={editPmTitle} onChange={e => setEditPmTitle(e.target.value)} placeholder="Title" />
                                <Textarea value={editPmContent} onChange={e => setEditPmContent(e.target.value)} rows={2} />
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm" onClick={() => setEditingPm(null)}><X className="h-3.5 w-3.5" /></Button>
                                  <Button size="sm" onClick={async () => {
                                    await onUpdatePrivateMessage(msg.id, editPmTitle, editPmContent);
                                    setEditingPm(null);
                                    loadPmHistory(pmTarget.id);
                                  }}><Save className="h-3.5 w-3.5" /></Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{msg.title || 'No title'}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", msg.is_read ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600")}>
                                      {msg.is_read ? 'Read' : 'Unread'}
                                    </span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingPm(msg.id); setEditPmTitle(msg.title || ''); setEditPmContent(msg.content); }}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={async () => {
                                      await onDeletePrivateMessage(msg.id);
                                      loadPmHistory(pmTarget.id);
                                    }}>
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="mt-1 text-sm text-muted-foreground">{msg.content}</p>
                              </>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}

            {/* Inline Block Form */}
            <AnimatePresence>
              {showInlineBlock && viewingProfile && !viewingProfile.is_blocked && (
                <motion.div ref={blockFormRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                  <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                        <Ban className="h-4 w-4" /> Block {viewingProfile.display_name || 'User'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">Select a duration and optionally provide a reason. The user will see a block screen with the countdown.</p>
                      <Select value={blockHours} onValueChange={setBlockHours}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Hour</SelectItem>
                          <SelectItem value="6">6 Hours</SelectItem>
                          <SelectItem value="12">12 Hours</SelectItem>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">2 Days</SelectItem>
                          <SelectItem value="168">1 Week</SelectItem>
                          <SelectItem value="720">1 Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Reason for blocking (optional)..." value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={2} />
                      <div className="flex gap-2">
                        <Button onClick={async () => {
                          await onBlockUser(viewingProfile.id, parseInt(blockHours), blockReason);
                          setShowInlineBlock(false);
                          setBlockHours('24');
                          setBlockReason('');
                          setViewingProfile(null);
                        }} className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                          <Ban className="h-4 w-4" /> Confirm Block
                        </Button>
                        <Button variant="outline" onClick={() => setShowInlineBlock(false)}>Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : null}
      </div>
    );
  }

  // Users List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Account Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} total • <span className="text-green-600">{onlineCount} online</span> • <span className="text-destructive">{blockedCount} blocked</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email, or ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="active">Last Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Grid */}
      <div className="space-y-3">
        {filteredUsers.map((u, index) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg hover:border-primary/20 rounded-3xl overflow-hidden",
                u.is_blocked && "border-destructive/30 bg-destructive/5"
              )}
              onClick={() => handleViewActivity(u)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white shadow-sm" style={{ backgroundColor: getAvatarColor(u.avatar_color) }}>
                      {u.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card", u.is_online ? "bg-green-500" : "bg-muted-foreground/40")} />
                  </div>

                  {/* Name + Email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground truncate">{u.display_name || 'User'}</p>
                      {getRoleBadge(u.role)}
                      {u.is_blocked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold flex items-center gap-0.5">
                          <Ban className="h-2.5 w-2.5" /> Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{u.email || u.id.slice(0, 20) + '...'}</p>
                  </div>

                  {/* Right side: language & country */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    {u.country && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{u.country}</span>
                    )}
                    {u.language && (
                      <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{LANGUAGE_NAMES[u.language] || u.language}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="rounded-xl bg-secondary/50 p-8 text-center">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No users match your filters</p>
          </div>
        )}
      </div>

      {/* Delete Dialog with password confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => { setDeleteTarget(null); setDeletePassword(''); setDeleteConfirmText(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Permanently Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.display_name || 'User'}</strong> and ALL their data from the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Type "DELETE" to confirm</label>
              <Input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Password</label>
              <Input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password" className="mt-1" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deleteConfirmText !== 'DELETE' || !deletePassword} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Dialog */}
      <AlertDialog open={!!promoteTarget} onOpenChange={() => { setPromoteTarget(null); setAdminPassword(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>Enter your password to confirm promoting "{promoteTarget?.display_name || 'User'}".</AlertDialogDescription>
          </AlertDialogHeader>
          <Input type="password" placeholder="Your password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="mt-2" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteUser} disabled={!adminPassword}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog */}
      <Dialog open={!!blockTarget} onOpenChange={() => setBlockTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600"><Ban className="h-5 w-5" />Block User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Block <strong>{blockTarget?.display_name}</strong> for a specified duration.</p>
            <Select value={blockHours} onValueChange={setBlockHours}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Hour</SelectItem>
                <SelectItem value="6">6 Hours</SelectItem>
                <SelectItem value="12">12 Hours</SelectItem>
                <SelectItem value="24">24 Hours</SelectItem>
                <SelectItem value="48">2 Days</SelectItem>
                <SelectItem value="168">1 Week</SelectItem>
                <SelectItem value="720">1 Month</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Reason for blocking (optional)..." value={blockReason} onChange={e => setBlockReason(e.target.value)} rows={2} />
            <Button onClick={handleBlockUser} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
              <Ban className="h-4 w-4" /> Block User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
