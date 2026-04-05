import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Star, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface XpGift {
  id: string;
  title: string;
  points: number;
  message: string | null;
  claimed: boolean;
}

export function XpGiftCelebration() {
  const { user } = useAuth();
  const [gift, setGift] = useState<XpGift | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchGift = async () => {
      const { data } = await supabase
        .from('xp_gifts')
        .select('id, title, points, message, claimed')
        .eq('user_id', user.id)
        .eq('claimed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setGift(data as XpGift);
    };

    fetchGift();

    const channel = supabase
      .channel('xp-gifts-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xp_gifts', filter: `user_id=eq.${user.id}` }, () => fetchGift())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fireConfetti = () => {
    const duration = 4000;
    const end = Date.now() + duration;
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4'];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const handleClaim = async () => {
    if (!gift || !user) return;
    setClaiming(true);

    // Claim the gift
    await supabase.from('xp_gifts').update({ claimed: true }).eq('id', gift.id);

    // Add points to user_settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('xp_points')
      .eq('user_id', user.id)
      .maybeSingle();

    const currentXp = (settings as any)?.xp_points || 0;
    await supabase.from('user_settings').update({ xp_points: currentXp + gift.points }).eq('user_id', user.id);

    fireConfetti();
    setTimeout(() => setGift(null), 2000);
    setClaiming(false);
  };

  useEffect(() => {
    if (gift) fireConfetti();
  }, [gift]);

  return (
    <AnimatePresence>
      {gift && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.7, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 50 }}
            className="relative w-full max-w-sm rounded-[2.5rem] bg-gradient-to-br from-amber-50 via-white to-sky-50 dark:from-amber-950/50 dark:via-background dark:to-sky-950/50 border border-amber-200/50 dark:border-amber-800/30 shadow-2xl p-8 text-center overflow-hidden"
          >
            {/* Decorative icons */}
            <div className="absolute top-4 left-4"><Sparkles className="h-6 w-6 text-amber-400 animate-pulse" /></div>
            <div className="absolute top-4 right-4"><Star className="h-6 w-6 text-yellow-500 animate-pulse" /></div>
            <div className="absolute bottom-4 left-4"><Award className="h-5 w-5 text-purple-400" /></div>
            <div className="absolute bottom-4 right-4"><Gift className="h-5 w-5 text-sky-400" /></div>

            {/* Gift icon */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <Gift className="h-10 w-10 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-extrabold text-foreground mb-2">{gift.title}</h2>

            {/* Points message */}
            <p className="text-sm text-muted-foreground mb-1">
              Congratulations! You have received{' '}
              <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{gift.points}</span>
              {' '}XP as a gift from the CEO!
            </p>

            {/* Optional message */}
            {gift.message && (
              <p className="mt-3 text-sm text-muted-foreground italic bg-secondary/50 rounded-[1.25rem] p-3">
                <Star className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
                {gift.message}
              </p>
            )}

            {/* Claim button */}
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="mt-6 w-full rounded-[1.5rem] bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-base py-6 shadow-lg"
            >
              <Gift className="h-5 w-5 mr-2" />
              {claiming ? 'Claiming...' : 'Claim Reward'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
