CREATE TABLE editorial_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  brand_name TEXT,
  handle TEXT,
  carousel_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_editorial_carousels_user_id ON editorial_carousels(user_id);
CREATE INDEX idx_editorial_carousels_created_at ON editorial_carousels(created_at DESC);

ALTER TABLE editorial_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carousels"
  ON editorial_carousels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own carousels"
  ON editorial_carousels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carousels"
  ON editorial_carousels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carousels"
  ON editorial_carousels FOR DELETE
  USING (auth.uid() = user_id);
