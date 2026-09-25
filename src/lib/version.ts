// SMU Platform — produktversion.
//
// To ADSKILTE begreber, samme princip som SMU Tid (`smu-tid/src/lib/version.ts`):
//  - PRODUKTVERSION (menneskelig, fx "v1.0") — eneste sandhedskilde er
//    package.json "version", indlejret ved build som __APP_PRODUCT_VERSION__.
//    Vises diskret i UI.
//  - BUILD-ID (teknisk bygnings-tidsstempel) — findes ikke i denne app og
//    indføres IKKE her. Har appen senere brug for update-detektion, tilføjes
//    et separat __APP_VERSION__ som i SMU Tid. De to må ikke blandes sammen.
//
// Deklarationen ligger her frem for i vite-env.d.ts, så hele produktversions-
// begrebet kan kopieres til en ny app som én fil.
declare const __APP_PRODUCT_VERSION__: string

// Fallback hvis konstanten ikke er defineret (fx et rent test-miljø).
// `typeof` på et udeklareret navn kaster ikke i JavaScript.
export const APP_PRODUCT_VERSION: string =
  typeof __APP_PRODUCT_VERSION__ !== 'undefined' ? __APP_PRODUCT_VERSION__ : 'dev'

/** Formatér en semver-streng til diskret label: "1.0.0" → "v1.0". Ren (testbar). */
export function formatProductVersion(v: string): string {
  const m = /^(\d+)\.(\d+)/.exec(v)
  return m ? `v${m[1]}.${m[2]}` : v
}

/** Menneskelig produktversion til diskret UI-label: "v1.0" (major.minor). */
export function appProductVersion(): string {
  return formatProductVersion(APP_PRODUCT_VERSION)
}
