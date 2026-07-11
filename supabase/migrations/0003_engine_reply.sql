-- Phase 5 fix: conversation-trigger candidates carry their reply linkage, so a
-- reply reads as a reply (and, when published, renders through the PostCard reply
-- variant) instead of standing alone.
alter table public.engine_candidates add column if not exists reply_to text;
