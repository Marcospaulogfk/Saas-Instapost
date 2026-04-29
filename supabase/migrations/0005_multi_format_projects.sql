-- =====================================================================
-- 0005_multi_format_projects.sql
-- Adiciona suporte a multi-formato (carousel/single/story), source URL
-- (gerar a partir de blog/artigo), templates visuais (editorial,
-- cinematic, hybrid), tipografia e atribuicao de imagens (IA, Unsplash,
-- upload).
-- =====================================================================

-- ---------- projects ----------
alter table public.projects
  add column format text not null default 'carousel'
    check (format in ('carousel','single','story')),
  add column aspect_ratio text not null default '4:5',
  add column dimensions text not null default '1080x1350',
  add column source_type text not null default 'topic'
    check (source_type in ('topic','url','mixed')),
  add column source_url text,
  add column source_content_extracted text,
  add column template text not null default 'cinematic'
    check (template in ('editorial','cinematic','hybrid')),
  add column font_family text not null default 'inter';

-- ---------- slides ----------
alter table public.slides
  add column image_source text not null default 'ai'
    check (image_source in ('ai','unsplash','upload')),
  add column unsplash_id text,
  add column unsplash_attribution_url text,
  add column highlight_color text;

-- ---------- brands ----------
-- brand_colors e logo_url ja existem desde 0001; aqui apenas os novos.
alter table public.brands
  add column default_font text not null default 'inter',
  add column default_template text not null default 'cinematic'
    check (default_template in ('editorial','cinematic','hybrid'));
