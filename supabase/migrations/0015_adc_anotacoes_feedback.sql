-- Protótipo ADC (RH Upskills) — tabela isolada de anotações da cliente.
-- TODO/CLEANUP: remover esta tabela do projeto SyncPost quando o protótipo migrar.
create table if not exists public.adc_anotacoes (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  page_label text not null,
  autor text not null,
  email text,
  texto text not null,
  tipo text not null default 'adicionar',
  prioridade text not null default 'essencial',
  status text not null default 'nova',
  criado_em timestamptz not null default now()
);

alter table public.adc_anotacoes enable row level security;

-- App (anon) pode inserir e ler; NÃO pode apagar/editar (proteção contra perda de dados).
create policy "adc_anon_insert" on public.adc_anotacoes
  for insert to anon with check (true);
create policy "adc_anon_select" on public.adc_anotacoes
  for select to anon using (true);

create index if not exists adc_anotacoes_page_idx
  on public.adc_anotacoes (page_key, criado_em desc);;
