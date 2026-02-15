-- Add interrogation_image column to characters table
-- Stores the path/URL to the interrogation scene image for each character
ALTER TABLE characters ADD COLUMN IF NOT EXISTS interrogation_image VARCHAR(500) DEFAULT '';
