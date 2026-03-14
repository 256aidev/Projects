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

// ─── Cactus Salads ────────────────────────────────────────────────────────────

function CactusSalads({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="115" height="70" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="115" height="70" rx="3" fill="#15803d" />
      <rect x="18" y="18" width="115" height="16" rx="3" fill="#16A34A" />
      <rect x="18" y="31" width="115" height="3" fill="#14532d" />
      <rect x="38" y="20" width="55" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="65" y="30" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="bold" fontFamily="sans-serif">SALADS</text>
      <rect x="110" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="112" y="22" width="10" height="6" rx="3" fill="#4B5563" />
      <rect x="24" y="40" width="18" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <rect x="24" y="46" width="18" height="1" fill="#14532d" opacity="0.5" />
      <rect x="32.5" y="40" width="1" height="14" fill="#14532d" opacity="0.5" />
      <rect x="48" y="40" width="18" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <ellipse cx="57" cy="47" rx="6" ry="4" fill="#22c55e" opacity="0.5" />
      <circle cx="55" cy="45" r="2" fill="#4ade80" opacity="0.6" />
      <circle cx="59" cy="44" r="1.5" fill="#ef4444" opacity="0.5" />
      <rect x="72" y="42" width="14" height="22" rx="2" fill="#052e16" />
      <circle cx="84" cy="53" r="1.2" fill="#4ade80" />
      <rect x="94" y="42" width="22" height="16" rx="2" fill="#dcfce7" opacity="0.4" />
      <rect x="96" y="58" width="18" height="3" rx="1" fill="#16A34A" />
      <rect x="70" y="68" width="24" height="8" rx="1" fill="#166534" />
      <circle cx="76" cy="72" r="2.5" fill="#4ade80" opacity="0.7" />
      <circle cx="82" cy="72" r="2.5" fill="#f97316" opacity="0.7" />
      <circle cx="88" cy="72" r="2.5" fill="#ef4444" opacity="0.7" />
      <PicnicTable x={35} y={115} umbrellaColor="#16A34A" />
      <PicnicTable x={70} y={115} umbrellaColor="#22c55e" />
      <PicnicTable x={105} y={115} umbrellaColor="#16A34A" />
      <circle cx="52" cy="105" r="3.5" fill="#166534" opacity="0.7" />
      <circle cx="52" cy="105" r="2" fill="#4ade80" opacity="0.5" />
      <circle cx="88" cy="105" r="3.5" fill="#166534" opacity="0.7" />
      <circle cx="88" cy="105" r="2" fill="#4ade80" opacity="0.5" />
      <circle cx="130" cy="108" r="4" fill="#15803d" />
      <circle cx="130" cy="108" r="2.5" fill="#22c55e" />
      <rect x="140" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="140" y="18" width="22" height="4" rx="1" fill="#4B5563" />
      <Car x={40} y={172} color="#22c55e" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />
      <circle cx="14" cy="20" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="20" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="60" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="60" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="135" cy="88" r="5" fill="#166534" opacity="0.6" />
      <circle cx="135" cy="88" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="88" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="88" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Sand Chicken ─────────────────────────────────────────────────────────────

function SandChicken({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="105" height="72" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="105" height="72" rx="3" fill="#991b1b" />
      <rect x="18" y="18" width="105" height="16" rx="3" fill="#DC2626" />
      <rect x="18" y="31" width="105" height="3" fill="#7f1d1d" />
      <rect x="32" y="20" width="60" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="62" y="30" textAnchor="middle" fontSize="8" fill="#DC2626" fontWeight="bold" fontFamily="sans-serif">CHICKEN</text>
      <rect x="100" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="102" y="22" width="10" height="6" rx="3" fill="#4B5563" />
      <rect x="24" y="40" width="18" height="14" rx="2" fill="#fca5a5" opacity="0.3" />
      <rect x="24" y="46" width="18" height="1" fill="#7f1d1d" opacity="0.5" />
      <rect x="32.5" y="40" width="1" height="14" fill="#7f1d1d" opacity="0.5" />
      <rect x="48" y="40" width="24" height="16" rx="2" fill="#fde68a" opacity="0.45" />
      <circle cx="54" cy="48" r="3" fill="#f97316" opacity="0.35" />
      <circle cx="54" cy="48" r="1.5" fill="#fbbf24" opacity="0.5" />
      <circle cx="66" cy="48" r="3" fill="#f97316" opacity="0.35" />
      <circle cx="66" cy="48" r="1.5" fill="#fbbf24" opacity="0.5" />
      <rect x="48" y="56" width="24" height="3" rx="1" fill="#DC2626" />
      <rect x="78" y="42" width="14" height="22" rx="2" fill="#450a0a" />
      <circle cx="90" cy="53" r="1.2" fill="#fca5a5" />
      <rect x="128" y="18" width="28" height="72" rx="3" fill="#292929" />
      <rect x="130" y="20" width="24" height="68" rx="2" fill="#1f1f2f" />
      <polygon points="142,80 136,70 139,70 139,35 145,35 145,70 148,70" fill="#fbbf24" opacity="0.5" />
      <rect x="131" y="24" width="22" height="16" rx="2" fill="#1e293b" />
      <rect x="133" y="26" width="18" height="3" rx="0.5" fill="#fde68a" opacity="0.6" />
      <rect x="133" y="30" width="14" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      <rect x="133" y="33" width="16" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      <circle cx="142" cy="46" r="3" fill="#374151" />
      <circle cx="142" cy="46" r="1.5" fill="#555" />
      <rect x="123" y="50" width="6" height="10" rx="1" fill="#fde68a" opacity="0.5" />
      <circle cx="105" cy="100" r="4" fill="#374151" />
      <circle cx="105" cy="100" r="2.5" fill="#4B5563" />
      <circle cx="120" cy="100" r="4" fill="#374151" />
      <circle cx="120" cy="100" r="2.5" fill="#4B5563" />
      <rect x="160" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="160" y="18" width="22" height="4" rx="1" fill="#4B5563" />
      <Car x={40} y={172} color="#dc2626" rot={90} />
      <Car x={75} y={172} color="#f5f5f4" rot={90} />
      <Car x={108} y={172} color="#3b82f6" rot={90} />
      <circle cx="14" cy="20" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="20" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="90" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="90" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Auto Repair ──────────────────────────────────────────────────────────────

function AutoRepair({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="125" height="75" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="125" height="75" rx="3" fill="#57534e" />
      <rect x="18" y="18" width="125" height="16" rx="3" fill="#78716C" />
      <rect x="18" y="31" width="125" height="3" fill="#44403c" />
      <rect x="45" y="20" width="50" height="12" rx="2" fill="#fde68a" opacity="0.9" />
      <text x="70" y="30" textAnchor="middle" fontSize="8" fill="#44403c" fontWeight="bold" fontFamily="sans-serif">REPAIR</text>
      <rect x="22" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      <rect x="28" y="46" width="22" height="10" rx="3" fill="#64748b" opacity="0.7" />
      <rect x="32" y="48" width="6" height="6" rx="1" fill="#1e293b" opacity="0.5" />
      <rect x="26" y="44" width="2" height="24" fill="#a8a29e" opacity="0.6" />
      <rect x="50" y="44" width="2" height="24" fill="#a8a29e" opacity="0.6" />
      <rect x="62" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      <rect x="68" y="43" width="4" height="8" rx="0.5" fill="#78716C" opacity="0.4" />
      <rect x="74" y="43" width="4" height="10" rx="0.5" fill="#78716C" opacity="0.4" />
      <rect x="80" y="43" width="4" height="7" rx="0.5" fill="#78716C" opacity="0.4" />
      <rect x="102" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      <rect x="102" y="40" width="34" height="12" rx="2" fill="#6B7280" opacity="0.7" />
      {[42, 45, 48].map(yy => (
        <rect key={yy} x="104" y={yy} width="30" height="1" rx="0.3" fill="#78716C" opacity="0.5" />
      ))}
      <rect x="120" y="76" width="12" height="16" rx="2" fill="#292524" />
      <circle cx="130" cy="84" r="1.2" fill="#a8a29e" />
      <circle cx="45" cy="105" r="8" fill="#1c1917" opacity="0.2" />
      <circle cx="80" cy="110" r="6" fill="#1c1917" opacity="0.15" />
      <circle cx="115" cy="100" r="7" fill="#1c1917" opacity="0.18" />
      <circle cx="60" cy="120" r="5" fill="#1c1917" opacity="0.12" />
      <rect x="140" y="40" width="12" height="18" rx="1" fill="#dc2626" />
      <rect x="140" y="42" width="12" height="3" rx="0.5" fill="#b91c1c" />
      <rect x="140" y="47" width="12" height="3" rx="0.5" fill="#b91c1c" />
      <rect x="140" y="52" width="12" height="3" rx="0.5" fill="#b91c1c" />
      <circle cx="155" cy="72" r="7" fill="#292524" />
      <circle cx="155" cy="72" r="4" fill="#1c1917" />
      <circle cx="155" cy="72" r="2" fill="#44403c" />
      <circle cx="153" cy="66" r="6" fill="#292524" opacity="0.8" />
      <circle cx="153" cy="66" r="3.5" fill="#1c1917" opacity="0.8" />
      <rect x="160" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="160" y="18" width="22" height="4" rx="1" fill="#4B5563" />
      <Car x={40} y={172} color="#a3a3a3" rot={90} />
      <Car x={108} y={172} color="#1e40af" rot={90} />
      <Car x={143} y={172} color="#854d0e" rot={90} />
      <circle cx="14" cy="20" r="4" fill="#166534" opacity="0.5" />
      <circle cx="14" cy="20" r="2.5" fill="#22c55e" opacity="0.35" />
    </ParkingLot>
  );
}

// ─── Car Dealership ───────────────────────────────────────────────────────────

function CarDealership({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="120" height="55" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="120" height="55" rx="3" fill="#4338ca" />
      <rect x="18" y="18" width="120" height="14" rx="3" fill="#6366F1" />
      <rect x="18" y="29" width="120" height="3" fill="#3730a3" />
      <rect x="42" y="20" width="52" height="10" rx="2" fill="#fff" opacity="0.9" />
      <text x="68" y="28" textAnchor="middle" fontSize="7" fill="#4338ca" fontWeight="bold" fontFamily="sans-serif">MOTORS</text>
      <rect x="118" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="120" y="22" width="10" height="6" rx="3" fill="#4B5563" />
      <rect x="24" y="36" width="80" height="30" rx="2" fill="#a5b4fc" opacity="0.3" />
      {[40, 56, 72, 88].map(x => (
        <rect key={x} x={x} y="36" width="1.5" height="30" fill="#6366F1" opacity="0.4" />
      ))}
      <rect x="26" y="38" width="12" height="26" rx="1" fill="#c7d2fe" opacity="0.2" />
      <rect x="58" y="38" width="12" height="26" rx="1" fill="#c7d2fe" opacity="0.2" />
      <rect x="42" y="46" width="18" height="9" rx="3" fill="#f5f5f4" opacity="0.6" />
      <rect x="110" y="42" width="14" height="22" rx="2" fill="#1e1b4b" />
      <rect x="112" y="44" width="10" height="18" rx="1" fill="#4338ca" opacity="0.4" />
      <circle cx="120" cy="53" r="1.2" fill="#a5b4fc" />
      <line x1="10" y1="10" x2="10" y2="40" stroke="#9ca3af" strokeWidth="1.5" />
      <polygon points="10,12 24,15 10,18" fill="#DC2626" opacity="0.8" />
      <polygon points="10,20 24,23 10,26" fill="#fff" opacity="0.8" />
      <polygon points="10,28 24,31 10,34" fill="#6366F1" opacity="0.8" />
      <line x1="145" y1="10" x2="145" y2="40" stroke="#9ca3af" strokeWidth="1.5" />
      <polygon points="145,12 159,15 145,18" fill="#6366F1" opacity="0.8" />
      <polygon points="145,20 159,23 145,26" fill="#fff" opacity="0.8" />
      <polygon points="145,28 159,31 145,34" fill="#DC2626" opacity="0.8" />
      <Car x={30} y={90} color="#f5f5f4" rot={90} />
      <Car x={60} y={90} color="#1e40af" rot={90} />
      <Car x={90} y={90} color="#dc2626" rot={90} />
      <Car x={120} y={90} color="#171717" rot={90} />
      <Car x={30} y={115} color="#6366F1" rot={90} />
      <Car x={60} y={115} color="#a3a3a3" rot={90} />
      <Car x={90} y={115} color="#f59e0b" rot={90} />
      <Car x={120} y={115} color="#f5f5f4" rot={90} />
      <rect x="24" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="54" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="84" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="114" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <Car x={40} y={172} color="#64748b" rot={90} />
      <Car x={108} y={172} color="#854d0e" rot={90} />
      <circle cx="155" cy="55" r="5" fill="#166534" opacity="0.6" />
      <circle cx="155" cy="55" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="155" cy="70" r="4" fill="#166534" opacity="0.6" />
      <circle cx="155" cy="70" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Rental House ─────────────────────────────────────────────────────────────

function RentalHouse({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a2a1a" />
      <defs>
        <pattern id="grass" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#22542a" />
          <circle cx="6" cy="6" r="0.4" fill="#1e3d22" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#grass)" opacity="0.4" />
      <rect x="10" y="10" width="180" height="180" rx="2" fill="none" stroke="#78716C" strokeWidth="1.5" strokeDasharray="6,3" />
      {[10, 55, 100, 145, 190].map(x => (
        <rect key={`ft-${x}`} x={x - 1.5} y="8" width="3" height="5" rx="0.5" fill="#a8a29e" />
      ))}
      {[10, 55, 100, 145, 190].map(x => (
        <rect key={`fb-${x}`} x={x - 1.5} y="187" width="3" height="5" rx="0.5" fill="#a8a29e" />
      ))}
      <rect x="85" y="188" width="30" height="4" fill="#1a2a1a" />
      <rect x="88" y="150" width="24" height="42" rx="1" fill="#44403c" />
      <rect x="34" y="44" width="110" height="72" rx="3" fill="#000" opacity="0.2" />
      <rect x="30" y="40" width="110" height="72" rx="3" fill="#d97706" />
      <polygon points="25,40 85,10 145,40" fill="#F59E0B" />
      <polygon points="30,40 85,14 140,40" fill="#fbbf24" opacity="0.3" />
      <line x1="85" y1="12" x2="85" y2="40" stroke="#b45309" strokeWidth="1" opacity="0.5" />
      <rect x="55" y="95" width="60" height="18" rx="2" fill="#92400E" opacity="0.6" />
      <rect x="57" y="95" width="56" height="2" fill="#78350f" />
      <rect x="57" y="95" width="3" height="18" fill="#a16207" />
      <rect x="110" y="95" width="3" height="18" fill="#a16207" />
      <rect x="36" y="52" width="16" height="14" rx="2" fill="#fef3c7" opacity="0.35" />
      <rect x="43.5" y="52" width="1" height="14" fill="#b45309" opacity="0.5" />
      <rect x="36" y="58.5" width="16" height="1" fill="#b45309" opacity="0.5" />
      <rect x="118" y="52" width="16" height="14" rx="2" fill="#fef3c7" opacity="0.35" />
      <rect x="125.5" y="52" width="1" height="14" fill="#b45309" opacity="0.5" />
      <rect x="118" y="58.5" width="16" height="1" fill="#b45309" opacity="0.5" />
      <rect x="36" y="75" width="14" height="12" rx="2" fill="#fef3c7" opacity="0.3" />
      <rect x="120" y="75" width="14" height="12" rx="2" fill="#fef3c7" opacity="0.3" />
      <rect x="76" y="68" width="18" height="28" rx="2" fill="#78350f" />
      <rect x="78" y="70" width="14" height="12" rx="1" fill="#fef3c7" opacity="0.2" />
      <circle cx="90" cy="86" r="1.5" fill="#fbbf24" />
      <rect x="78" y="136" width="6" height="10" rx="0.5" fill="#78716C" />
      <rect x="75" y="132" width="12" height="6" rx="1" fill="#57534e" />
      <rect x="87" y="133" width="3" height="3" rx="0.5" fill="#dc2626" />
      <circle cx="25" cy="85" r="7" fill="#166534" opacity="0.6" />
      <circle cx="25" cy="85" r="4.5" fill="#22c55e" opacity="0.4" />
      <circle cx="150" cy="70" r="6" fill="#166534" opacity="0.6" />
      <circle cx="150" cy="70" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="155" cy="90" r="5" fill="#166534" opacity="0.6" />
      <circle cx="155" cy="90" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="45" cy="118" r="3" fill="#166534" opacity="0.5" />
      <circle cx="51" cy="116" r="2.5" fill="#166534" opacity="0.5" />
      <circle cx="48" cy="114" r="1.5" fill="#f472b6" opacity="0.6" />
      <circle cx="44" cy="116" r="1" fill="#fbbf24" opacity="0.6" />
      <Car x={100} y={162} color="#64748b" rot={90} />
    </svg>
  );
}

// ─── Motel ────────────────────────────────────────────────────────────────────

function Motel({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="130" height="35" rx="3" fill="#000" opacity="0.25" />
      <rect x="22" y="22" width="35" height="100" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="130" height="35" rx="3" fill="#92400E" />
      <rect x="18" y="18" width="130" height="10" rx="3" fill="#B45309" />
      <rect x="18" y="26" width="130" height="2" fill="#78350f" />
      <rect x="18" y="18" width="35" height="100" rx="3" fill="#92400E" />
      <rect x="18" y="18" width="35" height="10" rx="3" fill="#B45309" />
      {[60, 80, 100, 120].map((x, i) => (
        <g key={`hr-${x}`}>
          <rect x={x} y="35" width="12" height="16" rx="1" fill="#78350f" />
          <text x={x + 6} y="46" textAnchor="middle" fontSize="5" fill="#fde68a" fontFamily="sans-serif">{i + 1}</text>
          <circle cx={x + 10} cy="43" r="0.8" fill="#fbbf24" />
          <rect x={x + 1} y="30" width="10" height="4" rx="1" fill="#fef3c7" opacity="0.25" />
        </g>
      ))}
      {[35, 55, 75, 95].map((y, i) => (
        <g key={`vr-${y}`}>
          <rect x="38" y={y} width="13" height="14" rx="1" fill="#78350f" />
          <text x="44" y={y + 10} textAnchor="middle" fontSize="5" fill="#fde68a" fontFamily="sans-serif">{i + 5}</text>
          <circle cx="48" cy={y + 7} r="0.8" fill="#fbbf24" />
          <rect x="28" y={y + 2} width="8" height="5" rx="1" fill="#fef3c7" opacity="0.25" />
        </g>
      ))}
      <line x1="160" y1="10" x2="160" y2="42" stroke="#6B7280" strokeWidth="2.5" />
      <rect x="148" y="10" width="24" height="14" rx="2" fill="#1c1917" />
      <rect x="149" y="11" width="22" height="12" rx="1.5" fill="#dc2626" opacity="0.8" />
      <text x="160" y="20" textAnchor="middle" fontSize="7" fill="#fef2f2" fontWeight="bold" fontFamily="sans-serif">MOTEL</text>
      <rect x="147" y="9" width="26" height="16" rx="3" fill="#dc2626" opacity="0.15" />
      <ellipse cx="95" cy="80" rx="28" ry="18" fill="#0e7490" opacity="0.8" />
      <ellipse cx="95" cy="80" rx="25" ry="15" fill="#22d3ee" opacity="0.5" />
      <ellipse cx="90" cy="76" rx="10" ry="5" fill="#67e8f9" opacity="0.3" />
      <ellipse cx="95" cy="80" rx="30" ry="20" fill="none" stroke="#a8a29e" strokeWidth="2" />
      <rect x="120" y="76" width="6" height="2" rx="0.5" fill="#9ca3af" />
      <rect x="121" y="74" width="1.5" height="6" fill="#9ca3af" />
      <rect x="124" y="74" width="1.5" height="6" fill="#9ca3af" />
      <rect x="140" y="38" width="10" height="12" rx="1" fill="#d1d5db" />
      <rect x="141" y="39" width="8" height="5" rx="0.5" fill="#9ca3af" />
      <rect x="143" y="46" width="4" height="3" rx="1" fill="#6B7280" />
      <rect x="140" y="55" width="10" height="14" rx="1" fill="#1e40af" />
      <rect x="141" y="56" width="8" height="7" rx="0.5" fill="#3b82f6" opacity="0.4" />
      <rect x="142" y="57" width="2" height="2" rx="0.3" fill="#dc2626" opacity="0.7" />
      <rect x="145" y="57" width="2" height="2" rx="0.3" fill="#22c55e" opacity="0.7" />
      <rect x="142" y="60" width="2" height="2" rx="0.3" fill="#f59e0b" opacity="0.7" />
      <rect x="145" y="60" width="2" height="2" rx="0.3" fill="#f5f5f4" opacity="0.7" />
      <rect x="144" y="65" width="3" height="2" rx="0.5" fill="#1e293b" />
      {[62, 82, 102, 122].map(x => (
        <rect key={`ps-${x}`} x={x} y="55" width="1" height="18" fill="#666" rx="0.3" />
      ))}
      <Car x={72} y={64} color="#64748b" rot={90} />
      <Car x={112} y={64} color="#dc2626" rot={90} />
      {[38, 58, 78, 98].map(y => (
        <rect key={`vps-${y}`} x="54" y={y} width="16" height="1" fill="#666" rx="0.3" />
      ))}
      <Car x={62} y={48} color="#f5f5f4" rot={0} />
      <Car x={40} y={172} color="#a3a3a3" rot={90} />
      <Car x={108} y={172} color="#facc15" rot={90} />
      <Car x={143} y={172} color="#1e40af" rot={90} />
      <circle cx="14" cy="18" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="160" cy="80" r="5" fill="#166534" opacity="0.6" />
      <circle cx="160" cy="80" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Barbershop ───────────────────────────────────────────────────────────────

function Barbershop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={24} y={14} width={120} height={90} rx={3} fill="#000" opacity={0.18} />
      <rect x={20} y={10} width={120} height={90} rx={3} fill="#fce7f3" stroke="#EC4899" strokeWidth={2} />
      <rect x={20} y={10} width={120} height={14} rx={3} fill="#EC4899" />
      <rect x={20} y={20} width={120} height={4} fill="#fce7f3" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`rs${i}`} x={20 + i * 20} y={10} width={10} height={14} fill={i % 2 === 0 ? "#fff" : "#EC4899"} opacity={0.5} />
      ))}
      <rect x={45} y={38} width={55} height={30} rx={2} fill="#bae6fd" opacity={0.5} stroke="#0ea5e9" strokeWidth={1} />
      <circle cx={58} cy={53} r={6} fill="#9f1239" opacity={0.6} />
      <circle cx={75} cy={53} r={6} fill="#9f1239" opacity={0.6} />
      <circle cx={92} cy={53} r={6} fill="#9f1239" opacity={0.6} />
      <rect x={55} y={59} width={6} height={3} fill="#6b7280" />
      <rect x={72} y={59} width={6} height={3} fill="#6b7280" />
      <rect x={89} y={59} width={6} height={3} fill="#6b7280" />
      <rect x={110} y={48} width={18} height={32} rx={2} fill="#9f1239" stroke="#831843" strokeWidth={1} />
      <circle cx={114} cy={64} r={2} fill="#fbbf24" />
      <rect x={132} y={42} width={8} height={38} rx={2} fill="#fff" stroke="#374151" strokeWidth={1} />
      <rect x={132} y={44} width={8} height={5} fill="#dc2626" opacity={0.8} />
      <rect x={132} y={52} width={8} height={5} fill="#2563eb" opacity={0.8} />
      <rect x={132} y={60} width={8} height={5} fill="#dc2626" opacity={0.8} />
      <rect x={132} y={68} width={8} height={5} fill="#2563eb" opacity={0.8} />
      <circle cx={136} cy={42} r={4} fill="#e5e7eb" stroke="#374151" strokeWidth={1} />
      <circle cx={136} cy={80} r={4} fill="#e5e7eb" stroke="#374151" strokeWidth={1} />
      <rect x={40} y={26} width={70} height={12} rx={2} fill="#9f1239" />
      <text x={75} y={35} textAnchor="middle" fontFamily="sans-serif" fontSize={8} fontWeight="bold" fill="#fff">SLICK CUTS</text>
      <rect x={25} y={85} width={24} height={6} rx={1} fill="#92400e" />
      <rect x={25} y={91} width={3} height={4} fill="#78350f" />
      <rect x={46} y={91} width={3} height={4} fill="#78350f" />
      <rect x={55} y={86} width={10} height={8} rx={1} fill="#d4d4d8" stroke="#a1a1aa" strokeWidth={1} />
      <rect x={56} y={87} width={3} height={6} fill="#ec4899" opacity={0.5} />
      <rect x={60} y={87} width={3} height={6} fill="#3b82f6" opacity={0.5} />
      <circle cx={22} cy={105} r={7} fill="#166534" opacity={0.6} />
      <circle cx={22} cy={105} r={4} fill="#22c55e" opacity={0.4} />
      <circle cx={140} cy={105} r={7} fill="#166534" opacity={0.6} />
      <circle cx={140} cy={105} r={4} fill="#22c55e" opacity={0.4} />
      <rect x={20} y={130} width={160} height={60} rx={3} fill="#4b5563" />
      <line x1={55} y1={130} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={90} y1={130} x2={90} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={125} y1={130} x2={125} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={160} y1={130} x2={160} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <Car x={37} y={150} color="#ef4444" rot={90} />
      <Car x={107} y={155} color="#1e40af" rot={90} />
      <Car x={142} y={148} color="#fbbf24" rot={90} />
      <rect x={20} y={118} width={160} height={12} fill="#d6d3d1" />
    </svg>
  );
}

// ─── Laundromat ───────────────────────────────────────────────────────────────

function Laundromat({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={24} y={14} width={130} height={85} rx={3} fill="#000" opacity={0.18} />
      <rect x={20} y={10} width={130} height={85} rx={3} fill="#f0f9ff" stroke="#38BDF8" strokeWidth={2} />
      <rect x={20} y={10} width={130} height={12} rx={3} fill="#38BDF8" />
      <rect x={38} y={24} width={80} height={12} rx={2} fill="#0284c7" />
      <text x={78} y={33} textAnchor="middle" fontFamily="sans-serif" fontSize={8} fontWeight="bold" fill="#fff">SPIN CYCLE</text>
      <rect x={28} y={40} width={110} height={28} rx={2} fill="#bae6fd" opacity={0.45} stroke="#0ea5e9" strokeWidth={1} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={`wm${i}`}>
          <circle cx={42 + i * 22} cy={54} r={9} fill="#e0f2fe" stroke="#38BDF8" strokeWidth={2} />
          <circle cx={42 + i * 22} cy={54} r={5} fill="#bae6fd" opacity={0.6} />
          <circle cx={42 + i * 22} cy={54} r={2} fill="#0ea5e9" opacity={0.4} />
        </g>
      ))}
      <rect x={30} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
      <rect x={60} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
      <rect x={90} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
      <rect x={120} y={52} width={18} height={30} rx={2} fill="#0284c7" stroke="#075985" strokeWidth={1} />
      <circle cx={124} cy={67} r={2} fill="#fbbf24" />
      <rect x={100} y={4} width={12} height={8} rx={1} fill="#9ca3af" stroke="#6b7280" strokeWidth={1} />
      <circle cx={106} cy={4} r={3} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} />
      <rect x={142} y={68} width={16} height={12} rx={2} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
      <circle cx={145} cy={82} r={2} fill="#6b7280" />
      <circle cx={155} cy={82} r={2} fill="#6b7280" />
      <rect x={144} y={66} width={5} height={4} rx={1} fill="#38BDF8" opacity={0.6} />
      <rect x={150} y={65} width={5} height={4} rx={1} fill="#f472b6" opacity={0.6} />
      <circle cx={20} cy={102} r={7} fill="#166534" opacity={0.6} />
      <circle cx={20} cy={102} r={4} fill="#22c55e" opacity={0.4} />
      <circle cx={155} cy={102} r={7} fill="#166534" opacity={0.6} />
      <circle cx={155} cy={102} r={4} fill="#22c55e" opacity={0.4} />
      <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
      <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
      <line x1={55} y1={127} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={95} y1={127} x2={95} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={135} y1={127} x2={135} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <Car x={35} y={148} color="#a855f7" rot={90} />
      <Car x={115} y={150} color="#f97316" rot={90} />
    </svg>
  );
}

