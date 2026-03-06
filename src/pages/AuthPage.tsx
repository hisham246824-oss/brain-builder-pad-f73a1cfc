import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, GraduationCap, BookOpen, Bot, Timer, BookA, Table2, Lightbulb, ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'hisham090807@gmail.com';

const FEATURES = [
  { icon: Bot, label: 'AI Study Chat', labelAr: 'محادثة ذكاء اصطناعي' },
  { icon: BookOpen, label: 'Study Materials', labelAr: 'مواد دراسية' },
  { icon: BookA, label: 'Vocabulary', labelAr: 'مفردات' },
  { icon: Timer, label: 'Pomodoro Timer', labelAr: 'مؤقت بومودورو' },
  { icon: Table2, label: 'Table Creator', labelAr: 'إنشاء جدول' },
  { icon: Lightbulb, label: 'Suggestions', labelAr: 'اقتراحات' },
];

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);

    if (mode === 'signup') {
      if (email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
        toast.error(t('emailNotAvailable'));
        setIsSubmitting(false);
        return;
      }
      if (password !== confirmPw) {
        toast.error(t('passwordsDontMatch'));
        setIsSubmitting(false);
        return;
      }
      if (password.length < 6) {
        toast.error(t('passwordTooShort'));
        setIsSubmitting(false);
        return;
      }
      if (!displayName.trim()) {
        toast.error(t('displayNameRequired'));
        setIsSubmitting(false);
        return;
      }

      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message || t('signupFailed'));
      } else {
        // Save display name to user_settings after signup
        // The profile will be created by trigger, but we also update settings
        toast.success(t('accountCreated'));
        
        // Try to sign in immediately and set display name
        const { error: signInError } = await signIn(email, password);
        if (!signInError) {
          // Update user settings with display name
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from('user_settings').upsert({
              user_id: newUser.id,
              display_name: displayName.trim(),
            }, { onConflict: 'user_id' });
            await supabase.from('profiles').upsert({
              user_id: newUser.id,
              display_name: displayName.trim(),
            }, { onConflict: 'user_id' });
          }
          navigate('/', { replace: true });
        }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message || t('signinFailed'));
      } else {
        toast.success(t('signedIn'));
        navigate('/', { replace: true });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-8 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
            {t('backToHome')}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">StudyHub</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            {mode === 'signin' ? t('welcomeBack') : t('createYourAccount')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'signin' ? t('continueYourJourney') : t('startYourJourney')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t('displayName')}</label>
                <div className="relative">
                  <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('howShouldWeCallYou')}
                    className={cn("rounded-xl h-12", isRTL ? "pr-10" : "pl-10")}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('email')}</label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn("rounded-xl h-12", isRTL ? "pr-10" : "pl-10")}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t('password')}</label>
              <div className="relative">
                <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn("rounded-xl h-12", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isRTL ? "left-3" : "right-3")}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t('confirmPasswordLabel')}</label>
                <div className="relative">
                  <Lock className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="••••••••"
                    className={cn("rounded-xl h-12", isRTL ? "pr-10" : "pl-10")}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!email.trim() || !password.trim() || isSubmitting}
              className="w-full rounded-xl h-12 text-base font-semibold mt-2"
            >
              {isSubmitting
                ? t('loading')
                : mode === 'signin'
                  ? t('signInBtn')
                  : t('createAccountBtn')
              }
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                {t('dontHaveAccount')}{' '}
                <button onClick={() => setMode('signup')} className="text-primary font-medium hover:underline">
                  {t('signUpLink')}
                </button>
              </>
            ) : (
              <>
                {t('alreadyHaveAccount')}{' '}
                <button onClick={() => setMode('signin')} className="text-primary font-medium hover:underline">
                  {t('signInLink')}
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right side - Feature showcase (hidden on mobile) */}
      {!isMobile && (
        <motion.div
          initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden md:flex w-[45%] lg:w-[50%] bg-primary flex-col justify-center items-center p-12 relative overflow-hidden"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground/20 blur-3xl" />
            <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-primary-foreground/15 blur-3xl" />
          </div>

          <div className="relative z-10 text-center max-w-md">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
              {t('learnSmarter')}
            </h2>
            <p className="text-primary-foreground/80 text-base lg:text-lg mb-10 leading-relaxed">
              {t('authFeatureDesc')}
            </p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 px-4 py-3"
                >
                  <feature.icon className="h-5 w-5 text-primary-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-primary-foreground">
                    {isRTL ? feature.labelAr : feature.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
