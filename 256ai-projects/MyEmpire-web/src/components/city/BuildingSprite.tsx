/**
 * Top-down SVG sprites for businesses on the city map.
 * ViewBox is 200×200 for fine detail; rendered at actual lot pixel size.
 */

interface SpriteProps {
  w?: number;
  h?: number;
}

// ─── Shared parking lot base ──────────────────────────────────────────────────

function ParkingLot({ w = 72, h = 72, spots = 'bottom', children }: SpriteProps & { spots?: 'bottom' | 'right' | 'both'; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Asphalt base */}
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Subtle asphalt texture */}
      <rect width="200" height="200" fill="url(#asphalt)" opacity="0.3" />
      <defs>
        <pattern id="asphalt" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.4" fill="#333" />
          <circle cx="4" cy="4" r="0.3" fill="#2a2a3a" />
        </pattern>
      </defs>

      {/* Parking spots — bottom */}
      {(spots === 'bottom' || spots === 'both') && (
        <g>
          {/* Curb / sidewalk strip */}
          <rect x="8" y="148" width="184" height="5" rx="1.5" fill="#555" />
          {/* Parking bay lines */}
          {[20, 55, 90, 125, 160].map(x => (
            <rect key={x} x={x} y="153" width="1.5" height="40" fill="#666" rx="0.5" />
          ))}
          {/* Handicap symbol in first spot */}
          <rect x="25" y="168" width="20" height="16" rx="2" fill="#1e40af" opacity="0.5" />
          <text x="35" y="180" textAnchor="middle" fontSize="10" fill="#60a5fa" fontWeight="bold">♿</text>
        </g>
      )}

      {/* Parking spots — right side */}
      {(spots === 'right' || spots === 'both') && (
        <g>
          <rect x="155" y="8" width="5" height="135" rx="1.5" fill="#555" />
          {[20, 50, 80, 110].map(y => (
            <rect key={y} x="160" y={y} width="32" height="1.5" fill="#666" rx="0.5" />
          ))}
        </g>
      )}

      {children}
    </svg>
  );
}

// Parked car shape (top-down, ~28×14)
function Car({ x, y, color, rot = 0 }: { x: number; y: number; color: string; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      {/* Body */}
      <rect x="-14" y="-7" width="28" height="14" rx="4" fill={color} />
      {/* Windshield */}
      <rect x="5" y="-5" width="7" height="10" rx="2" fill="#1e293b" opacity="0.7" />
      {/* Rear window */}
      <rect x="-11" y="-4" width="5" height="8" rx="1.5" fill="#1e293b" opacity="0.5" />
      {/* Headlights */}
      <circle cx="13" cy="-4" r="1.2" fill="#fde68a" />
      <circle cx="13" cy="4" r="1.2" fill="#fde68a" />
      {/* Taillights */}
      <circle cx="-13" cy="-4" r="1" fill="#ef4444" opacity="0.8" />
      <circle cx="-13" cy="4" r="1" fill="#ef4444" opacity="0.8" />
    </g>
  );
}

// Picnic table with umbrella (top-down)
function PicnicTable({ x, y, umbrellaColor }: { x: number; y: number; umbrellaColor: string }) {
  return (
    <g>
      {/* Table */}
      <rect x={x - 6} y={y - 4} width="12" height="8" rx="1" fill="#78716C" />
      {/* Bench seats */}
      <rect x={x - 7} y={y - 6} width="14" height="2" rx="0.5" fill="#92400E" />
      <rect x={x - 7} y={y + 4} width="14" height="2" rx="0.5" fill="#92400E" />
      {/* Umbrella */}
      <circle cx={x} cy={y} r="9" fill={umbrellaColor} opacity="0.7" />
      <circle cx={x} cy={y} r="1" fill="#444" />
    </g>
  );
}

// ─── Taco Stand ───────────────────────────────────────────────────────────────

