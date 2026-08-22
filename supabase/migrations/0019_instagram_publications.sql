-- Publicações feitas pelo SyncPost no Instagram. Guarda o id da mídia que a
-- Meta devolve no media_publish: sem ele não dá pra amarrar métrica ao
-- conteúdo gerado aqui (a página de métricas marca "publicado pelo SyncPost").

CREATE TABLE IF NOT EXISTS instagram_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  ig_media_id TEXT NOT NULL,
  caption TEXT,
  image_count INT NOT NULL DEFAULT 1,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS instagram_publications_media_idx
  ON instagram_publications (ig_media_id);
CREATE INDEX IF NOT EXISTS instagram_publications_user_idx
  ON instagram_publications (user_id, published_at DESC);

ALTER TABLE instagram_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own instagram publications - select"
  ON instagram_publications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own instagram publications - insert"
  ON instagram_publications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own instagram publications - delete"
  ON instagram_publications FOR DELETE
  USING (auth.uid() = user_id);
