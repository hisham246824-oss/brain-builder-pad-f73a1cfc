import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_color: string;
  avatar_icon: string;
  total_seconds: number;
  lesson_count: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      if (error) throw error;
      return (data || []) as LeaderboardEntry[];
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}
