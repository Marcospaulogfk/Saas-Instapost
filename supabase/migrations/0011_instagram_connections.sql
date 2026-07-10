-- Conexões de Instagram por usuário (publicação direta via Instagram Login).
-- Guarda o token de longa duração (60 dias) + o ig_user_id descoberto no OAuth.
-- Token é sensível: RLS restringe cada linha ao dono; o service role (server)
-- é quem lê pra publicar.

CREATE TABLE IF NOT EXISTS instagram_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  username TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;

-- O usuário enxerga/gerencia só a própria conexão. (O token nunca vai pro
-- client — os endpoints server leem via sessão; o SELECT do client traz só
-- username/status, ver /api/instagram/status.)
CREATE POLICY "own instagram connection - select"
  ON instagram_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own instagram connection - insert"
  ON instagram_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own instagram connection - update"
  ON instagram_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "own instagram connection - delete"
  ON instagram_connections FOR DELETE
  USING (auth.uid() = user_id);
