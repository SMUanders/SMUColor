-- ============================================================
-- SMU Color — historiske produktionsobservationer (provenance/review-lag)
--
-- ADSKILT fra reference / materialefarve / match / verificeret produktion.
-- En observation er en RÅ transskription fra et historisk produktionsark
-- (fx Manus-analyse). Originaltekst bevares i *_as_written. En normaliseret
-- værdi er ALTID et separat review-resultat — aldrig automatisk sandhed.
-- En observation bliver ALDRIG automatisk til et verificeret match.
--
-- Status: AI_EKSTRAHERET → TIL_GENNEMGANG → GODKENDT_SOM_FORSLAG | AFVIST
-- (TEST og VERIFICERET hører til det eksisterende match-/testlag.)
-- ============================================================

do $$ begin
  create type farve_observation_status as enum
    ('AI_EKSTRAHERET', 'TIL_GENNEMGANG', 'GODKENDT_SOM_FORSLAG', 'AFVIST');
exception when duplicate_object then null; end $$;

create table if not exists farve_observations (
  id                uuid primary key default gen_random_uuid(),
  obs_kode          text unique,                 -- fx "OBS-001"
  -- Kilde / provenance
  source_file       text,
  source_page       text,
  source_location   text,
  document_type     text,
  source_dataset    text,                        -- Manus-datasæt/batch (fx "batch 3")
  source_row_number integer,                     -- rækkenummer i master-CSV/JSON
  source_value_class text,                       -- Manus-klasse: A / B / C
  -- Kunde/job/brand-kontekst (RÅ historisk kontekst — IKKE kundemaster)
  job_context       text,                        -- generel jobkontekst (fri tekst)
  customer_as_written        text,
  job_name_as_written        text,
  order_reference_as_written text,
  job_reference_as_written   text,
  brand_as_written           text,
  context_evidence_as_written text,              -- rå tekst der understøtter kontekst-tolkningen
  -- Rå transskription (originaltekst bevaret — må ikke normaliseres i disse felter)
  printer_as_written                text,
  media_group_as_written            text,
  manufacturer_as_written           text,   -- producent som skrevet (≠ materialemaster)
  material_as_written               text,
  material_code_as_written          text,   -- materialekode som skrevet (fx "3551", "751-031")
  profile_or_print_mode_as_written  text,
  pantone_as_written                text,   -- Pantone/PMS som skrevet (≠ normaliseret reference)
  ral_as_written                    text,   -- RAL som skrevet (≠ normaliseret reference)
  internal_code_as_written          text,
  numeric_string_as_written         text,   -- trykte/etiket-tal (som skrevet)
  handwritten_as_written            text,   -- håndskrevne tal/tekst (rå, ALDRIG auto-tolket)
  color_name_as_written             text,
  physical_material_as_written      text,
  sample_present    boolean not null default false,
  sample_type       text,
  result_marking_as_written text,
  assessment_signal_as_written text,        -- vurderingssignal, fx flueben (rå, ikke = "godkendt")
  confidence        numeric,                      -- valgfri samlet 0..1 (ofte null: sikkerhed er per-aspekt)
  confidence_notes  text,                         -- per-aspekt AI-sikkerhed (rå)
  transcription_notes text,
  -- Review (menneskeligt resultat — den eneste vej til normalisering)
  reviewer          text,
  review_decision   text,
  review_notes      text,
  status            farve_observation_status not null default 'AI_EKSTRAHERET',
  -- audit
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  slettet           boolean not null default false
);
create trigger farve_observations_updated before update on farve_observations
  for each row execute function farve_set_updated_at();
create index if not exists farve_obs_status_idx on farve_observations (status);

-- ---------- RLS ----------
alter table farve_observations enable row level security;
create policy farve_obs_select on farve_observations
  for select to authenticated using (true);
create policy farve_obs_insert on farve_observations
  for insert to authenticated with check (true);
create policy farve_obs_update on farve_observations
  for update to authenticated using (true) with check (true);
-- (Ingen delete — brug kolonnen slettet. Redaktør-håndhævelse i frontend i V1.)
