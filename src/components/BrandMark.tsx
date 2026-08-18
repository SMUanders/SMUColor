/**
 * SMU Color-mærke: en lille farvevifte (fan-deck) i blå-familie på navy — flad
 * SMU-stil uden hvide kanter, kort adskilt af navy mellemrum. Bruges i topbar
 * og på login. Samme motiv som favicon.
 */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="SMU Color">
      <rect x="2" y="2" width="96" height="96" rx="24" fill="#213746" />
      <g stroke="#213746" strokeWidth="3.5">
        <g transform="rotate(42 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#B1C9E8" /></g>
        <g transform="rotate(28 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#7BB8E2" /></g>
        <g transform="rotate(12 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#3f9ed3" /></g>
        <g transform="rotate(-5 38 85)"><rect x="24" y="20" width="28" height="65" rx="7" fill="#2384b8" /></g>
      </g>
      <g transform="rotate(-5 38 85)"><circle cx="38" cy="75" r="4.5" fill="#213746" /></g>
    </svg>
  )
}
