-- =====================================================================
-- 0003_rls_policies.sql
-- Habilita RLS em todas as tabelas e cria policies para garantir
-- que cada usuario so acessa os proprios dados.
-- =====================================================================

alter table public.users         enable row level security;
alter table public.brands        enable row level security;
alter table public.projects      enable row level security;
alter table public.slides        enable row level security;
alter table public.subscriptions enable row level security;

-- ---------- users ----------
-- Insert e ato pelo trigger handle_new_user (security definer); sem policy de insert.
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- brands ----------
create policy "brands_select_own"
  on public.brands
  for select
  using (auth.uid() = user_id);

create policy "brands_insert_own"
  on public.brands
  for insert
  with check (auth.uid() = user_id);

create policy "brands_update_own"
  on public.brands
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brands_delete_own"
  on public.brands
  for delete
  using (auth.uid() = user_id);

-- ---------- projects (ownership via brand) ----------
create policy "projects_select_own"
  on public.projects
  for select
  using (
    exists (
      select 1 from public.brands b
      where b.id = projects.brand_id and b.user_id = auth.uid()
    )
  );

create policy "projects_insert_own"
  on public.projects
  for insert
  with check (
    exists (
      select 1 from public.brands b
      where b.id = projects.brand_id and b.user_id = auth.uid()
    )
  );

create policy "projects_update_own"
  on public.projects
  for update
  using (
    exists (
      select 1 from public.brands b
      where b.id = projects.brand_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brands b
      where b.id = projects.brand_id and b.user_id = auth.uid()
    )
  );

create policy "projects_delete_own"
  on public.projects
  for delete
  using (
    exists (
      select 1 from public.brands b
      where b.id = projects.brand_id and b.user_id = auth.uid()
    )
  );

-- ---------- slides (ownership via project -> brand) ----------
create policy "slides_select_own"
  on public.slides
  for select
  using (
    exists (
      select 1 from public.projects p
      join public.brands b on b.id = p.brand_id
      where p.id = slides.project_id and b.user_id = auth.uid()
    )
  );

create policy "slides_insert_own"
  on public.slides
  for insert
  with check (
    exists (
      select 1 from public.projects p
      join public.brands b on b.id = p.brand_id
      where p.id = slides.project_id and b.user_id = auth.uid()
    )
  );

create policy "slides_update_own"
  on public.slides
  for update
  using (
    exists (
      select 1 from public.projects p
      join public.brands b on b.id = p.brand_id
      where p.id = slides.project_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      join public.brands b on b.id = p.brand_id
      where p.id = slides.project_id and b.user_id = auth.uid()
    )
  );

create policy "slides_delete_own"
  on public.slides
  for delete
  using (
    exists (
      select 1 from public.projects p
      join public.brands b on b.id = p.brand_id
      where p.id = slides.project_id and b.user_id = auth.uid()
    )
  );

-- ---------- subscriptions ----------
-- Usuario pode ler a propria assinatura. Mutacoes (insert/update/delete)
-- sao feitas exclusivamente pelo webhook do Stripe via service_role,
-- que ignora RLS.
create policy "subs_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);
