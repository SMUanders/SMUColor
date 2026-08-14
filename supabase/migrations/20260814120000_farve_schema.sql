-- ============================================================
-- SMU Color — skema (prefix: farve_)
-- Delt Supabase-projekt. Adskiller REFERENCE fra SMU-VIDEN:
--   farve_reference_colors  = ekstern Color Bridge-reference (read-only for brugere)
--   farve_materials/_colors = materialer/folier
--   farve_matches           = selvstændigt domæneobjekt (reference ↔ materiale)
--   farve_verification_*    = menneskelig verifikation (append-only historik)
-- ============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;     -- hurtig fuzzy-søgning

-- ---------- Enums ----------
do $$ begin
  create type farve_match_status as enum ('forslag', 'under_test', 'verificeret', 'afvist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type farve_match_type as enum ('folie', 'print', 'ral', 'cmyk', 'materiale', 'andet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type farve_material_kind as enum ('folie', 'print', 'ral', 'cmyk', 'andet');
exception when duplicate_object then null; end $$;

-- ---------- updated_at trigger ----------
create or replace function farve_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- 1) REFERENCE — ekstern Pantone-reference. Aldrig overskrevet af SMU-data.
--    ANKER = spotfarven (C, Solid Coated): standarden/sandheden, med målt Lab.
--    CMYK-REFERENCE = Color Bridge (CP): Pantones CMYK-procesgengivelse — selv
--    en reference, ikke sandheden.
-- ============================================================
create table if not exists farve_reference_colors (
  id             uuid primary key default gen_random_uuid(),
  -- Anker/identitet: spotfarven, fx "PANTONE 186 C" (kundens mål/standard).
  pantone_name   text not null unique,
  -- Color Bridge-navnet = Pantones CMYK-procesreference, fx "PANTONE 186 CP".
  cp_name        text,
  pantone_code   text not null,
  fixed_id       integer,
  process        boolean not null default false,
  -- Spot (C) — standard/sandhed: målt Lab + spotfarvens sRGB/hex
  lab_l          numeric, lab_a numeric, lab_b numeric,
  srgb_r         integer, srgb_g integer, srgb_b integer,
  hex            text,
  -- Color Bridge (CP) — CMYK-procesreference (null hvis ingen bridge-post)
  cmyk_c         numeric, cmyk_m numeric, cmyk_y numeric, cmyk_k numeric,
  cp_hex         text,   -- CP'ens CMYK-simulering som hex (til sammenligning)
  -- Råværdier bevaret til sporbarhed (Corels normaliserede repræsentation)
  lab_corel_raw       text,
  srgb_corel_raw      text,
  adobe_rgb_corel_raw text,
  cmyk_corel_raw      text,
  -- Kilder bevaret pr. post
  source             text not null default 'Corel PANTONE+ Solid Coated V5',
  source_version     text,   -- spot-kilde, fx "PANTONE+ Solid Coated-V5"
  source_file        text,
  source_sha256      text,
  cp_source_version  text,   -- CMYK-kilde, fx "PANTONE+ COLOR BRIDGE Coated-V5"
  cp_source_file     text,
  cp_source_sha256   text,
  created_at     timestamptz not null default now()
);
create index if not exists farve_ref_name_lower_idx on farve_reference_colors (lower(pantone_name));
create index if not exists farve_ref_code_idx on farve_reference_colors (upper(pantone_code));
create index if not exists farve_ref_name_trgm_idx on farve_reference_colors using gin (pantone_name gin_trgm_ops);

