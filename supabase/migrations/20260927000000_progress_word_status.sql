-- TagLingo — Phase 4: distinguish "favorited but never graded" rows from
-- graded ones. word_progress.status gains a 'new' value (no progress made),
-- and the column defaults to it so a favorites-only upsert stays clearly
-- ungraded instead of silently becoming 'learning'.

alter type public.word_status add value if not exists 'new';

alter table public.word_progress alter column status set default 'new';