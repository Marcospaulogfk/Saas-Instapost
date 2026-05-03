-- Cria bucket público pra uploads do editor editorial.
-- Idempotente: pode rodar múltiplas vezes sem duplicar.

INSERT INTO storage.buckets (id, name, public)
VALUES ('editorial-uploads', 'editorial-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Policies: usuários autenticados podem ler/escrever próprios arquivos.
-- Path convention: <user_id>/<filename>

DROP POLICY IF EXISTS "Public read editorial uploads" ON storage.objects;
CREATE POLICY "Public read editorial uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'editorial-uploads');

DROP POLICY IF EXISTS "Authenticated upload to own folder" ON storage.objects;
CREATE POLICY "Authenticated upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'editorial-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Authenticated delete own files" ON storage.objects;
CREATE POLICY "Authenticated delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'editorial-uploads'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
