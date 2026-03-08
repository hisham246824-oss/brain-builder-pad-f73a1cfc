
-- Allow admins to read all study_materials
CREATE POLICY "Admins can view all materials"
ON public.study_materials
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to read all lessons
CREATE POLICY "Admins can view all lessons"
ON public.lessons
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to read all vocabulary
CREATE POLICY "Admins can view all vocabulary"
ON public.vocabulary
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow admins to read all todos
CREATE POLICY "Admins can view all todos"
ON public.todos
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