// ─── Gym ──────────────────────────────────────────────────────────────────────

function GymSprite({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={24} y={14} width={135} height={90} rx={3} fill="#000" opacity={0.18} />
      <rect x={20} y={10} width={135} height={90} rx={3} fill="#292524" stroke="#F97316" strokeWidth={2} />
      <rect x={20} y={10} width={135} height={14} rx={3} fill="#F97316" />
      <rect x={35} y={26} width={90} height={14} rx={2} fill="#1c1917" stroke="#F97316" strokeWidth={1} />
      <text x={80} y={36} textAnchor="middle" fontFamily="sans-serif" fontSize={9} fontWeight="bold" fill="#F97316">IRON DESERT</text>
      <rect x={28} y={44} width={40} height={24} rx={2} fill="#7dd3fc" opacity={0.3} stroke="#38bdf8" strokeWidth={1} />
      <rect x={74} y={44} width={40} height={24} rx={2} fill="#7dd3fc" opacity={0.3} stroke="#38bdf8" strokeWidth={1} />
      <circle cx={36} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
      <line x1={40} y1={54} x2={56} y2={54} stroke="#a8a29e" strokeWidth={2} />
      <circle cx={60} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
      <circle cx={82} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
      <line x1={86} y1={54} x2={102} y2={54} stroke="#a8a29e" strokeWidth={2} />
      <circle cx={106} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
      <rect x={34} y={60} width={28} height={3} rx={1} fill="#78716c" opacity={0.5} />
      <rect x={82} y={60} width={28} height={3} rx={1} fill="#78716c" opacity={0.5} />
      <rect x={120} y={44} width={28} height={30} rx={2} fill="#1c1917" stroke="#57534e" strokeWidth={1} />
      <line x1={130} y1={44} x2={130} y2={50} stroke="#a8a29e" strokeWidth={1} />
      <ellipse cx={130} cy={58} rx={5} ry={8} fill="#dc2626" opacity={0.7} />
      <line x1={142} y1={44} x2={142} y2={50} stroke="#a8a29e" strokeWidth={1} />
      <ellipse cx={142} cy={58} rx={5} ry={8} fill="#dc2626" opacity={0.7} />
      <rect x={28} y={72} width={18} height={22} rx={2} fill="#F97316" stroke="#c2410c" strokeWidth={1} />
      <circle cx={42} cy={83} r={2} fill="#fbbf24" />
      <rect x={52} y={88} width={22} height={5} rx={1} fill="#78716c" />
      <rect x={53} y={93} width={3} height={4} fill="#57534e" />
      <rect x={70} y={93} width={3} height={4} fill="#57534e" />
      <circle cx={160} cy={98} r={7} fill="#166534" opacity={0.6} />
      <circle cx={160} cy={98} r={4} fill="#22c55e" opacity={0.4} />
      <circle cx={18} cy={108} r={6} fill="#166534" opacity={0.6} />
      <circle cx={18} cy={108} r={3.5} fill="#22c55e" opacity={0.4} />
      <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
      <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
      <line x1={50} y1={127} x2={50} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={85} y1={127} x2={85} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={120} y1={127} x2={120} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={155} y1={127} x2={155} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <Car x={32} y={150} color="#000" rot={90} />
      <Car x={102} y={148} color="#dc2626" rot={90} />
      <Car x={137} y={152} color="#e5e7eb" rot={90} />
    </svg>
  );
}

