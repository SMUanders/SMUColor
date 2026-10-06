// Color-skriveret udledt af den APP-SPECIFIKKE rolle i app_adgange — så frontend
// spejler databasens RLS (har_app_rolle('color','redaktoer')), ikke profiler.rolle.
//
// Niveauer i app_roller (color): observatoer 5, bruger 10, redaktoer 20, admin 30.
// Skriveret (oprette/redigere/verificere) kræver niveau >= redaktoer (20) →
// altså rollerne redaktoer og admin. observatoer og bruger = kun læsning.
export const COLOR_SKRIVE_ROLLER: ReadonlySet<string> = new Set(['redaktoer', 'admin'])

/**
 * true hvis mindst én af brugerens AKTIVE color-roller giver skriveret (redaktør+).
 * Fail-closed: tom liste (ingen/inaktiv color-adgang) → false. Robust over for
 * flere rækker (højeste rolle vinder) samt case/whitespace.
 */
export function erColorRedaktoer(aktiveColorRoller: readonly string[]): boolean {
  return aktiveColorRoller.some((r) => COLOR_SKRIVE_ROLLER.has(r.trim().toLowerCase()))
}
