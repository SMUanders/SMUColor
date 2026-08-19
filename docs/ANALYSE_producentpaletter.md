# ANALYSE — Producentpaletter (CorelDRAW)

> **Read-only investigation, 2026-08-19.** Dette er et ANALYSEDOKUMENT — ikke en
> beslutning og ikke en implementering. Ingen databaseændringer, migrationer,
> imports, seeds, UI-ændringer eller normaliseringer er foretaget. Produktvalget
> om datamodel er bevidst IKKE truffet her.

Kilde: 6 ZIP-filer i `kilder/` (gitignoreret som internt kildemateriale).

---

## 1. Fundne ZIP/paletter

| ZIP | Producent | Indhold |
|---|---|---|
| `oracal651_corel.zip` | ORAFOL (Oracal) | `ORACAL 651_X5.xml` + `.cpl` + readme (de/en) |
| `oracal751c_corel.zip` | ORAFOL (Oracal) | `ORACAL 751 C.xml` + readme |
| `oracal8500_corel.zip` | ORAFOL (Oracal) | `ORACAL 8500_X5.xml` + `.cpl` + readme |
| `oracal8800_corel.zip` | ORAFOL (Oracal) | `ORACAL 8800_X5.xml` + `.cpl` + readme |
| `oracal970_corel.zip` | ORAFOL (Oracal) | `970 glossy` + `970 matt` (hver `.xml` + `.cpl`) + readme |
| `Mactac_MACal_9800_Pro_101_color_swatches.zip` | Mactac | 101 **PNG-swatchbilleder** (ingen datapalette) |

`.xml` = CorelDRAW X5-palette (maskinlæsbar). `.cpl` = samme data i Corels binære
paletteformat (redundant ift. XML).

## 2–3. Serier, antal farver, farvefelter

Alle Oracal-paletter er **udelukkende RGB** (ingen Lab, CMYK, HEX-felt eller
spot-definition). RGB gemmes som 0–1-tints; HEX herunder er afledt.

| Serie | Antal farver | Farvefelter |
|---|---|---|
| ORACAL 651 | 60 | RGB |
| ORACAL 751 C | 117 | RGB |
| ORACAL 8500 | 54 | RGB |
| ORACAL 8800 | 57 | RGB |
| ORACAL 970 glossy | 76 | RGB |
| ORACAL 970 matt | 20 | RGB |
| Mactac MACal 9800 Pro | 101 (kun PNG) | *ingen datafarve* |

**Kodeidentitet:** farvenavnet har formen `"031 (ORACAL 751 C)"` → koden er
farve­nummeret (3-cifret), serien i parentes. Readme bekræfter skemaet:
"020 (551) = colour 020 of the series ORACAL 551". Der er **ingen serie-præfiks
i koden selv** (koden er `031`, ikke `751-031`).

**Mactac:** filnavne koder serie/variant/navn + et Mactac-artikelnummer
(fx `EA3980002`), men indeholder ingen strukturerede farveværdier — kun billeder.

## 4. Konkrete eksempler

Dine eksempelkoder (§3) — alle fundet:

```
ORACAL 651:
  057 → #003F8D  RGB(0,0.247,0.553)      | 057 (ORACAL 651)   (blå)
  073 → #4A4C4C  RGB(0.290,0.298,0.298)  | 073 (ORACAL 651)   (mørk grå)
  063 → #68A630  RGB(0.408,0.651,0.188)  | 063 (ORACAL 651)   (grøn)
ORACAL 751 C:
  031 → #B81311  RGB(0.722,0.075,0.067)  | 031 (ORACAL 751 C) (rød)
  032 → #D21502  RGB(0.824,0.082,0.008)  | 032 (ORACAL 751 C) (lys rød)
  060 → #004429  RGB(0,0.267,0.161)      | 060 (ORACAL 751 C) (mørk grøn)
```

## 5. Provenance / kildekvalitet

