
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_color text,
  avatar_icon text,
  total_seconds bigint,
  lesson_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pv.user_id,
    COALESCE(us.display_name, 'User') as display_name,
    COALESCE(us.avatar_color, 'primary') as avatar_color,
    COALESCE(us.avatar_icon, '') as avatar_icon,
    COALESCE(SUM(pv.duration_seconds), 0)::bigint as total_seconds,
    COALESCE(lc.cnt, 0)::bigint as lesson_count
  FROM page_visits pv
  LEFT JOIN user_settings us ON us.user_id = pv.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*)::bigint as cnt FROM lessons GROUP BY user_id
  ) lc ON lc.user_id = pv.user_id
  WHERE pv.user_id IS NOT NULL
  GROUP BY pv.user_id, us.display_name, us.avatar_color, us.avatar_icon, lc.cnt
  ORDER BY COALESCE(SUM(pv.duration_seconds), 0) DESC
  LIMIT 50
$$;