-- ============================================================
-- 2) MATERIALER + materialefarver (SMU-viden)
-- ============================================================
create table if not exists farve_materials (
  id                uuid primary key default gen_random_uuid(),
  kind              farve_material_kind not null default 'folie',
  producent         text,
  serie             text,
  navn              text not null,
  anvendelse        text,
  bredde            text,
  holdbarhed        text,
  anbefalet_laminat text,
  note              text,
  source_file       text,
  source_sheet      text,
  source_row        integer,
  source_value_raw  text,
  slettet           boolean not null default false,
  created_by        uuid,
  updated_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger farve_materials_updated before update on farve_materials
  for each row execute function farve_set_updated_at();

create table if not exists farve_material_colors (
  id                 uuid primary key default gen_random_uuid(),
  material_id        uuid references farve_materials(id),
  kode               text not null,
  navn               text,
  ral_kode           text,
  apa_kode           text,
  legacy_pantone_raw text,
  hex                text,
  note               text,
  source_file        text,
  source_sheet       text,
  source_row         integer,
  source_value_raw   text,
  slettet            boolean not null default false,
  created_by         uuid,
  updated_by         uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger farve_material_colors_updated before update on farve_material_colors
  for each row execute function farve_set_updated_at();
create index if not exists farve_mc_material_idx on farve_material_colors (material_id);
create index if not exists farve_mc_kode_idx on farve_material_colors (upper(kode));
create index if not exists farve_mc_navn_trgm_idx on farve_material_colors using gin (coalesce(navn,'') gin_trgm_ops);

-- ============================================================
-- 3) MATCHES — selvstændigt domæneobjekt (reference ↔ materiale)
-- ============================================================
create table if not exists farve_matches (
  id                  uuid primary key default gen_random_uuid(),
  reference_color_id  uuid references farve_reference_colors(id),
  material_color_id   uuid references farve_material_colors(id),
  match_type          farve_match_type not null default 'folie',
  status              farve_match_status not null default 'forslag',
  -- true = referencen er ANTAGET (fx fra legacy-tal), ikke bekræftet
  reference_antaget   boolean not null default false,
  note                text,
  -- sporbarhed / oprindelse
  source              text not null default 'manuel',
  source_file         text,
  source_sheet        text,
  source_row          integer,
  source_value_raw    text,
  needs_review        boolean not null default false,
  -- aktuel verifikation (denormaliseret; sæt kun ved status=verificeret)
  verified_by         uuid,
  verified_by_navn    text,
  verified_at         timestamptz,
  verification_method text,
  verification_comment text,
  -- fremtidsklar (valgfri i V1)
  measured_lab_l      numeric,
  measured_lab_a      numeric,
  measured_lab_b      numeric,
  delta_e             numeric,
  instrument          text,
  fysisk_reference    text,
  photo_url           text,
  -- audit
  created_by          uuid,
  created_by_navn     text,
  updated_by          uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  slettet             boolean not null default false,
  -- et match skal referere til mindst én side
  constraint farve_match_har_anker check (reference_color_id is not null or material_color_id is not null)
);
create trigger farve_matches_updated before update on farve_matches
  for each row execute function farve_set_updated_at();
create index if not exists farve_match_ref_idx on farve_matches (reference_color_id);
create index if not exists farve_match_mc_idx on farve_matches (material_color_id);
create index if not exists farve_match_status_idx on farve_matches (status);

-- ============================================================
-- 4) PRODUKTIONSKONTEKST — knyttet til et match (Canon Colorado M-series / ONYX)
-- ============================================================
create table if not exists farve_production_context (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references farve_matches(id) on delete cascade,
  printer        text default 'Canon Colorado M-series',
  blaekset       text,
  mediegruppe    text,
  medie          text,
  printmode      text,
  profil         text,
  quick_set      text,
  outputopskrift text,
  note           text,
  slettet        boolean not null default false,
  created_by     uuid,
  updated_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create trigger farve_production_context_updated before update on farve_production_context
  for each row execute function farve_set_updated_at();
create index if not exists farve_pc_match_idx on farve_production_context (match_id);

-- ============================================================
-- 5) VERIFIKATIONSHISTORIK — append-only
-- ============================================================
create table if not exists farve_verification_history (
  id             uuid primary key default gen_random_uuid(),
  match_id       uuid not null references farve_matches(id) on delete cascade,
  handling       text not null,               -- 'oprettet' | 'status_skiftet' | 'verificeret' | 'afvist' | 'opdateret'
  fra_status     farve_match_status,
  til_status     farve_match_status,
  metode         text,
  kommentar      text,
  udfoert_af     uuid,
  udfoert_af_navn text,
  created_at     timestamptz not null default now()
);
create index if not exists farve_vh_match_idx on farve_verification_history (match_id, created_at);

-- ============================================================
-- 6) IMPORT-ISSUES — tvetydige legacy-rækker til manuel gennemgang
-- ============================================================
create table if not exists farve_import_issues (
  id           uuid primary key default gen_random_uuid(),
  source_file  text,
  source_sheet text,
  source_row   integer,
  kind         text,
  raw_data     text,
  reason       text,
  resolved     boolean not null default false,
  created_at   timestamptz not null default now()
);
