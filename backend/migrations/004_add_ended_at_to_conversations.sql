-- Migration: 004_add_ended_at_to_conversations
-- Marks a conversation as closed so no further messages can be appended

ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