function TacoStand({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="110" height="75" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="110" height="75" rx="3" fill="#3f6212" />
      {/* Roof / top accent */}
      <rect x="18" y="18" width="110" height="18" rx="3" fill="#65A30D" />
      <rect x="18" y="33" width="110" height="3" fill="#4d7c0f" />

      {/* Front awning (striped) */}
      <g>
        {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
          <rect key={i} x={22 + i * 10} y="88" width="5" height="14" rx="1"
            fill={i % 2 === 0 ? '#a3e635' : '#65A30D'} opacity="0.85" />
        ))}
        <rect x="22" y="88" width="105" height="2" fill="#4d7c0f" />
      </g>

      {/* Windows */}
      <rect x="25" y="42" width="18" height="14" rx="2" fill="#bef264" opacity="0.3" />
      <rect x="50" y="42" width="18" height="14" rx="2" fill="#bef264" opacity="0.3" />
      {/* Window frames */}
      <rect x="25" y="48" width="18" height="1" fill="#4d7c0f" opacity="0.5" />
      <rect x="33.5" y="42" width="1" height="14" fill="#4d7c0f" opacity="0.5" />
      <rect x="50" y="48" width="18" height="1" fill="#4d7c0f" opacity="0.5" />
      <rect x="58.5" y="42" width="1" height="14" fill="#4d7c0f" opacity="0.5" />

      {/* Front door */}
      <rect x="76" y="42" width="14" height="22" rx="2" fill="#2d4a0a" />
      <circle cx="88" cy="53" r="1.2" fill="#a3e635" /> {/* door handle */}

      {/* Service counter window */}
      <rect x="98" y="42" width="24" height="18" rx="2" fill="#fde68a" opacity="0.5" />
      <rect x="100" y="60" width="20" height="3" rx="1" fill="#a3e635" /> {/* counter ledge */}

      {/* TACOS sign on roof */}
      <rect x="38" y="20" width="50" height="12" rx="2" fill="#fde68a" opacity="0.9" />
      <text x="63" y="30" textAnchor="middle" fontSize="9" fill="#3f6212" fontWeight="bold" fontFamily="sans-serif">TACOS</text>

      {/* A/C unit on roof */}
      <rect x="105" y="20" width="16" height="12" rx="1" fill="#6B7280" />
      <rect x="107" y="22" width="12" height="8" rx="3" fill="#4B5563" />

      {/* === Outdoor area === */}
      {/* Picnic tables with umbrellas */}
      <PicnicTable x={40} y={118} umbrellaColor="#65A30D" />
      <PicnicTable x={75} y={118} umbrellaColor="#a3e635" />
      <PicnicTable x={110} y={118} umbrellaColor="#65A30D" />

      {/* Trash can */}
      <circle cx="138" cy="112" r="4" fill="#374151" />
      <circle cx="138" cy="112" r="2.5" fill="#4B5563" />

      {/* Dumpster (back corner) */}
      <rect x="140" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="140" y="18" width="22" height="4" rx="1" fill="#4B5563" />
      <rect x="142" y="22" width="8" height="1.5" fill="#555" />
      <rect x="152" y="22" width="8" height="1.5" fill="#555" />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#64748b" rot={90} />
      <Car x={108} y={172} color="#dc2626" rot={90} />
      <Car x={143} y={172} color="#f5f5f4" rot={90} />

      {/* Small landscaping */}
      <circle cx="14" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="132" cy="92" r="4" fill="#166534" opacity="0.6" />
      <circle cx="132" cy="92" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Desert Burger (building shaped like a giant burger) ─────────────────────

