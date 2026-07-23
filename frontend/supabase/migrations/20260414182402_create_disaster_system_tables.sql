/*
  # Early Disaster Detection System - Database Schema

  ## Tables Created:
  1. `saved_predictions` - Stores user prediction history
     - id, user_id, location_name, lat, lon, predictions (jsonb), created_at
  2. `contacts` - Stores contact form submissions
     - id, name, email, message, created_at

  ## Security:
  - RLS enabled on all tables
  - Users can only access their own predictions
  - Anyone can submit a contact message
*/

CREATE TABLE IF NOT EXISTS saved_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location_name text NOT NULL,
  lat numeric NOT NULL,
  lon numeric NOT NULL,
  predictions jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE saved_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own predictions"
  ON saved_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions"
  ON saved_predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
  ON saved_predictions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON contacts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_saved_predictions_user_id ON saved_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_predictions_created_at ON saved_predictions(created_at DESC);
