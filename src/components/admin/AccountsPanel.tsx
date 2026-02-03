import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  UserCircle, 
  Shield, 
  ShieldAlert,
  Trash2,
  ChevronLeft,
  Send,
  MessageSquare,
  Eye,
  Crown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AccountsPanelProps {
  users: User[];
  isLoading: boolean;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onPromoteToAdmin: (userId: string, password: string) => Promise<boolean>;
  onDemoteFromAdmin: (userId: string) => Promise<boolean>;
  onSendBroadcast: (title: string, content: string) => Promise<boolean>;
}

export function AccountsPanel({
  users,
  isLoading,
  onDeleteUser,
  onPromoteToAdmin,
  onDemoteFromAdmin,
  onSendBroadcast,
}: AccountsPanelProps) {
  const { isSuperAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isSending, setIsSending] = useState(false);

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendBroadcast = async () => {
    if (!broadcastContent.trim()) return;
    setIsSending(true);
    const success = await onSendBroadcast(broadcastTitle, broadcastContent);
    if (success) {
      setBroadcastTitle('');
      setBroadcastContent('');
      setShowBroadcast(false);
    }
    setIsSending(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await onDeleteUser(selectedUser.id);
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const handlePromoteUser = async () => {
    if (!selectedUser || !adminPassword) return;
    const success = await onPromoteToAdmin(selectedUser.id, adminPassword);
    if (success) {
      setPromoteDialogOpen(false);
      setAdminPassword('');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <UserCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'المشرف الرئيسي';
      case 'admin':
        return 'مشرف';
      default:
        return 'مستخدم';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          إدارة الحسابات
        </motion.h2>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowBroadcast(true)}
            className="gap-2"
            variant="outline"
          >
            <Send className="h-4 w-4" />
            رسالة جماعية
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="البحث عن مستخدم..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Broadcast Dialog */}
      <AnimatePresence>
        {showBroadcast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  إرسال رسالة لجميع المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="عنوان الرسالة (اختياري)"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                />
                <Textarea
                  placeholder="محتوى الرسالة..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowBroadcast(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={!broadcastContent.trim() || isSending}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    إرسال
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedUser?.id === user.id && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || ''}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                        {user.display_name?.charAt(0) || user.email?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -left-1 rounded-full bg-card p-0.5">
                      {getRoleIcon(user.role)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user.display_name || 'مستخدم'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getRoleName(user.role)} • انضم {new Date(user.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>

                  <ChevronLeft className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform',
                    selectedUser?.id === user.id && 'rotate-90'
                  )} />
                </div>

                {/* Expanded Actions */}
                <AnimatePresence>
                  {selectedUser?.id === user.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          عرض النشاط
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          رسالة خاصة
                        </Button>
                        
                        {isSuperAdmin && user.role !== 'super_admin' && (
                          <>
                            {user.role === 'admin' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDemoteFromAdmin(user.id);
                                }}
                                className="gap-2 text-orange-600 hover:text-orange-700"
                              >
                                <ShieldAlert className="h-4 w-4" />
                                إزالة الصلاحيات
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromoteDialogOpen(true);
                                }}
                                className="gap-2 text-blue-600 hover:text-blue-700"
                              >
                                <Shield className="h-4 w-4" />
                                ترقية لمشرف
                              </Button>
                            )}
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialogOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف الحساب
                            </Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="rounded-xl bg-secondary/50 p-8 text-center">
            <UserCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">لا توجد نتائج</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الحساب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حساب "{selectedUser?.display_name || selectedUser?.email}"؟
              سيتم حذف جميع بياناته بشكل نهائي ولن يمكن استرجاعها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف نهائياً
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد ترقية المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              لترقية "{selectedUser?.display_name || selectedUser?.email}" إلى مشرف، 
              يرجى إدخال كلمة مرور حسابك للتأكيد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminPassword('')}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteUser}
              disabled={!adminPassword}
            >
              تأكيد الترقية
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
