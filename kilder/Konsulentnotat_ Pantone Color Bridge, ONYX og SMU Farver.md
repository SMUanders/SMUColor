# Konsulentnotat: Pantone Color Bridge, ONYX og SMU Farver

**Dato:** 14. august 2026  
**Virksomhed:** Signmeup A/S  
**Formål:** At afklare, om der allerede findes digital Pantone Color Bridge Coated-data, og definere et lavrisiko-princip for at holde en ekstern Pantone-reference adskilt fra Signmeups egne verificerede produktionsmatches.

## 1. Konklusion

Signmeup har fundet en konkret, digital Color Bridge Coated-palette i en eksisterende, licenseret CorelDRAW-installation. Det er det bedste hidtidige grunddatafund og indeholder Pantone-navn, proces-CMYK, Lab, sRGB og Adobe RGB i et maskinlæsbart XML-format.

> **Anbefalet princip:**  
> **Pantone Color Bridge = ekstern reference.**  
> **SMU Farver = Signmeups egne ONYX-specifikke, målte og godkendte produktionsmatches.**

Den fundne Corel-palette bør **bevares som sporbar referencekilde**, men ikke ukritisk kopieres ind i SMU OS som en permanent komplet Pantone-database. Pantone angiver selv, at indbygning af deres farvebiblioteker, data og nummersystem i software er omfattet af særskilte erhvervslicenser. [1]

## 2. Hvad er undersøgt

| Spor | Resultat | Vurdering |
|---|---|---|
| Pantones aktuelle Color Bridge Coated-produkt | Pantone beskriver Color Bridge Guide Coated, SKU GG6103B, som en coated reference med CMYK, RGB og HTML/Hex samt 2.359 Pantone-spotfarver. [2] | Den fysiske guide er den visuelle reference, som skal være facit for den konkrete modtagne udgave. |
| Pantone Connect | Tjenesten giver digital adgang til aktuelle Pantone-data og konverteringer, men den tilknyttede browser var ikke logget ind. Adgangsniveau, præcist Color Bridge-bibliotek og legitim eksport er derfor **ikke** verificeret. [3] | Mulig supplerende kilde, men ikke grundlag for projektet endnu. |
| Lokale filer og mail | Ingen relevante Pantone-, Color Bridge-, ASE- eller ACO-filer blev fundet i det tilgængelige arbejdsområde eller tilgængelige mailarkiv. | Ikke udtømmende for Signmeups PC’er, NAS eller backups. |
| X-Rite i1ProcessControl | Der findes en licens til i1ProcessControl. X-Rite har fortsat produktsupport og software-/manualspor. [4] | Relevant til proceskontrol, målinger og historiske rapporter — ikke dokumenteret som en komplet Color Bridge-kilde. |
| Barbieri Caldera ColorPad | Instrumentet er identificeret som Barbieri Caldera ColorPad, model C300B00-C, årgang 2018. | Relevant som måleinstrument; **Caldera bruges ikke hos Signmeup** og er derfor ikke et RIP-spor. |
| CorelDRAW Color-mappe | Signmeup har leveret en ZIP-kopi fra `C:\Program Files\Corel\CorelDRAW Graphics Suite\27\Color`. | Indeholder den fundne Color Bridge V5-kilde samt standard-ONYX-referencepalette. |
| ONYX | Signmeup bruger ONYX som RIP. ONYX understøtter printmode-definerede farver med outputværdier knyttet til valgt printer, medie, mediegruppe og printmode. [5] | Dette er det rigtige lag for Signmeups produktionsmatches. |

## 3. Det konkrete fund i CorelDRAW

Den leverede CorelDRAW-mappe indeholder denne fil:

```text
Color/Palettes/Process/PANTONE/PANTONE+/PantonePlusColorBridgeCoated.xml
```

Palettens egne metadata er:

| Egenskab | Fund |
|---|---|
| Internt paletnavn | `PANTONE+ COLOR BRIDGE Coated-V5` |
| Status i Corel | `locked=true` |
| Antal poster | 2.363 |
| Start/slut i filen | `PANTONE Process Yellow C` → `PANTONE 6224 CP` |
| Individuelle Corel-versionsmarkører | 1700, 2000, 2200 og 2430 |
| Ældre Color Bridge-fil fundet? | Ja, separat `Previous Version/PantoneColorBridgeCoated.xml` med 1.089 poster. **Den skal ikke bruges.** |

### 3.1 Indeholdte felter

| Felt | Fundet i V5 XML | Bemærkning |
|---|---:|---|
| Pantone/Color Bridge-navn | Ja | Eksempel: `PANTONE 100 CP`. |
| CMYK | Ja | Gemmes som 0–1-værdier; den medfølgende CSV viser procent. |
| Lab | Ja | Gemmes i Corels normaliserede repræsentation. Råværdi bevares. |
| sRGB | Ja | CSV viser 0–255-værdier. |
| Adobe RGB | Ja | Råværdi bevares i CSV. |
| Hex | Ikke direkte | Beregnes i CSV ud fra Corels sRGB-værdi. Det må derfor ikke kaldes et selvstændigt, officielt Pantone-HTML-felt uden ekstra verifikation. |

