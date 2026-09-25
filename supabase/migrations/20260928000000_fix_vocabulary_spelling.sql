-- TagLingo — Phase 6.5: correct three Cebuano translations that were written
-- with typos in the Phase 6 expansion (baguised -> bugnaw, binulan -> bulan,
-- lungod -> lungsod).
--
-- These rows already exist live, so a rerun of the expansion generator would
-- emit DUPLICATE natural keys instead of correcting them — hence UPDATEs keyed
-- on the stable tagalog+english pair. Idempotent: re-running is a no-op.
--
-- Natural-key example: malamig/bugnaw/cold

update public.words set cebuano = 'bugnaw' where tagalog = 'malamig' and english = 'cold';
update public.words set cebuano = 'bulan' where tagalog = 'buwan' and english = 'month';
update public.words set cebuano = 'lungsod' where tagalog = 'bayan' and english = 'city';

-- Sanity check: should read bugnaw / bulan / lungsod.
--   select tagalog, cebuano, english from public.words
--   where english in ('cold', 'month', 'city') order by english;