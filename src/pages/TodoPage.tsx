import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, CheckCircle2, Trash2, AlertTriangle, AlertCircle, Leaf, Calendar, PartyPopper, X, ListTodo, Target, TrendingUp, Sparkles, Timer, FileText, Flag, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTodos, Todo } from '@/hooks/useTodos';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { TodoSkeleton } from '@/components/skeletons/TodoSkeleton';
import confetti from 'canvas-confetti';

const IMPORTANCE_CONFIG = {
  red: { label: 'Urgent', icon: AlertTriangle, gradient: 'from-red-500/20 to-red-600/5', border: 'border-red-500/30', badge: 'bg-red-500/15 text-red-600 dark:text-red-400', dot: 'bg-red-500', glow: 'shadow-[0_0_15px_hsl(0_70%_55%/0.15)]' },
  yellow: { label: 'Medium', icon: AlertCircle, gradient: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/30', badge: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500', glow: 'shadow-[0_0_15px_hsl(45_80%_50%/0.15)]' },
  green: { label: 'Low', icon: Leaf, gradient: 'from-green-500/20 to-green-600/5', border: 'border-green-500/30', badge: 'bg-green-500/15 text-green-600 dark:text-green-400', dot: 'bg-green-500', glow: 'shadow-[0_0_15px_hsl(145_60%_40%/0.15)]' },
};

const CELEBRATION_PHRASES = [
  "Great job! You're on fire! 🔥",
  "Task completed! Keep going! 💪",
  "Well done! One step closer! 🎯",
  "Amazing! You're crushing it! ⭐",
  "Incredible progress! 🚀",
];