Paletten ligner klart en nyere Color Bridge-kilde, men den indeholder ikke et eksplicit Pantone-udgivelsesår eller en direkte reference til SKU GG6103B. Den må derfor **ikke** antages at være bit-identisk med den nye fysiske guide, før vi har lavet en enkel stikprøvekontrol mod den modtagne guide.

## 4. Filer afleveret med dette notat

| Fil | Type | Formål |
|---|---|---|
| `PantonePlusColorBridgeCoated_V5.xml` | Original XML | Uændret udtræk fra Signmeups licenserede CorelDRAW-installation. Bevar som write-once/referencekilde. |
| `Pantone_Color_Bridge_Coated_V5_2363.csv` | Afledt CSV | Læsevenlig analysefil med navn, CMYK, Lab, RGB, afledt Hex, Adobe RGB og kildeoplysning. |
| `Pantone_og_SMU_Farver_konsulentnotat.md` | Notat | Denne rapport. |

| Integritetsoplysning | SHA-256 |
|---|---|
| Original XML | `2972f0e967bbe4796a40ba35991581784c91f6be5ede8343311bee5304fd0425` |
| Afledt CSV | `a8486cb06de63a8820894b0cb2bc66bba310d9d6571f634a2ed33d4c6e68b691` |

## 5. ONYX er produktionslaget — ikke Pantone-kilden

ONYX’ **Print Mode Defined Colors** er relevant, fordi den kan gemme en navngiven spotfarve med de konkrete outputkanalværdier for en udvalgt printer, mediegruppe, medie og printmode. ONYX anvender den matchende farves navn og prioriterer denne erstatningstabel, når et navn findes. [5]

Det anbefalede minimum pr. SMU-match er derfor:

| Feltgruppe | Minimumindhold |
|---|---|
| Pantone-reference | `PANTONE 100 CP`, referencekilde `Corel Color Bridge V5`, fysisk guide/side eller foto, samt rå referencefelter. |
| ONYX-produktionsopsætning | Printer, blækset, mediegruppe, medie, printmode, profil/Quick Set og faktisk outputopskrift. |
| Verifikation | Instrument, målebetingelse, L*a*b* eller anden anvendt måleværdi, evt. Delta E, dato, ansvarlig og godkendelsesstatus. |
| Status | Udkast, under test, godkendt eller udgået. |

ONYX pointerer selv, at spotfarver uden for printerens farverum ikke kan forventes at blive matchet perfekt. [6] Derfor må en Color Bridge-CMYK aldrig blive behandlet som en direkte, universel ONYX-opskrift.

## 6. Afgrænsninger og risici

| Risiko | Håndtering |
|---|---|
| Corel-palette og fysisk Color Bridge-guide er ikke dokumenteret som samme udgave | Foretag stikprøve mod den modtagne guide, før paletten får status som projektets reference. |
| Digital Pantone-data er licensbeskyttet | Bevar filen som intern kildedokumentation. Afklar Pantone-licens før fuld kopi i SMU OS eller kundevendt brug. [1] |
| Referencetal forveksles med produktionsopskrift | Hold Pantone-reference og ONYX-match i separate tabeller/objekter. |
| Gammel standardpalette eller “Previous Version” anvendes ved en fejl | Brug kun V5-kilden; markér historiske filer som arkiv. |
| Måleresultater mangler produktionskontekst | Gem altid printer, medie, printmode, profil og måledato sammen med resultatet. |

## 7. Anbefalet næste skridt

Der bør **ikke** bygges en komplet Pantone-funktion i SMU OS endnu.

1. Når den fysiske Color Bridge Guide Coated modtages, dokumenteres forside, SKU, informationsside og 10 stikprøver mod V5-filen.
2. Tag en **læsekopi** af ONYX’ konfigurations-/backup- og farvedata. Der skal ikke opdateres, eksporteres eller ændres i ONYX først.
3. Identificér eksisterende egne ONYX-matches og skel dem fra standard-ONYX-data.
4. Opret derefter kun et lille pilotkartotek med 10–20 hyppige kundefarver og relevante materialer.
5. Beslut efter piloten, om en Pantone-licens eller Pantone Connect-adgang skal afklares nærmere.

Det afgørende er, at Signmeup opbygger **målte, driftssikre produktionsmatches** og ikke et stort, uverificeret farveregister.

## Referencer

[1]: https://www.pantone.com/eu/en-de/license "Pantone: Business Licensing for Software + Web"
[2]: https://www.pantone.com/na/en-us/products/graphics/color-bridge-guide-coated "Pantone: Color Bridge Guide Coated"
[3]: https://connect.pantone.com/pricing "Pantone Connect: Pricing and feature overview"
[4]: https://www.xrite.com/service-support/product-support/calibration-solutions/i1process-control "X-Rite: i1Process Control Product Support"
[5]: https://help.onyxgfx.com/18/ProductionHouse/Content/RIP-Queue/Color%20Matching%20Table/Print%20Mode%20Defined%20Colors.htm "ONYX: Print Mode Defined Colors"
[6]: https://help.onyxgfx.com/25/ONYXGo/Content/RIP-Queue/Color%20Matching%20Table/Color%20Matching%20Table_Thrive.htm "ONYX: Color Matching Table"
