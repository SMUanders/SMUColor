/**
 * SMU Color-mærke: en lille farveprøve-chip (Pantone-kort-stil) med Signmeups
 * lyseblå PANTONE 658 C (#B1C9E8). Bruges i topbar og på login. Læsbar helt ned
 * i favicon-størrelse; label-bjælken antyder chip-kortets tekstlinje.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="SMU Color">
      <rect x="2" y="2" width="96" height="96" rx="26" fill="#ffffff" stroke="#e4e0d8" strokeWidth="3" />
      <rect x="15" y="13" width="70" height="52" rx="10" fill="#B1C9E8" />
      {/* Lille label-bjælke der antyder PANTONE-tekstlinjen på chip-kortet */}
      <rect x="15" y="75" width="46" height="9" rx="4.5" fill="#213746" />
    </svg>
  )
}
