# SMU Color — app-specifik CLAUDE.md

> **SMU Platform.** Dette repo er en del af SMU Platform. Fælles platform-sandhed og sandhedshierarki ligger i
> `smu-os-v2`'s Truth Reset-dokumenter (`PROJECT_OVERVIEW`/`DOMAIN_MODEL`/`DESIGNKATALOG`/`ROADMAP`/`NEXT_STEPS`/`PLANNING`),
> `SMU_APP_STANDARD.md` og det globale Claude Code-lag. Ved konflikt vinder platformens sandhedshierarki.
> Denne fil beskriver kun app-specifikke forhold.

Internt farveopslags- og verifikationsværktøj for Signmeups tegnestue. Følger
`SMU_APP_STANDARD.md` (roden) + `docs/SMU_DESIGN_SYSTEM.md`. Læs dem først.
Afvigelser fra standarden er dokumenteret nederst.

**Tabel-prefix:** `farve_`

## Kerneprincip
`SPOT (C) ≠ CP CMYK ≠ MATCH ≠ VERIFIKATION.` Tre referencelag + Signmeups sandhed:
- **PANTONE C (Solid Coated)** = spotfarve-**standarden/sandheds-ankeret** (målt Lab). Kundens mål.
- **PANTONE CP (Color Bridge)** = Pantones **CMYK-procesreference** af spotfarven — allerede en reference, ikke sandheden. Hænges på C-farven via nummeret.
- **SMU-viden = matches** oven på referencen (folie/print/RAL/…), med status.
- **Verifikation** er en menneskelig Signmeup-handling — sættes aldrig automatisk. Det verificerede produktionsmatch er Signmeups sandhed.

## Datamodel (se `supabase/migrations/`)
- `farve_reference_colors` — **anker = Solid Coated (C), 2.390 spotfarver** med målt Lab; CP-CMYK (Color Bridge, 2.359 joinede) hængt på som `cmyk_*` + `cp_name` + `cp_hex`. Read-only for brugere.
- `farve_materials` / `farve_material_colors` — folier/materialer (Oracal m.fl.).
- `farve_matches` — **selvstændigt domæneobjekt**: reference ↔ materiale, med
  `status` (forslag/under_test/verificeret/afvist) og `reference_antaget`.
- `farve_production_context` — printer/medie/printmode/profil/quick_set/output (Canon Colorado M-series / ONYX).
- `farve_verification_history` — append-only historik.
- `farve_import_issues` — tvetydige legacy-rækker til manuel gennemgang.

## Data-arkitektur
- Storage bag interface (`src/data/store.ts`) med to adaptere:
  - `supabaseStore.ts` — den rigtige, delte backend.
  - `localStore.ts` — dev-fallback (seed + localStorage), bruges når Supabase-keys mangler.
- Adaptervalg i `src/data/index.ts` via `hasSupabase`.

## Import (reproducerbar, sporbar)
- `npm run import:reference` — joiner `kilder/PantonePlusSolidCoated_V5.xml` (C-anker) + `kilder/PantonePlusColorBridgeCoated_V5.xml` (CP CMYK) på Pantone-nummer → `src/data/seed/reference-colors.json` + `supabase/seed/0001_reference_colors_seed.sql`. SHA-256 på begge kilder beregnes og gemmes pr. post.
- `npm run import:legacy` — `kilder/Tegnestueplan2023.xlsx` → materials/material-colors/matches/import-issues (JSON + `0002_legacy_seed.sql`).
- Legacy importeres **altid som `forslag`**, `reference_antaget=true`, med fil/ark/række/råværdi. Aldrig verificeret. Tvetydige rækker logges i stedet for at gættes.
- Kildefiler ligger i `kilder/` (write-once referencekilder + legacy). SHA-256 på XML bevaret i seed.

## Skærme (`src/pages/`)
Login · Home (søgning + forside) · ColorDetail (reference + matches) · MatchEdit (opret/rediger + produktion + verifikation) · Admin (status-overblik + legacy-issues).

## Kør
`npm run dev` · `npm run build` · `npm run lint` · `npm test` · `npm run import:all`

## Supabase-status: ANVENDT (2026-08-14)
Skema + RLS + begge seeds er kørt på det delte prod-projekt `smu-os-v2`
(ref `ggnnfzhhqhwmugubfxuj`) via `supabase db query --linked` (Management API,
ikke `db push`). 7 `farve_`-tabeller oprettet, ingen eksisterende tabeller ændret.
Data i DB: 2.390 reference · 18 materialer · 118 materialefarver · 111 forslag ·
0 verificeret · 10 issues. `.env.local` (gitignored) peger appen på projektet.
Netlify: sæt samme to `VITE_`-vars i UI før deploy.

## Opsætning mod delt Supabase (hvis nulstilling nødvendig) — KRÆVER MENNESKE
Det delte prod-projekt er `smu-os-v2` (ref `ggnnfzhhqhwmugubfxuj`, West EU). Skema
til shared prod skal køres af et menneske (kan ikke dry-run'es uden Docker; kræver
DB-password). Migrationen er additiv (`create ... if not exists`, `farve_`-prefix,
ingen drops). To veje:

**A. Supabase Studio (anbefalet — du styrer prod):**
1. Kør `supabase/migrations/20260814120000_farve_schema.sql` i SQL Editor.
2. Kør `supabase/migrations/20260814120100_farve_rls.sql`.
3. Kør `supabase/seed/0001_reference_colors_seed.sql` (2.390 spot, idempotent).
4. Kør `supabase/seed/0002_legacy_seed.sql` (111 forslag, 118 materialefarver, ...).

**B. CLI (repoet er allerede `supabase init`'et med `config.toml`):**
```
supabase link --project-ref ggnnfzhhqhwmugubfxuj   # beder om DB-password
supabase db push                                   # kører migrations
# seeds køres via Studio, eller lokalt med: supabase db reset (kræver Docker)
```

Derefter:
5. Sæt `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Netlify UI / `.env.local`). Så skifter appen automatisk fra lokal dev til Supabase.
6. Bekræft `profiler`-rolle og aktivér rolle-stram RLS (skabelon i `20260814120100_farve_rls.sql`).

## Dokumenterede afvigelser fra standarden
1. **Roller i frontend, ikke i RLS (endnu).** V1 håndhæver redaktør/medarbejder i
   frontend (`AuthContext.erRedaktoer` + `RequireRedaktoer`). DB-RLS er minimum
   `to authenticated`. Årsag: `profiler.rolle`-værdier i det delte projekt er ikke
   bekræftet endnu. Rolle-stram RLS ligger som klar skabelon i RLS-migrationen —
   aktivér når rollerne er verificeret.
2. **Reference-tabel uden skrive-RLS.** `farve_reference_colors` har kun
   `select`-politik; skrivning sker via seed/service role. Beskytter ekstern
   reference mod overskrivning.
3. **Vite 6 (ikke 8).** Standarden nævner Vite 8; brugt Vite 6 (seneste stabile
   testet her). React 19 + TS strict + Tailwind 4 følger standarden.
4. **Ingen Netlify Functions endnu.** Ingen server-hemmeligheder nødvendige i V1.

## Ikke i V1 (bevidst)
ONYX-integration · måleinstrument-integration · komplet materialestyring · SMU OS-integration · farveberegningsmotor. Datamodellen er dog klar til måledata (measured_lab, delta_e, instrument, foto) og materialefelter.