// ─── Tattoo Parlor ────────────────────────────────────────────────────────────

function TattooParlor({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={24} y={14} width={130} height={88} rx={3} fill="#000" opacity={0.18} />
      <rect x={20} y={10} width={130} height={88} rx={3} fill="#1e1b4b" stroke="#7C3AED" strokeWidth={2} />
      <rect x={20} y={10} width={130} height={12} rx={3} fill="#7C3AED" />
      <rect x={35} y={24} width={85} height={14} rx={2} fill="#0f0a1e" />
      <text x={77} y={35} textAnchor="middle" fontFamily="sans-serif" fontSize={10} fontWeight="bold" fill="#c084fc">DESERT INK</text>
      <rect x={28} y={42} width={35} height={22} rx={2} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
      <rect x={68} y={42} width={35} height={22} rx={2} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
      <rect x={32} y={47} width={26} height={10} rx={1} fill="#0f0a1e" />
      <text x={45} y={55} textAnchor="middle" fontFamily="sans-serif" fontSize={7} fontWeight="bold" fill="#22d3ee">OPEN</text>
      <rect x={72} y={45} width={6} height={7} rx={1} fill="#ef4444" opacity={0.7} />
      <rect x={80} y={45} width={6} height={7} rx={1} fill="#22c55e" opacity={0.7} />
      <rect x={88} y={45} width={6} height={7} rx={1} fill="#eab308" opacity={0.7} />
      <rect x={72} y={54} width={6} height={7} rx={1} fill="#3b82f6" opacity={0.7} />
      <rect x={80} y={54} width={6} height={7} rx={1} fill="#ec4899" opacity={0.7} />
      <rect x={88} y={54} width={6} height={7} rx={1} fill="#f97316" opacity={0.7} />
      <rect x={110} y={50} width={18} height={30} rx={2} fill="#4c1d95" stroke="#3b0764" strokeWidth={1} />
      <circle cx={114} cy={65} r={2} fill="#c084fc" />
      <rect x={132} y={46} width={12} height={16} rx={1} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
      <rect x={108} y={48} width={22} height={2} fill="#c084fc" opacity={0.5} />
      <rect x={108} y={80} width={22} height={2} fill="#c084fc" opacity={0.5} />
      <g transform="translate(148, 80)">
        <ellipse cx={0} cy={8} rx={6} ry={3} fill="#1c1917" />
        <rect x={-8} y={2} width={16} height={6} rx={2} fill="#292524" />
        <circle cx={-7} cy={8} r={4} fill="#374151" stroke="#1f2937" strokeWidth={1} />
        <circle cx={7} cy={8} r={4} fill="#374151" stroke="#1f2937" strokeWidth={1} />
        <rect x={-3} y={0} width={6} height={4} rx={1} fill="#7C3AED" />
        <rect x={8} y={3} width={6} height={2} rx={1} fill="#a8a29e" />
      </g>
      <circle cx={18} cy={104} r={6} fill="#166534" opacity={0.6} />
      <circle cx={18} cy={104} r={3.5} fill="#22c55e" opacity={0.4} />
      <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
      <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
      <line x1={55} y1={127} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={95} y1={127} x2={95} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={135} y1={127} x2={135} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <Car x={35} y={150} color="#1e1b4b" rot={90} />
      <Car x={115} y={148} color="#374151" rot={90} />
    </svg>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

function BarSprite({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={24} y={14} width={135} height={92} rx={3} fill="#000" opacity={0.18} />
      <rect x={20} y={10} width={135} height={92} rx={3} fill="#7f1d1d" stroke="#B91C1C" strokeWidth={2} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line key={`bk${i}`} x1={20} y1={24 + i * 12} x2={155} y2={24 + i * 12} stroke="#991b1b" strokeWidth={0.5} opacity={0.4} />
      ))}
      <rect x={20} y={10} width={135} height={12} rx={3} fill="#B91C1C" />
      <rect x={30} y={24} width={100} height={16} rx={2} fill="#1c1917" stroke="#B91C1C" strokeWidth={1} />
      <rect x={35} y={27} width={3} height={10} rx={1} fill="#22c55e" />
      <rect x={33} y={30} width={3} height={5} rx={1} fill="#22c55e" />
      <rect x={39} y={29} width={3} height={5} rx={1} fill="#22c55e" />
      <text x={82} y={36} textAnchor="middle" fontFamily="sans-serif" fontSize={9} fontWeight="bold" fill="#fbbf24">CACTUS BAR</text>
      <rect x={28} y={44} width={30} height={20} rx={2} fill="#1e1b4b" opacity={0.7} stroke="#57534e" strokeWidth={1} />
      <rect x={64} y={44} width={30} height={20} rx={2} fill="#1e1b4b" opacity={0.7} stroke="#57534e" strokeWidth={1} />
      <rect x={32} y={48} width={22} height={10} rx={1} fill="#0f0a1e" />
      <text x={43} y={56} textAnchor="middle" fontFamily="sans-serif" fontSize={6} fontWeight="bold" fill="#ef4444">BEER</text>
      <rect x={68} y={48} width={22} height={10} rx={1} fill="#0f0a1e" />
      <text x={79} y={56} textAnchor="middle" fontFamily="sans-serif" fontSize={5} fontWeight="bold" fill="#22d3ee">DRINKS</text>
      <rect x={100} y={50} width={20} height={32} rx={2} fill="#451a03" stroke="#78350f" strokeWidth={1} />
      <circle cx={116} cy={66} r={2} fill="#fbbf24" />
      <rect x={123} y={60} width={10} height={16} rx={1} fill="#292524" stroke="#57534e" strokeWidth={1} />
      <circle cx={128} cy={58} r={4} fill="#44403c" />
      <rect x={20} y={85} width={60} height={17} rx={2} fill="#44403c" opacity={0.5} stroke="#57534e" strokeWidth={1} />
      <line x1={24} y1={87} x2={76} y2={87} stroke="#a8a29e" strokeWidth={0.5} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={`sl${i}`} cx={28 + i * 10} cy={87} r={2} fill={i % 2 === 0 ? "#fbbf24" : "#f87171"} opacity={0.8} />
      ))}
      <circle cx={32} cy={95} r={3} fill="#78716c" opacity={0.6} />
      <circle cx={50} cy={95} r={3} fill="#78716c" opacity={0.6} />
      <circle cx={68} cy={95} r={3} fill="#78716c" opacity={0.6} />
      <rect x={140} y={84} width={18} height={14} rx={1} fill="#365314" stroke="#3f6212" strokeWidth={1} />
      <rect x={141} y={82} width={16} height={3} rx={1} fill="#4d7c0f" />
      <circle cx={165} cy={100} r={7} fill="#166534" opacity={0.6} />
      <circle cx={165} cy={100} r={4} fill="#22c55e" opacity={0.4} />
      <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
      <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
      <line x1={50} y1={127} x2={50} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={85} y1={127} x2={85} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={120} y1={127} x2={120} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <line x1={155} y1={127} x2={155} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
      <Car x={32} y={148} color="#78350f" rot={90} />
      <Car x={67} y={152} color="#1e3a5f" rot={90} />
      <Car x={137} y={150} color="#fbbf24" rot={90} />
    </svg>
  );
}

