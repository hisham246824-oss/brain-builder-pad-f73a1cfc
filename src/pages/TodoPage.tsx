import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, CheckCircle2, Trash2, AlertTriangle, AlertCircle, Leaf, Calendar, PartyPopper, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTodos, Todo } from '@/hooks/useTodos';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/auth/AuthDialog';
import confetti from 'canvas-confetti';

const IMPORTANCE_CONFIG = {
  red: { label: 'Very Important', icon: AlertTriangle, color: 'border-red-500/40 bg-red-500/5', badge: 'bg-red-500/15 text-red-600 dark:text-red-400', dot: 'bg-red-500' },
  yellow: { label: 'Medium', icon: AlertCircle, color: 'border-yellow-500/40 bg-yellow-500/5', badge: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500' },
  green: { label: 'Low Priority', icon: Leaf, color: 'border-green-500/40 bg-green-500/5', badge: 'bg-green-500/15 text-green-600 dark:text-green-400', dot: 'bg-green-500' },
};

const CELEBRATION_PHRASES = [
  "Great job! You're on fire! 🔥",
  "Task completed! Keep going! 💪",
  "Well done! One step closer to your goals! 🎯",
  "Amazing! You're crushing it! ⭐",
  "Incredible progress! Keep it up! 🚀",
];

function getTimeRemaining(deadline: string) {
  const now = new Date().getTime();
  const end = new Date(deadline).getTime();
  const diff = end - now;
  if (diff <= 0) return { text: 'Overdue', overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return { text: `${days}d ${hours}h`, overdue: false };
  if (hours > 0) return { text: `${hours}h ${mins}m`, overdue: false };
  return { text: `${mins}m`, overdue: false };
}

function TodoCard({ todo, onToggle, onDelete }: { todo: Todo; onToggle: (id: string, completed: boolean) => void; onDelete: (id: string) => void }) {
  const config = IMPORTANCE_CONFIG[todo.importance];
  const [timeLeft, setTimeLeft] = useState(todo.deadline ? getTimeRemaining(todo.deadline) : null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!todo.deadline || todo.completed) return;
    const interval = setInterval(() => setTimeLeft(getTimeRemaining(todo.deadline!)), 60000);
    setTimeLeft(getTimeRemaining(todo.deadline));
    return () => clearInterval(interval);
  }, [todo.deadline, todo.completed]);

  const handleComplete = () => {
    if (!todo.completed) {
      setShowCelebration(true);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#14b8a6', '#06b6d4', '#22c55e', '#eab308'] });
      } catch {}
      setTimeout(() => setShowCelebration(false), 3000);
    }
    onToggle(todo.id, !todo.completed);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative rounded-2xl border-2 p-5 shadow-card transition-all ${todo.completed ? 'border-border/30 bg-muted/30 opacity-60' : config.color}`}
    >
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm"
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

      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Importance badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.badge}`}>
              <div className={`w-2 h-2 rounded-full ${config.dot}`} />
              {config.label}
            </span>
          </div>

          <h3 className={`text-lg font-bold text-foreground mb-1 ${todo.completed ? 'line-through' : ''}`}>
            {todo.title}
          </h3>
          {todo.description && (
            <p className={`text-sm text-muted-foreground leading-relaxed ${todo.completed ? 'line-through' : ''}`}>
              {todo.description}
            </p>
          )}
        </div>

        {/* Countdown & actions */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {timeLeft && !todo.completed && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
              timeLeft.overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
              <Clock className="h-3.5 w-3.5" />
              {timeLeft.text}
            </div>
          )}
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant={todo.completed ? "secondary" : "default"}
              onClick={handleComplete}
              className="rounded-xl h-9 px-3"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(todo.id)}
              className="rounded-xl h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const TodoPage = () => {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary/30 mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">To-Do List</h2>
          <p className="text-muted-foreground mb-6">Sign in to manage your tasks</p>
          <Button onClick={() => setShowAuth(true)} className="rounded-full px-8">Sign In</Button>
        </div>
        <AuthDialog isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">To-Do List</h1>
          <p className="text-muted-foreground mt-1">Stay organized and track your tasks</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="rounded-full gap-2 shadow-glow">
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </motion.div>

      {/* Active tasks */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : activeTodos.length === 0 && completedTodos.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CheckCircle2 className="h-16 w-16 text-primary/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No tasks yet</h3>
          <p className="text-muted-foreground">Add your first task to get started!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {activeTodos.map(todo => (
              <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo} />
            ))}
          </AnimatePresence>

          {completedTodos.length > 0 && (
            <div className="pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Completed</h3>
              <div className="space-y-3">
                <AnimatePresence>
                  {completedTodos.map(todo => (
                    <TodoCard key={todo.id} todo={todo} onToggle={toggleComplete} onDelete={deleteTodo} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." className="rounded-xl text-lg font-semibold" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Details</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task details..." className="rounded-xl min-h-[80px]" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Importance</label>
              <div className="flex gap-2">
                {(Object.entries(IMPORTANCE_CONFIG) as [string, typeof IMPORTANCE_CONFIG.red][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setImportance(key as 'red' | 'yellow' | 'green')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      importance === key
                        ? `${cfg.color} border-current ${cfg.badge}`
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
              <label className="text-sm font-medium text-foreground mb-1.5 block">Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="rounded-xl pl-10" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!title.trim()} className="w-full rounded-xl py-6 text-base font-semibold">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodoPage;