Fra ORAFOL's egen readme (leveret i hver ZIP):
- **Kilde: ORAFOL Europe GmbH** — producentens egne, officielle CorelDRAW-paletter
  ("ORAFOL provides Colour palettes for selected products"). Version fx
  `ORACAL 751 C … 2018-05-15`.
- **Formål:** designværktøj til at *vælge* foliefarver i designfasen.
- **Eksplicit disclaimer:** *"The accuracy of the presented colours depends on the
  used hard- and software. The colours may deviate from the original product.
  Examples for the colours as references (Colour cards) are available from your
  dealer."*

**Konklusion om provenance:**
- **Kode + navn + serie:** høj tillid — dette ER producentens officielle
  produkt-/variantliste.
- **Farveværdi (RGB):** LAV tillid som farvesandhed — det er en hardware-afhængig
  skærmtilnærmelse, som ORAFOL selv fraskriver sig. Den fysiske farvekort/prøve er
  facit. Må **ikke** kaldes "autoritativ producentfarve".
- Mactac: kilde ser ud til at være swatch-billeder (sandsynligvis fra Mactacs
  materiale); ingen målte/strukturerede farveværdier — kun billede + artikelnr.

## 6. Sammenligning med Pantone C-modellen

**Ens:**
- Begge leveres som CorelDRAW-paletter.
- Begge har kode + navn og kan søges.

**Forskelligt (afgørende):**
| | PANTONE C | ORACAL 751 C |
|---|---|---|
| Hvad er det | En farve-**reference/standard** | En fysisk **produktserie** med producent-definerede farvevarianter |
| Farvedata | **Målt Lab** (spot) = sandheds-anker + CMYK-bridge | Kun **RGB-skærmtilnærmelse**, disclaimet |
| Eksisterer uafhængigt af et produkt? | Ja (en farvestandard) | Nej (en variant ER et fysisk produkt) |
| Domæne | Farvereference (SMU Color) | Produkt/materiale (SMU Source) med en farve-*attribut* |

⇒ **De må ikke modelleres identisk.** Pantone C er en ren farvereference; en
ORACAL-variant er et produkt/materiale, hvis "farve" tilmed kun er en svag
tilnærmelse. At lægge Oracal ind som et Pantone-lignende referenceunivers ville
gøre farvedata (svag) til et anker og gøre SMU Color til en de-facto materialemaster.

## 7. Overlap med Manus' historiske materialekoder

*(Kun candidate matching. Ingen observation ændret, ingen normalisering godkendt.)*

**A) Legacy Tegnestueplan-koder** (118 rå material-farver, backup):
- **Eksakt palettekode-match: 116** — alle `751-xxx` findes som farvenummer i 751 C-paletten.
- **Uden match: 1** — `752-801` (ingen 752-palette i materialet). Ikke-format: 1.

**B) Manus-masterens faktiske rå koder** (fra konsolideringsdokumentet):

| Manus rå kode | Obs | Palette-kandidat | Resultat |
|---|---|---|---|
| `751-591` | OBS-003 | 751 C / 591 | FUNDET ✓ (kandidat) |
| `751-051` | OBS-067, OBS-068 | 751 C / 051 | FUNDET ✓ (kandidat) |
| `65L-032` | (datakvalitet) | 651 / 032 ? | FUNDET **men OCR-tvetydig** (`65L` ≈ `651`?) |
| `Macal 9839-23` | OBS-236 | Mactac 9839-23 | FUNDET ✓ i Mactac-swatch ("Scandinavian Blue") |
| `3551`, `3551-215`, `X1 - 3551-SG` | 43+ obs | *(Orajet — ingen palette)* | ingen palette leveret |
| `Avery Supreme Blue CB-152` | OBS-035 | *(Avery — ingen palette)* | ingen palette leveret |

**Tvetydigheder / serieproblemer:**
- **751 vs 751C:** paletten hedder **"751 C"** (cast); Manus/legacy skriver **"751-xxx"** (uden C).
  Match sker på farvenummer, men *751-031 = 751C-031* er en **antagelse** (samme serie/variant),
  som skal bekræftes menneskeligt.