// ─── Nightclub ────────────────────────────────────────────────────────────────

function Nightclub({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />
      <rect x={24} y={54} width={152} height={100} fill="rgba(0,0,0,0.25)" rx={2} />
      <rect x={20} y={50} width={152} height={100} fill="#1F1F2E" rx={2} />
      <rect x={20} y={50} width={152} height={6} fill="#DB2777" rx={2} />
      <rect x={20} y={53} width={152} height={3} fill="#BE185D" />
      <circle cx={96} cy={42} r={8} fill="#E5E7EB" />
      <defs>
        <radialGradient id="discoBallGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="50%" stopColor="#D1D5DB" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0.8} />
        </radialGradient>
      </defs>
      <circle cx={96} cy={42} r={8} fill="url(#discoBallGrad)" />
      <circle cx={92} cy={39} r={1.5} fill="#FFFFFF" opacity={0.9} />
      <circle cx={99} cy={41} r={1} fill="#FFFFFF" opacity={0.7} />
      <circle cx={94} cy={44} r={1} fill="#FFFFFF" opacity={0.6} />
      <rect x={95} y={34} width={2} height={4} fill="#6B7280" />
      <rect x={40} y={62} width={112} height={22} rx={4} fill="#DB2777" opacity={0.3} />
      <rect x={40} y={62} width={112} height={22} rx={4} fill="#DB2777" opacity={0.15} stroke="#DB2777" strokeWidth={2} />
      <text x={96} y={78} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={12} fill="#F9A8D4" stroke="#DB2777" strokeWidth={0.5}>NEON MIRAGE</text>
      <rect x={30} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={56} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={118} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={144} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={84} y={112} width={24} height={38} fill="#111827" rx={1} />
      <rect x={84} y={112} width={24} height={38} fill="none" stroke="#DB2777" strokeWidth={1.5} rx={1} />
      <circle cx={104} cy={132} r={2} fill="#DB2777" />
      <rect x={74} y={126} width={8} height={24} fill="#1a1a2e" stroke="#374151" strokeWidth={1} rx={1} />
      <rect x={75} y={128} width={6} height={4} fill="#111" rx={1} />
      <rect x={75} y={134} width={6} height={4} fill="#111" rx={1} />
      <rect x={75} y={140} width={6} height={6} fill="#111" rx={1} />
      <rect x={110} y={126} width={8} height={24} fill="#1a1a2e" stroke="#374151" strokeWidth={1} rx={1} />
      <rect x={111} y={128} width={6} height={4} fill="#111" rx={1} />
      <rect x={111} y={134} width={6} height={4} fill="#111" rx={1} />
      <rect x={111} y={140} width={6} height={6} fill="#111" rx={1} />
      <rect x={78} y={148} width={3} height={8} fill="#B8860B" rx={1} />
      <circle cx={79.5} cy={147} r={2.5} fill="#DAA520" />
      <rect x={111} y={148} width={3} height={8} fill="#B8860B" rx={1} />
      <circle cx={112.5} cy={147} r={2.5} fill="#DAA520" />
      <line x1={79.5} y1={150} x2={112.5} y2={150} stroke="#DC143C" strokeWidth={2} />
      <rect x={5} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={30} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={55} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={130} y={158} width={65} height={38} fill="#2D2D3E" rx={2} />
      <text x={162} y={166} textAnchor="middle" fontFamily="sans-serif" fontSize={6} fill="#DB2777" fontWeight="bold">VIP</text>
      <rect x={135} y={168} width={1} height={14} fill="#DB2777" />
      <rect x={160} y={168} width={1} height={14} fill="#DB2777" />
      <Car x={12} y={170} color="#EF4444" rot={90} />
      <Car x={37} y={172} color="#3B82F6" rot={90} />
      <Car x={140} y={174} color="#FBBF24" rot={90} />
      <Car x={165} y={173} color="#F8F8F8" rot={90} />
      <circle cx={16} cy={152} r={5} fill="#166534" />
      <circle cx={16} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={176} cy={152} r={5} fill="#166534" />
      <circle cx={176} cy={152} r={3.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Pawn Shop ────────────────────────────────────────────────────────────────

function PawnShop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />
      <rect x={19} y={59} width={162} height={95} fill="rgba(0,0,0,0.25)" rx={2} />
      <rect x={15} y={55} width={162} height={95} fill="#92700C" rx={2} />
      <rect x={15} y={55} width={162} height={7} fill="#CA8A04" rx={2} />
      <rect x={15} y={59} width={162} height={3} fill="#A16207" />
      <rect x={35} y={66} width={122} height={20} fill="#1F2937" rx={3} />
      <text x={96} y={80} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={13} fill="#FBBF24">QUICK CASH</text>
      <line x1={160} y1={80} x2={153} y2={66} stroke="#CA8A04" strokeWidth={1.5} />
      <line x1={160} y1={80} x2={160} y2={64} stroke="#CA8A04" strokeWidth={1.5} />
      <line x1={160} y1={80} x2={167} y2={66} stroke="#CA8A04" strokeWidth={1.5} />
      <circle cx={153} cy={63} r={4} fill="#FBBF24" />
      <circle cx={160} cy={61} r={4} fill="#FBBF24" />
      <circle cx={167} cy={63} r={4} fill="#FBBF24" />
      <rect x={24} y={92} width={28} height={20} fill="#7DD3FC" opacity={0.3} rx={1} />
      <rect x={24} y={92} width={28} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <line x1={30} y1={92} x2={30} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={36} y1={92} x2={36} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={42} y1={92} x2={42} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={48} y1={92} x2={48} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <rect x={58} y={92} width={34} height={20} fill="#FEF3C7" opacity={0.4} rx={1} />
      <rect x={58} y={92} width={34} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <rect x={62} y={101} width={5} height={8} fill="#EF4444" rx={1} />
      <circle cx={73} cy={105} r={3} fill="#FBBF24" />
      <rect x={79} y={100} width={7} height={3} fill="#60A5FA" />
      <rect x={79} y={105} width={6} height={5} fill="#A78BFA" rx={1} />
      <rect x={140} y={92} width={28} height={20} fill="#7DD3FC" opacity={0.3} rx={1} />
      <rect x={140} y={92} width={28} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <line x1={146} y1={92} x2={146} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={152} y1={92} x2={152} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={158} y1={92} x2={158} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={164} y1={92} x2={164} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <rect x={103} y={110} width={26} height={40} fill="#44403C" rx={1} />
      <rect x={103} y={110} width={26} height={40} fill="none" stroke="#292524" strokeWidth={2} rx={1} />
      <circle cx={124} cy={132} r={2.5} fill="#CA8A04" />
      <line x1={103} y1={125} x2={129} y2={125} stroke="#292524" strokeWidth={1} />
      <rect x={170} y={70} width={3} height={8} fill="#4B5563" />
      <rect x={166} y={76} width={10} height={5} fill="#1F2937" rx={1} />
      <circle cx={166} cy={78.5} r={2} fill="#EF4444" opacity={0.8} />
      <rect x={10} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={35} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={60} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />
      <Car x={15} y={170} color="#DC2626" rot={90} />
      <Car x={42} y={172} color="#6B7280" rot={90} />
      <Car x={145} y={171} color="#1D4ED8" rot={90} />
      <circle cx={12} cy={152} r={5} fill="#166534" />
      <circle cx={12} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={180} cy={152} r={5} fill="#166534" />
      <circle cx={180} cy={152} r={3.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Check Cashing ────────────────────────────────────────────────────────────

function CheckCashing({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />
      <rect x={19} y={54} width={162} height={100} fill="rgba(0,0,0,0.25)" rx={2} />
      <rect x={15} y={50} width={162} height={100} fill="#F0FDF4" rx={2} />
      <rect x={15} y={50} width={162} height={7} fill="#16A34A" rx={2} />
      <rect x={15} y={54} width={162} height={3} fill="#15803D" />
      <rect x={20} y={60} width={152} height={4} fill="#FFFFFF" opacity={0.6} />
      <rect x={42} y={68} width={108} height={22} fill="#16A34A" rx={3} />
      <text x={96} y={83} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={14} fill="#FFFFFF">EZ MONEY</text>
      <text x={30} y={84} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={16} fill="#16A34A" opacity={0.6}>$</text>
      <text x={162} y={84} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={16} fill="#16A34A" opacity={0.6}>$</text>
      <rect x={28} y={96} width={50} height={28} fill="#DBEAFE" opacity={0.5} rx={1} />
      <rect x={28} y={96} width={50} height={28} fill="none" stroke="#4B5563" strokeWidth={3} rx={1} />
      <rect x={28} y={118} width={50} height={4} fill="#6B7280" />
      <rect x={42} y={114} width={22} height={3} fill="#1F2937" rx={1} />
      <rect x={130} y={96} width={22} height={18} fill="#BFDBFE" opacity={0.4} rx={1} />
      <rect x={156} y={96} width={16} height={18} fill="#BFDBFE" opacity={0.4} rx={1} />
      <rect x={88} y={112} width={24} height={38} fill="#1F2937" rx={1} />
      <rect x={88} y={112} width={24} height={3} fill="#16A34A" />
      <circle cx={108} cy={132} r={2} fill="#D1D5DB" />
      <rect x={116} y={124} width={12} height={26} fill="#374151" rx={1} />
      <rect x={118} y={127} width={8} height={6} fill="#60A5FA" rx={1} />
      <rect x={118} y={135} width={8} height={4} fill="#1F2937" rx={1} />
      <rect x={120} y={141} width={4} height={2} fill="#111827" />
      <rect x={20} y={65} width={3} height={7} fill="#4B5563" />
      <rect x={15} y={70} width={10} height={5} fill="#1F2937" rx={1} />
      <circle cx={15} cy={72.5} r={1.5} fill="#EF4444" opacity={0.8} />
      <rect x={8} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={33} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={58} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />
      <Car x={13} y={170} color="#9CA3AF" rot={90} />
      <Car x={40} y={171} color="#16A34A" rot={90} />
      <Car x={145} y={172} color="#FBBF24" rot={90} />
      <circle cx={14} cy={152} r={5} fill="#166534" />
      <circle cx={14} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={178} cy={152} r={5} fill="#166534" />
      <circle cx={178} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={82} cy={152} r={4} fill="#166534" />
      <circle cx={82} cy={152} r={2.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Convenience Store ────────────────────────────────────────────────────────

function ConvenienceStore({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />
      <rect x={44} y={158} width={112} height={4} fill="rgba(0,0,0,0.15)" />
      <rect x={14} y={59} width={177} height={95} fill="rgba(0,0,0,0.25)" rx={2} />
      <rect x={10} y={55} width={177} height={95} fill="#CCFBF1" rx={2} />
      <rect x={10} y={55} width={177} height={7} fill="#0F766E" rx={2} />
      <rect x={10} y={59} width={177} height={3} fill="#115E59" />
      <rect x={30} y={66} width={132} height={20} fill="#0F766E" rx={3} />
      <text x={96} y={80} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={12} fill="#FFFFFF">DESERT MART</text>
      <rect x={20} y={92} width={40} height={30} fill="#CFFAFE" opacity={0.5} rx={1} />
      <rect x={20} y={92} width={40} height={30} fill="none" stroke="#6B7280" strokeWidth={1} rx={1} />
      <line x1={22} y1={100} x2={58} y2={100} stroke="#9CA3AF" strokeWidth={0.8} />
      <line x1={22} y1={107} x2={58} y2={107} stroke="#9CA3AF" strokeWidth={0.8} />
      <line x1={22} y1={114} x2={58} y2={114} stroke="#9CA3AF" strokeWidth={0.8} />
      <rect x={24} y={95} width={4} height={5} fill="#EF4444" opacity={0.6} rx={0.5} />
      <rect x={30} y={96} width={4} height={4} fill="#3B82F6" opacity={0.6} rx={0.5} />
      <rect x={36} y={95} width={3} height={5} fill="#FBBF24" opacity={0.6} rx={0.5} />
      <rect x={44} y={96} width={5} height={4} fill="#22C55E" opacity={0.6} rx={0.5} />
      <rect x={65} y={92} width={40} height={30} fill="#CFFAFE" opacity={0.5} rx={1} />
      <rect x={65} y={92} width={40} height={30} fill="none" stroke="#6B7280" strokeWidth={1} rx={1} />
      <line x1={67} y1={100} x2={103} y2={100} stroke="#9CA3AF" strokeWidth={0.8} />
      <line x1={67} y1={107} x2={103} y2={107} stroke="#9CA3AF" strokeWidth={0.8} />
      <line x1={67} y1={114} x2={103} y2={114} stroke="#9CA3AF" strokeWidth={0.8} />
      <rect x={110} y={110} width={22} height={40} fill="#1F2937" rx={1} />
      <rect x={110} y={110} width={22} height={3} fill="#0F766E" />
      <circle cx={128} cy={132} r={2} fill="#D1D5DB" />
      <rect x={137} y={130} width={16} height={20} fill="#F0F9FF" stroke="#93C5FD" strokeWidth={1} rx={2} />
      <text x={145} y={143} textAnchor="middle" fontFamily="sans-serif" fontSize={5} fill="#3B82F6">ICE</text>
      <rect x={157} y={136} width={10} height={14} fill="#FDE68A" stroke="#CA8A04" strokeWidth={1} rx={1} />
      <rect x={158} y={138} width={8} height={4} fill="#F5F5F4" />
      <rect x={172} y={124} width={12} height={26} fill="#374151" rx={1} />
      <rect x={174} y={127} width={8} height={6} fill="#60A5FA" rx={1} />
      <rect x={174} y={135} width={8} height={4} fill="#1F2937" rx={1} />
      <rect x={176} y={141} width={4} height={2} fill="#111827" />
      <rect x={40} y={152} width={120} height={3} fill="#0F766E" />
      <rect x={45} y={155} width={2} height={18} fill="#6B7280" />
      <rect x={155} y={155} width={2} height={18} fill="#6B7280" />
      <rect x={70} y={168} width={60} height={6} fill="#D1D5DB" rx={1} />
      <rect x={78} y={160} width={10} height={14} fill="#EF4444" rx={1} />
      <rect x={80} y={162} width={6} height={4} fill="#1F2937" rx={0.5} />
      <circle cx={83} cy={170} r={2} fill="#111827" />
      <rect x={112} y={160} width={10} height={14} fill="#EF4444" rx={1} />
      <rect x={114} y={162} width={6} height={4} fill="#1F2937" rx={0.5} />
      <circle cx={117} cy={170} r={2} fill="#111827" />
      <rect x={5} y={180} width={1} height={16} fill="#9CA3AF" />
      <rect x={30} y={180} width={1} height={16} fill="#9CA3AF" />
      <rect x={170} y={180} width={1} height={16} fill="#9CA3AF" />
      <Car x={10} y={185} color="#0EA5E9" rot={90} />
      <Car x={175} y={186} color="#F97316" rot={90} />
      <circle cx={8} cy={152} r={4} fill="#166534" />
      <circle cx={8} cy={152} r={2.5} fill="#22c55e" />
      <circle cx={190} cy={152} r={4} fill="#166534" />
      <circle cx={190} cy={152} r={2.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Smoke Shop ───────────────────────────────────────────────────────────────

function SmokeShop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />
      <rect x={34} y={64} width={132} height={90} fill="rgba(0,0,0,0.25)" rx={2} />
      <rect x={30} y={60} width={132} height={90} fill="#2E1065" rx={2} />
      <rect x={30} y={60} width={132} height={7} fill="#7C3AED" rx={2} />
      <rect x={30} y={64} width={132} height={3} fill="#6D28D9" />
      <ellipse cx={96} cy={52} rx={40} ry={8} fill="#7C3AED" opacity={0.1} />
      <ellipse cx={86} cy={48} rx={28} ry={6} fill="#A78BFA" opacity={0.08} />
      <ellipse cx={106} cy={45} rx={22} ry={5} fill="#C4B5FD" opacity={0.06} />
      <ellipse cx={96} cy={56} rx={50} ry={6} fill="#7C3AED" opacity={0.07} />
      <rect x={50} y={72} width={92} height={20} fill="#1F2937" rx={3} />
      <rect x={50} y={72} width={92} height={20} fill="none" stroke="#7C3AED" strokeWidth={1.5} rx={3} />
      <text x={96} y={86} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={13} fill="#C4B5FD">CLOUD 9</text>
      <rect x={40} y={98} width={44} height={24} fill="#1E1B4B" opacity={0.7} rx={1} />
      <rect x={40} y={98} width={44} height={24} fill="none" stroke="#7C3AED" strokeWidth={1} rx={1} />
      <rect x={44} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={57} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={70} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={44} y={112} width={14} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={62} y={112} width={14} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={44} y={125} width={28} height={10} fill="#111827" rx={2} />
      <text x={58} y={133} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={7} fill="#22C55E">OPEN</text>
      <rect x={44} y={125} width={28} height={10} fill="none" stroke="#22C55E" strokeWidth={1} rx={2} opacity={0.6} />
      <rect x={108} y={98} width={44} height={24} fill="#1E1B4B" opacity={0.7} rx={1} />
      <rect x={108} y={98} width={44} height={24} fill="none" stroke="#7C3AED" strokeWidth={1} rx={1} />
      <rect x={112} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={124} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={136} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={88} y={114} width={20} height={36} fill="#111827" rx={1} />
      <rect x={88} y={114} width={20} height={3} fill="#7C3AED" />
      <circle cx={104} cy={134} r={2} fill="#A78BFA" />
      <rect x={10} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={35} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={60} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />
      <Car x={15} y={170} color="#7C3AED" rot={90} />
      <Car x={42} y={172} color="#6B7280" rot={90} />
      <Car x={145} y={171} color="#F59E0B" rot={90} />
      <circle cx={26} cy={152} r={5} fill="#166534" />
      <circle cx={26} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={166} cy={152} r={5} fill="#166534" />
      <circle cx={166} cy={152} r={3.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Green Cross (Medical Dispensary) ─────────────────────────────────────────

function GreenCross({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="120" height="80" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="120" height="80" rx="3" fill="#f8fafc" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="120" height="16" rx="3" fill="#16A34A" />
      <rect x="18" y="31" width="120" height="3" fill="#15803d" />

      {/* Green cross on roof */}
      <rect x="68" y="20" width="12" height="4" rx="1" fill="#fff" />
      <rect x="72" y="18" width="4" height="8" rx="1" fill="#fff" />

      {/* "WELLNESS" sign */}
      <rect x="88" y="20" width="44" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="110" y="29" textAnchor="middle" fontSize="7" fill="#16A34A" fontWeight="bold" fontFamily="sans-serif">WELLNESS</text>

      {/* Frosted glass windows */}
      <rect x="24" y="40" width="20" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <rect x="33.5" y="40" width="1" height="14" fill="#16A34A" opacity="0.3" />
      <rect x="24" y="46.5" width="20" height="1" fill="#16A34A" opacity="0.3" />
      <rect x="50" y="40" width="20" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <rect x="59.5" y="40" width="1" height="14" fill="#16A34A" opacity="0.3" />
      <rect x="50" y="46.5" width="20" height="1" fill="#16A34A" opacity="0.3" />

      {/* Front door (frosted glass double doors) */}
      <rect x="78" y="40" width="22" height="28" rx="2" fill="#0f172a" />
      <rect x="79" y="41" width="10" height="26" rx="1" fill="#bbf7d0" opacity="0.25" />
      <rect x="90" y="41" width="10" height="26" rx="1" fill="#bbf7d0" opacity="0.25" />
      <circle cx="89" cy="55" r="1.2" fill="#16A34A" />
      <circle cx="90" cy="55" r="1.2" fill="#16A34A" />

      {/* Side windows */}
      <rect x="108" y="40" width="24" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <rect x="119.5" y="40" width="1" height="14" fill="#16A34A" opacity="0.3" />

      {/* Sidewalk in front */}
      <rect x="18" y="92" width="120" height="6" rx="1" fill="#d1d5db" opacity="0.5" />

      {/* Security guard post */}
      <rect x="22" y="68" width="10" height="10" rx="1" fill="#374151" />
      <circle cx="27" cy="73" r="3" fill="#4B5563" />
      <circle cx="27" cy="73" r="1.5" fill="#6B7280" />

      {/* Security cameras */}
      <rect x="18" y="35" width="4" height="2" rx="0.5" fill="#555" />
      <circle cx="18" cy="36" r="1" fill="#ef4444" opacity="0.8" />
      <rect x="134" y="35" width="4" height="2" rx="0.5" fill="#555" />
      <circle cx="138" cy="36" r="1" fill="#ef4444" opacity="0.8" />

      {/* A/C unit on roof */}
      <rect x="24" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="26" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#f5f5f4" rot={90} />
      <Car x={108} y={172} color="#16A34A" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />

      {/* Landscaping bushes */}
      <circle cx="14" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="142" cy="92" r="4" fill="#166534" opacity="0.6" />
      <circle cx="142" cy="92" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="92" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="92" r="2.5" fill="#22c55e" opacity="0.4" />

      {/* Dumpster (back) */}
      <rect x="140" y="18" width="20" height="14" rx="2" fill="#374151" />
      <rect x="140" y="18" width="20" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
  );
}

// ─── Bloom Cannabis (Recreational Dispensary) ─────────────────────────────────

function BloomCannabis({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="115" height="78" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="115" height="78" rx="3" fill="#2e1065" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="115" height="16" rx="3" fill="#7C3AED" />
      <rect x="18" y="31" width="115" height="3" fill="#6d28d9" />

      {/* "BLOOM" sign with leaf icon */}
      <rect x="40" y="20" width="60" height="12" rx="2" fill="#1e1b4b" opacity="0.9" />
      <text x="75" y="29" textAnchor="middle" fontSize="8" fill="#a78bfa" fontWeight="bold" fontFamily="sans-serif">BLOOM</text>
      {/* Leaf icon next to sign */}
      <ellipse cx="32" cy="26" rx="4" ry="2.5" fill="#22c55e" opacity="0.8" transform="rotate(-30,32,26)" />
      <line x1="30" y1="28" x2="34" y2="24" stroke="#166534" strokeWidth="0.8" />

      {/* Modern glass storefront */}
      <rect x="24" y="40" width="100" height="22" rx="2" fill="#c4b5fd" opacity="0.2" />
      {/* Glass panel dividers */}
      {[44, 64, 84, 104].map(x => (
        <rect key={x} x={x} y="40" width="1" height="22" fill="#7C3AED" opacity="0.4" />
      ))}

      {/* Display cases visible through glass */}
      <rect x="28" y="46" width="12" height="6" rx="1" fill="#ddd6fe" opacity="0.3" />
      <rect x="48" y="46" width="12" height="6" rx="1" fill="#bbf7d0" opacity="0.3" />
      <rect x="68" y="46" width="12" height="6" rx="1" fill="#ddd6fe" opacity="0.3" />
      <rect x="88" y="46" width="12" height="6" rx="1" fill="#bbf7d0" opacity="0.3" />

      {/* Front door */}
      <rect x="108" y="40" width="16" height="26" rx="2" fill="#0f0326" />
      <rect x="110" y="42" width="12" height="22" rx="1" fill="#c4b5fd" opacity="0.15" />
      <circle cx="120" cy="53" r="1.2" fill="#a78bfa" />

      {/* Neon accent lines on building face */}
      <rect x="24" y="66" width="100" height="2" rx="1" fill="#a78bfa" opacity="0.6" />
      <rect x="24" y="72" width="100" height="1" rx="0.5" fill="#7C3AED" opacity="0.4" />

      {/* Sidewalk */}
      <rect x="18" y="90" width="115" height="6" rx="1" fill="#d1d5db" opacity="0.4" />

      {/* Lounge area outside */}
      <rect x="24" y="102" width="14" height="10" rx="2" fill="#3b0764" opacity="0.6" />
      <rect x="44" y="102" width="14" height="10" rx="2" fill="#3b0764" opacity="0.6" />
      {/* Small table between seats */}
      <circle cx="37" cy="107" r="4" fill="#581c87" opacity="0.5" />

      {/* A/C unit on roof */}
      <rect x="110" y="20" width="16" height="10" rx="1" fill="#6B7280" />
      <rect x="112" y="22" width="12" height="6" rx="3" fill="#4B5563" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#7C3AED" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#1e1b4b" rot={90} />

      {/* Modern landscaping */}
      <circle cx="14" cy="20" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="20" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="136" cy="92" r="5" fill="#166534" opacity="0.6" />
      <circle cx="136" cy="92" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="70" cy="118" r="4" fill="#166534" opacity="0.6" />
      <circle cx="70" cy="118" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="90" cy="120" r="3" fill="#166534" opacity="0.6" />
      <circle cx="90" cy="120" r="2" fill="#22c55e" opacity="0.4" />

      {/* Dumpster (back) */}
      <rect x="140" y="18" width="20" height="14" rx="2" fill="#374151" />
      <rect x="140" y="18" width="20" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
  );
}

// ─── Small Apartment (2-story, grass base) ────────────────────────────────────

function SmallApartment({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a2a1a" />

      {/* Grass texture patches */}
      <circle cx="30" cy="180" r="8" fill="#22c55e" opacity="0.08" />
      <circle cx="160" cy="30" r="10" fill="#22c55e" opacity="0.06" />

      {/* === Building shadow === */}
      <rect x="24" y="24" width="130" height="90" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body (2-story apartment) === */}
      <rect x="20" y="20" width="130" height="90" rx="3" fill="#6B7280" />
      {/* Flat roof surface */}
      <rect x="20" y="20" width="130" height="14" rx="3" fill="#9CA3AF" />
      {/* Roof accent stripe */}
      <rect x="20" y="31" width="130" height="3" fill="#10B981" />

      {/* "SUNRISE APTS" sign on side */}
      <rect x="42" y="22" width="66" height="10" rx="2" fill="#10B981" opacity="0.9" />
      <text x="75" y="30" textAnchor="middle" fontSize="6.5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">SUNRISE APTS</text>

      {/* A/C units on roof */}
      <rect x="120" y="22" width="12" height="8" rx="1" fill="#4B5563" />
      <rect x="122" y="24" width="8" height="4" rx="2" fill="#374151" />
      <rect x="134" y="24" width="10" height="7" rx="1" fill="#4B5563" />
      <rect x="136" y="26" width="6" height="3" rx="1.5" fill="#374151" />

      {/* Shared stairwell (central rectangle) */}
      <rect x="68" y="38" width="18" height="34" rx="1" fill="#4B5563" />
      <rect x="70" y="40" width="14" height="30" rx="1" fill="#374151" />
      {/* Stair lines */}
      {[44, 49, 54, 59, 64].map(yy => (
        <rect key={yy} x="72" y={yy} width="10" height="1" fill="#555" />
      ))}

      {/* Unit doors — left side */}
      <rect x="28" y="42" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="36" cy="49" r="1" fill="#10B981" />
      <rect x="46" y="42" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="54" cy="49" r="1" fill="#10B981" />
      {/* Unit doors — right side */}
      <rect x="96" y="42" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="104" cy="49" r="1" fill="#10B981" />
      <rect x="116" y="42" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="124" cy="49" r="1" fill="#10B981" />
      {/* Lower floor doors */}
      <rect x="28" y="62" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="36" cy="69" r="1" fill="#10B981" />
      <rect x="46" y="62" width="10" height="14" rx="1.5" fill="#1e293b" />
      <circle cx="54" cy="69" r="1" fill="#10B981" />

      {/* Balconies (small protruding rects) */}
      <rect x="26" y="56" width="14" height="4" rx="1" fill="#9CA3AF" opacity="0.6" />
      <rect x="96" y="56" width="14" height="4" rx="1" fill="#9CA3AF" opacity="0.6" />
      <rect x="116" y="56" width="14" height="4" rx="1" fill="#9CA3AF" opacity="0.6" />

      {/* Laundry line */}
      <line x1="135" y1="60" x2="155" y2="60" stroke="#888" strokeWidth="0.8" />
      <rect x="138" y="60" width="3" height="5" rx="0.5" fill="#f5f5f4" opacity="0.5" />
      <rect x="143" y="60" width="3" height="4" rx="0.5" fill="#93c5fd" opacity="0.5" />
      <rect x="148" y="60" width="3" height="5" rx="0.5" fill="#fca5a5" opacity="0.5" />

      {/* Community mailbox */}
      <rect x="155" y="95" width="8" height="6" rx="1" fill="#374151" />
      <rect x="155" y="95" width="8" height="2" rx="0.5" fill="#4B5563" />

      {/* Sidewalk */}
      <rect x="20" y="105" width="130" height="5" rx="1" fill="#555" opacity="0.4" />

      {/* Small parking area */}
      <rect x="20" y="130" width="90" height="50" rx="2" fill="#1a1a2a" />
      {/* Parking lines */}
      {[35, 58, 81].map(x => (
        <rect key={x} x={x} y="135" width="1.5" height="40" fill="#555" rx="0.5" />
      ))}
      <Car x={48} y={158} color="#64748b" rot={90} />
      <Car x={70} y={158} color="#dc2626" rot={90} />
      <Car x={95} y={158} color="#f5f5f4" rot={90} />

      {/* Bushes */}
      <circle cx="160" cy="130" r="6" fill="#166534" opacity="0.6" />
      <circle cx="160" cy="130" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="175" cy="150" r="5" fill="#166534" opacity="0.6" />
      <circle cx="175" cy="150" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="15" cy="130" r="5" fill="#166534" opacity="0.6" />
      <circle cx="15" cy="130" r="3" fill="#22c55e" opacity="0.4" />
    </svg>
  );
}

// ─── Duplex Rental (side-by-side, grass base) ─────────────────────────────────

function DuplexRental({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a2a1a" />

      {/* Grass texture */}
      <circle cx="20" cy="170" r="12" fill="#22c55e" opacity="0.06" />
      <circle cx="180" cy="170" r="10" fill="#22c55e" opacity="0.07" />

      {/* === Building shadow === */}
      <rect x="19" y="24" width="165" height="85" rx="3" fill="#000" opacity="0.25" />

      {/* === Left unit === */}
      <rect x="15" y="20" width="80" height="85" rx="3" fill="#78716c" />
      {/* Pitched roof V-shape lines (left unit) */}
      <rect x="15" y="20" width="80" height="12" rx="3" fill="#92400E" />
      <line x1="55" y1="20" x2="15" y2="32" stroke="#78350f" strokeWidth="1.5" />
      <line x1="55" y1="20" x2="95" y2="32" stroke="#78350f" strokeWidth="1.5" />
      <rect x="15" y="30" width="80" height="2" fill="#F59E0B" />

      {/* Left front door (blue) */}
      <rect x="40" y="60" width="14" height="22" rx="2" fill="#1e3a5f" />
      <rect x="42" y="62" width="10" height="18" rx="1" fill="#2563eb" opacity="0.4" />
      <circle cx="52" cy="72" r="1.2" fill="#fbbf24" />

      {/* Left porch */}
      <rect x="32" y="82" width="30" height="10" rx="1.5" fill="#a8a29e" opacity="0.5" />

      {/* Left windows */}
      <rect x="22" y="42" width="16" height="12" rx="2" fill="#fde68a" opacity="0.25" />
      <rect x="29.5" y="42" width="1" height="12" fill="#78716c" opacity="0.5" />
      <rect x="62" y="42" width="16" height="12" rx="2" fill="#fde68a" opacity="0.25" />
      <rect x="69.5" y="42" width="1" height="12" fill="#78716c" opacity="0.5" />

      {/* === Right unit === */}
      <rect x="100" y="20" width="80" height="85" rx="3" fill="#78716c" />
      {/* Pitched roof V-shape lines (right unit) */}
      <rect x="100" y="20" width="80" height="12" rx="3" fill="#92400E" />
      <line x1="140" y1="20" x2="100" y2="32" stroke="#78350f" strokeWidth="1.5" />
      <line x1="140" y1="20" x2="180" y2="32" stroke="#78350f" strokeWidth="1.5" />
      <rect x="100" y="30" width="80" height="2" fill="#F59E0B" />

      {/* Right front door (red) */}
      <rect x="128" y="60" width="14" height="22" rx="2" fill="#5c1a1a" />
      <rect x="130" y="62" width="10" height="18" rx="1" fill="#dc2626" opacity="0.4" />
      <circle cx="130" cy="72" r="1.2" fill="#fbbf24" />

      {/* Right porch */}
      <rect x="120" y="82" width="30" height="10" rx="1.5" fill="#a8a29e" opacity="0.5" />

      {/* Right windows */}
      <rect x="108" y="42" width="16" height="12" rx="2" fill="#fde68a" opacity="0.25" />
      <rect x="115.5" y="42" width="1" height="12" fill="#78716c" opacity="0.5" />
      <rect x="152" y="42" width="16" height="12" rx="2" fill="#fde68a" opacity="0.25" />
      <rect x="159.5" y="42" width="1" height="12" fill="#78716c" opacity="0.5" />

      {/* Fence dividing yards */}
      <line x1="97" y1="100" x2="97" y2="195" stroke="#92400E" strokeWidth="2" />
      {[110, 130, 150, 170, 190].map(y => (
        <rect key={y} x="95" y={y} width="4" height="6" rx="0.5" fill="#a16207" opacity="0.6" />
      ))}

      {/* Shared driveway */}
      <rect x="70" y="100" width="55" height="95" rx="2" fill="#292929" />
      <rect x="72" y="102" width="51" height="91" rx="1" fill="#1f1f2f" />
      {/* Driveway center line */}
      <line x1="97" y1="105" x2="97" y2="195" stroke="#555" strokeWidth="1" strokeDasharray="4,4" />

      {/* Mailboxes */}
      <rect x="60" y="100" width="5" height="4" rx="0.5" fill="#374151" />
      <rect x="60" y="100" width="5" height="1.5" rx="0.3" fill="#4B5563" />
      <rect x="130" y="100" width="5" height="4" rx="0.5" fill="#374151" />
      <rect x="130" y="100" width="5" height="1.5" rx="0.3" fill="#4B5563" />

      {/* Trash bins */}
      <rect x="22" y="100" width="6" height="8" rx="1" fill="#374151" />
      <rect x="22" y="100" width="6" height="2" rx="0.5" fill="#4B5563" />
      <rect x="165" y="100" width="6" height="8" rx="1" fill="#374151" />
      <rect x="165" y="100" width="6" height="2" rx="0.5" fill="#4B5563" />

      {/* Small gardens */}
      <circle cx="30" cy="130" r="5" fill="#166534" opacity="0.6" />
      <circle cx="30" cy="130" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="50" cy="145" r="4" fill="#166534" opacity="0.6" />
      <circle cx="50" cy="145" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="160" cy="130" r="5" fill="#166534" opacity="0.6" />
      <circle cx="160" cy="130" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="145" cy="148" r="4" fill="#166534" opacity="0.6" />
      <circle cx="145" cy="148" r="2.5" fill="#22c55e" opacity="0.4" />

      {/* Flower patches */}
      <circle cx="40" cy="160" r="2" fill="#f472b6" opacity="0.5" />
      <circle cx="44" cy="158" r="2" fill="#fb923c" opacity="0.5" />
      <circle cx="155" cy="162" r="2" fill="#a78bfa" opacity="0.5" />
      <circle cx="150" cy="158" r="2" fill="#fbbf24" opacity="0.5" />

      {/* Cars on driveway */}
      <Car x={85} y={150} color="#3b82f6" rot={0} />
      <Car x={110} y={155} color="#a3a3a3" rot={0} />
    </svg>
  );
}

// ─── Apartment Block (large complex, grass base) ──────────────────────────────

function ApartmentBlock({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a2a1a" />

      {/* === Building shadow === */}
      <rect x="9" y="9" width="130" height="100" rx="3" fill="#000" opacity="0.25" />

      {/* === Main building (L-shape) === */}
      <rect x="5" y="5" width="130" height="100" rx="3" fill="#4338ca" />
      {/* Flat roof */}
      <rect x="5" y="5" width="130" height="14" rx="3" fill="#6366F1" />
      {/* Roof accent stripe */}
      <rect x="5" y="16" width="130" height="3" fill="#4f46e5" />

      {/* "KINGPIN TOWERS" sign */}
      <rect x="20" y="7" width="80" height="10" rx="2" fill="#1e1b4b" opacity="0.9" />
      <text x="60" y="15" textAnchor="middle" fontSize="6" fill="#c7d2fe" fontWeight="bold" fontFamily="sans-serif">KINGPIN TOWERS</text>

      {/* A/C units on roof */}
      <rect x="105" y="7" width="10" height="8" rx="1" fill="#6B7280" />
      <rect x="107" y="9" width="6" height="4" rx="2" fill="#4B5563" />
      <rect x="118" y="7" width="10" height="8" rx="1" fill="#6B7280" />
      <rect x="120" y="9" width="6" height="4" rx="2" fill="#4B5563" />
      <rect x="30" y="8" width="8" height="6" rx="1" fill="#6B7280" />

      {/* Satellite dishes */}
      <circle cx="48" cy="11" r="3" fill="#9CA3AF" opacity="0.6" />
      <circle cx="48" cy="11" r="1" fill="#6B7280" />
      <line x1="48" y1="11" x2="50" y2="9" stroke="#888" strokeWidth="0.8" />

      {/* Windows grid (multiple floors) */}
      {[24, 36, 48, 60, 72, 84].map(yy =>
        [12, 28, 44, 60, 76, 92, 108].map(xx => (
          <rect key={`${xx}-${yy}`} x={xx} y={yy} width="10" height="8" rx="1" fill="#a5b4fc" opacity="0.2" />
        ))
      )}

      {/* Grand entrance with canopy */}
      <rect x="50" y="85" width="30" height="20" rx="2" fill="#312e81" />
      <rect x="52" y="87" width="12" height="16" rx="1.5" fill="#0f172a" />
      <circle cx="62" cy="95" r="1.2" fill="#c7d2fe" />
      <rect x="66" y="87" width="12" height="16" rx="1.5" fill="#0f172a" />
      <circle cx="68" cy="95" r="1.2" fill="#c7d2fe" />
      {/* Canopy overhang */}
      <rect x="44" y="83" width="42" height="4" rx="1" fill="#6366F1" opacity="0.7" />

      {/* === Large parking lot (bottom area) === */}
      <rect x="5" y="120" width="190" height="75" rx="2" fill="#1a1a2a" />
      {/* Parking lines */}
      {[20, 42, 64, 86, 108, 130, 152, 174].map(x => (
        <rect key={x} x={x} y="130" width="1.5" height="35" fill="#555" rx="0.5" />
      ))}
      {/* Curb */}
      <rect x="8" y="126" width="184" height="3" rx="1" fill="#555" />

      {/* Many parked cars */}
      <Car x={32} y={148} color="#64748b" rot={90} />
      <Car x={54} y={148} color="#dc2626" rot={90} />
      <Car x={76} y={148} color="#f5f5f4" rot={90} />
      <Car x={120} y={148} color="#3b82f6" rot={90} />
      <Car x={142} y={148} color="#facc15" rot={90} />
      <Car x={164} y={148} color="#a3a3a3" rot={90} />

      {/* Cars in far row */}
      <Car x={32} y={180} color="#22c55e" rot={90} />
      <Car x={76} y={180} color="#7C3AED" rot={90} />
      <Car x={142} y={180} color="#f97316" rot={90} />

      {/* === Pool area (right side) === */}
      <ellipse cx="165" cy="55" rx="25" ry="15" fill="#06b6d4" opacity="0.6" />
      <ellipse cx="165" cy="55" rx="22" ry="12" fill="#22d3ee" opacity="0.4" />
      {/* Pool border */}
      <ellipse cx="165" cy="55" rx="27" ry="17" fill="none" stroke="#a5f3fc" strokeWidth="2" opacity="0.5" />
      {/* Pool ladder */}
      <rect x="186" y="50" width="3" height="10" rx="0.5" fill="#d4d4d8" />

      {/* === Basketball court (right side, below pool) === */}
      <rect x="142" y="78" width="50" height="30" rx="2" fill="#92400E" opacity="0.6" />
      <rect x="142" y="78" width="50" height="30" rx="2" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />
      {/* Center circle */}
      <circle cx="167" cy="93" r="8" fill="none" stroke="#fff" strokeWidth="1" opacity="0.4" />
      {/* Center line */}
      <line x1="167" y1="78" x2="167" y2="108" stroke="#fff" strokeWidth="1" opacity="0.4" />
      {/* Free throw areas */}
      <rect x="142" y="85" width="12" height="16" rx="1" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3" />
      <rect x="180" y="85" width="12" height="16" rx="1" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.3" />

      {/* Landscaping */}
      <circle cx="140" cy="45" r="5" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="45" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="140" cy="72" r="4" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="72" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="5" cy="115" r="5" fill="#166534" opacity="0.6" />
      <circle cx="5" cy="115" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="190" cy="115" r="4" fill="#166534" opacity="0.6" />
      <circle cx="190" cy="115" r="2.5" fill="#22c55e" opacity="0.4" />
    </svg>
  );
}

// ─── Sprite router ────────────────────────────────────────────────────────────

const SPRITE_MAP: Record<string, (props: SpriteProps) => React.ReactNode> = {
  tasty_toads: TacoStand,
  desert_burger: DesertBurger,
  car_wash: CarWash,
  cactus_salads: CactusSalads,
  sand_chicken: SandChicken,
  auto_repair: AutoRepair,
  car_dealership: CarDealership,
  rental_house: RentalHouse,
  motel: Motel,
  barbershop: Barbershop,
  laundromat: Laundromat,
  gym: GymSprite,
  tattoo_parlor: TattooParlor,
  bar: BarSprite,
  nightclub: Nightclub,
  pawn_shop: PawnShop,
  check_cashing: CheckCashing,
  convenience_store: ConvenienceStore,
  smoke_shop: SmokeShop,
  green_cross: GreenCross,
  bloom_cannabis: BloomCannabis,
  small_apartment: SmallApartment,
  duplex_rental: DuplexRental,
  apartment_block: ApartmentBlock,
  strip_club: StripClub,
  underground_casino: UndergroundCasino,
  chop_shop: ChopShop,
  loan_shark: LoanShark,
  law_firm: LawFirm,
  bank: BankSprite,
  insurance_co: InsuranceCo,
  accounting_firm: AccountingFirm,
  real_estate_holdings: RealEstateHoldings,
  hemp_plant: HempPlant,
  cannabis_license: CannabisLicense,
  packaging_factory: PackagingFactory,
  textile_mill: TextileMill,
  electronics_assembly: ElectronicsAssembly,
  legal_dispensary: LegalDispensary,
  cbd_wellness: CbdWellness,
  clothing_outlet: ClothingOutlet,
  tech_retailer: TechRetailer,
  general_store: GeneralStore,
};

export default function BuildingSprite({ businessDefId, w = 72, h = 72 }: { businessDefId: string; w?: number; h?: number }) {
  const Sprite = SPRITE_MAP[businessDefId];
  if (!Sprite) return null;
  return <>{Sprite({ w, h })}</>;
}

export function hasSprite(businessDefId: string): boolean {
  return businessDefId in SPRITE_MAP;
}
