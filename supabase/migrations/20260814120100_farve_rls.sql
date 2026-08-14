-- ============================================================
-- SMU Color — Row Level Security
--
-- V1-princip (jf. SMU_APP_STANDARD.md §5–6):
--   * RLS aktiv på alle tabeller, politikker KUN `to authenticated`.
--   * REFERENCE (Color Bridge) er read-only for brugere — kun seed/
--     service role må skrive. Beskytter ekstern reference mod
--     overskrivning af SMU-data.
--   * SMU-viden (materials, matches, ...) kan læses+skrives af enhver
--     autentificeret bruger i V1. Redaktør/medarbejder-adskillelsen
--     håndhæves i frontend i V1 (dokumenteret afvigelse i CLAUDE.md).
--     Skabelon til rolle-stram RLS ligger nederst — aktivér når
--     `profiler.rolle` er bekræftet i det delte projekt.
--   * Verifikationshistorik er append-only (kun INSERT + SELECT).
--   * Ingen hard delete — brug kolonnen `slettet`.
-- ============================================================

alter table farve_reference_colors   enable row level security;
alter table farve_materials           enable row level security;
alter table farve_material_colors     enable row level security;
alter table farve_matches             enable row level security;
alter table farve_production_context  enable row level security;
alter table farve_verification_history enable row level security;
alter table farve_import_issues        enable row level security;

-- ---------- REFERENCE: læs for alle autentificerede, ingen skrivning ----------
create policy farve_ref_select on farve_reference_colors
  for select to authenticated using (true);
-- (Bevidst: ingen insert/update/delete-politik → kun service role/seed skriver.)

-- ---------- MATERIALER ----------
create policy farve_materials_select on farve_materials
  for select to authenticated using (true);
create policy farve_materials_insert on farve_materials
  for insert to authenticated with check (true);
create policy farve_materials_update on farve_materials
  for update to authenticated using (true) with check (true);

-- ---------- MATERIALEFARVER ----------
create policy farve_mc_select on farve_material_colors
  for select to authenticated using (true);
create policy farve_mc_insert on farve_material_colors
  for insert to authenticated with check (true);
create policy farve_mc_update on farve_material_colors
  for update to authenticated using (true) with check (true);

-- ---------- MATCHES ----------
create policy farve_matches_select on farve_matches
  for select to authenticated using (true);
create policy farve_matches_insert on farve_matches
  for insert to authenticated with check (true);
create policy farve_matches_update on farve_matches
  for update to authenticated using (true) with check (true);

-- ---------- PRODUKTIONSKONTEKST ----------
create policy farve_pc_select on farve_production_context
  for select to authenticated using (true);
create policy farve_pc_insert on farve_production_context
  for insert to authenticated with check (true);
create policy farve_pc_update on farve_production_context
  for update to authenticated using (true) with check (true);

-- ---------- VERIFIKATIONSHISTORIK: append-only ----------
create policy farve_vh_select on farve_verification_history
  for select to authenticated using (true);
create policy farve_vh_insert on farve_verification_history
  for insert to authenticated with check (true);
-- (Bevidst: ingen update/delete → historik kan ikke ændres.)

-- ---------- IMPORT-ISSUES ----------
create policy farve_issues_select on farve_import_issues
  for select to authenticated using (true);
create policy farve_issues_update on farve_import_issues
  for update to authenticated using (true) with check (true);


-- ============================================================
-- SKABELON (deaktiveret): rolle-stram RLS når behovet strammes.
-- Kræver en `profiler`-tabel med en rolle-kolonne i det delte projekt.
-- Redigér kolonne/rolleværdier så de matcher projektet, og erstat de
-- åbne insert/update-politikker ovenfor med disse.
-- ============================================================
-- create or replace function farve_er_redaktoer()
-- returns boolean language sql security definer stable as $$
--   select exists (
--     select 1 from profiler p
--     where p.id = auth.uid()
--       and p.rolle in ('admin', 'redaktoer')   -- tilpas til projektets rolleværdier
--   );
-- $$;
-- revoke all on function farve_er_redaktoer() from public;
--
-- Eksempel (matches): kun redaktør må skrive, alle må læse:
--   drop policy farve_matches_insert on farve_matches;
--   create policy farve_matches_insert on farve_matches
--     for insert to authenticated with check (farve_er_redaktoer());
--   drop policy farve_matches_update on farve_matches;
--   create policy farve_matches_update on farve_matches
--     for update to authenticated using (farve_er_redaktoer()) with check (farve_er_redaktoer());