function getTimeRemaining(deadline: string) {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  if (diff <= 0) return { text: 'Overdue', overdue: true, percent: 100 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  if (days > 0) return { text: `${days}d ${hours}h ${mins}m`, overdue: false, percent: 0 };
  if (hours > 0) return { text: `${hours}h ${mins}m ${secs}s`, overdue: false, percent: 0 };
  return { text: `${mins}m ${secs}s`, overdue: false, percent: 0 };
}

function TodoCard({ todo, onToggle, onDelete, index }: { todo: Todo; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void; index: number }) {
  const { t } = useLanguage();
  const config = IMPORTANCE_CONFIG[todo.importance];
  const [timeLeft, setTimeLeft] = useState(todo.deadline ? getTimeRemaining(todo.deadline) : null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!todo.deadline || todo.completed) return;
    const interval = setInterval(() => setTimeLeft(getTimeRemaining(todo.deadline!)), 1000);
    setTimeLeft(getTimeRemaining(todo.deadline));
    return () => clearInterval(interval);
  }, [todo.deadline, todo.completed]);

  const handleComplete = () => {
    if (!todo.completed) {
      setShowCelebration(true);
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 }, colors: ['#14b8a6', '#06b6d4', '#22c55e', '#eab308', '#f97316'] });
      } catch {}
      setTimeout(() => setShowCelebration(false), 3000);
    }
    onToggle(todo.id, !todo.completed);
  };

  const createdDate = new Date(todo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const deadlineDate = todo.deadline ? new Date(todo.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.2) }}
      className={`relative rounded-[1.25rem] border-2 overflow-hidden ${
        todo.completed
          ? 'border-border/20 bg-muted/20 opacity-50'
          : `${config.border} bg-gradient-to-br ${config.gradient}`
      }`}
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.25rem] bg-primary/10"
          >
            <div className="text-center">
              <PartyPopper className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-primary">
                {CELEBRATION_PHRASES[Math.floor(Math.random() * CELEBRATION_PHRASES.length)]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Importance accent stripe */}
      <div className={`h-1 w-full ${config.dot}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* 1. Completion checkbox */}
          <button
            onClick={handleComplete}
            className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
              todo.completed
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary/60'
            }`}
          >
            {todo.completed && <CheckCircle2 className="h-4 w-4" />}
          </button>

          <div className="flex-1 min-w-0 space-y-2">
            {/* 2. Importance badge + 3. Created date */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${config.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {createdDate}
              </span>
            </div>

            {/* 4. Title */}
            <h3 className={`text-lg font-bold text-foreground leading-tight ${todo.completed ? 'line-through opacity-60' : ''}`}>
              {todo.title}
            </h3>

            {/* 5. Description */}
            {todo.description && (
              <p className={`text-sm text-muted-foreground leading-relaxed ${todo.completed ? 'line-through opacity-50' : ''}`}>
                {todo.description}
              </p>
            )}

            {/* 6. Deadline + 7. Countdown */}
            {deadlineDate && !todo.completed && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3" /> Due: {deadlineDate}
                </span>
                {timeLeft && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                    timeLeft.overdue ? 'bg-destructive/15 text-destructive animate-pulse' : 'bg-primary/10 text-primary'
                  }`}>
                    <Timer className="h-3 w-3" />
                    {timeLeft.text}
                  </span>
                )}
              </div>
            )}

            {/* 8. Overdue warning */}
            {timeLeft?.overdue && !todo.completed && (
              <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                <AlertTriangle className="h-3 w-3" />
                {t('overdueWarning')}
              </div>
            )}
          </div>

          {/* 9. Delete button + 10. Status indicator */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {todo.completed && (
              <span className="text-[10px] font-semibold text-primary uppercase">Done</span>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const TodoPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { todos, isLoading, addTodo, toggleComplete, deleteTodo } = useTodos();
  const [showAdd, setShowAdd] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<'red' | 'yellow' | 'green'>('green');
  const [deadline, setDeadline] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    addTodo({ title: title.trim(), description: description.trim(), importance, deadline: deadline || undefined });
    setTitle(''); setDescription(''); setImportance('green'); setDeadline(''); setShowAdd(false);
  };

  const activeTodos = useMemo(() => todos.filter(t => !t.completed), [todos]);
  const completedTodos = useMemo(() => todos.filter(t => t.completed), [todos]);
  const completionPercent = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;
  const urgentCount = activeTodos.filter(t => t.importance === 'red').length;
  const overdueCount = activeTodos.filter(t => t.deadline && new Date(t.deadline).getTime() < Date.now()).length;

  if (!user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('toDoList')}</h2>
          <p className="text-muted-foreground mb-6">{t('signInToManageTasks')}</p>
          <Button onClick={() => setShowAuth(true)} className="rounded-full px-8">{t('signInBtn')}</Button>
        </div>
        <AuthDialog isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header with gradient title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.5rem] gradient-primary">
              <ListTodo className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">{t('toDoList')}</h1>
              <p className="text-sm text-muted-foreground">{t('stayOrganized')}</p>
            </div>
          </div>
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2 shadow-glow px-5 py-5">
            <Plus className="h-5 w-5" /> {t('addTask')}
          </Button>
        </div>
      </div>

      {/* 2. Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-primary">{todos.length}</p>
          <p className="text-[11px] text-muted-foreground">{t('totalTasks')}</p>
        </div>
        <div className="bg-card border border-border rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{completedTodos.length}</p>
          <p className="text-[11px] text-muted-foreground">{t('completed')}</p>
        </div>
        <div className="bg-card border border-border rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{urgentCount}</p>
          <p className="text-[11px] text-muted-foreground">{t('urgent')}</p>
        </div>
        <div className="bg-card border border-border rounded-[1.5rem] p-3 text-center">
          <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          <p className="text-[11px] text-muted-foreground">{t('overdue')}</p>
        </div>
      </div>

      {/* 3. Completion progress */}
      {todos.length > 0 && (
        <div className="bg-card border border-border rounded-[1.5rem] p-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" /> {t('overallProgress')}
            </span>
            <span className="font-bold text-primary">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2.5" />
        </div>
      )}

      {/* 4. Quick filter pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Target className="h-3 w-3" /> {activeTodos.length} {t('active')}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" /> {completedTodos.length} {t('done')}
        </span>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
            <AlertTriangle className="h-3 w-3" /> {overdueCount} {t('overdue')}
          </span>
        )}
      </motion.div>

      {/* 5. Tasks list */}
      {isLoading ? (
        <TodoSkeleton />
      ) : activeTodos.length === 0 && completedTodos.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">{t('allClear')}</h3>
          <p className="text-muted-foreground mb-4">{t('addFirstTaskDesc')}</p>
          <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2">
            <Plus className="h-4 w-4" /> {t('createFirstTask')}
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3 contain-paint">
          <AnimatePresence>
            {activeTodos.map((todo, i) => (
              <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo} index={i} />
            ))}
          </AnimatePresence>

          {/* 6. Completed section */}
          {completedTodos.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">{t('completed')} ({completedTodos.length})</h3>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {completedTodos.map((todo, i) => (
                    <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo} index={i} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Motivational footer */}
      {activeTodos.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-center py-4">
          <p className="text-xs text-muted-foreground italic">
            "The secret of getting ahead is getting started." — Mark Twain
          </p>
        </motion.div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary flex items-center gap-2">
              <Plus className="h-5 w-5" /> {t('addNewTask')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('title')}</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t('whatNeedsToBeDone')} className="rounded-[1.25rem] text-lg font-semibold" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('details')}</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('addMoreContext')} className="rounded-[1.25rem] min-h-[80px]" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t('priority')}</label>
              <div className="flex gap-2">
                {(Object.entries(IMPORTANCE_CONFIG) as [string, typeof IMPORTANCE_CONFIG.red][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setImportance(key as 'red' | 'yellow' | 'green')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[1.25rem] border-2 text-sm font-medium transition-all ${
                      importance === key
                        ? `bg-gradient-to-br ${cfg.gradient} ${cfg.border} ${cfg.badge}`
                        : 'border-border bg-card text-muted-foreground hover:border-border/80'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('dueDate')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-[1.25rem] pl-10" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!title.trim()} className="w-full rounded-full py-6 text-base font-semibold">
              {t('createFirstTask')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodoPage;
