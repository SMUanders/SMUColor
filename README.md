# SMU Color

Internt farveopslags- og verifikationsværktøj for Signmeups tegnestue.

Hurtigt at bruge: **søg → find farve → se Color Bridge-reference → se SMU-matches → forstå om et match er et *forslag* eller *verificeret* → verificér.**

Kerneprincip: **reference er ikke det samme som et verificeret match.** Pantone
Color Bridge er en ekstern reference; Signmeups egne, verificerede folie-/print-/
materialematches bygges ovenpå og holdes teknisk adskilt.

## Kom i gang

```bash
npm install
npm run dev
```

Uden Supabase-keys kører appen i **lokal dev-tilstand** (seed-data + localStorage),
så hele flowet kan afprøves med det samme.

## Kommandoer

```bash
npm run dev          # udviklingsserver
npm run build        # tsc + produktionsbuild
npm run lint         # eslint
npm test             # vitest
npm run import:all   # regenerér seed fra kilder/ (reference + legacy)
```

## Struktur

- `src/data/` — storage bag interface (Supabase-adapter + lokal dev-adapter) + genereret seed.
- `src/pages/` — Login, Home (søgning), ColorDetail, MatchEdit, Admin.
- `supabase/migrations/` — skema + RLS. `supabase/seed/` — genererede seed-SQL.
- `scripts/` — reproducerbar Color Bridge- og legacy-import.
- `kilder/` — write-once referencekilder + legacy-fil.

Se `CLAUDE.md` for datamodel, afvigelser fra SMU-standarden og opsætning mod det
delte Supabase-projekt.