- **OCR-fejl:** `65L-032` og lignende kan ikke sikkert kategoriseres (Manus flagger selv dette).
- **Ikke-Oracal-materialer:** de hyppigste Manus-materialekoder er `3551`-varianter (Orajet) og
  Avery — der er **ingen paletter** for disse. Mange rå koder har ukendt semantik.
- **Cross-producent:** `Macal 9839-23` viser at Mactacs swatch-filnavne fungerer som kode+navn-kilde
  (men uden farvedata).

## 7b. Bekræftelse: Manus' feltbehov = det udvidede observationslag

Manus-konsolideringens egen "felter som viste sig nødvendige" er **identiske** med de rå
felter, observationslaget allerede er udvidet med (forrige runde): `ral_as_written`,
`manufacturer_as_written`, `material_code_as_written`, `handwritten_as_written`,
`assessment_signal_as_written`, `context_evidence_as_written`, `source_dataset`,
`source_row_number`, `source_value_class`, `status`. Modellen er altså på linje med den
faktiske master (uden at masteren er importeret).

## 8. Datamodelmuligheder (kun vurdering — ingen beslutning)

Domænegrænse: **SMU Source** ejer producent/produkt/variant/materiale. **SMU Color**
ejer farvereferencer/-repræsentationer, matches, test/verifikation.

**A) Referenceunivers i SMU Color** (som Pantone `reference_colors`)
- \+ Genbruger eksisterende reference-/match-/søgemodel; hurtigt.
- − Konflaterer produkt (Source) med farvereference (Color); skaber en de-facto
  materiale-/produktmaster i Color — **det som eksplicit skal undgås**. RGB-tilnærmelsen
  ophøjes fejlagtigt til reference.

**B) Farveattribut på Source-materialefarver**
- Variant (Oracal 751C-031) ejes af Source; SMU Color holder kun en farve-*repræsentation*
  (producent-RGB, provenance ORAFOL, vejledende) knyttet til Source-varianten + matches.
- \+ Korrekt ejerskab; ingen parallel master i Color; RGB behandlet som svag attribut.
- − Source findes ikke endnu; materialefarver ligger p.t. i Colors `farve_material_colors`.
  Tidsafhængighed / overgangsspørgsmål.

**C) Kombination med eksplicit ejerskab/relation**
- Source ejer produkt/variant-identiteten; SMU Color har en "producent-farvereference"-post
  (RGB + provenance + disclaimer) der er **relateret** til Source-varianten via koden; matches
  peger på den. Ingen kopiering — Color refererer Source' variant-id.
- \+ Rent ejerskab, ingen dobbeltdata, fremtidssikret.
- − Flere bevægelige dele; kræver at ejerskabskontrakten (Source↔Color) defineres først.

## 9. Risici for dobbeltdata / uklart domæneejerskab

- **Parallel materialemaster i Color** hvis Oracal importeres som referenceunivers (A)
  — direkte imod domænegrænsen.
- **Svag farve fremstillet som sandhed:** producent-RGB er disclaimet; må aldrig vises/lagres
  som materialets autoritative farve (samme princip som "vejledende visning via Pantone-match").
- **751 vs 751C** seriemapping kan skabe forkerte relationer, hvis antaget uden review.
- **Variant-navn/-kode = Source-ejendom;** at lade Color eje produktvariant-identiteten dobler
  det, Source skal eje.

## 10. Anbefalet næste skridt (ikke besluttet)

- Produktbeslutning om A/B/C hører til produktejer + Source-arkitektur.
- Uanset valg: behandl **kode+navn** (høj provenance) adskilt fra **RGB** (vejledende,
  disclaimet). Ingen import før ejerskab (Source↔Color) er afklaret.
- 752-serien og evt. andre serier mangler paletter; Mactac mangler datafarver.