function DesertBurger({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Giant burger-shaped building === */}

      {/* Building shadow */}
      <ellipse cx="78" cy="68" rx="52" ry="48" fill="#000" opacity="0.2" />

      {/* Bottom bun */}
      <ellipse cx="75" cy="86" rx="50" ry="16" fill="#b45309" />
      <ellipse cx="75" cy="86" rx="50" ry="12" fill="#d97706" />
      {/* Sesame seed dots on bottom bun */}
      <ellipse cx="55" cy="84" rx="2" ry="1.2" fill="#fbbf24" opacity="0.5" />
      <ellipse cx="90" cy="82" rx="2" ry="1.2" fill="#fbbf24" opacity="0.5" />

      {/* Patty layer */}
      <ellipse cx="75" cy="74" rx="48" ry="10" fill="#5c2d0e" />
      <ellipse cx="75" cy="74" rx="48" ry="7" fill="#7c3a12" />
      {/* Grill marks on patty */}
      <line x1="42" y1="73" x2="108" y2="73" stroke="#5c2d0e" strokeWidth="1.5" />
      <line x1="45" y1="76" x2="105" y2="76" stroke="#5c2d0e" strokeWidth="1.5" />

      {/* Cheese layer (draping over patty) */}
      <ellipse cx="75" cy="68" rx="46" ry="8" fill="#fbbf24" />
      {/* Melty cheese drips */}
      <path d="M32,68 Q30,75 33,78" fill="#fbbf24" stroke="none" />
      <path d="M50,68 Q47,77 50,80" fill="#fbbf24" stroke="none" />
      <path d="M100,68 Q103,76 100,79" fill="#fbbf24" stroke="none" />
      <path d="M115,68 Q118,74 116,77" fill="#fbbf24" stroke="none" />

      {/* Lettuce layer */}
      <ellipse cx="75" cy="62" rx="47" ry="7" fill="#22c55e" />
      {/* Lettuce wavy edges */}
      {[30,40,50,60,70,80,90,100,110].map(x => (
        <circle key={x} cx={x} cy={62} r="4" fill="#4ade80" opacity="0.6" />
      ))}

      {/* Tomato slices peeking out */}
      <circle cx="45" cy="62" r="5" fill="#ef4444" opacity="0.6" />
      <circle cx="75" cy="60" r="5" fill="#ef4444" opacity="0.6" />
      <circle cx="100" cy="62" r="5" fill="#ef4444" opacity="0.6" />

      {/* Top bun */}
      <ellipse cx="75" cy="48" rx="50" ry="22" fill="#d97706" />
      <ellipse cx="75" cy="44" rx="48" ry="20" fill="#f59e0b" />
      {/* Bun highlight / shine */}
      <ellipse cx="65" cy="38" rx="20" ry="8" fill="#fbbf24" opacity="0.4" />
      {/* Sesame seeds on top bun */}
      <ellipse cx="55" cy="36" rx="3" ry="1.5" fill="#fef3c7" opacity="0.8" transform="rotate(-15,55,36)" />
      <ellipse cx="70" cy="32" rx="3" ry="1.5" fill="#fef3c7" opacity="0.8" transform="rotate(10,70,32)" />
      <ellipse cx="88" cy="34" rx="3" ry="1.5" fill="#fef3c7" opacity="0.8" transform="rotate(-5,88,34)" />
      <ellipse cx="78" cy="40" rx="2.5" ry="1.5" fill="#fef3c7" opacity="0.8" transform="rotate(20,78,40)" />
      <ellipse cx="60" cy="44" rx="2.5" ry="1.5" fill="#fef3c7" opacity="0.7" transform="rotate(-10,60,44)" />
      <ellipse cx="95" cy="42" rx="2.5" ry="1.5" fill="#fef3c7" opacity="0.7" transform="rotate(5,95,42)" />

      {/* Building entrance (door cut into bottom bun) */}
      <rect x="65" y="80" width="20" height="14" rx="10" fill="#451a03" />
      <rect x="67" y="82" width="16" height="10" rx="8" fill="#78350f" opacity="0.5" />
      <circle cx="79" cy="88" r="1.2" fill="#fbbf24" /> {/* door handle */}

      {/* "BURGERS" sign — flag pole from top */}
      <line x1="75" y1="10" x2="75" y2="28" stroke="#888" strokeWidth="2" />
      <rect x="58" y="10" width="42" height="14" rx="2" fill="#dc2626" />
      <text x="79" y="20" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold" fontFamily="sans-serif">BURGERS</text>

      {/* Drive-thru lane (right side) */}
      <rect x="130" y="30" width="28" height="60" rx="3" fill="#292929" />
      <rect x="132" y="32" width="24" height="56" rx="2" fill="#1f1f2f" />
      {/* Drive-thru arrow */}
      <polygon points="144,80 138,70 141,70 141,45 147,45 147,70 150,70" fill="#fbbf24" opacity="0.5" />
      {/* Menu board at drive-thru */}
      <rect x="133" y="34" width="22" height="16" rx="2" fill="#1e293b" />
      <rect x="135" y="36" width="18" height="3" rx="0.5" fill="#fde68a" opacity="0.6" />
      <rect x="135" y="40" width="14" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      <rect x="135" y="43" width="16" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      {/* Speaker box */}
      <circle cx="144" cy="56" r="3" fill="#374151" />
      <circle cx="144" cy="56" r="1.5" fill="#555" />

      {/* Pickup window */}
      <rect x="126" y="55" width="6" height="10" rx="1" fill="#fde68a" opacity="0.5" />

      {/* Outdoor seating */}
      <PicnicTable x={40} y={118} umbrellaColor="#dc2626" />
      <PicnicTable x={80} y={118} umbrellaColor="#f59e0b" />

      {/* Trash cans near seating */}
      <circle cx="110" cy="112" r="3.5" fill="#374151" />
      <circle cx="110" cy="112" r="2" fill="#4B5563" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#3b82f6" rot={90} />
      <Car x={108} y={172} color="#a3a3a3" rot={90} />
      <Car x={143} y={172} color="#facc15" rot={90} />

      {/* Landscaping bushes */}
      <circle cx="14" cy="28" r="6" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="28" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="90" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="90" r="3" fill="#22c55e" opacity="0.4" />

      {/* Dumpster (back) */}
      <rect x="160" y="10" width="22" height="16" rx="2" fill="#374151" />
      <rect x="160" y="10" width="22" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
  );
}

// ─── Suds & Shine Car Wash ────────────────────────────────────────────────────

function CarWash({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h} spots="both">
      {/* === Building shadow === */}
      <rect x="19" y="19" width="122" height="72" rx="3" fill="#000" opacity="0.25" />

      {/* === Main building === */}
      <rect x="15" y="15" width="122" height="72" rx="3" fill="#0C4A6E" />
      {/* Roof accent stripe */}
      <rect x="15" y="15" width="122" height="16" rx="3" fill="#0EA5E9" />
      <rect x="15" y="28" width="122" height="3" fill="#0284C7" />

      {/* "SUDS & SHINE" sign on roof */}
      <rect x="28" y="17" width="80" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="68" y="27" textAnchor="middle" fontSize="7" fill="#0C4A6E" fontWeight="bold" fontFamily="sans-serif">SUDS &amp; SHINE</text>

      {/* A/C unit on roof */}
      <rect x="118" y="17" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="120" y="19" width="10" height="6" rx="3" fill="#4B5563" />

      {/* === Office section (left) === */}
      {/* Office window */}
      <rect x="20" y="38" width="16" height="12" rx="2" fill="#7DD3FC" opacity="0.35" />
      <rect x="27.5" y="38" width="1" height="12" fill="#0284C7" opacity="0.5" />
      <rect x="20" y="43.5" width="16" height="1" fill="#0284C7" opacity="0.5" />
      {/* Office door */}
      <rect x="20" y="54" width="12" height="18" rx="2" fill="#0f172a" />
      <rect x="22" y="56" width="8" height="14" rx="1" fill="#0C4A6E" opacity="0.4" />
      <circle cx="29" cy="63" r="1.2" fill="#7DD3FC" /> {/* door handle */}

      {/* === Wash bay openings (2 tunnels) === */}
      {/* Bay 1 */}
      <rect x="42" y="38" width="38" height="36" rx="2" fill="#0f172a" />
      {/* Roller shutter lines */}
      {[40, 44, 48, 52, 56].map(yy => (
        <rect key={yy} x="44" y={yy} width="34" height="1.5" rx="0.5" fill="#1e293b" />
      ))}
      {/* Spinning brush roller (top-down circles) */}
      <circle cx="52" cy="52" r="6" fill="#0EA5E9" opacity="0.5" />
      <circle cx="52" cy="52" r="4" fill="#7DD3FC" opacity="0.4" />
      <line x1="48" y1="52" x2="56" y2="52" stroke="#0284C7" strokeWidth="1" />
      <line x1="52" y1="48" x2="52" y2="56" stroke="#0284C7" strokeWidth="1" />
      <circle cx="68" cy="52" r="6" fill="#0EA5E9" opacity="0.5" />
      <circle cx="68" cy="52" r="4" fill="#7DD3FC" opacity="0.4" />
      <line x1="64" y1="52" x2="72" y2="52" stroke="#0284C7" strokeWidth="1" />
      <line x1="68" y1="48" x2="68" y2="56" stroke="#0284C7" strokeWidth="1" />

      {/* Bay 2 */}
      <rect x="86" y="38" width="38" height="36" rx="2" fill="#0f172a" />
      {[40, 44, 48, 52, 56].map(yy => (
        <rect key={`b2-${yy}`} x="88" y={yy} width="34" height="1.5" rx="0.5" fill="#1e293b" />
      ))}
      {/* Brush rollers bay 2 */}
      <circle cx="96" cy="52" r="6" fill="#0EA5E9" opacity="0.5" />
      <circle cx="96" cy="52" r="4" fill="#7DD3FC" opacity="0.4" />
      <line x1="92" y1="52" x2="100" y2="52" stroke="#0284C7" strokeWidth="1" />
      <line x1="96" y1="48" x2="96" y2="56" stroke="#0284C7" strokeWidth="1" />
      <circle cx="112" cy="52" r="6" fill="#0EA5E9" opacity="0.5" />
      <circle cx="112" cy="52" r="4" fill="#7DD3FC" opacity="0.4" />
      <line x1="108" y1="52" x2="116" y2="52" stroke="#0284C7" strokeWidth="1" />
      <line x1="112" y1="48" x2="112" y2="56" stroke="#0284C7" strokeWidth="1" />

      {/* Water spray arcs coming from bays */}
      <ellipse cx="61" cy="80" rx="18" ry="4" fill="#BAE6FD" opacity="0.25" />
      <ellipse cx="105" cy="80" rx="18" ry="4" fill="#BAE6FD" opacity="0.25" />

      {/* === Conveyor track lines on ground (entry) === */}
      <rect x="55" y="76" width="2" height="20" rx="0.5" fill="#555" opacity="0.6" />
      <rect x="65" y="76" width="2" height="20" rx="0.5" fill="#555" opacity="0.6" />
      <rect x="99" y="76" width="2" height="20" rx="0.5" fill="#555" opacity="0.6" />
      <rect x="109" y="76" width="2" height="20" rx="0.5" fill="#555" opacity="0.6" />

      {/* Wet puddles on ground near exit */}
      <ellipse cx="61" cy="95" rx="14" ry="5" fill="#7DD3FC" opacity="0.15" />
      <ellipse cx="105" cy="98" rx="12" ry="4" fill="#7DD3FC" opacity="0.12" />
      <ellipse cx="80" cy="102" rx="8" ry="3" fill="#7DD3FC" opacity="0.1" />

      {/* === Car in wash bay 1 (covered in suds) === */}
      <Car x={61} y={52} color="#64748b" rot={90} />
      {/* Soap suds overlay */}
      <circle cx="56" cy="50" r="3" fill="#fff" opacity="0.4" />
      <circle cx="64" cy="48" r="2.5" fill="#fff" opacity="0.35" />
      <circle cx="60" cy="55" r="2" fill="#fff" opacity="0.3" />
      <circle cx="66" cy="53" r="2.5" fill="#fff" opacity="0.35" />
      <circle cx="58" cy="46" r="2" fill="#fff" opacity="0.3" />

      {/* === Vacuum stations (right side area) === */}
      {/* Vacuum post 1 */}
      <circle cx="145" cy="30" r="3" fill="#374151" />
      <circle cx="145" cy="30" r="1.5" fill="#4B5563" />
      <ellipse cx="145" cy="38" rx="5" ry="3" fill="#1f2937" opacity="0.6" /> {/* hose coil */}
      {/* Vacuum post 2 */}
      <circle cx="145" cy="55" r="3" fill="#374151" />
      <circle cx="145" cy="55" r="1.5" fill="#4B5563" />
      <ellipse cx="145" cy="63" rx="5" ry="3" fill="#1f2937" opacity="0.6" />
      {/* Vacuum post 3 */}
      <circle cx="145" cy="80" r="3" fill="#374151" />
      <circle cx="145" cy="80" r="1.5" fill="#4B5563" />
      <ellipse cx="145" cy="88" rx="5" ry="3" fill="#1f2937" opacity="0.6" />

      {/* "WASH" price sign near entrance */}
      <line x1="14" y1="95" x2="14" y2="110" stroke="#888" strokeWidth="2" />
      <rect x="4" y="95" width="20" height="12" rx="2" fill="#0EA5E9" />
      <text x="14" y="104" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold" fontFamily="sans-serif">WASH</text>

      {/* === Parked cars in bottom lot === */}
      <Car x={40} y={172} color="#0EA5E9" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#9ca3af" rot={90} />

      {/* Car using vacuum (right side lot) */}
      <Car x={176} y={42} color="#facc15" rot={0} />

      {/* Trash can near vacuums */}
      <circle cx="145" cy="105" r="4" fill="#374151" />
      <circle cx="145" cy="105" r="2.5" fill="#4B5563" />

      {/* Dumpster (back corner) */}
      <rect x="140" y="12" width="20" height="14" rx="2" fill="#374151" />
      <rect x="140" y="12" width="20" height="4" rx="1" fill="#4B5563" />

      {/* Landscaping bushes */}
      <circle cx="10" cy="15" r="5" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="15" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="10" cy="80" r="4" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="80" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="138" cy="140" r="5" fill="#166534" opacity="0.6" />
      <circle cx="138" cy="140" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Sprite router ────────────────────────────────────────────────────────────

const SPRITE_MAP: Record<string, (props: SpriteProps) => React.ReactNode> = {
  tasty_toads: TacoStand,
  desert_burger: DesertBurger,
  car_wash: CarWash,
};

export default function BuildingSprite({ businessDefId, w = 72, h = 72 }: { businessDefId: string; w?: number; h?: number }) {
  const Sprite = SPRITE_MAP[businessDefId];
  if (!Sprite) return null;
  return <>{Sprite({ w, h })}</>;
}

export function hasSprite(businessDefId: string): boolean {
  return businessDefId in SPRITE_MAP;
}
