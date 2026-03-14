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

// ─── Strip Club ──────────────────────────────────────────────────────────────

function StripClub({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="19" y="19" width="115" height="70" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body (windowless, dark) === */}
      <rect x="15" y="15" width="115" height="70" rx="3" fill="#1a0a14" />
      {/* Neon outline around building edges */}
      <rect x="15" y="15" width="115" height="70" rx="3" fill="none"
        stroke="#DB2777" strokeWidth="2" opacity="0.8" />
      {/* Roof accent stripe */}
      <rect x="15" y="15" width="115" height="14" rx="3" fill="#2d0a1e" />
      <rect x="15" y="26" width="115" height="3" fill="#DB2777" opacity="0.6" />

      {/* "DESERT DOLLS" neon sign on roof */}
      <rect x="28" y="17" width="85" height="11" rx="2" fill="#0f0f0f" />
      <text x="70" y="26" textAnchor="middle" fontSize="7.5" fill="#DB2777"
        fontWeight="bold" fontFamily="sans-serif" opacity="0.95">DESERT DOLLS</text>
      {/* Neon glow behind sign */}
      <rect x="28" y="17" width="85" height="11" rx="2" fill="none"
        stroke="#DB2777" strokeWidth="1" opacity="0.5" />

      {/* Star decorations on facade */}
      <text x="22" y="48" fontSize="8" fill="#DB2777" opacity="0.7">★</text>
      <text x="118" y="48" fontSize="8" fill="#DB2777" opacity="0.7">★</text>
      {/* Diamond decorations */}
      <text x="40" y="40" fontSize="6" fill="#EC4899" opacity="0.6">◆</text>
      <text x="100" y="40" fontSize="6" fill="#EC4899" opacity="0.6">◆</text>
      <text x="70" y="38" fontSize="7" fill="#EC4899" opacity="0.5">◆</text>

      {/* Neon strips along facade */}
      <rect x="20" y="55" width="105" height="1.5" fill="#DB2777" opacity="0.4" />
      <rect x="20" y="65" width="105" height="1.5" fill="#DB2777" opacity="0.3" />

      {/* Main entrance (blacked-out) */}
      <rect x="55" y="60" width="20" height="22" rx="2" fill="#0a0a0a" />
      <rect x="57" y="62" width="16" height="18" rx="1" fill="#110510" />
      <circle cx="73" cy="71" r="1.2" fill="#DB2777" /> {/* door handle */}
      {/* Velvet rope posts */}
      <circle cx="50" cy="84" r="2" fill="#8B8000" />
      <circle cx="80" cy="84" r="2" fill="#8B8000" />
      <line x1="50" y1="84" x2="80" y2="84" stroke="#DC2626" strokeWidth="1.5" opacity="0.7" />
      {/* Bouncer post */}
      <rect x="44" y="78" width="6" height="8" rx="1" fill="#1f1f1f" />
      <circle cx="47" cy="76" r="3" fill="#374151" /> {/* bouncer head */}

      {/* VIP entrance (right side) */}
      <rect x="118" y="45" width="10" height="16" rx="1" fill="#0a0a0a" />
      <text x="123" y="42" textAnchor="middle" fontSize="5" fill="#DB2777"
        fontWeight="bold" fontFamily="sans-serif">VIP</text>
      <circle cx="126" cy="53" r="1" fill="#DB2777" />

      {/* A/C unit on roof */}
      <rect x="110" y="17" width="14" height="10" rx="1" fill="#4B5563" />
      <rect x="112" y="19" width="10" height="6" rx="3" fill="#374151" />

      {/* Neon glow puddles on ground */}
      <ellipse cx="65" cy="92" rx="18" ry="4" fill="#DB2777" opacity="0.1" />
      <ellipse cx="123" cy="58" rx="6" ry="8" fill="#DB2777" opacity="0.08" />

      {/* Dumpster (back corner) */}
      <rect x="140" y="15" width="22" height="16" rx="2" fill="#374151" />
      <rect x="140" y="15" width="22" height="4" rx="1" fill="#4B5563" />

      {/* Parked cars in bottom lot */}
      <Car x={35} y={172} color="#1e1e1e" rot={90} />
      <Car x={70} y={172} color="#64748b" rot={90} />
      <Car x={108} y={172} color="#dc2626" rot={90} />
      <Car x={143} y={172} color="#0f0f0f" rot={90} />
      <Car x={176} y={172} color="#a855f7" rot={90} />

      {/* Landscaping (minimal, dark) */}
      <circle cx="12" cy="18" r="5" fill="#166534" opacity="0.5" />
      <circle cx="12" cy="18" r="3" fill="#22c55e" opacity="0.3" />
      <circle cx="135" cy="90" r="4" fill="#166534" opacity="0.5" />
      <circle cx="135" cy="90" r="2.5" fill="#22c55e" opacity="0.3" />
    </ParkingLot>
  );
}

// ─── Underground Casino ──────────────────────────────────────────────────────

function UndergroundCasino({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="100" height="65" rx="3" fill="#000" opacity="0.25" />

      {/* === Warehouse building (unassuming) === */}
      <rect x="18" y="18" width="100" height="65" rx="3" fill="#374151" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="100" height="14" rx="3" fill="#4B5563" />
      <rect x="18" y="29" width="100" height="3" fill="#6B7280" />

      {/* Corrugated wall texture */}
      {[36, 42, 48, 54, 60, 66, 72].map(yy => (
        <rect key={yy} x="20" y={yy} width="96" height="0.8" fill="#4B5563" opacity="0.4" />
      ))}

      {/* Small, subtle "SNAKE EYES" sign (not flashy) */}
      <rect x="32" y="20" width="55" height="10" rx="1" fill="#292929" />
      <text x="59" y="28" textAnchor="middle" fontSize="5.5" fill="#9ca3af"
        fontWeight="bold" fontFamily="sans-serif" opacity="0.7">SNAKE EYES</text>

      {/* Dirty/grimy windows (small, high up) */}
      <rect x="25" y="38" width="10" height="8" rx="1" fill="#1f2937" opacity="0.5" />
      <rect x="98" y="38" width="10" height="8" rx="1" fill="#1f2937" opacity="0.5" />

      {/* Heavy steel door (main entrance / basement access) */}
      <rect x="55" y="55" width="22" height="26" rx="2" fill="#1f1f1f" />
      <rect x="57" y="57" width="18" height="22" rx="1" fill="#292929" />
      {/* Door reinforcement bars */}
      <rect x="57" y="62" width="18" height="1.5" fill="#4B5563" />
      <rect x="57" y="70" width="18" height="1.5" fill="#4B5563" />
      <circle cx="72" cy="67" r="1.5" fill="#6B7280" /> {/* handle */}
      {/* Steel door frame */}
      <rect x="54" y="54" width="24" height="28" rx="2" fill="none"
        stroke="#555" strokeWidth="1.5" />

      {/* Basement stairs visible (stepped rects going darker) */}
      <rect x="80" y="58" width="28" height="22" rx="1" fill="#1a1a2a" />
      <rect x="82" y="60" width="24" height="4" rx="0.5" fill="#2a2a3a" />
      <rect x="82" y="64" width="24" height="4" rx="0.5" fill="#222233" />
      <rect x="82" y="68" width="24" height="4" rx="0.5" fill="#1a1a28" />
      <rect x="82" y="72" width="24" height="4" rx="0.5" fill="#111120" />
      <rect x="82" y="76" width="24" height="4" rx="0.5" fill="#0a0a18" />
      {/* Handrail */}
      <line x1="82" y1="59" x2="82" y2="80" stroke="#6B7280" strokeWidth="1" />

      {/* Security camera */}
      <rect x="50" y="36" width="4" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="50" cy="39" r="1.5" fill="#DC2626" opacity="0.6" />
      <line x1="52" y1="37" x2="56" y2="35" stroke="#4B5563" strokeWidth="1" />

      {/* Dim exterior light */}
      <circle cx="54" cy="52" r="2" fill="#fde68a" opacity="0.2" />
      <ellipse cx="60" cy="88" rx="14" ry="4" fill="#fde68a" opacity="0.06" />

      {/* Dumpster (concealment) */}
      <rect x="122" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="122" y="18" width="22" height="4" rx="1" fill="#4B5563" />

      {/* A few cars parked discreetly */}
      <Car x={35} y={115} color="#1e1e1e" rot={0} />
      <Car x={130} y={55} color="#374151" rot={0} />
      <Car x={40} y={172} color="#4B5563" rot={90} />
      <Car x={108} y={172} color="#1e293b" rot={90} />

      {/* Sparse landscaping */}
      <circle cx="14" cy="20" r="4" fill="#166534" opacity="0.4" />
      <circle cx="14" cy="20" r="2.5" fill="#22c55e" opacity="0.25" />
    </ParkingLot>
  );
}

// ─── Chop Shop ───────────────────────────────────────────────────────────────

function ChopShop({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Chain-link fence around property (dashed border) === */}
      <rect x="6" y="6" width="188" height="188" rx="2" fill="none"
        stroke="#78716C" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
      {/* Fence posts */}
      {[6, 50, 100, 150, 194].map(x => (
        <circle key={`ft-${x}`} cx={x} cy="6" r="2" fill="#78716C" opacity="0.5" />
      ))}
      {[6, 50, 100, 150, 194].map(x => (
        <circle key={`fb-${x}`} cx={x} cy="194" r="2" fill="#78716C" opacity="0.5" />
      ))}

      {/* === Building shadow === */}
      <rect x="19" y="19" width="130" height="70" rx="3" fill="#000" opacity="0.25" />

      {/* === Industrial garage building === */}
      <rect x="15" y="15" width="130" height="70" rx="3" fill="#57534E" />
      {/* Corrugated metal texture */}
      {[20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].map(yy => (
        <rect key={yy} x="15" y={yy} width="130" height="1" fill="#78716C" opacity="0.3" />
      ))}
      {/* Roof accent stripe */}
      <rect x="15" y="15" width="130" height="12" rx="3" fill="#6B7280" />
      <rect x="15" y="24" width="130" height="3" fill="#78716C" />

      {/* "PARTS UNKNOWN" sign */}
      <rect x="30" y="17" width="75" height="9" rx="1" fill="#44403C" />
      <text x="67" y="24.5" textAnchor="middle" fontSize="6" fill="#D6D3D1"
        fontWeight="bold" fontFamily="sans-serif">PARTS UNKNOWN</text>

      {/* === Roll-up garage doors (3 bays) === */}
      {/* Bay 1 */}
      <rect x="20" y="40" width="34" height="38" rx="2" fill="#292524" />
      {[44, 50, 56, 62, 68].map(yy => (
        <rect key={`b1-${yy}`} x="22" y={yy} width="30" height="2" rx="0.5" fill="#44403C" />
      ))}
      {/* Bay 2 */}
      <rect x="60" y="40" width="34" height="38" rx="2" fill="#292524" />
      {[44, 50, 56, 62, 68].map(yy => (
        <rect key={`b2-${yy}`} x="62" y={yy} width="30" height="2" rx="0.5" fill="#44403C" />
      ))}
      {/* Bay 3 (partially open) */}
      <rect x="100" y="40" width="34" height="38" rx="2" fill="#1c1917" />
      <rect x="100" y="40" width="34" height="14" rx="2" fill="#292524" />
      {[44, 50].map(yy => (
        <rect key={`b3-${yy}`} x="102" y={yy} width="30" height="2" rx="0.5" fill="#44403C" />
      ))}

      {/* === Oil stains on ground === */}
      <ellipse cx="37" cy="95" rx="12" ry="5" fill="#1c1917" opacity="0.3" />
      <ellipse cx="77" cy="98" rx="10" ry="4" fill="#1c1917" opacity="0.25" />
      <ellipse cx="117" cy="92" rx="14" ry="6" fill="#1c1917" opacity="0.35" />

      {/* === Scattered car parts === */}
      {/* Tires (circles) */}
      <circle cx="155" cy="25" r="5" fill="#292524" />
      <circle cx="155" cy="25" r="3" fill="#44403C" />
      <circle cx="155" cy="38" r="5" fill="#292524" />
      <circle cx="155" cy="38" r="3" fill="#44403C" />
      <circle cx="165" cy="30" r="5" fill="#292524" />
      <circle cx="165" cy="30" r="3" fill="#44403C" />
      {/* Panels (rects) */}
      <rect x="155" y="50" width="20" height="8" rx="1" fill="#78716C" opacity="0.6"
        transform="rotate(15,165,54)" />
      <rect x="150" y="62" width="16" height="5" rx="1" fill="#6B7280" opacity="0.5"
        transform="rotate(-8,158,64)" />
      {/* Hood piece */}
      <rect x="160" y="72" width="18" height="12" rx="2" fill="#57534E" opacity="0.7" />

      {/* Engine block */}
      <rect x="12" y="95" width="14" height="10" rx="1" fill="#44403C" />
      <circle cx="19" cy="100" r="2" fill="#292524" />

      {/* Junk car (stripped, no wheels) */}
      <rect x="30" y="110" width="30" height="16" rx="3" fill="#78716C" opacity="0.5" />
      <rect x="36" y="112" width="8" height="6" rx="1" fill="#1c1917" opacity="0.4" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#78716C" rot={90} />
      <Car x={108} y={172} color="#292524" rot={90} />
      <Car x={143} y={172} color="#b91c1c" rot={90} />

      {/* Rust patches */}
      <ellipse cx="80" cy="20" rx="4" ry="2" fill="#92400E" opacity="0.3" />
      <ellipse cx="45" cy="30" rx="3" ry="1.5" fill="#92400E" opacity="0.25" />
    </ParkingLot>
  );
}

// ─── Loan Shark ──────────────────────────────────────────────────────────────

function LoanShark({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="29" y="29" width="85" height="60" rx="3" fill="#000" opacity="0.25" />

      {/* === Small fortified building === */}
      <rect x="25" y="25" width="85" height="60" rx="3" fill="#7F1D1D" />
      {/* Roof accent stripe */}
      <rect x="25" y="25" width="85" height="14" rx="3" fill="#B91C1C" />
      <rect x="25" y="36" width="85" height="3" fill="#991B1B" />

      {/* "QUICK LEND" sign */}
      <rect x="35" y="27" width="60" height="10" rx="2" fill="#1f1f1f" />
      <text x="65" y="35" textAnchor="middle" fontSize="7" fill="#FCA5A5"
        fontWeight="bold" fontFamily="sans-serif">QUICK LEND</text>

      {/* Barred windows (dark tinted with bars) */}
      {/* Window 1 */}
      <rect x="30" y="44" width="14" height="10" rx="1" fill="#1c1917" opacity="0.7" />
      <line x1="33" y1="44" x2="33" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="37" y1="44" x2="37" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="41" y1="44" x2="41" y2="54" stroke="#6B7280" strokeWidth="1" />
      {/* Window 2 */}
      <rect x="50" y="44" width="14" height="10" rx="1" fill="#1c1917" opacity="0.7" />
      <line x1="53" y1="44" x2="53" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="57" y1="44" x2="57" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="61" y1="44" x2="61" y2="54" stroke="#6B7280" strokeWidth="1" />
      {/* Window 3 */}
      <rect x="70" y="44" width="14" height="10" rx="1" fill="#1c1917" opacity="0.7" />
      <line x1="73" y1="44" x2="73" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="77" y1="44" x2="77" y2="54" stroke="#6B7280" strokeWidth="1" />
      <line x1="81" y1="44" x2="81" y2="54" stroke="#6B7280" strokeWidth="1" />

      {/* Heavy reinforced door */}
      <rect x="90" y="48" width="16" height="24" rx="2" fill="#1f1f1f" />
      <rect x="91" y="49" width="14" height="22" rx="1" fill="#292929" />
      {/* Door reinforcement plates */}
      <rect x="92" y="50" width="12" height="3" rx="0.5" fill="#4B5563" />
      <rect x="92" y="66" width="12" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="103" cy="60" r="1.5" fill="#B91C1C" /> {/* handle */}

      {/* Security cameras */}
      <rect x="28" y="38" width="4" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="28" cy="41" r="1.5" fill="#DC2626" opacity="0.6" />
      <rect x="103" y="38" width="4" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="107" cy="41" r="1.5" fill="#DC2626" opacity="0.6" />

      {/* Warning signs */}
      <rect x="26" y="60" width="8" height="6" rx="0.5" fill="#EAB308" />
      <text x="30" y="65" textAnchor="middle" fontSize="4" fill="#1f1f1f"
        fontWeight="bold" fontFamily="sans-serif">⚠</text>
      <rect x="86" y="74" width="12" height="6" rx="0.5" fill="#EAB308" />
      <text x="92" y="79" textAnchor="middle" fontSize="3.5" fill="#1f1f1f"
        fontWeight="bold" fontFamily="sans-serif">24HR</text>

      {/* Exterior light (harsh) */}
      <circle cx="98" cy="44" r="2" fill="#fde68a" opacity="0.4" />
      <ellipse cx="98" cy="90" rx="10" ry="4" fill="#fde68a" opacity="0.08" />

      {/* Reinforced bollards at entrance */}
      <circle cx="88" cy="76" r="2.5" fill="#6B7280" />
      <circle cx="109" cy="76" r="2.5" fill="#6B7280" />

      {/* A/C unit */}
      <rect x="92" y="27" width="12" height="8" rx="1" fill="#4B5563" />
      <rect x="94" y="29" width="8" height="4" rx="2" fill="#374151" />

      {/* Minimal landscaping — dead/sparse */}
      <circle cx="120" cy="35" r="3" fill="#166534" opacity="0.3" />
      <circle cx="120" cy="35" r="2" fill="#22c55e" opacity="0.2" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#1e1e1e" rot={90} />
      <Car x={108} y={172} color="#6B7280" rot={90} />
      <Car x={143} y={172} color="#44403C" rot={90} />

      {/* Dumpster */}
      <rect x="120" y="55" width="20" height="14" rx="2" fill="#374151" />
      <rect x="120" y="55" width="20" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
  );
}

// ─── Law Firm ────────────────────────────────────────────────────────────────

function LawFirm({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="19" y="19" width="120" height="75" rx="3" fill="#000" opacity="0.25" />

      {/* === Professional office building === */}
      <rect x="15" y="15" width="120" height="75" rx="3" fill="#1E3A5F" />
      {/* Roof accent stripe */}
      <rect x="15" y="15" width="120" height="16" rx="3" fill="#2563EB" />
      <rect x="15" y="28" width="120" height="3" fill="#1D4ED8" />

      {/* "DESERT DEFENSE LLP" elegant sign */}
      <rect x="25" y="17" width="95" height="12" rx="2" fill="#0f172a" opacity="0.8" />
      <text x="72" y="26" textAnchor="middle" fontSize="5.5" fill="#CBD5E1"
        fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">DESERT DEFENSE LLP</text>
      {/* Underline accent */}
      <rect x="35" y="27" width="75" height="0.8" fill="#60A5FA" opacity="0.6" />

      {/* Large glass windows (row 1) */}
      <rect x="22" y="36" width="16" height="14" rx="1.5" fill="#93C5FD" opacity="0.3" />
      <rect x="22" y="42.5" width="16" height="0.8" fill="#1D4ED8" opacity="0.4" />
      <rect x="29.5" y="36" width="0.8" height="14" fill="#1D4ED8" opacity="0.4" />

      <rect x="44" y="36" width="16" height="14" rx="1.5" fill="#93C5FD" opacity="0.3" />
      <rect x="44" y="42.5" width="16" height="0.8" fill="#1D4ED8" opacity="0.4" />
      <rect x="51.5" y="36" width="0.8" height="14" fill="#1D4ED8" opacity="0.4" />

      <rect x="66" y="36" width="16" height="14" rx="1.5" fill="#93C5FD" opacity="0.3" />
      <rect x="66" y="42.5" width="16" height="0.8" fill="#1D4ED8" opacity="0.4" />
      <rect x="73.5" y="36" width="0.8" height="14" fill="#1D4ED8" opacity="0.4" />

      <rect x="88" y="36" width="16" height="14" rx="1.5" fill="#93C5FD" opacity="0.3" />
      <rect x="88" y="42.5" width="16" height="0.8" fill="#1D4ED8" opacity="0.4" />
      <rect x="95.5" y="36" width="0.8" height="14" fill="#1D4ED8" opacity="0.4" />

      {/* Large glass windows (row 2) */}
      <rect x="22" y="54" width="16" height="12" rx="1.5" fill="#93C5FD" opacity="0.25" />
      <rect x="44" y="54" width="16" height="12" rx="1.5" fill="#93C5FD" opacity="0.25" />
      <rect x="88" y="54" width="16" height="12" rx="1.5" fill="#93C5FD" opacity="0.25" />

      {/* Entrance with columns */}
      <rect x="64" y="55" width="20" height="22" rx="2" fill="#0f172a" />
      <rect x="66" y="57" width="16" height="18" rx="1" fill="#1E3A5F" opacity="0.4" />
      <circle cx="80" cy="66" r="1.2" fill="#60A5FA" /> {/* handle */}
      {/* Columns */}
      <rect x="62" y="54" width="3" height="24" rx="1" fill="#CBD5E1" />
      <rect x="84" y="54" width="3" height="24" rx="1" fill="#CBD5E1" />
      {/* Column caps */}
      <rect x="61" y="53" width="5" height="2" rx="0.5" fill="#E2E8F0" />
      <rect x="83" y="53" width="5" height="2" rx="0.5" fill="#E2E8F0" />

      {/* Flagpole */}
      <line x1="112" y1="12" x2="112" y2="42" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="113" y="12" width="10" height="7" rx="0.5" fill="#1D4ED8" />
      <circle cx="112" cy="12" r="1.5" fill="#D4AF37" />

      {/* A/C unit on roof */}
      <rect x="115" y="17" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="117" y="19" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Manicured landscaping */}
      <circle cx="14" cy="20" r="6" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="20" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="40" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="40" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="58" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="58" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="140" cy="25" r="6" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="25" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="140" cy="50" r="5" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="50" r="3" fill="#22c55e" opacity="0.4" />

      {/* Walkway to entrance */}
      <rect x="68" y="80" width="14" height="20" rx="1" fill="#9CA3AF" opacity="0.3" />

      {/* Executive parking labels */}
      <rect x="20" y="155" width="28" height="8" rx="1" fill="#1E3A5F" opacity="0.4" />
      <text x="34" y="161" textAnchor="middle" fontSize="4" fill="#93C5FD"
        fontFamily="sans-serif">RESERVED</text>

      {/* Parked cars (upscale colors) */}
      <Car x={35} y={172} color="#1e293b" rot={90} />
      <Car x={70} y={172} color="#0f172a" rot={90} />
      <Car x={108} y={172} color="#78716C" rot={90} />
      <Car x={143} y={172} color="#1e3a5f" rot={90} />
    </ParkingLot>
  );
}

// ─── Bank ────────────────────────────────────────────────────────────────────

function BankSprite({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h} spots="both">
      {/* === Building shadow === */}
      <rect x="19" y="19" width="120" height="75" rx="3" fill="#000" opacity="0.25" />

      {/* === Solid bank building === */}
      <rect x="15" y="15" width="120" height="75" rx="3" fill="#0F766E" />
      {/* Roof accent stripe */}
      <rect x="15" y="15" width="120" height="16" rx="3" fill="#14B8A6" />
      <rect x="15" y="28" width="120" height="3" fill="#0D9488" />

      {/* "FIRST DESERT SAVINGS" sign */}
      <rect x="22" y="17" width="100" height="12" rx="2" fill="#042F2E" opacity="0.8" />
      <text x="72" y="26" textAnchor="middle" fontSize="5" fill="#99F6E4"
        fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">FIRST DESERT SAVINGS</text>

      {/* Vault door icon on building face */}
      <circle cx="105" cy="52" r="12" fill="#115E59" stroke="#0D9488" strokeWidth="1.5" />
      <circle cx="105" cy="52" r="9" fill="#134E4A" />
      <circle cx="105" cy="52" r="6" fill="#115E59" />
      {/* Vault handle (cross shape) */}
      <line x1="100" y1="52" x2="110" y2="52" stroke="#5EEAD4" strokeWidth="1.5" />
      <line x1="105" y1="47" x2="105" y2="57" stroke="#5EEAD4" strokeWidth="1.5" />
      <circle cx="105" cy="52" r="2" fill="#14B8A6" />

      {/* Entrance columns (classic bank) */}
      <rect x="36" y="45" width="3" height="28" rx="1" fill="#CBD5E1" />
      <rect x="48" y="45" width="3" height="28" rx="1" fill="#CBD5E1" />
      <rect x="60" y="45" width="3" height="28" rx="1" fill="#CBD5E1" />
      {/* Column caps */}
      <rect x="35" y="43" width="5" height="3" rx="0.5" fill="#E2E8F0" />
      <rect x="47" y="43" width="5" height="3" rx="0.5" fill="#E2E8F0" />
      <rect x="59" y="43" width="5" height="3" rx="0.5" fill="#E2E8F0" />
      {/* Column pediment (triangle) */}
      <polygon points="33,43 65,43 49,35" fill="#14B8A6" opacity="0.6" />

      {/* Main door (between columns) */}
      <rect x="39" y="55" width="18" height="20" rx="2" fill="#042F2E" />
      <rect x="41" y="57" width="6" height="16" rx="1" fill="#0F766E" opacity="0.4" />
      <rect x="49" y="57" width="6" height="16" rx="1" fill="#0F766E" opacity="0.4" />
      <circle cx="47" cy="66" r="1.2" fill="#5EEAD4" /> {/* handle */}

      {/* ATM alcove (right of entrance) */}
      <rect x="70" y="58" width="14" height="16" rx="1" fill="#134E4A" />
      <rect x="72" y="60" width="10" height="8" rx="1" fill="#1e293b" />
      {/* ATM screen */}
      <rect x="73" y="61" width="8" height="4" rx="0.5" fill="#5EEAD4" opacity="0.4" />
      {/* ATM keypad */}
      <rect x="74" y="66" width="6" height="3" rx="0.5" fill="#4B5563" />

      {/* Windows */}
      <rect x="20" y="48" width="12" height="10" rx="1.5" fill="#5EEAD4" opacity="0.25" />
      <rect x="20" y="52.5" width="12" height="0.8" fill="#0D9488" opacity="0.4" />
      <rect x="120" y="48" width="10" height="10" rx="1.5" fill="#5EEAD4" opacity="0.25" />

      {/* Security booth at entrance */}
      <rect x="30" y="78" width="10" height="10" rx="1" fill="#134E4A" />
      <rect x="31" y="79" width="8" height="8" rx="0.5" fill="#042F2E" />
      <rect x="32" y="80" width="6" height="3" rx="0.5" fill="#5EEAD4" opacity="0.3" />
      {/* Guard figure */}
      <circle cx="35" cy="84" r="2" fill="#374151" />

      {/* Drive-thru lane (bottom right) */}
      <rect x="130" y="95" width="35" height="50" rx="3" fill="#1a1a2a" opacity="0.5" />
      {/* Drive direction arrow */}
      <polygon points="147,140 142,130 145,130 145,105 149,105 149,130 152,130"
        fill="#14B8A6" opacity="0.3" />
      {/* Pneumatic tube station */}
      <circle cx="132" cy="108" r="4" fill="#0D9488" />
      <circle cx="132" cy="108" r="2.5" fill="#14B8A6" />
      <circle cx="132" cy="108" r="1" fill="#042F2E" />
      {/* Tube line going to building */}
      <line x1="132" y1="104" x2="132" y2="90" stroke="#0D9488" strokeWidth="1.5" />

      {/* Armored truck in parking (wider, darker) */}
      <g transform="translate(170,42) rotate(0)">
        <rect x="-16" y="-9" width="32" height="18" rx="3" fill="#374151" />
        <rect x="6" y="-7" width="8" height="14" rx="2" fill="#1e293b" opacity="0.7" />
        <rect x="-14" y="-6" width="6" height="12" rx="1.5" fill="#1e293b" opacity="0.5" />
        <circle cx="15" cy="-6" r="1.2" fill="#fde68a" />
        <circle cx="15" cy="6" r="1.2" fill="#fde68a" />
        <circle cx="-15" cy="-6" r="1" fill="#ef4444" opacity="0.8" />
        <circle cx="-15" cy="6" r="1" fill="#ef4444" opacity="0.8" />
      </g>

      {/* Security cameras */}
      <rect x="18" y="38" width="4" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="18" cy="41" r="1.5" fill="#DC2626" opacity="0.6" />
      <rect x="128" y="38" width="4" height="3" rx="0.5" fill="#4B5563" />
      <circle cx="132" cy="41" r="1.5" fill="#DC2626" opacity="0.6" />

      {/* A/C units on roof */}
      <rect x="115" y="17" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="117" y="19" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Manicured landscaping */}
      <circle cx="12" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="12" cy="18" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="12" cy="50" r="5" fill="#166534" opacity="0.6" />
      <circle cx="12" cy="50" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="12" cy="80" r="4" fill="#166534" opacity="0.6" />
      <circle cx="12" cy="80" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="140" cy="80" r="5" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="80" r="3" fill="#22c55e" opacity="0.4" />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#0f172a" rot={90} />
      <Car x={108} y={172} color="#6B7280" rot={90} />

      {/* Car at drive-thru */}
      <Car x={147} y={125} color="#3b82f6" rot={90} />
    </ParkingLot>
  );
}

// ─── Insurance Co ─────────────────────────────────────────────────────────────

function InsuranceCo({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="115" height="80" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="115" height="80" rx="3" fill="#1e40af" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="115" height="16" rx="3" fill="#2563EB" />
      <rect x="18" y="31" width="115" height="3" fill="#1d4ed8" />

      {/* "SHIELD & CO." sign on roof */}
      <rect x="32" y="20" width="72" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="68" y="29" textAnchor="middle" fontSize="7" fill="#1e40af" fontWeight="bold" fontFamily="sans-serif">SHIELD &amp; CO.</text>

      {/* Glass facade — row of windows */}
      {[24, 44, 64, 84, 104].map(x => (
        <rect key={x} x={x} y="40" width="18" height="16" rx="2" fill="#93c5fd" opacity="0.35" />
      ))}
      {/* Window crossbars */}
      {[24, 44, 64, 84, 104].map(x => (
        <g key={`xb-${x}`}>
          <rect x={x + 8.5} y="40" width="1" height="16" fill="#1d4ed8" opacity="0.5" />
          <rect x={x} y="47" width="18" height="1" fill="#1d4ed8" opacity="0.5" />
        </g>
      ))}

      {/* Lobby visible — second row of smaller windows */}
      {[24, 44, 64].map(x => (
        <rect key={`lb-${x}`} x={x} y="62" width="14" height="10" rx="2" fill="#bfdbfe" opacity="0.25" />
      ))}

      {/* Front door — corporate glass double door */}
      <rect x="86" y="60" width="20" height="24" rx="2" fill="#0f172a" />
      <rect x="87" y="62" width="8.5" height="20" rx="1" fill="#1e40af" opacity="0.4" />
      <rect x="96.5" y="62" width="8.5" height="20" rx="1" fill="#1e40af" opacity="0.4" />
      <circle cx="95" cy="72" r="1.2" fill="#93c5fd" />
      <circle cx="98" cy="72" r="1.2" fill="#93c5fd" />

      {/* Flagpole */}
      <line x1="14" y1="18" x2="14" y2="50" stroke="#9ca3af" strokeWidth="2" />
      <rect x="15" y="18" width="12" height="8" rx="1" fill="#dc2626" />
      <rect x="15" y="22" width="12" height="4" rx="0" fill="#fff" />

      {/* A/C unit on roof */}
      <rect x="115" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="117" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Manicured entrance — hedges */}
      <rect x="78" y="86" width="36" height="5" rx="2" fill="#166534" opacity="0.6" />
      <rect x="78" y="86" width="36" height="3" rx="2" fill="#22c55e" opacity="0.4" />

      {/* Executive parking — nicer cars */}
      <Car x={40} y={172} color="#1e293b" rot={90} />
      <Car x={75} y={172} color="#1e3a5f" rot={90} />
      <Car x={108} y={172} color="#374151" rot={90} />
      <Car x={143} y={172} color="#f5f5f4" rot={90} />

      {/* Landscaping bushes */}
      <circle cx="14" cy="90" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="90" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="138" cy="92" r="5" fill="#166534" opacity="0.6" />
      <circle cx="138" cy="92" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Accounting Firm ──────────────────────────────────────────────────────────

function AccountingFirm({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="24" y="24" width="100" height="70" rx="2" fill="#000" opacity="0.25" />

      {/* === Building body — plain gray box === */}
      <rect x="20" y="20" width="100" height="70" rx="2" fill="#4B5563" />
      {/* Roof accent stripe */}
      <rect x="20" y="20" width="100" height="14" rx="2" fill="#6B7280" />
      <rect x="20" y="31" width="100" height="3" fill="#374151" />

      {/* "BEAN COUNTER CPA" sign — simple */}
      <rect x="30" y="22" width="80" height="10" rx="1" fill="#f5f5f4" opacity="0.85" />
      <text x="70" y="30" textAnchor="middle" fontSize="6.5" fill="#374151" fontWeight="bold" fontFamily="sans-serif">BEAN COUNTER CPA</text>

      {/* Small windows — understated */}
      {[28, 50, 72, 94].map(x => (
        <rect key={x} x={x} y="42" width="14" height="10" rx="1" fill="#9ca3af" opacity="0.3" />
      ))}
      {/* Window crossbars */}
      {[28, 50, 72, 94].map(x => (
        <g key={`ab-${x}`}>
          <rect x={x + 6.5} y="42" width="1" height="10" fill="#374151" opacity="0.5" />
          <rect x={x} y="46.5" width="14" height="1" fill="#374151" opacity="0.5" />
        </g>
      ))}

      {/* Filing cabinet visible through window (tiny rects in first window) */}
      <rect x="30" y="44" width="3" height="6" rx="0.5" fill="#6B7280" opacity="0.5" />
      <rect x="34" y="44" width="3" height="6" rx="0.5" fill="#6B7280" opacity="0.5" />
      <rect x="30" y="45" width="3" height="0.5" fill="#374151" opacity="0.4" />
      <rect x="30" y="47" width="3" height="0.5" fill="#374151" opacity="0.4" />
      <rect x="34" y="45" width="3" height="0.5" fill="#374151" opacity="0.4" />
      <rect x="34" y="47" width="3" height="0.5" fill="#374151" opacity="0.4" />

      {/* Simple front door */}
      <rect x="58" y="60" width="14" height="20" rx="2" fill="#1f2937" />
      <rect x="60" y="62" width="10" height="16" rx="1" fill="#374151" opacity="0.4" />
      <circle cx="69" cy="70" r="1.2" fill="#9ca3af" />

      {/* Minimal entrance step */}
      <rect x="55" y="80" width="20" height="3" rx="1" fill="#6B7280" />

      {/* A/C unit on roof */}
      <rect x="100" y="22" width="14" height="8" rx="1" fill="#6B7280" />
      <rect x="102" y="24" width="10" height="4" rx="2" fill="#4B5563" />

      {/* Parked cars — sensible sedans */}
      <Car x={40} y={172} color="#6B7280" rot={90} />
      <Car x={75} y={172} color="#9ca3af" rot={90} />
      <Car x={108} y={172} color="#d4d4d8" rot={90} />

      {/* Minimal landscaping */}
      <circle cx="16" cy="20" r="4" fill="#166534" opacity="0.6" />
      <circle cx="16" cy="20" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="124" cy="84" r="4" fill="#166534" opacity="0.6" />
      <circle cx="124" cy="84" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Real Estate Holdings ─────────────────────────────────────────────────────

function RealEstateHoldings({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="110" height="75" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body — warm brown === */}
      <rect x="18" y="18" width="110" height="75" rx="3" fill="#92400E" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="110" height="16" rx="3" fill="#B45309" />
      <rect x="18" y="31" width="110" height="3" fill="#78350f" />

      {/* "SUNSET REALTY" sign on roof */}
      <rect x="32" y="20" width="68" height="12" rx="2" fill="#fef3c7" opacity="0.9" />
      <text x="66" y="29" textAnchor="middle" fontSize="7" fill="#92400E" fontWeight="bold" fontFamily="sans-serif">SUNSET REALTY</text>

      {/* Large display window showing floor plans */}
      <rect x="24" y="40" width="40" height="24" rx="2" fill="#fde68a" opacity="0.3" />
      {/* Floor plan lines inside window */}
      <rect x="28" y="44" width="14" height="8" rx="0.5" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <rect x="28" y="54" width="8" height="6" rx="0.5" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <rect x="44" y="44" width="16" height="16" rx="0.5" fill="none" stroke="#92400E" strokeWidth="0.5" opacity="0.4" />
      <line x1="44" y1="52" x2="60" y2="52" stroke="#92400E" strokeWidth="0.5" opacity="0.3" />

      {/* Side windows */}
      {[72, 94].map(x => (
        <rect key={x} x={x} y="42" width="16" height="14" rx="2" fill="#fde68a" opacity="0.25" />
      ))}
      {[72, 94].map(x => (
        <g key={`rb-${x}`}>
          <rect x={x + 7.5} y="42" width="1" height="14" fill="#78350f" opacity="0.5" />
          <rect x={x} y="48.5" width="16" height="1" fill="#78350f" opacity="0.5" />
        </g>
      ))}

      {/* Front door */}
      <rect x="72" y="62" width="16" height="22" rx="2" fill="#451a03" />
      <rect x="74" y="64" width="12" height="18" rx="1" fill="#78350f" opacity="0.4" />
      <circle cx="84" cy="73" r="1.2" fill="#fbbf24" />

      {/* "FOR SALE" sign in front yard */}
      <line x1="40" y1="100" x2="40" y2="120" stroke="#78350f" strokeWidth="2" />
      <line x1="54" y1="100" x2="54" y2="120" stroke="#78350f" strokeWidth="2" />
      <rect x="34" y="100" width="26" height="14" rx="2" fill="#dc2626" />
      <text x="47" y="108" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">FOR SALE</text>
      <text x="47" y="113" textAnchor="middle" fontSize="3.5" fill="#fde68a" fontFamily="sans-serif">CALL NOW!</text>

      {/* A/C unit on roof */}
      <rect x="110" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="112" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#b45309" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />

      {/* Landscaping bushes */}
      <circle cx="14" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="14" cy="85" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="85" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="132" cy="90" r="5" fill="#166534" opacity="0.6" />
      <circle cx="132" cy="90" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Hemp Plant ───────────────────────────────────────────────────────────────

function HempPlant({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="14" y="14" width="140" height="90" rx="3" fill="#000" opacity="0.25" />

      {/* === Large industrial building === */}
      <rect x="10" y="10" width="140" height="90" rx="3" fill="#166534" />
      {/* Roof accent stripe */}
      <rect x="10" y="10" width="140" height="18" rx="3" fill="#16A34A" />
      <rect x="10" y="25" width="140" height="3" fill="#15803D" />

      {/* "DESERT HEMP CO." sign */}
      <rect x="30" y="12" width="90" height="14" rx="2" fill="#fef3c7" opacity="0.9" />
      <text x="75" y="22" textAnchor="middle" fontSize="7.5" fill="#166534" fontWeight="bold" fontFamily="sans-serif">DESERT HEMP CO.</text>

      {/* Smokestacks */}
      <rect x="135" y="2" width="8" height="20" rx="1" fill="#6B7280" />
      <rect x="137" y="0" width="4" height="4" rx="1" fill="#9ca3af" opacity="0.5" />
      <rect x="122" y="5" width="7" height="17" rx="1" fill="#6B7280" />
      <rect x="124" y="3" width="3" height="4" rx="1" fill="#9ca3af" opacity="0.4" />

      {/* Industrial windows */}
      {[18, 40, 62, 84, 106].map(x => (
        <rect key={x} x={x} y="34" width="14" height="10" rx="1" fill="#4ade80" opacity="0.25" />
      ))}

      {/* Loading dock (large opening) */}
      <rect x="18" y="70" width="30" height="22" rx="2" fill="#0f172a" />
      <rect x="20" y="72" width="26" height="18" rx="1" fill="#166534" opacity="0.3" />
      {/* Dock bumpers */}
      <rect x="18" y="70" width="3" height="22" rx="1" fill="#fbbf24" />
      <rect x="45" y="70" width="3" height="22" rx="1" fill="#fbbf24" />

      {/* Office door */}
      <rect x="58" y="72" width="12" height="20" rx="2" fill="#052e16" />
      <circle cx="68" cy="82" r="1.2" fill="#4ade80" />

      {/* Forklift (small vehicle shape) */}
      <g>
        <rect x="90" y="108" width="14" height="10" rx="2" fill="#fbbf24" />
        <rect x="104" y="110" width="8" height="6" rx="1" fill="#fbbf24" opacity="0.7" />
        <circle cx="93" cy="120" r="2" fill="#374151" />
        <circle cx="101" cy="120" r="2" fill="#374151" />
      </g>

      {/* Pallets — brown rects in grid */}
      {[120, 135, 150].map(x =>
        [108, 120, 132].map(y => (
          <rect key={`p-${x}-${y}`} x={x} y={y} width="10" height="8" rx="1" fill="#92400E" opacity="0.6" />
        ))
      )}

      {/* Parked cars */}
      <Car x={40} y={172} color="#16A34A" rot={90} />
      <Car x={75} y={172} color="#64748b" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />

      {/* Landscaping */}
      <circle cx="8" cy="108" r="5" fill="#166534" opacity="0.6" />
      <circle cx="8" cy="108" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Cannabis License ─────────────────────────────────────────────────────────

function CannabisLicense({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Security fence (dashed border) === */}
      <rect x="6" y="6" width="188" height="140" rx="2" fill="none"
        stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,3" />

      {/* === Greenhouse building shadow === */}
      <rect x="18" y="18" width="130" height="85" rx="3" fill="#000" opacity="0.2" />

      {/* === Greenhouse frame === */}
      <rect x="14" y="14" width="130" height="85" rx="3" fill="#15803D" />
      {/* Roof accent stripe */}
      <rect x="14" y="14" width="130" height="14" rx="3" fill="#22c55e" />
      <rect x="14" y="25" width="130" height="3" fill="#166534" />

      {/* "GREEN STATE" sign */}
      <rect x="35" y="16" width="72" height="10" rx="2" fill="#fff" opacity="0.9" />
      <text x="71" y="24" textAnchor="middle" fontSize="7" fill="#15803D" fontWeight="bold" fontFamily="sans-serif">GREEN STATE</text>

      {/* Glass roof panels — translucent green rects in grid */}
      {[20, 44, 68, 92, 116].map(x =>
        [32, 48, 64].map(y => (
          <rect key={`gp-${x}-${y}`} x={x} y={y} width="20" height="12" rx="1"
            fill="#4ade80" opacity="0.2" stroke="#22c55e" strokeWidth="0.5" />
        ))
      )}

      {/* Grow lights (yellow dots inside panels) */}
      {[30, 54, 78, 102, 126].map(x =>
        [38, 54, 70].map(y => (
          <circle key={`gl-${x}-${y}`} cx={x} cy={y} r="2" fill="#fde68a" opacity="0.6" />
        ))
      )}

      {/* Ventilation fans (circles on roof) */}
      <circle cx="36" cy="16" r="0" />
      {[148, 148].map((x, i) => (
        <g key={`fan-${i}`}>
          <circle cx={x} cy={30 + i * 30} r="8" fill="#374151" opacity="0.7" />
          <circle cx={x} cy={30 + i * 30} r="5" fill="#4B5563" opacity="0.5" />
          <line x1={x - 4} y1={30 + i * 30} x2={x + 4} y2={30 + i * 30} stroke="#6B7280" strokeWidth="1.5" />
          <line x1={x} y1={26 + i * 30} x2={x} y2={34 + i * 30} stroke="#6B7280" strokeWidth="1.5" />
        </g>
      ))}

      {/* Guard booth (small box at entrance) */}
      <rect x="160" y="110" width="22" height="18" rx="2" fill="#374151" />
      <rect x="162" y="112" width="18" height="14" rx="1" fill="#4B5563" />
      <rect x="166" y="116" width="10" height="8" rx="1" fill="#9ca3af" opacity="0.3" />
      <text x="171" y="108" textAnchor="middle" fontSize="4" fill="#9ca3af" fontFamily="sans-serif">GUARD</text>

      {/* Gate opening in fence */}
      <rect x="155" y="138" width="30" height="6" fill="#1a1a2a" />
      <rect x="155" y="138" width="14" height="4" rx="1" fill="#fbbf24" opacity="0.5" />

      {/* Parked cars */}
      <Car x={40} y={172} color="#15803D" rot={90} />
      <Car x={75} y={172} color="#374151" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
    </ParkingLot>
  );
}

// ─── Cactus Salads ────────────────────────────────────────────────────────────

function CactusSalads({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="115" height="70" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="115" height="70" rx="3" fill="#15803d" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="115" height="16" rx="3" fill="#16A34A" />
      <rect x="18" y="31" width="115" height="3" fill="#14532d" />

      {/* "SALADS" sign on roof */}
      <rect x="38" y="20" width="55" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="65" y="30" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="bold" fontFamily="sans-serif">SALADS</text>

      {/* A/C unit on roof */}
      <rect x="110" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="112" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Windows */}
      <rect x="24" y="40" width="18" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <rect x="24" y="46" width="18" height="1" fill="#14532d" opacity="0.5" />
      <rect x="32.5" y="40" width="1" height="14" fill="#14532d" opacity="0.5" />

      {/* Salad bowl icon in second window */}
      <rect x="48" y="40" width="18" height="14" rx="2" fill="#bbf7d0" opacity="0.35" />
      <ellipse cx="57" cy="47" rx="6" ry="4" fill="#22c55e" opacity="0.5" />
      <circle cx="55" cy="45" r="2" fill="#4ade80" opacity="0.6" />
      <circle cx="59" cy="44" r="1.5" fill="#ef4444" opacity="0.5" />

      {/* Front door */}
      <rect x="72" y="42" width="14" height="22" rx="2" fill="#052e16" />
      <circle cx="84" cy="53" r="1.2" fill="#4ade80" />

      {/* Service window */}
      <rect x="94" y="42" width="22" height="16" rx="2" fill="#dcfce7" opacity="0.4" />
      <rect x="96" y="58" width="18" height="3" rx="1" fill="#16A34A" />

      {/* === Fresh produce display near entrance === */}
      <rect x="70" y="68" width="24" height="8" rx="1" fill="#166534" />
      <circle cx="76" cy="72" r="2.5" fill="#4ade80" opacity="0.7" />
      <circle cx="82" cy="72" r="2.5" fill="#f97316" opacity="0.7" />
      <circle cx="88" cy="72" r="2.5" fill="#ef4444" opacity="0.7" />

      {/* === Outdoor seating area === */}
      <PicnicTable x={35} y={115} umbrellaColor="#16A34A" />
      <PicnicTable x={70} y={115} umbrellaColor="#22c55e" />
      <PicnicTable x={105} y={115} umbrellaColor="#16A34A" />

      {/* Potted plants near seating */}
      <circle cx="52" cy="105" r="3.5" fill="#166534" opacity="0.7" />
      <circle cx="52" cy="105" r="2" fill="#4ade80" opacity="0.5" />
      <circle cx="88" cy="105" r="3.5" fill="#166534" opacity="0.7" />
      <circle cx="88" cy="105" r="2" fill="#4ade80" opacity="0.5" />

      {/* Trash can (green/eco) */}
      <circle cx="130" cy="108" r="4" fill="#15803d" />
      <circle cx="130" cy="108" r="2.5" fill="#22c55e" />

      {/* Dumpster (back corner) */}
      <rect x="140" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="140" y="18" width="22" height="4" rx="1" fill="#4B5563" />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#22c55e" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />

      {/* Landscaping bushes */}
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
      {/* === Building shadow === */}
      <rect x="22" y="22" width="105" height="72" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="105" height="72" rx="3" fill="#991b1b" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="105" height="16" rx="3" fill="#DC2626" />
      <rect x="18" y="31" width="105" height="3" fill="#7f1d1d" />

      {/* "CHICKEN" sign on roof */}
      <rect x="32" y="20" width="60" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="62" y="30" textAnchor="middle" fontSize="8" fill="#DC2626" fontWeight="bold" fontFamily="sans-serif">CHICKEN</text>

      {/* A/C unit on roof */}
      <rect x="100" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="102" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* Windows */}
      <rect x="24" y="40" width="18" height="14" rx="2" fill="#fca5a5" opacity="0.3" />
      <rect x="24" y="46" width="18" height="1" fill="#7f1d1d" opacity="0.5" />
      <rect x="32.5" y="40" width="1" height="14" fill="#7f1d1d" opacity="0.5" />

      {/* Service window with heat lamps */}
      <rect x="48" y="40" width="24" height="16" rx="2" fill="#fde68a" opacity="0.45" />
      {/* Heat lamp glow */}
      <circle cx="54" cy="48" r="3" fill="#f97316" opacity="0.35" />
      <circle cx="54" cy="48" r="1.5" fill="#fbbf24" opacity="0.5" />
      <circle cx="66" cy="48" r="3" fill="#f97316" opacity="0.35" />
      <circle cx="66" cy="48" r="1.5" fill="#fbbf24" opacity="0.5" />
      {/* Counter ledge */}
      <rect x="48" y="56" width="24" height="3" rx="1" fill="#DC2626" />

      {/* Front door */}
      <rect x="78" y="42" width="14" height="22" rx="2" fill="#450a0a" />
      <circle cx="90" cy="53" r="1.2" fill="#fca5a5" />

      {/* === Drive-thru lane (right side) === */}
      <rect x="128" y="18" width="28" height="72" rx="3" fill="#292929" />
      <rect x="130" y="20" width="24" height="68" rx="2" fill="#1f1f2f" />
      {/* Drive-thru arrow */}
      <polygon points="142,80 136,70 139,70 139,35 145,35 145,70 148,70" fill="#fbbf24" opacity="0.5" />
      {/* Menu board */}
      <rect x="131" y="24" width="22" height="16" rx="2" fill="#1e293b" />
      <rect x="133" y="26" width="18" height="3" rx="0.5" fill="#fde68a" opacity="0.6" />
      <rect x="133" y="30" width="14" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      <rect x="133" y="33" width="16" height="2" rx="0.5" fill="#fde68a" opacity="0.4" />
      {/* Speaker box */}
      <circle cx="142" cy="46" r="3" fill="#374151" />
      <circle cx="142" cy="46" r="1.5" fill="#555" />
      {/* Pickup window */}
      <rect x="123" y="50" width="6" height="10" rx="1" fill="#fde68a" opacity="0.5" />

      {/* Outdoor trash cans */}
      <circle cx="105" cy="100" r="4" fill="#374151" />
      <circle cx="105" cy="100" r="2.5" fill="#4B5563" />
      <circle cx="120" cy="100" r="4" fill="#374151" />
      <circle cx="120" cy="100" r="2.5" fill="#4B5563" />

      {/* Dumpster (back corner) */}
      <rect x="160" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="160" y="18" width="22" height="4" rx="1" fill="#4B5563" />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#dc2626" rot={90} />
      <Car x={75} y={172} color="#f5f5f4" rot={90} />
      <Car x={108} y={172} color="#3b82f6" rot={90} />

      {/* Landscaping bushes */}
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
      {/* === Building shadow === */}
      <rect x="22" y="22" width="125" height="75" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="125" height="75" rx="3" fill="#57534e" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="125" height="16" rx="3" fill="#78716C" />
      <rect x="18" y="31" width="125" height="3" fill="#44403c" />

      {/* "REPAIR" sign on roof */}
      <rect x="45" y="20" width="50" height="12" rx="2" fill="#fde68a" opacity="0.9" />
      <text x="70" y="30" textAnchor="middle" fontSize="8" fill="#44403c" fontWeight="bold" fontFamily="sans-serif">REPAIR</text>

      {/* === Garage bay doors (3 bays) === */}
      {/* Bay 1 — open, car on lift */}
      <rect x="22" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      {/* Car on lift inside bay 1 */}
      <rect x="28" y="46" width="22" height="10" rx="3" fill="#64748b" opacity="0.7" />
      <rect x="32" y="48" width="6" height="6" rx="1" fill="#1e293b" opacity="0.5" />
      {/* Lift rails */}
      <rect x="26" y="44" width="2" height="24" fill="#a8a29e" opacity="0.6" />
      <rect x="50" y="44" width="2" height="24" fill="#a8a29e" opacity="0.6" />

      {/* Bay 2 — open, empty */}
      <rect x="62" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      {/* Tool outlines on back wall */}
      <rect x="68" y="43" width="4" height="8" rx="0.5" fill="#78716C" opacity="0.4" />
      <rect x="74" y="43" width="4" height="10" rx="0.5" fill="#78716C" opacity="0.4" />
      <rect x="80" y="43" width="4" height="7" rx="0.5" fill="#78716C" opacity="0.4" />

      {/* Bay 3 — half closed */}
      <rect x="102" y="40" width="34" height="30" rx="2" fill="#1c1917" />
      <rect x="102" y="40" width="34" height="12" rx="2" fill="#6B7280" opacity="0.7" />
      {[42, 45, 48].map(yy => (
        <rect key={yy} x="104" y={yy} width="30" height="1" rx="0.3" fill="#78716C" opacity="0.5" />
      ))}

      {/* Office door (far right) */}
      <rect x="120" y="76" width="12" height="16" rx="2" fill="#292524" />
      <circle cx="130" cy="84" r="1.2" fill="#a8a29e" />

      {/* === Oil stains on ground === */}
      <circle cx="45" cy="105" r="8" fill="#1c1917" opacity="0.2" />
      <circle cx="80" cy="110" r="6" fill="#1c1917" opacity="0.15" />
      <circle cx="115" cy="100" r="7" fill="#1c1917" opacity="0.18" />
      <circle cx="60" cy="120" r="5" fill="#1c1917" opacity="0.12" />

      {/* === Tool boxes === */}
      <rect x="140" y="40" width="12" height="18" rx="1" fill="#dc2626" />
      <rect x="140" y="42" width="12" height="3" rx="0.5" fill="#b91c1c" />
      <rect x="140" y="47" width="12" height="3" rx="0.5" fill="#b91c1c" />
      <rect x="140" y="52" width="12" height="3" rx="0.5" fill="#b91c1c" />

      {/* === Tire stack === */}
      <circle cx="155" cy="72" r="7" fill="#292524" />
      <circle cx="155" cy="72" r="4" fill="#1c1917" />
      <circle cx="155" cy="72" r="2" fill="#44403c" />
      {/* Second tire on top */}
      <circle cx="153" cy="66" r="6" fill="#292524" opacity="0.8" />
      <circle cx="153" cy="66" r="3.5" fill="#1c1917" opacity="0.8" />

      {/* Dumpster (back corner) */}
      <rect x="160" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="160" y="18" width="22" height="4" rx="1" fill="#4B5563" />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#a3a3a3" rot={90} />
      <Car x={108} y={172} color="#1e40af" rot={90} />
      <Car x={143} y={172} color="#854d0e" rot={90} />

      {/* Landscaping (minimal for industrial) */}
      <circle cx="14" cy="20" r="4" fill="#166534" opacity="0.5" />
      <circle cx="14" cy="20" r="2.5" fill="#22c55e" opacity="0.35" />
    </ParkingLot>
  );
}

// ─── Car Dealership ───────────────────────────────────────────────────────────

function CarDealership({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === Building shadow === */}
      <rect x="22" y="22" width="120" height="55" rx="3" fill="#000" opacity="0.25" />

      {/* === Building body === */}
      <rect x="18" y="18" width="120" height="55" rx="3" fill="#4338ca" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="120" height="14" rx="3" fill="#6366F1" />
      <rect x="18" y="29" width="120" height="3" fill="#3730a3" />

      {/* "MOTORS" sign on roof */}
      <rect x="42" y="20" width="52" height="10" rx="2" fill="#fff" opacity="0.9" />
      <text x="68" y="28" textAnchor="middle" fontSize="7" fill="#4338ca" fontWeight="bold" fontFamily="sans-serif">MOTORS</text>

      {/* A/C unit on roof */}
      <rect x="118" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="120" y="22" width="10" height="6" rx="3" fill="#4B5563" />

      {/* === Large glass showroom (reflective panels) === */}
      <rect x="24" y="36" width="80" height="30" rx="2" fill="#a5b4fc" opacity="0.3" />
      {/* Glass panel dividers */}
      {[40, 56, 72, 88].map(x => (
        <rect key={x} x={x} y="36" width="1.5" height="30" fill="#6366F1" opacity="0.4" />
      ))}
      {/* Reflective highlights */}
      <rect x="26" y="38" width="12" height="26" rx="1" fill="#c7d2fe" opacity="0.2" />
      <rect x="58" y="38" width="12" height="26" rx="1" fill="#c7d2fe" opacity="0.2" />

      {/* Showroom car inside */}
      <rect x="42" y="46" width="18" height="9" rx="3" fill="#f5f5f4" opacity="0.6" />

      {/* Office entrance */}
      <rect x="110" y="42" width="14" height="22" rx="2" fill="#1e1b4b" />
      <rect x="112" y="44" width="10" height="18" rx="1" fill="#4338ca" opacity="0.4" />
      <circle cx="120" cy="53" r="1.2" fill="#a5b4fc" />

      {/* === Flagpoles with pennant banners === */}
      <line x1="10" y1="10" x2="10" y2="40" stroke="#9ca3af" strokeWidth="1.5" />
      <polygon points="10,12 24,15 10,18" fill="#DC2626" opacity="0.8" />
      <polygon points="10,20 24,23 10,26" fill="#fff" opacity="0.8" />
      <polygon points="10,28 24,31 10,34" fill="#6366F1" opacity="0.8" />

      <line x1="145" y1="10" x2="145" y2="40" stroke="#9ca3af" strokeWidth="1.5" />
      <polygon points="145,12 159,15 145,18" fill="#6366F1" opacity="0.8" />
      <polygon points="145,20 159,23 145,26" fill="#fff" opacity="0.8" />
      <polygon points="145,28 159,31 145,34" fill="#DC2626" opacity="0.8" />

      {/* === Display cars in front lot (organized grid) === */}
      {/* Row 1 */}
      <Car x={30} y={90} color="#f5f5f4" rot={90} />
      <Car x={60} y={90} color="#1e40af" rot={90} />
      <Car x={90} y={90} color="#dc2626" rot={90} />
      <Car x={120} y={90} color="#171717" rot={90} />
      {/* Row 2 */}
      <Car x={30} y={115} color="#6366F1" rot={90} />
      <Car x={60} y={115} color="#a3a3a3" rot={90} />
      <Car x={90} y={115} color="#f59e0b" rot={90} />
      <Car x={120} y={115} color="#f5f5f4" rot={90} />

      {/* Price tag stickers on display cars */}
      <rect x="24" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="54" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="84" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />
      <rect x="114" y="82" width="12" height="4" rx="1" fill="#fde68a" opacity="0.7" />

      {/* Parked cars in bottom lot (customer) */}
      <Car x={40} y={172} color="#64748b" rot={90} />
      <Car x={108} y={172} color="#854d0e" rot={90} />

      {/* Landscaping */}
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
      {/* Grass base */}
      <rect width="200" height="200" fill="#1a2a1a" />

      {/* Grass texture */}
      <defs>
        <pattern id="grass" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.5" fill="#22542a" />
          <circle cx="6" cy="6" r="0.4" fill="#1e3d22" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#grass)" opacity="0.4" />

      {/* === Fence around property (dashed) === */}
      <rect x="10" y="10" width="180" height="180" rx="2" fill="none"
        stroke="#78716C" strokeWidth="1.5" strokeDasharray="6,3" />
      {/* Fence posts */}
      {[10, 55, 100, 145, 190].map(x => (
        <rect key={`ft-${x}`} x={x - 1.5} y="8" width="3" height="5" rx="0.5" fill="#a8a29e" />
      ))}
      {[10, 55, 100, 145, 190].map(x => (
        <rect key={`fb-${x}`} x={x - 1.5} y="187" width="3" height="5" rx="0.5" fill="#a8a29e" />
      ))}

      {/* Gate opening at bottom */}
      <rect x="85" y="188" width="30" height="4" fill="#1a2a1a" />

      {/* === Driveway === */}
      <rect x="88" y="150" width="24" height="42" rx="1" fill="#44403c" />

      {/* === Building shadow === */}
      <rect x="34" y="44" width="110" height="72" rx="3" fill="#000" opacity="0.2" />

      {/* === House body === */}
      <rect x="30" y="40" width="110" height="72" rx="3" fill="#d97706" />

      {/* Pitched roof (shown as triangle top) === */}
      <polygon points="25,40 85,10 145,40" fill="#F59E0B" />
      <polygon points="30,40 85,14 140,40" fill="#fbbf24" opacity="0.3" />
      {/* Ridge line */}
      <line x1="85" y1="12" x2="85" y2="40" stroke="#b45309" strokeWidth="1" opacity="0.5" />

      {/* Front porch */}
      <rect x="55" y="95" width="60" height="18" rx="2" fill="#92400E" opacity="0.6" />
      <rect x="57" y="95" width="56" height="2" fill="#78350f" />
      {/* Porch posts */}
      <rect x="57" y="95" width="3" height="18" fill="#a16207" />
      <rect x="110" y="95" width="3" height="18" fill="#a16207" />

      {/* Windows */}
      <rect x="36" y="52" width="16" height="14" rx="2" fill="#fef3c7" opacity="0.35" />
      <rect x="43.5" y="52" width="1" height="14" fill="#b45309" opacity="0.5" />
      <rect x="36" y="58.5" width="16" height="1" fill="#b45309" opacity="0.5" />

      <rect x="118" y="52" width="16" height="14" rx="2" fill="#fef3c7" opacity="0.35" />
      <rect x="125.5" y="52" width="1" height="14" fill="#b45309" opacity="0.5" />
      <rect x="118" y="58.5" width="16" height="1" fill="#b45309" opacity="0.5" />

      {/* Side windows */}
      <rect x="36" y="75" width="14" height="12" rx="2" fill="#fef3c7" opacity="0.3" />
      <rect x="120" y="75" width="14" height="12" rx="2" fill="#fef3c7" opacity="0.3" />

      {/* Front door */}
      <rect x="76" y="68" width="18" height="28" rx="2" fill="#78350f" />
      <rect x="78" y="70" width="14" height="12" rx="1" fill="#fef3c7" opacity="0.2" />
      <circle cx="90" cy="86" r="1.5" fill="#fbbf24" />

      {/* === Mailbox === */}
      <rect x="78" y="136" width="6" height="10" rx="0.5" fill="#78716C" />
      <rect x="75" y="132" width="12" height="6" rx="1" fill="#57534e" />
      <rect x="87" y="133" width="3" height="3" rx="0.5" fill="#dc2626" />

      {/* === Yard bushes === */}
      <circle cx="25" cy="85" r="7" fill="#166534" opacity="0.6" />
      <circle cx="25" cy="85" r="4.5" fill="#22c55e" opacity="0.4" />
      <circle cx="150" cy="70" r="6" fill="#166534" opacity="0.6" />
      <circle cx="150" cy="70" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="155" cy="90" r="5" fill="#166534" opacity="0.6" />
      <circle cx="155" cy="90" r="3" fill="#22c55e" opacity="0.4" />

      {/* Small flower bed */}
      <circle cx="45" cy="118" r="3" fill="#166534" opacity="0.5" />
      <circle cx="51" cy="116" r="2.5" fill="#166534" opacity="0.5" />
      <circle cx="48" cy="114" r="1.5" fill="#f472b6" opacity="0.6" />
      <circle cx="44" cy="116" r="1" fill="#fbbf24" opacity="0.6" />

      {/* Parked car in driveway */}
      <Car x={100} y={162} color="#64748b" rot={90} />
    </svg>
  );
}

// ─── Motel ────────────────────────────────────────────────────────────────────

function Motel({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      {/* === L-shaped building shadow === */}
      <rect x="22" y="22" width="130" height="35" rx="3" fill="#000" opacity="0.25" />
      <rect x="22" y="22" width="35" height="100" rx="3" fill="#000" opacity="0.25" />

      {/* === L-shaped building body — horizontal wing === */}
      <rect x="18" y="18" width="130" height="35" rx="3" fill="#92400E" />
      {/* Roof accent stripe */}
      <rect x="18" y="18" width="130" height="10" rx="3" fill="#B45309" />
      <rect x="18" y="26" width="130" height="2" fill="#78350f" />

      {/* === L-shaped building body — vertical wing === */}
      <rect x="18" y="18" width="35" height="100" rx="3" fill="#92400E" />
      <rect x="18" y="18" width="35" height="10" rx="3" fill="#B45309" />

      {/* === Room doors (horizontal wing) — numbered === */}
      {[60, 80, 100, 120].map((x, i) => (
        <g key={`hr-${x}`}>
          <rect x={x} y="35" width="12" height="16" rx="1" fill="#78350f" />
          <text x={x + 6} y="46" textAnchor="middle" fontSize="5" fill="#fde68a" fontFamily="sans-serif">{i + 1}</text>
          <circle cx={x + 10} cy="43" r="0.8" fill="#fbbf24" />
          {/* Small window above door */}
          <rect x={x + 1} y="30" width="10" height="4" rx="1" fill="#fef3c7" opacity="0.25" />
        </g>
      ))}

      {/* === Room doors (vertical wing) — numbered === */}
      {[35, 55, 75, 95].map((y, i) => (
        <g key={`vr-${y}`}>
          <rect x="38" y={y} width="13" height="14" rx="1" fill="#78350f" />
          <text x="44" y={y + 10} textAnchor="middle" fontSize="5" fill="#fde68a" fontFamily="sans-serif">{i + 5}</text>
          <circle cx="48" cy={y + 7} r="0.8" fill="#fbbf24" />
          {/* Small window */}
          <rect x="28" y={y + 2} width="8" height="5" rx="1" fill="#fef3c7" opacity="0.25" />
        </g>
      ))}

      {/* === "MOTEL" neon sign on pole === */}
      <line x1="160" y1="10" x2="160" y2="42" stroke="#6B7280" strokeWidth="2.5" />
      <rect x="148" y="10" width="24" height="14" rx="2" fill="#1c1917" />
      <rect x="149" y="11" width="22" height="12" rx="1.5" fill="#dc2626" opacity="0.8" />
      <text x="160" y="20" textAnchor="middle" fontSize="7" fill="#fef2f2" fontWeight="bold" fontFamily="sans-serif">MOTEL</text>
      {/* Neon glow */}
      <rect x="147" y="9" width="26" height="16" rx="3" fill="#dc2626" opacity="0.15" />

      {/* === Pool (cyan oval) in courtyard === */}
      <ellipse cx="95" cy="80" rx="28" ry="18" fill="#0e7490" opacity="0.8" />
      <ellipse cx="95" cy="80" rx="25" ry="15" fill="#22d3ee" opacity="0.5" />
      <ellipse cx="90" cy="76" rx="10" ry="5" fill="#67e8f9" opacity="0.3" />
      {/* Pool border */}
      <ellipse cx="95" cy="80" rx="30" ry="20" fill="none" stroke="#a8a29e" strokeWidth="2" />

      {/* Pool ladder */}
      <rect x="120" y="76" width="6" height="2" rx="0.5" fill="#9ca3af" />
      <rect x="121" y="74" width="1.5" height="6" fill="#9ca3af" />
      <rect x="124" y="74" width="1.5" height="6" fill="#9ca3af" />

      {/* === Ice machine === */}
      <rect x="140" y="38" width="10" height="12" rx="1" fill="#d1d5db" />
      <rect x="141" y="39" width="8" height="5" rx="0.5" fill="#9ca3af" />
      <rect x="143" y="46" width="4" height="3" rx="1" fill="#6B7280" />

      {/* === Vending machine === */}
      <rect x="140" y="55" width="10" height="14" rx="1" fill="#1e40af" />
      <rect x="141" y="56" width="8" height="7" rx="0.5" fill="#3b82f6" opacity="0.4" />
      {/* Product rows */}
      <rect x="142" y="57" width="2" height="2" rx="0.3" fill="#dc2626" opacity="0.7" />
      <rect x="145" y="57" width="2" height="2" rx="0.3" fill="#22c55e" opacity="0.7" />
      <rect x="142" y="60" width="2" height="2" rx="0.3" fill="#f59e0b" opacity="0.7" />
      <rect x="145" y="60" width="2" height="2" rx="0.3" fill="#f5f5f4" opacity="0.7" />
      {/* Coin slot */}
      <rect x="144" y="65" width="3" height="2" rx="0.5" fill="#1e293b" />

      {/* === Parking spots in front of rooms === */}
      {/* Horizontal wing parking */}
      {[62, 82, 102, 122].map(x => (
        <rect key={`ps-${x}`} x={x} y="55" width="1" height="18" fill="#666" rx="0.3" />
      ))}
      {/* Cars parked in front of rooms */}
      <Car x={72} y={64} color="#64748b" rot={90} />
      <Car x={112} y={64} color="#dc2626" rot={90} />

      {/* Vertical wing parking */}
      {[38, 58, 78, 98].map(y => (
        <rect key={`vps-${y}`} x="54" y={y} width="16" height="1" fill="#666" rx="0.3" />
      ))}
      <Car x={62} y={48} color="#f5f5f4" rot={0} />

      {/* Parked cars in bottom lot */}
      <Car x={40} y={172} color="#a3a3a3" rot={90} />
      <Car x={108} y={172} color="#facc15" rot={90} />
      <Car x={143} y={172} color="#1e40af" rot={90} />

      {/* Landscaping */}
      <circle cx="14" cy="18" r="4" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="160" cy="80" r="5" fill="#166534" opacity="0.6" />
      <circle cx="160" cy="80" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Barbershop ──────────────────────────────────────────────────────────────

function Barbershop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        {/* Shadow */}
        <rect x={24} y={14} width={120} height={90} rx={3} fill="#000" opacity={0.18} />
        {/* Building body */}
        <rect x={20} y={10} width={120} height={90} rx={3} fill="#fce7f3" stroke="#EC4899" strokeWidth={2} />
        {/* Roof accent */}
        <rect x={20} y={10} width={120} height={14} rx={3} fill="#EC4899" />
        <rect x={20} y={20} width={120} height={4} fill="#fce7f3" />
        {/* Barber stripes on roof */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={`rs${i}`} x={20 + i * 20} y={10} width={10} height={14} fill={i % 2 === 0 ? "#fff" : "#EC4899"} opacity={0.5} />
        ))}
        {/* Front window (large) */}
        <rect x={45} y={38} width={55} height={30} rx={2} fill="#bae6fd" opacity={0.5} stroke="#0ea5e9" strokeWidth={1} />
        {/* Barber chairs inside (circles) */}
        <circle cx={58} cy={53} r={6} fill="#9f1239" opacity={0.6} />
        <circle cx={75} cy={53} r={6} fill="#9f1239" opacity={0.6} />
        <circle cx={92} cy={53} r={6} fill="#9f1239" opacity={0.6} />
        {/* Chair bases */}
        <rect x={55} y={59} width={6} height={3} fill="#6b7280" />
        <rect x={72} y={59} width={6} height={3} fill="#6b7280" />
        <rect x={89} y={59} width={6} height={3} fill="#6b7280" />
        {/* Door */}
        <rect x={110} y={48} width={18} height={32} rx={2} fill="#9f1239" stroke="#831843" strokeWidth={1} />
        <circle cx={114} cy={64} r={2} fill="#fbbf24" />
        {/* Barber pole by entrance */}
        <rect x={132} y={42} width={8} height={38} rx={2} fill="#fff" stroke="#374151" strokeWidth={1} />
        <rect x={132} y={44} width={8} height={5} fill="#dc2626" opacity={0.8} />
        <rect x={132} y={52} width={8} height={5} fill="#2563eb" opacity={0.8} />
        <rect x={132} y={60} width={8} height={5} fill="#dc2626" opacity={0.8} />
        <rect x={132} y={68} width={8} height={5} fill="#2563eb" opacity={0.8} />
        <circle cx={136} cy={42} r={4} fill="#e5e7eb" stroke="#374151" strokeWidth={1} />
        <circle cx={136} cy={80} r={4} fill="#e5e7eb" stroke="#374151" strokeWidth={1} />
        {/* "SLICK CUTS" sign */}
        <rect x={40} y={26} width={70} height={12} rx={2} fill="#9f1239" />
        <text x={75} y={35} textAnchor="middle" fontFamily="sans-serif" fontSize={8} fontWeight="bold" fill="#fff">SLICK CUTS</text>
        {/* Waiting bench outside */}
        <rect x={25} y={85} width={24} height={6} rx={1} fill="#92400e" />
        <rect x={25} y={91} width={3} height={4} fill="#78350f" />
        <rect x={46} y={91} width={3} height={4} fill="#78350f" />
        {/* Magazine rack */}
        <rect x={55} y={86} width={10} height={8} rx={1} fill="#d4d4d8" stroke="#a1a1aa" strokeWidth={1} />
        <rect x={56} y={87} width={3} height={6} fill="#ec4899" opacity={0.5} />
        <rect x={60} y={87} width={3} height={6} fill="#3b82f6" opacity={0.5} />
        {/* Bushes */}
        <circle cx={22} cy={105} r={7} fill="#166534" opacity={0.6} />
        <circle cx={22} cy={105} r={4} fill="#22c55e" opacity={0.4} />
        <circle cx={140} cy={105} r={7} fill="#166534" opacity={0.6} />
        <circle cx={140} cy={105} r={4} fill="#22c55e" opacity={0.4} />
        {/* Parking lot */}
        <rect x={20} y={130} width={160} height={60} rx={3} fill="#4b5563" />
        {/* Parking lines */}
        <line x1={55} y1={130} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={90} y1={130} x2={90} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={125} y1={130} x2={125} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={160} y1={130} x2={160} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        {/* Cars */}
        <Car x={37} y={150} color="#ef4444" rot={90} />
        <Car x={107} y={155} color="#1e40af" rot={90} />
        <Car x={142} y={148} color="#fbbf24" rot={90} />
        {/* Sidewalk */}
        <rect x={20} y={118} width={160} height={12} fill="#d6d3d1" />
    </svg>
  );
}

// ─── Laundromat ──────────────────────────────────────────────────────────────

function Laundromat({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        {/* Shadow */}
        <rect x={24} y={14} width={130} height={85} rx={3} fill="#000" opacity={0.18} />
        {/* Building body */}
        <rect x={20} y={10} width={130} height={85} rx={3} fill="#f0f9ff" stroke="#38BDF8" strokeWidth={2} />
        {/* Roof accent */}
        <rect x={20} y={10} width={130} height={12} rx={3} fill="#38BDF8" />
        {/* "SPIN CYCLE" sign */}
        <rect x={38} y={24} width={80} height={12} rx={2} fill="#0284c7" />
        <text x={78} y={33} textAnchor="middle" fontFamily="sans-serif" fontSize={8} fontWeight="bold" fill="#fff">SPIN CYCLE</text>
        {/* Front windows showing washing machines */}
        <rect x={28} y={40} width={110} height={28} rx={2} fill="#bae6fd" opacity={0.45} stroke="#0ea5e9" strokeWidth={1} />
        {/* Washing machines (circles inside window) */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`wm${i}`}>
            <circle cx={42 + i * 22} cy={54} r={9} fill="#e0f2fe" stroke="#38BDF8" strokeWidth={2} />
            <circle cx={42 + i * 22} cy={54} r={5} fill="#bae6fd" opacity={0.6} />
            <circle cx={42 + i * 22} cy={54} r={2} fill="#0ea5e9" opacity={0.4} />
          </g>
        ))}
        {/* Folding tables inside (above machines) */}
        <rect x={30} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
        <rect x={60} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
        <rect x={90} y={70} width={25} height={4} rx={1} fill="#94a3b8" opacity={0.5} />
        {/* Door */}
        <rect x={120} y={52} width={18} height={30} rx={2} fill="#0284c7" stroke="#075985" strokeWidth={1} />
        <circle cx={124} cy={67} r={2} fill="#fbbf24" />
        {/* Dryer vent on roof */}
        <rect x={100} y={4} width={12} height={8} rx={1} fill="#9ca3af" stroke="#6b7280" strokeWidth={1} />
        <circle cx={106} cy={4} r={3} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} />
        {/* Rolling laundry cart near entrance */}
        <rect x={142} y={68} width={16} height={12} rx={2} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
        <circle cx={145} cy={82} r={2} fill="#6b7280" />
        <circle cx={155} cy={82} r={2} fill="#6b7280" />
        {/* Fabric peeking out of cart */}
        <rect x={144} y={66} width={5} height={4} rx={1} fill="#38BDF8" opacity={0.6} />
        <rect x={150} y={65} width={5} height={4} rx={1} fill="#f472b6" opacity={0.6} />
        {/* Bushes */}
        <circle cx={20} cy={102} r={7} fill="#166534" opacity={0.6} />
        <circle cx={20} cy={102} r={4} fill="#22c55e" opacity={0.4} />
        <circle cx={155} cy={102} r={7} fill="#166534" opacity={0.6} />
        <circle cx={155} cy={102} r={4} fill="#22c55e" opacity={0.4} />
        {/* Sidewalk */}
        <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
        {/* Parking lot */}
        <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
        {/* Parking lines */}
        <line x1={55} y1={127} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={95} y1={127} x2={95} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={135} y1={127} x2={135} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        {/* Cars */}
        <Car x={35} y={148} color="#a855f7" rot={90} />
        <Car x={115} y={150} color="#f97316" rot={90} />
    </svg>
  );
}

// ─── Gym ─────────────────────────────────────────────────────────────────────

function GymSprite({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        {/* Shadow */}
        <rect x={24} y={14} width={135} height={90} rx={3} fill="#000" opacity={0.18} />
        {/* Building body */}
        <rect x={20} y={10} width={135} height={90} rx={3} fill="#292524" stroke="#F97316" strokeWidth={2} />
        {/* Roof accent */}
        <rect x={20} y={10} width={135} height={14} rx={3} fill="#F97316" />
        {/* "IRON DESERT" sign */}
        <rect x={35} y={26} width={90} height={14} rx={2} fill="#1c1917" stroke="#F97316" strokeWidth={1} />
        <text x={80} y={36} textAnchor="middle" fontFamily="sans-serif" fontSize={9} fontWeight="bold" fill="#F97316">IRON DESERT</text>
        {/* Mirrored front windows */}
        <rect x={28} y={44} width={40} height={24} rx={2} fill="#7dd3fc" opacity={0.3} stroke="#38bdf8" strokeWidth={1} />
        <rect x={74} y={44} width={40} height={24} rx={2} fill="#7dd3fc" opacity={0.3} stroke="#38bdf8" strokeWidth={1} />
        {/* Weight equipment visible — barbells */}
        {/* Barbell 1 */}
        <circle cx={36} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
        <line x1={40} y1={54} x2={56} y2={54} stroke="#a8a29e" strokeWidth={2} />
        <circle cx={60} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
        {/* Barbell 2 */}
        <circle cx={82} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
        <line x1={86} y1={54} x2={102} y2={54} stroke="#a8a29e" strokeWidth={2} />
        <circle cx={106} cy={54} r={4} fill="#a8a29e" opacity={0.7} />
        {/* Dumbbell rack (small) */}
        <rect x={34} y={60} width={28} height={3} rx={1} fill="#78716c" opacity={0.5} />
        <rect x={82} y={60} width={28} height={3} rx={1} fill="#78716c" opacity={0.5} />
        {/* Punching bag area (right side) */}
        <rect x={120} y={44} width={28} height={30} rx={2} fill="#1c1917" stroke="#57534e" strokeWidth={1} />
        <line x1={130} y1={44} x2={130} y2={50} stroke="#a8a29e" strokeWidth={1} />
        <ellipse cx={130} cy={58} rx={5} ry={8} fill="#dc2626" opacity={0.7} />
        <line x1={142} y1={44} x2={142} y2={50} stroke="#a8a29e" strokeWidth={1} />
        <ellipse cx={142} cy={58} rx={5} ry={8} fill="#dc2626" opacity={0.7} />
        {/* Door */}
        <rect x={28} y={72} width={18} height={22} rx={2} fill="#F97316" stroke="#c2410c" strokeWidth={1} />
        <circle cx={42} cy={83} r={2} fill="#fbbf24" />
        {/* Outdoor bench */}
        <rect x={52} y={88} width={22} height={5} rx={1} fill="#78716c" />
        <rect x={53} y={93} width={3} height={4} fill="#57534e" />
        <rect x={70} y={93} width={3} height={4} fill="#57534e" />
        {/* Bushes */}
        <circle cx={160} cy={98} r={7} fill="#166534" opacity={0.6} />
        <circle cx={160} cy={98} r={4} fill="#22c55e" opacity={0.4} />
        <circle cx={18} cy={108} r={6} fill="#166534" opacity={0.6} />
        <circle cx={18} cy={108} r={3.5} fill="#22c55e" opacity={0.4} />
        {/* Sidewalk */}
        <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
        {/* Parking lot */}
        <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
        {/* Parking lines */}
        <line x1={50} y1={127} x2={50} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={85} y1={127} x2={85} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={120} y1={127} x2={120} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={155} y1={127} x2={155} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        {/* Cars */}
        <Car x={32} y={150} color="#000" rot={90} />
        <Car x={102} y={148} color="#dc2626" rot={90} />
        <Car x={137} y={152} color="#e5e7eb" rot={90} />
    </svg>
  );
}

// ─── Tattoo Parlor ───────────────────────────────────────────────────────────

function TattooParlor({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        {/* Shadow */}
        <rect x={24} y={14} width={130} height={88} rx={3} fill="#000" opacity={0.18} />
        {/* Building body */}
        <rect x={20} y={10} width={130} height={88} rx={3} fill="#1e1b4b" stroke="#7C3AED" strokeWidth={2} />
        {/* Roof accent */}
        <rect x={20} y={10} width={130} height={12} rx={3} fill="#7C3AED" />
        {/* "DESERT INK" neon sign */}
        <rect x={35} y={24} width={85} height={14} rx={2} fill="#0f0a1e" />
        <text x={77} y={35} textAnchor="middle" fontFamily="sans-serif" fontSize={10} fontWeight="bold" fill="#c084fc" style={{ filter: "drop-shadow(0 0 3px #a855f7)" }}>DESERT INK</text>
        {/* Blacked-out windows */}
        <rect x={28} y={42} width={35} height={22} rx={2} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
        <rect x={68} y={42} width={35} height={22} rx={2} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
        {/* Neon "OPEN" sign in left window */}
        <rect x={32} y={47} width={26} height={10} rx={1} fill="#0f0a1e" />
        <text x={45} y={55} textAnchor="middle" fontFamily="sans-serif" fontSize={7} fontWeight="bold" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 2px #22d3ee)" }}>OPEN</text>
        {/* Tattoo flash art on walls (small colored rects) */}
        <rect x={72} y={45} width={6} height={7} rx={1} fill="#ef4444" opacity={0.7} />
        <rect x={80} y={45} width={6} height={7} rx={1} fill="#22c55e" opacity={0.7} />
        <rect x={88} y={45} width={6} height={7} rx={1} fill="#eab308" opacity={0.7} />
        <rect x={72} y={54} width={6} height={7} rx={1} fill="#3b82f6" opacity={0.7} />
        <rect x={80} y={54} width={6} height={7} rx={1} fill="#ec4899" opacity={0.7} />
        <rect x={88} y={54} width={6} height={7} rx={1} fill="#f97316" opacity={0.7} />
        {/* Door */}
        <rect x={110} y={50} width={18} height={30} rx={2} fill="#4c1d95" stroke="#3b0764" strokeWidth={1} />
        <circle cx={114} cy={65} r={2} fill="#c084fc" />
        {/* Side window (small) */}
        <rect x={132} y={46} width={12} height={16} rx={1} fill="#0f172a" stroke="#4c1d95" strokeWidth={1} />
        {/* Neon trim around door */}
        <rect x={108} y={48} width={22} height={2} fill="#c084fc" opacity={0.5} />
        <rect x={108} y={80} width={22} height={2} fill="#c084fc" opacity={0.5} />
        {/* Motorcycle parked outside */}
        <g transform="translate(148, 80)">
          <ellipse cx={0} cy={8} rx={6} ry={3} fill="#1c1917" />
          <rect x={-8} y={2} width={16} height={6} rx={2} fill="#292524" />
          <circle cx={-7} cy={8} r={4} fill="#374151" stroke="#1f2937" strokeWidth={1} />
          <circle cx={7} cy={8} r={4} fill="#374151" stroke="#1f2937" strokeWidth={1} />
          <rect x={-3} y={0} width={6} height={4} rx={1} fill="#7C3AED" />
          <rect x={8} y={3} width={6} height={2} rx={1} fill="#a8a29e" />
        </g>
        {/* Bushes */}
        <circle cx={18} cy={104} r={6} fill="#166534" opacity={0.6} />
        <circle cx={18} cy={104} r={3.5} fill="#22c55e" opacity={0.4} />
        {/* Sidewalk */}
        <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
        {/* Parking lot */}
        <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
        {/* Parking lines */}
        <line x1={55} y1={127} x2={55} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={95} y1={127} x2={95} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={135} y1={127} x2={135} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        {/* Cars */}
        <Car x={35} y={150} color="#1e1b4b" rot={90} />
        <Car x={115} y={148} color="#374151" rot={90} />
    </svg>
  );
}

// ─── Bar ─────────────────────────────────────────────────────────────────────

function BarSprite({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        {/* Shadow */}
        <rect x={24} y={14} width={135} height={92} rx={3} fill="#000" opacity={0.18} />
        {/* Building body (brick look) */}
        <rect x={20} y={10} width={135} height={92} rx={3} fill="#7f1d1d" stroke="#B91C1C" strokeWidth={2} />
        {/* Brick pattern lines */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`bk${i}`} x1={20} y1={24 + i * 12} x2={155} y2={24 + i * 12} stroke="#991b1b" strokeWidth={0.5} opacity={0.4} />
        ))}
        {/* Roof accent */}
        <rect x={20} y={10} width={135} height={12} rx={3} fill="#B91C1C" />
        {/* "CACTUS BAR" sign */}
        <rect x={30} y={24} width={100} height={16} rx={2} fill="#1c1917" stroke="#B91C1C" strokeWidth={1} />
        {/* Cactus icon */}
        <rect x={35} y={27} width={3} height={10} rx={1} fill="#22c55e" />
        <rect x={33} y={30} width={3} height={5} rx={1} fill="#22c55e" />
        <rect x={39} y={29} width={3} height={5} rx={1} fill="#22c55e" />
        <text x={82} y={36} textAnchor="middle" fontFamily="sans-serif" fontSize={9} fontWeight="bold" fill="#fbbf24">CACTUS BAR</text>
        {/* Windows with neon beer signs */}
        <rect x={28} y={44} width={30} height={20} rx={2} fill="#1e1b4b" opacity={0.7} stroke="#57534e" strokeWidth={1} />
        <rect x={64} y={44} width={30} height={20} rx={2} fill="#1e1b4b" opacity={0.7} stroke="#57534e" strokeWidth={1} />
        {/* Neon beer sign in left window */}
        <rect x={32} y={48} width={22} height={10} rx={1} fill="#0f0a1e" />
        <text x={43} y={56} textAnchor="middle" fontFamily="sans-serif" fontSize={6} fontWeight="bold" fill="#ef4444" style={{ filter: "drop-shadow(0 0 2px #ef4444)" }}>BEER</text>
        {/* Neon cocktail sign in right window */}
        <rect x={68} y={48} width={22} height={10} rx={1} fill="#0f0a1e" />
        <text x={79} y={56} textAnchor="middle" fontFamily="sans-serif" fontSize={5} fontWeight="bold" fill="#22d3ee" style={{ filter: "drop-shadow(0 0 2px #22d3ee)" }}>DRINKS</text>
        {/* Door */}
        <rect x={100} y={50} width={20} height={32} rx={2} fill="#451a03" stroke="#78350f" strokeWidth={1} />
        <circle cx={116} cy={66} r={2} fill="#fbbf24" />
        {/* Bouncer post by door */}
        <rect x={123} y={60} width={10} height={16} rx={1} fill="#292524" stroke="#57534e" strokeWidth={1} />
        <circle cx={128} cy={58} r={4} fill="#44403c" />
        {/* Back patio area with string lights */}
        <rect x={20} y={85} width={60} height={17} rx={2} fill="#44403c" opacity={0.5} stroke="#57534e" strokeWidth={1} />
        {/* String lights (circles connected by lines) */}
        <line x1={24} y1={87} x2={76} y2={87} stroke="#a8a29e" strokeWidth={0.5} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle key={`sl${i}`} cx={28 + i * 10} cy={87} r={2} fill={i % 2 === 0 ? "#fbbf24" : "#f87171"} opacity={0.8} />
        ))}
        {/* Patio tables */}
        <circle cx={32} cy={95} r={3} fill="#78716c" opacity={0.6} />
        <circle cx={50} cy={95} r={3} fill="#78716c" opacity={0.6} />
        <circle cx={68} cy={95} r={3} fill="#78716c" opacity={0.6} />
        {/* Dumpster in back */}
        <rect x={140} y={84} width={18} height={14} rx={1} fill="#365314" stroke="#3f6212" strokeWidth={1} />
        <rect x={141} y={82} width={16} height={3} rx={1} fill="#4d7c0f" />
        {/* Bushes */}
        <circle cx={165} cy={100} r={7} fill="#166534" opacity={0.6} />
        <circle cx={165} cy={100} r={4} fill="#22c55e" opacity={0.4} />
        {/* Sidewalk */}
        <rect x={15} y={115} width={170} height={12} fill="#d6d3d1" />
        {/* Parking lot */}
        <rect x={15} y={127} width={170} height={63} rx={3} fill="#4b5563" />
        {/* Parking lines */}
        <line x1={50} y1={127} x2={50} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={85} y1={127} x2={85} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={120} y1={127} x2={120} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        <line x1={155} y1={127} x2={155} y2={190} stroke="#d1d5db" strokeWidth={1} strokeDasharray="4,3" />
        {/* Cars */}
        <Car x={32} y={148} color="#78350f" rot={90} />
        <Car x={67} y={152} color="#1e3a5f" rot={90} />
        <Car x={137} y={150} color="#fbbf24" rot={90} />
    </svg>
  );
}

// ─── Nightclub ───────────────────────────────────────────────────────────────

function Nightclub({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Ground / parking lot */}
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />

      {/* Building shadow */}
      <rect x={24} y={54} width={152} height={100} fill="rgba(0,0,0,0.25)" rx={2} />

      {/* Main building - dark exterior */}
      <rect x={20} y={50} width={152} height={100} fill="#1F1F2E" rx={2} />

      {/* Roof accent stripe */}
      <rect x={20} y={50} width={152} height={6} fill="#DB2777" rx={2} />
      <rect x={20} y={53} width={152} height={3} fill="#BE185D" />

      {/* Disco ball on roof */}
      <circle cx={96} cy={42} r={8} fill="#E5E7EB" />
      <circle cx={96} cy={42} r={8} fill="url(#discoBallGrad)" />
      <defs>
        <radialGradient id="discoBallGrad" cx="35%" cy="35%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="50%" stopColor="#D1D5DB" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0.8} />
        </radialGradient>
      </defs>
      {/* Disco ball reflections */}
      <circle cx={92} cy={39} r={1.5} fill="#FFFFFF" opacity={0.9} />
      <circle cx={99} cy={41} r={1} fill="#FFFFFF" opacity={0.7} />
      <circle cx={94} cy={44} r={1} fill="#FFFFFF" opacity={0.6} />
      {/* Disco ball pole */}
      <rect x={95} y={34} width={2} height={4} fill="#6B7280" />

      {/* Neon sign glow background */}
      <rect x={40} y={62} width={112} height={22} rx={4} fill="#DB2777" opacity={0.3} />
      <rect x={40} y={62} width={112} height={22} rx={4} fill="#DB2777" opacity={0.15} stroke="#DB2777" strokeWidth={2} />

      {/* "NEON MIRAGE" sign */}
      <text x={96} y={78} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={12} fill="#F9A8D4" stroke="#DB2777" strokeWidth={0.5}>
        NEON MIRAGE
      </text>

      {/* Blacked-out windows */}
      <rect x={30} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={56} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={118} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />
      <rect x={144} y={90} width={18} height={14} fill="#111827" rx={1} stroke="#DB2777" strokeWidth={1} />

      {/* Door */}
      <rect x={84} y={112} width={24} height={38} fill="#111827" rx={1} />
      <rect x={84} y={112} width={24} height={38} fill="none" stroke="#DB2777" strokeWidth={1.5} rx={1} />
      <circle cx={104} cy={132} r={2} fill="#DB2777" />

      {/* Speaker stacks by door */}
      <rect x={74} y={126} width={8} height={24} fill="#1a1a2e" stroke="#374151" strokeWidth={1} rx={1} />
      <rect x={75} y={128} width={6} height={4} fill="#111" rx={1} />
      <rect x={75} y={134} width={6} height={4} fill="#111" rx={1} />
      <rect x={75} y={140} width={6} height={6} fill="#111" rx={1} />
      <rect x={110} y={126} width={8} height={24} fill="#1a1a2e" stroke="#374151" strokeWidth={1} rx={1} />
      <rect x={111} y={128} width={6} height={4} fill="#111" rx={1} />
      <rect x={111} y={134} width={6} height={4} fill="#111" rx={1} />
      <rect x={111} y={140} width={6} height={6} fill="#111" rx={1} />

      {/* Velvet rope entrance */}
      <rect x={78} y={148} width={3} height={8} fill="#B8860B" rx={1} />
      <circle cx={79.5} cy={147} r={2.5} fill="#DAA520" />
      <rect x={111} y={148} width={3} height={8} fill="#B8860B" rx={1} />
      <circle cx={112.5} cy={147} r={2.5} fill="#DAA520" />
      <line x1={79.5} y1={150} x2={112.5} y2={150} stroke="#DC143C" strokeWidth={2} />

      {/* Parking lot lines */}
      <rect x={5} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={30} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={55} y={163} width={1} height={18} fill="#9CA3AF" />

      {/* VIP parking section */}
      <rect x={130} y={158} width={65} height={38} fill="#2D2D3E" rx={2} />
      <text x={162} y={166} textAnchor="middle" fontFamily="sans-serif" fontSize={6} fill="#DB2777" fontWeight="bold">VIP</text>
      <rect x={135} y={168} width={1} height={14} fill="#DB2777" />
      <rect x={160} y={168} width={1} height={14} fill="#DB2777" />

      {/* Cars - regular */}
      <Car x={12} y={170} color="#EF4444" rot={90} />
      <Car x={37} y={172} color="#3B82F6" rot={90} />

      {/* VIP cars (nicer = different colors) */}
      <Car x={140} y={174} color="#FBBF24" rot={90} />
      <Car x={165} y={173} color="#F8F8F8" rot={90} />

      {/* Bushes */}
      <circle cx={16} cy={152} r={5} fill="#166534" />
      <circle cx={16} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={176} cy={152} r={5} fill="#166534" />
      <circle cx={176} cy={152} r={3.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Pawn Shop ───────────────────────────────────────────────────────────────

function PawnShop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Ground / parking lot */}
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />

      {/* Building shadow */}
      <rect x={19} y={59} width={162} height={95} fill="rgba(0,0,0,0.25)" rx={2} />

      {/* Main building */}
      <rect x={15} y={55} width={162} height={95} fill="#92700C" rx={2} />

      {/* Roof accent stripe */}
      <rect x={15} y={55} width={162} height={7} fill="#CA8A04" rx={2} />
      <rect x={15} y={59} width={162} height={3} fill="#A16207" />

      {/* Sign background */}
      <rect x={35} y={66} width={122} height={20} fill="#1F2937" rx={3} />
      {/* "QUICK CASH" sign */}
      <text x={96} y={80} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={13} fill="#FBBF24">
        QUICK CASH
      </text>

      {/* Triple-ball pawn symbol */}
      <line x1={160} y1={80} x2={153} y2={66} stroke="#CA8A04" strokeWidth={1.5} />
      <line x1={160} y1={80} x2={160} y2={64} stroke="#CA8A04" strokeWidth={1.5} />
      <line x1={160} y1={80} x2={167} y2={66} stroke="#CA8A04" strokeWidth={1.5} />
      <circle cx={153} cy={63} r={4} fill="#FBBF24" />
      <circle cx={160} cy={61} r={4} fill="#FBBF24" />
      <circle cx={167} cy={63} r={4} fill="#FBBF24" />

      {/* Barred windows */}
      <rect x={24} y={92} width={28} height={20} fill="#7DD3FC" opacity={0.3} rx={1} />
      <rect x={24} y={92} width={28} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <line x1={30} y1={92} x2={30} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={36} y1={92} x2={36} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={42} y1={92} x2={42} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={48} y1={92} x2={48} y2={112} stroke="#78716C" strokeWidth={1.2} />

      {/* Window 2 - display window with items */}
      <rect x={58} y={92} width={34} height={20} fill="#FEF3C7" opacity={0.4} rx={1} />
      <rect x={58} y={92} width={34} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <rect x={62} y={101} width={5} height={8} fill="#EF4444" rx={1} />
      <circle cx={73} cy={105} r={3} fill="#FBBF24" />
      <rect x={79} y={100} width={7} height={3} fill="#60A5FA" />
      <rect x={79} y={105} width={6} height={5} fill="#A78BFA" rx={1} />

      {/* Barred window 3 */}
      <rect x={140} y={92} width={28} height={20} fill="#7DD3FC" opacity={0.3} rx={1} />
      <rect x={140} y={92} width={28} height={20} fill="none" stroke="#78716C" strokeWidth={1.5} rx={1} />
      <line x1={146} y1={92} x2={146} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={152} y1={92} x2={152} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={158} y1={92} x2={158} y2={112} stroke="#78716C" strokeWidth={1.2} />
      <line x1={164} y1={92} x2={164} y2={112} stroke="#78716C" strokeWidth={1.2} />

      {/* Heavy door */}
      <rect x={103} y={110} width={26} height={40} fill="#44403C" rx={1} />
      <rect x={103} y={110} width={26} height={40} fill="none" stroke="#292524" strokeWidth={2} rx={1} />
      <circle cx={124} cy={132} r={2.5} fill="#CA8A04" />
      <line x1={103} y1={125} x2={129} y2={125} stroke="#292524" strokeWidth={1} />

      {/* Security camera */}
      <rect x={170} y={70} width={3} height={8} fill="#4B5563" />
      <rect x={166} y={76} width={10} height={5} fill="#1F2937" rx={1} />
      <circle cx={166} cy={78.5} r={2} fill="#EF4444" opacity={0.8} />

      {/* Parking lot lines */}
      <rect x={10} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={35} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={60} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />

      {/* Cars */}
      <Car x={15} y={170} color="#DC2626" rot={90} />
      <Car x={42} y={172} color="#6B7280" rot={90} />
      <Car x={145} y={171} color="#1D4ED8" rot={90} />

      {/* Bushes */}
      <circle cx={12} cy={152} r={5} fill="#166534" />
      <circle cx={12} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={180} cy={152} r={5} fill="#166534" />
      <circle cx={180} cy={152} r={3.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Check Cashing ───────────────────────────────────────────────────────────

function CheckCashing({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Ground / parking lot */}
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />

      {/* Building shadow */}
      <rect x={19} y={54} width={162} height={100} fill="rgba(0,0,0,0.25)" rx={2} />

      {/* Main building - clean white/green */}
      <rect x={15} y={50} width={162} height={100} fill="#F0FDF4" rx={2} />

      {/* Roof accent stripe */}
      <rect x={15} y={50} width={162} height={7} fill="#16A34A" rx={2} />
      <rect x={15} y={54} width={162} height={3} fill="#15803D" />

      {/* Fluorescent lighting glow */}
      <rect x={20} y={60} width={152} height={4} fill="#FFFFFF" opacity={0.6} />
      <rect x={20} y={60} width={152} height={4} fill="none" stroke="#D1FAE5" strokeWidth={1} />

      {/* Sign */}
      <rect x={42} y={68} width={108} height={22} fill="#16A34A" rx={3} />
      <text x={96} y={83} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={14} fill="#FFFFFF">
        EZ MONEY
      </text>

      {/* Dollar sign symbols */}
      <text x={30} y={84} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={16} fill="#16A34A" opacity={0.6}>$</text>
      <text x={162} y={84} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={16} fill="#16A34A" opacity={0.6}>$</text>

      {/* Bulletproof window counter */}
      <rect x={28} y={96} width={50} height={28} fill="#DBEAFE" opacity={0.5} rx={1} />
      <rect x={28} y={96} width={50} height={28} fill="none" stroke="#4B5563" strokeWidth={3} rx={1} />
      <rect x={28} y={118} width={50} height={4} fill="#6B7280" />
      <rect x={42} y={114} width={22} height={3} fill="#1F2937" rx={1} />

      {/* Windows */}
      <rect x={130} y={96} width={22} height={18} fill="#BFDBFE" opacity={0.4} rx={1} />
      <rect x={130} y={96} width={22} height={18} fill="none" stroke="#6B7280" strokeWidth={1} rx={1} />
      <rect x={156} y={96} width={16} height={18} fill="#BFDBFE" opacity={0.4} rx={1} />
      <rect x={156} y={96} width={16} height={18} fill="none" stroke="#6B7280" strokeWidth={1} rx={1} />

      {/* Door */}
      <rect x={88} y={112} width={24} height={38} fill="#1F2937" rx={1} />
      <rect x={88} y={112} width={24} height={3} fill="#16A34A" />
      <circle cx={108} cy={132} r={2} fill="#D1D5DB" />

      {/* ATM machine by entrance */}
      <rect x={116} y={124} width={12} height={26} fill="#374151" rx={1} />
      <rect x={118} y={127} width={8} height={6} fill="#60A5FA" rx={1} />
      <rect x={118} y={135} width={8} height={4} fill="#1F2937" rx={1} />
      <rect x={120} y={141} width={4} height={2} fill="#111827" />

      {/* Security camera */}
      <rect x={20} y={65} width={3} height={7} fill="#4B5563" />
      <rect x={15} y={70} width={10} height={5} fill="#1F2937" rx={1} />
      <circle cx={15} cy={72.5} r={1.5} fill="#EF4444" opacity={0.8} />

      {/* Parking lot lines */}
      <rect x={8} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={33} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={58} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />

      {/* Cars */}
      <Car x={13} y={170} color="#9CA3AF" rot={90} />
      <Car x={40} y={171} color="#16A34A" rot={90} />
      <Car x={145} y={172} color="#FBBF24" rot={90} />

      {/* Bushes */}
      <circle cx={14} cy={152} r={5} fill="#166534" />
      <circle cx={14} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={178} cy={152} r={5} fill="#166534" />
      <circle cx={178} cy={152} r={3.5} fill="#22c55e" />
      <circle cx={82} cy={152} r={4} fill="#166534" />
      <circle cx={82} cy={152} r={2.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Convenience Store ───────────────────────────────────────────────────────

function ConvenienceStore({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Ground / parking lot */}
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />

      {/* Gas pump canopy shadow */}
      <rect x={44} y={158} width={112} height={4} fill="rgba(0,0,0,0.15)" />

      {/* Building shadow */}
      <rect x={14} y={59} width={177} height={95} fill="rgba(0,0,0,0.25)" rx={2} />

      {/* Main building */}
      <rect x={10} y={55} width={177} height={95} fill="#CCFBF1" rx={2} />

      {/* Roof accent stripe */}
      <rect x={10} y={55} width={177} height={7} fill="#0F766E" rx={2} />
      <rect x={10} y={59} width={177} height={3} fill="#115E59" />

      {/* Sign */}
      <rect x={30} y={66} width={132} height={20} fill="#0F766E" rx={3} />
      <text x={96} y={80} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={12} fill="#FFFFFF">
        DESERT MART
      </text>

      {/* Large front windows showing shelves */}
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

      {/* Door */}
      <rect x={110} y={110} width={22} height={40} fill="#1F2937" rx={1} />
      <rect x={110} y={110} width={22} height={3} fill="#0F766E" />
      <circle cx={128} cy={132} r={2} fill="#D1D5DB" />

      {/* Ice cooler outside */}
      <rect x={137} y={130} width={16} height={20} fill="#F0F9FF" stroke="#93C5FD" strokeWidth={1} rx={2} />
      <text x={145} y={143} textAnchor="middle" fontFamily="sans-serif" fontSize={5} fill="#3B82F6">ICE</text>

      {/* Newspaper stand */}
      <rect x={157} y={136} width={10} height={14} fill="#FDE68A" stroke="#CA8A04" strokeWidth={1} rx={1} />
      <rect x={158} y={138} width={8} height={4} fill="#F5F5F4" />

      {/* ATM */}
      <rect x={172} y={124} width={12} height={26} fill="#374151" rx={1} />
      <rect x={174} y={127} width={8} height={6} fill="#60A5FA" rx={1} />
      <rect x={174} y={135} width={8} height={4} fill="#1F2937" rx={1} />
      <rect x={176} y={141} width={4} height={2} fill="#111827" />

      {/* Gas pump canopy */}
      <rect x={40} y={152} width={120} height={3} fill="#0F766E" />
      <rect x={45} y={155} width={2} height={18} fill="#6B7280" />
      <rect x={155} y={155} width={2} height={18} fill="#6B7280" />

      {/* Gas pump island */}
      <rect x={70} y={168} width={60} height={6} fill="#D1D5DB" rx={1} />
      <rect x={78} y={160} width={10} height={14} fill="#EF4444" rx={1} />
      <rect x={80} y={162} width={6} height={4} fill="#1F2937" rx={0.5} />
      <circle cx={83} cy={170} r={2} fill="#111827" />
      <rect x={112} y={160} width={10} height={14} fill="#EF4444" rx={1} />
      <rect x={114} y={162} width={6} height={4} fill="#1F2937" rx={0.5} />
      <circle cx={117} cy={170} r={2} fill="#111827" />

      {/* Parking */}
      <rect x={5} y={180} width={1} height={16} fill="#9CA3AF" />
      <rect x={30} y={180} width={1} height={16} fill="#9CA3AF" />
      <rect x={170} y={180} width={1} height={16} fill="#9CA3AF" />

      {/* Cars */}
      <Car x={10} y={185} color="#0EA5E9" rot={90} />
      <Car x={175} y={186} color="#F97316" rot={90} />

      {/* Bushes */}
      <circle cx={8} cy={152} r={4} fill="#166534" />
      <circle cx={8} cy={152} r={2.5} fill="#22c55e" />
      <circle cx={190} cy={152} r={4} fill="#166534" />
      <circle cx={190} cy={152} r={2.5} fill="#22c55e" />
    </svg>
  );
}

// ─── Smoke Shop ──────────────────────────────────────────────────────────────

function SmokeShop({ w, h }: SpriteProps) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      {/* Ground / parking lot */}
      <rect x={0} y={150} width={200} height={50} fill="#374151" />
      <rect x={0} y={150} width={200} height={1} fill="#4B5563" />

      {/* Building shadow */}
      <rect x={34} y={64} width={132} height={90} fill="rgba(0,0,0,0.25)" rx={2} />

      {/* Main building - dark purple */}
      <rect x={30} y={60} width={132} height={90} fill="#2E1065" rx={2} />

      {/* Roof accent stripe */}
      <rect x={30} y={60} width={132} height={7} fill="#7C3AED" rx={2} />
      <rect x={30} y={64} width={132} height={3} fill="#6D28D9" />

      {/* Smoky haze effect */}
      <ellipse cx={96} cy={52} rx={40} ry={8} fill="#7C3AED" opacity={0.1} />
      <ellipse cx={86} cy={48} rx={28} ry={6} fill="#A78BFA" opacity={0.08} />
      <ellipse cx={106} cy={45} rx={22} ry={5} fill="#C4B5FD" opacity={0.06} />
      <ellipse cx={96} cy={56} rx={50} ry={6} fill="#7C3AED" opacity={0.07} />

      {/* "CLOUD 9" sign */}
      <rect x={50} y={72} width={92} height={20} fill="#1F2937" rx={3} />
      <rect x={50} y={72} width={92} height={20} fill="none" stroke="#7C3AED" strokeWidth={1.5} rx={3} />
      <text x={96} y={86} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={13} fill="#C4B5FD">
        CLOUD 9
      </text>

      {/* Window with display cases */}
      <rect x={40} y={98} width={44} height={24} fill="#1E1B4B" opacity={0.7} rx={1} />
      <rect x={40} y={98} width={44} height={24} fill="none" stroke="#7C3AED" strokeWidth={1} rx={1} />
      <rect x={44} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={57} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={70} y={102} width={10} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={44} y={112} width={14} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={62} y={112} width={14} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />

      {/* Neon "OPEN" sign */}
      <rect x={44} y={125} width={28} height={10} fill="#111827" rx={2} />
      <text x={58} y={133} textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize={7} fill="#22C55E">
        OPEN
      </text>
      <rect x={44} y={125} width={28} height={10} fill="none" stroke="#22C55E" strokeWidth={1} rx={2} opacity={0.6} />

      {/* Second window */}
      <rect x={108} y={98} width={44} height={24} fill="#1E1B4B" opacity={0.7} rx={1} />
      <rect x={108} y={98} width={44} height={24} fill="none" stroke="#7C3AED" strokeWidth={1} rx={1} />
      <rect x={112} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={124} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />
      <rect x={136} y={102} width={8} height={6} fill="#4C1D95" stroke="#7C3AED" strokeWidth={0.5} rx={0.5} />

      {/* Door */}
      <rect x={88} y={114} width={20} height={36} fill="#111827" rx={1} />
      <rect x={88} y={114} width={20} height={3} fill="#7C3AED" />
      <circle cx={104} cy={134} r={2} fill="#A78BFA" />

      {/* Parking lot lines */}
      <rect x={10} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={35} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={60} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={140} y={163} width={1} height={18} fill="#9CA3AF" />
      <rect x={165} y={163} width={1} height={18} fill="#9CA3AF" />

      {/* Cars */}
      <Car x={15} y={170} color="#7C3AED" rot={90} />
      <Car x={42} y={172} color="#6B7280" rot={90} />
      <Car x={145} y={171} color="#F59E0B" rot={90} />

      {/* Bushes - fewer for smoke shop */}
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

// ─── Packaging Factory ────────────────────────────────────────────────────────

function PackagingFactory({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="14" y="14" width="135" height="85" rx="3" fill="#000" opacity="0.25" />
      <rect x="10" y="10" width="135" height="85" rx="3" fill="#78350f" />
      <rect x="10" y="10" width="135" height="16" rx="3" fill="#92400E" />
      <rect x="10" y="23" width="135" height="3" fill="#713f12" />
      <rect x="42" y="12" width="52" height="12" rx="2" fill="#fef3c7" opacity="0.9" />
      <text x="68" y="22" textAnchor="middle" fontSize="9" fill="#78350f" fontWeight="bold" fontFamily="sans-serif">BOXCO</text>
      {[18, 52, 86].map(x => (
        <g key={`bay-${x}`}>
          <rect x={x} y="68" width="26" height="20" rx="2" fill="#0f172a" />
          <rect x={x + 2} y="70" width="22" height="16" rx="1" fill="#451a03" opacity="0.3" />
          <rect x={x} y="68" width="3" height="20" rx="1" fill="#fbbf24" />
          <rect x={x + 23} y="68" width="3" height="20" rx="1" fill="#fbbf24" />
        </g>
      ))}
      {[18, 42, 66, 90, 114].map(x => (
        <rect key={`w-${x}`} x={x} y="32" width="14" height="10" rx="1" fill="#fde68a" opacity="0.2" />
      ))}
      {[0, 8, 16, 24, 32, 40, 48].map(i => (
        <circle key={`cv-${i}`} cx={120 + (i % 4) * 2} cy={100 + i * 2} r="1.5" fill="#92400E" opacity="0.5" />
      ))}
      {[120, 132, 144].map(x =>
        [50, 60, 70].map(y => (
          <rect key={`bx-${x}-${y}`} x={x} y={y} width="8" height="7" rx="1" fill="#b45309" opacity="0.7" />
        ))
      )}
      <rect x="155" y="15" width="32" height="12" rx="2" fill="#dc2626" opacity="0.8" />
      <rect x="155" y="32" width="32" height="12" rx="2" fill="#2563EB" opacity="0.8" />
      <rect x="155" y="49" width="32" height="12" rx="2" fill="#16A34A" opacity="0.8" />
      <rect x="155" y="66" width="32" height="12" rx="2" fill="#fbbf24" opacity="0.8" />
      <rect x="120" y="100" width="14" height="10" rx="2" fill="#fbbf24" />
      <rect x="134" y="102" width="8" height="6" rx="1" fill="#fbbf24" opacity="0.7" />
      <circle cx="123" cy="112" r="2" fill="#374151" />
      <circle cx="131" cy="112" r="2" fill="#374151" />
      <Car x={40} y={172} color="#78350f" rot={90} />
      <Car x={75} y={172} color="#f5f5f4" rot={90} />
      <Car x={108} y={172} color="#64748b" rot={90} />
    </ParkingLot>
  );
}

// ─── Textile Mill ─────────────────────────────────────────────────────────────

function TextileMill({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="14" y="14" width="135" height="85" rx="3" fill="#000" opacity="0.25" />
      <rect x="10" y="10" width="135" height="85" rx="3" fill="#4c1d95" />
      <rect x="10" y="10" width="135" height="16" rx="3" fill="#7C3AED" />
      <rect x="10" y="23" width="135" height="3" fill="#6d28d9" />
      <rect x="25" y="12" width="90" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="70" y="22" textAnchor="middle" fontSize="7" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">DESERT THREADS</text>
      {[20, 44, 68, 92, 116].map(x => (
        <rect key={`sky-${x}`} x={x} y="14" width="16" height="8" rx="1"
          fill="#c4b5fd" opacity="0.2" stroke="#7C3AED" strokeWidth="0.5" />
      ))}
      {[18, 42, 66, 90, 114].map(x => (
        <rect key={`tw-${x}`} x={x} y="34" width="14" height="10" rx="1" fill="#c4b5fd" opacity="0.25" />
      ))}
      <rect x="60" y="68" width="16" height="22" rx="2" fill="#1e1b4b" />
      <rect x="62" y="70" width="12" height="18" rx="1" fill="#4c1d95" opacity="0.4" />
      <circle cx="72" cy="79" r="1.2" fill="#c4b5fd" />
      <rect x="130" y="0" width="8" height="18" rx="1" fill="#6B7280" />
      <rect x="132" y="-2" width="4" height="4" rx="1" fill="#9ca3af" opacity="0.4" />
      <circle cx="155" cy="40" r="5" fill="#dc2626" opacity="0.7" />
      <circle cx="155" cy="40" r="2" fill="#dc2626" opacity="0.5" />
      <circle cx="168" cy="40" r="5" fill="#2563EB" opacity="0.7" />
      <circle cx="168" cy="40" r="2" fill="#2563EB" opacity="0.5" />
      <circle cx="155" cy="55" r="5" fill="#fbbf24" opacity="0.7" />
      <circle cx="155" cy="55" r="2" fill="#fbbf24" opacity="0.5" />
      <circle cx="168" cy="55" r="5" fill="#22c55e" opacity="0.7" />
      <circle cx="168" cy="55" r="2" fill="#22c55e" opacity="0.5" />
      <circle cx="161" cy="68" r="5" fill="#7C3AED" opacity="0.7" />
      <circle cx="161" cy="68" r="2" fill="#7C3AED" opacity="0.5" />
      <rect x="18" y="68" width="28" height="20" rx="2" fill="#0f172a" />
      <rect x="20" y="70" width="24" height="16" rx="1" fill="#4c1d95" opacity="0.3" />
      <rect x="18" y="68" width="3" height="20" rx="1" fill="#fbbf24" />
      <rect x="43" y="68" width="3" height="20" rx="1" fill="#fbbf24" />
      <rect x="18" y="94" width="28" height="16" rx="2" fill="#e5e7eb" />
      <rect x="18" y="94" width="28" height="4" rx="1" fill="#d1d5db" />
      <rect x="22" y="110" width="6" height="3" rx="1" fill="#374151" />
      <rect x="36" y="110" width="6" height="3" rx="1" fill="#374151" />
      <Car x={75} y={172} color="#7C3AED" rot={90} />
      <Car x={108} y={172} color="#64748b" rot={90} />
      <Car x={143} y={172} color="#f5f5f4" rot={90} />
      <circle cx="8" cy="120" r="5" fill="#166534" opacity="0.6" />
      <circle cx="8" cy="120" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Electronics Assembly ─────────────────────────────────────────────────────

function ElectronicsAssembly({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="14" y="14" width="140" height="88" rx="3" fill="#000" opacity="0.25" />
      <rect x="10" y="10" width="140" height="88" rx="3" fill="#0e4651" />
      <rect x="10" y="10" width="140" height="16" rx="3" fill="#0891B2" />
      <rect x="10" y="23" width="140" height="3" fill="#0e7490" />
      <rect x="38" y="12" width="72" height="12" rx="2" fill="#0f172a" opacity="0.9" />
      <text x="74" y="22" textAnchor="middle" fontSize="8" fill="#22d3ee" fontWeight="bold" fontFamily="sans-serif">DESERT TECH</text>
      <line x1="140" y1="2" x2="140" y2="14" stroke="#9ca3af" strokeWidth="1.5" />
      <line x1="136" y1="5" x2="144" y2="5" stroke="#9ca3af" strokeWidth="1" />
      <line x1="137" y1="8" x2="143" y2="8" stroke="#9ca3af" strokeWidth="1" />
      <circle cx="140" cy="2" r="1.5" fill="#ef4444" />
      <line x1="130" y1="4" x2="130" y2="14" stroke="#9ca3af" strokeWidth="1.5" />
      <circle cx="130" cy="4" r="1" fill="#ef4444" />
      {[18, 40, 62, 84, 106, 128].map(x => (
        <rect key={`ew-${x}`} x={x} y="32" width="12" height="14" rx="1" fill="#22d3ee" opacity="0.2" />
      ))}
      <rect x="20" y="52" width="50" height="30" rx="2" fill="#f0f9ff" opacity="0.3" />
      <rect x="22" y="54" width="46" height="26" rx="1" fill="#e0f2fe" opacity="0.2" />
      <rect x="26" y="58" width="8" height="12" rx="1" fill="#9ca3af" opacity="0.4" />
      <rect x="38" y="58" width="8" height="12" rx="1" fill="#9ca3af" opacity="0.4" />
      <rect x="50" y="58" width="8" height="12" rx="1" fill="#9ca3af" opacity="0.4" />
      {[80, 95, 110, 125].map(x => (
        <rect key={`sr-${x}`} x={x} y="54" width="10" height="24" rx="1" fill="#374151" opacity="0.6" />
      ))}
      {[80, 95, 110, 125].map(x => (
        <g key={`sl-${x}`}>
          <circle cx={x + 3} cy="58" r="1" fill="#22d3ee" opacity="0.7" />
          <circle cx={x + 7} cy="58" r="1" fill="#4ade80" opacity="0.7" />
          <circle cx={x + 3} cy="62" r="1" fill="#22d3ee" opacity="0.5" />
          <circle cx={x + 7} cy="62" r="1" fill="#fbbf24" opacity="0.5" />
        </g>
      ))}
      <rect x="62" y="76" width="18" height="18" rx="2" fill="#0f172a" />
      <rect x="64" y="78" width="6.5" height="14" rx="1" fill="#0e4651" opacity="0.4" />
      <rect x="71.5" y="78" width="6.5" height="14" rx="1" fill="#0e4651" opacity="0.4" />
      <circle cx="70" cy="85" r="1.2" fill="#22d3ee" />
      <circle cx="73" cy="85" r="1.2" fill="#22d3ee" />
      <rect x="155" y="100" width="30" height="5" rx="1" fill="#fbbf24" opacity="0.7" />
      <rect x="155" y="95" width="8" height="14" rx="1" fill="#374151" />
      <rect x="18" y="12" width="12" height="10" rx="1" fill="#6B7280" />
      <rect x="20" y="14" width="8" height="6" rx="3" fill="#4B5563" />
      <Car x={40} y={172} color="#0891B2" rot={90} />
      <Car x={75} y={172} color="#1e293b" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />
      <circle cx="8" cy="100" r="5" fill="#166534" opacity="0.6" />
      <circle cx="8" cy="100" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="155" cy="88" r="4" fill="#166534" opacity="0.6" />
      <circle cx="155" cy="88" r="2.5" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Legal Dispensary ─────────────────────────────────────────────────────────

function LegalDispensary({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="110" height="72" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="110" height="72" rx="3" fill="#166534" />
      <rect x="18" y="18" width="110" height="16" rx="3" fill="#15803D" />
      <rect x="18" y="31" width="110" height="3" fill="#14532d" />
      <rect x="30" y="20" width="80" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="72" y="29" textAnchor="middle" fontSize="7.5" fill="#15803D" fontWeight="bold" fontFamily="sans-serif">GREEN LEAF</text>
      <ellipse cx="40" cy="26" rx="4" ry="3" fill="#22c55e" transform="rotate(-30,40,26)" />
      <line x1="38" y1="28" x2="42" y2="24" stroke="#166534" strokeWidth="0.5" />
      <rect x="24" y="40" width="40" height="22" rx="2" fill="#4ade80" opacity="0.25" />
      <rect x="26" y="44" width="36" height="1" fill="#15803D" opacity="0.4" />
      <rect x="26" y="50" width="36" height="1" fill="#15803D" opacity="0.4" />
      <rect x="26" y="56" width="36" height="1" fill="#15803D" opacity="0.4" />
      {[28, 34, 40, 46, 52, 58].map(x => (
        <rect key={`jar-${x}`} x={x} y="45" width="4" height="4" rx="1" fill="#fef3c7" opacity="0.5" />
      ))}
      {[28, 34, 40, 46, 52].map(x => (
        <rect key={`jar2-${x}`} x={x} y="51" width="4" height="4" rx="1" fill="#bbf7d0" opacity="0.5" />
      ))}
      <rect x="94" y="40" width="18" height="14" rx="2" fill="#4ade80" opacity="0.2" />
      <rect x="102.5" y="40" width="1" height="14" fill="#14532d" opacity="0.5" />
      <rect x="94" y="46.5" width="18" height="1" fill="#14532d" opacity="0.5" />
      <rect x="70" y="42" width="18" height="28" rx="2" fill="#052e16" />
      <rect x="72" y="44" width="14" height="24" rx="1" fill="#166534" opacity="0.4" />
      <circle cx="84" cy="56" r="1.5" fill="#4ade80" />
      <rect x="89" y="52" width="4" height="6" rx="0.5" fill="#374151" />
      <circle cx="91" cy="54" r="0.8" fill="#ef4444" />
      <rect x="120" y="20" width="6" height="4" rx="1" fill="#374151" />
      <rect x="124" y="21" width="4" height="2" rx="0.5" fill="#4B5563" />
      <circle cx="128" cy="22" r="1.5" fill="#1e293b" />
      <circle cx="128" cy="22" r="0.8" fill="#ef4444" opacity="0.8" />
      {[30, 55, 80, 105].map(x => (
        <circle key={`lt-${x}`} cx={x} cy="86" r="2" fill="#fde68a" opacity="0.25" />
      ))}
      <rect x="108" y="20" width="12" height="8" rx="1" fill="#6B7280" />
      <rect x="110" y="22" width="8" height="4" rx="2" fill="#4B5563" />
      <Car x={40} y={172} color="#15803D" rot={90} />
      <Car x={75} y={172} color="#374151" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#64748b" rot={90} />
      <circle cx="14" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="132" cy="86" r="5" fill="#166534" opacity="0.6" />
      <circle cx="132" cy="86" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── CBD Wellness ─────────────────────────────────────────────────────────────

function CbdWellness({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="22" y="22" width="110" height="72" rx="3" fill="#000" opacity="0.25" />
      <rect x="18" y="18" width="110" height="72" rx="3" fill="#4c1d95" />
      <rect x="18" y="18" width="110" height="16" rx="3" fill="#7C3AED" />
      <rect x="18" y="31" width="110" height="3" fill="#6d28d9" />
      <rect x="42" y="20" width="56" height="12" rx="2" fill="#faf5ff" opacity="0.9" />
      <text x="70" y="29" textAnchor="middle" fontSize="8" fill="#6d28d9" fontWeight="bold" fontFamily="sans-serif">ZEN CBD</text>
      <rect x="24" y="40" width="22" height="16" rx="2" fill="#c4b5fd" opacity="0.25" />
      <rect x="52" y="40" width="22" height="16" rx="2" fill="#c4b5fd" opacity="0.25" />
      <rect x="100" y="40" width="22" height="16" rx="2" fill="#c4b5fd" opacity="0.25" />
      <rect x="26" y="44" width="8" height="2" rx="0.5" fill="#7C3AED" opacity="0.4" />
      <rect x="26" y="48" width="8" height="2" rx="0.5" fill="#a78bfa" opacity="0.4" />
      <rect x="26" y="52" width="8" height="2" rx="0.5" fill="#7C3AED" opacity="0.4" />
      <rect x="78" y="42" width="16" height="24" rx="2" fill="#1e1b4b" />
      <rect x="80" y="44" width="12" height="20" rx="1" fill="#4c1d95" opacity="0.4" />
      <circle cx="90" cy="54" r="1.2" fill="#c4b5fd" />
      <line x1="140" y1="24" x2="140" y2="55" stroke="#22c55e" strokeWidth="2" />
      <line x1="145" y1="28" x2="145" y2="55" stroke="#22c55e" strokeWidth="1.5" />
      <line x1="150" y1="22" x2="150" y2="55" stroke="#22c55e" strokeWidth="2" />
      <circle cx="140" cy="32" r="1.5" fill="#16A34A" />
      <circle cx="140" cy="42" r="1.5" fill="#16A34A" />
      <circle cx="145" cy="36" r="1.2" fill="#16A34A" />
      <circle cx="145" cy="46" r="1.2" fill="#16A34A" />
      <circle cx="150" cy="30" r="1.5" fill="#16A34A" />
      <circle cx="150" cy="40" r="1.5" fill="#16A34A" />
      <circle cx="155" cy="70" r="10" fill="#0c4a6e" opacity="0.5" />
      <circle cx="155" cy="70" r="7" fill="#0ea5e9" opacity="0.3" />
      <circle cx="155" cy="70" r="4" fill="#7dd3fc" opacity="0.3" />
      <circle cx="155" cy="70" r="2" fill="#bae6fd" opacity="0.4" />
      <circle cx="140" cy="62" r="2.5" fill="#9ca3af" opacity="0.5" />
      <circle cx="148" cy="60" r="1.8" fill="#6B7280" opacity="0.5" />
      <circle cx="135" cy="68" r="2" fill="#9ca3af" opacity="0.5" />
      {[58, 62, 66, 70, 74].map(y => (
        <line key={`rake-${y}`} x1="132" y1={y} x2="170" y2={y}
          stroke="#d4d4d8" strokeWidth="0.3" opacity="0.3" />
      ))}
      {[30, 50, 70, 90, 110].map(x => (
        <circle key={`slt-${x}`} cx={x} cy="86" r="2.5" fill="#c4b5fd" opacity="0.15" />
      ))}
      <circle cx="74" cy="82" r="5" fill="#166534" opacity="0.6" />
      <circle cx="74" cy="82" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="98" cy="82" r="5" fill="#166534" opacity="0.6" />
      <circle cx="98" cy="82" r="3" fill="#22c55e" opacity="0.4" />
      <rect x="24" y="20" width="12" height="8" rx="1" fill="#6B7280" />
      <rect x="26" y="22" width="8" height="4" rx="2" fill="#4B5563" />
      <Car x={40} y={172} color="#7C3AED" rot={90} />
      <Car x={75} y={172} color="#f5f5f4" rot={90} />
      <Car x={108} y={172} color="#64748b" rot={90} />
      <circle cx="14" cy="18" r="5" fill="#166534" opacity="0.6" />
      <circle cx="14" cy="18" r="3" fill="#22c55e" opacity="0.4" />
    </ParkingLot>
  );
}

// ─── Clothing Outlet ─────────────────────────────────────────────────────────

function ClothingOutlet({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="18" y="22" width="120" height="70" rx="3" fill="#000" opacity="0.25" />
      <rect x="14" y="18" width="120" height="70" rx="3" fill="#9D174D" />
      <rect x="14" y="18" width="120" height="16" rx="3" fill="#EC4899" />
      <rect x="14" y="31" width="120" height="3" fill="#BE185D" />
      <rect x="30" y="20" width="72" height="12" rx="2" fill="#fff" opacity="0.9" />
      <text x="66" y="29" textAnchor="middle" fontSize="7" fill="#9D174D" fontWeight="bold" fontFamily="sans-serif">DESERT WEAR</text>
      <rect x="114" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="116" y="22" width="10" height="6" rx="3" fill="#4B5563" />
      <rect x="20" y="40" width="28" height="20" rx="2" fill="#FBCFE8" opacity="0.3" />
      <circle cx="30" cy="44" r="2.5" fill="#831843" opacity="0.5" />
      <rect x="27" y="47" width="6" height="10" rx="1" fill="#831843" opacity="0.5" />
      <line x1="27" y1="49" x2="24" y2="54" stroke="#831843" strokeWidth="1" opacity="0.4" />
      <line x1="33" y1="49" x2="36" y2="54" stroke="#831843" strokeWidth="1" opacity="0.4" />
      <rect x="54" y="40" width="28" height="20" rx="2" fill="#FBCFE8" opacity="0.3" />
      <circle cx="64" cy="44" r="2.5" fill="#831843" opacity="0.5" />
      <rect x="61" y="47" width="6" height="10" rx="1" fill="#831843" opacity="0.5" />
      <line x1="61" y1="49" x2="58" y2="54" stroke="#831843" strokeWidth="1" opacity="0.4" />
      <line x1="67" y1="49" x2="70" y2="54" stroke="#831843" strokeWidth="1" opacity="0.4" />
      <rect x="22" y="38" width="14" height="6" rx="1" fill="#FACC15" opacity="0.9" />
      <text x="29" y="43" textAnchor="middle" fontSize="4" fill="#831843" fontWeight="bold" fontFamily="sans-serif">SALE</text>
      <rect x="56" y="38" width="14" height="6" rx="1" fill="#F43F5E" opacity="0.9" />
      <text x="63" y="43" textAnchor="middle" fontSize="4" fill="#fff" fontWeight="bold" fontFamily="sans-serif">50%</text>
      <rect x="88" y="40" width="38" height="20" rx="2" fill="#FBCFE8" opacity="0.25" />
      <line x1="92" y1="46" x2="122" y2="46" stroke="#BE185D" strokeWidth="1.5" opacity="0.6" />
      {[96, 101, 106, 111, 116].map(hx => (
        <polygon key={hx} points={`${hx},46 ${hx - 2},52 ${hx + 2},52`} fill="#EC4899" opacity="0.35" />
      ))}
      <rect x="44" y="64" width="16" height="22" rx="2" fill="#4a0626" />
      <rect x="46" y="66" width="12" height="18" rx="1" fill="#EC4899" opacity="0.15" />
      <circle cx="57" cy="75" r="1.2" fill="#F9A8D4" />
      <rect x="62" y="78" width="5" height="6" rx="1" fill="#EC4899" />
      <rect x="69" y="79" width="4" height="5" rx="1" fill="#FACC15" />
      <rect x="74" y="78" width="5" height="6" rx="1" fill="#A855F7" />
      <path d="M63,78 Q64.5,75 66,78" fill="none" stroke="#EC4899" strokeWidth="0.6" />
      <path d="M70,79 Q71,76.5 72,79" fill="none" stroke="#FACC15" strokeWidth="0.6" />
      <path d="M75,78 Q76.5,75 78,78" fill="none" stroke="#A855F7" strokeWidth="0.6" />
      <rect x="96" y="64" width="16" height="12" rx="2" fill="#FBCFE8" opacity="0.25" />
      <rect x="103.5" y="64" width="1" height="12" fill="#BE185D" opacity="0.4" />
      <rect x="96" y="69.5" width="16" height="1" fill="#BE185D" opacity="0.4" />
      <Car x={40} y={172} color="#EC4899" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#6366F1" rot={90} />
      <circle cx="10" cy="20" r="5" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="20" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="10" cy="80" r="5" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="80" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="138" cy="92" r="4" fill="#166534" opacity="0.6" />
      <circle cx="138" cy="92" r="2.5" fill="#22c55e" opacity="0.4" />
      <rect x="144" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="144" y="18" width="22" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
  );
}

// ─── Tech Retailer ───────────────────────────────────────────────────────────

function TechRetailer({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="18" y="22" width="125" height="68" rx="3" fill="#000" opacity="0.25" />
      <rect x="14" y="18" width="125" height="68" rx="3" fill="#0E7490" />
      <rect x="14" y="18" width="125" height="14" rx="3" fill="#0891B2" />
      <rect x="14" y="29" width="125" height="3" fill="#155E75" />
      <rect x="14" y="17" width="125" height="1.5" rx="0.5" fill="#22D3EE" opacity="0.8" />
      <rect x="14" y="85" width="125" height="1.5" rx="0.5" fill="#22D3EE" opacity="0.6" />
      <rect x="42" y="19" width="48" height="11" rx="2" fill="#0f172a" opacity="0.9" />
      <text x="66" y="28" textAnchor="middle" fontSize="9" fill="#22D3EE" fontWeight="bold" fontFamily="sans-serif">VOLT</text>
      <polygon points="92,20 89,25 91,25 88,30 94,24 92,24" fill="#22D3EE" opacity="0.7" />
      <rect x="120" y="20" width="14" height="9" rx="1" fill="#6B7280" />
      <rect x="122" y="22" width="10" height="5" rx="3" fill="#4B5563" />
      <rect x="20" y="36" width="94" height="28" rx="2" fill="#67E8F9" opacity="0.2" />
      <rect x="43" y="36" width="1" height="28" fill="#155E75" opacity="0.5" />
      <rect x="67" y="36" width="1" height="28" fill="#155E75" opacity="0.5" />
      <rect x="91" y="36" width="1" height="28" fill="#155E75" opacity="0.5" />
      <rect x="26" y="46" width="6" height="10" rx="1" fill="#0f172a" />
      <rect x="27" y="47" width="4" height="7" rx="0.5" fill="#22D3EE" opacity="0.5" />
      <rect x="26" y="44" width="6" height="2" rx="0.5" fill="#374151" />
      <rect x="36" y="46" width="6" height="10" rx="1" fill="#0f172a" />
      <rect x="37" y="47" width="4" height="7" rx="0.5" fill="#A78BFA" opacity="0.5" />
      <rect x="36" y="44" width="6" height="2" rx="0.5" fill="#374151" />
      <rect x="49" y="44" width="14" height="10" rx="1" fill="#0f172a" />
      <rect x="50" y="45" width="12" height="7" rx="0.5" fill="#22D3EE" opacity="0.4" />
      <rect x="48" y="54" width="16" height="2" rx="0.5" fill="#374151" />
      <rect x="72" y="44" width="10" height="14" rx="1" fill="#0f172a" />
      <rect x="73" y="45" width="8" height="11" rx="0.5" fill="#67E8F9" opacity="0.4" />
      <rect x="72" y="42" width="10" height="2" rx="0.5" fill="#374151" />
      <rect x="96" y="42" width="16" height="12" rx="1" fill="#0f172a" />
      <rect x="97" y="43" width="14" height="9" rx="0.5" fill="#0891B2" opacity="0.4" />
      <rect x="101" y="54" width="8" height="3" rx="0.5" fill="#374151" />
      <rect x="99" y="57" width="12" height="1.5" rx="0.5" fill="#4B5563" />
      <rect x="56" y="68" width="20" height="18" rx="1" fill="#0f172a" />
      <rect x="58" y="70" width="7" height="14" rx="0.5" fill="#67E8F9" opacity="0.15" />
      <rect x="67" y="70" width="7" height="14" rx="0.5" fill="#67E8F9" opacity="0.15" />
      <circle cx="65" cy="77" r="1" fill="#22D3EE" />
      <rect x="58" y="86" width="16" height="4" rx="1" fill="#374151" opacity="0.5" />
      <rect x="120" y="50" width="12" height="18" rx="1" fill="#164E63" />
      <circle cx="130" cy="59" r="1" fill="#22D3EE" />
      <rect x="120" y="36" width="14" height="10" rx="2" fill="#67E8F9" opacity="0.15" />
      <Car x={40} y={172} color="#0f172a" rot={90} />
      <Car x={108} y={172} color="#f5f5f4" rot={90} />
      <Car x={143} y={172} color="#0891B2" rot={90} />
      <circle cx="10" cy="20" r="5" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="20" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="10" cy="80" r="4" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="80" r="2.5" fill="#22c55e" opacity="0.4" />
      <circle cx="142" cy="92" r="5" fill="#166534" opacity="0.6" />
      <circle cx="142" cy="92" r="3" fill="#22c55e" opacity="0.4" />
      <rect x="148" y="18" width="22" height="14" rx="2" fill="#374151" />
      <rect x="148" y="18" width="22" height="4" rx="1" fill="#4B5563" />
      <rect x="42" y="90" width="12" height="1.5" rx="0.5" fill="#9CA3AF" />
      {[44, 48, 52].map(bx => (
        <rect key={bx} x={bx} y="88" width="1" height="5" rx="0.5" fill="#9CA3AF" />
      ))}
    </ParkingLot>
  );
}

// ─── General Store ───────────────────────────────────────────────────────────

function GeneralStore({ w, h }: SpriteProps) {
  return (
    <ParkingLot w={w} h={h}>
      <rect x="18" y="22" width="118" height="74" rx="3" fill="#000" opacity="0.25" />
      <rect x="14" y="18" width="118" height="74" rx="3" fill="#92400E" />
      <rect x="14" y="18" width="118" height="16" rx="3" fill="#A16207" />
      <rect x="14" y="31" width="118" height="3" fill="#78350F" />
      {[38, 46, 54, 62, 70, 78].map(yy => (
        <rect key={yy} x="14" y={yy} width="118" height="0.8" fill="#78350F" opacity="0.3" />
      ))}
      <rect x="24" y="20" width="80" height="12" rx="2" fill="#FEF3C7" opacity="0.9" />
      <text x="64" y="29" textAnchor="middle" fontSize="6.5" fill="#78350F" fontWeight="bold" fontFamily="sans-serif">DESERT SUPPLY</text>
      <rect x="14" y="88" width="118" height="18" rx="1" fill="#78350F" opacity="0.5" />
      <rect x="14" y="88" width="118" height="16" rx="1" fill="#B45309" opacity="0.7" />
      {[90, 93, 96, 99].map(yy => (
        <rect key={yy} x="14" y={yy} width="118" height="0.5" fill="#92400E" opacity="0.3" />
      ))}
      <rect x="18" y="86" width="4" height="20" rx="1" fill="#78350F" />
      <rect x="50" y="86" width="4" height="20" rx="1" fill="#78350F" />
      <rect x="90" y="86" width="4" height="20" rx="1" fill="#78350F" />
      <rect x="124" y="86" width="4" height="20" rx="1" fill="#78350F" />
      <rect x="22" y="42" width="22" height="16" rx="2" fill="#FDE68A" opacity="0.3" />
      <rect x="32.5" y="42" width="1" height="16" fill="#78350F" opacity="0.4" />
      <rect x="22" y="49.5" width="22" height="1" fill="#78350F" opacity="0.4" />
      <rect x="78" y="42" width="22" height="16" rx="2" fill="#FDE68A" opacity="0.3" />
      <rect x="88.5" y="42" width="1" height="16" fill="#78350F" opacity="0.4" />
      <rect x="78" y="49.5" width="22" height="1" fill="#78350F" opacity="0.4" />
      <rect x="50" y="42" width="18" height="26" rx="2" fill="#451A03" />
      <rect x="52" y="44" width="14" height="22" rx="1" fill="#78350F" opacity="0.4" />
      <rect x="53" y="45" width="12" height="8" rx="1" fill="#92400E" opacity="0.3" />
      <rect x="53" y="56" width="12" height="8" rx="1" fill="#92400E" opacity="0.3" />
      <circle cx="65" cy="55" r="1.5" fill="#FBBF24" />
      <rect x="54" y="46" width="10" height="5" rx="1" fill="#DC2626" opacity="0.8" />
      <text x="59" y="50" textAnchor="middle" fontSize="3.5" fill="#fff" fontWeight="bold" fontFamily="sans-serif">OPEN</text>
      <line x1="128" y1="18" x2="128" y2="50" stroke="#9CA3AF" strokeWidth="1.5" />
      <rect x="129" y="20" width="16" height="10" rx="0.5" fill="#DC2626" />
      <rect x="129" y="22" width="16" height="1.5" fill="#fff" />
      <rect x="129" y="25" width="16" height="1.5" fill="#fff" />
      <rect x="129" y="28" width="16" height="1.5" fill="#fff" />
      <rect x="129" y="20" width="7" height="5" fill="#1E3A8A" />
      {[131, 133, 135].map(sx => (
        <g key={sx}>
          <circle cx={sx} cy={21.5} r="0.5" fill="#fff" />
          <circle cx={sx} cy={23.5} r="0.5" fill="#fff" />
        </g>
      ))}
      <rect x="26" y="92" width="6" height="5" rx="1" fill="#78350F" />
      <rect x="25" y="90" width="2" height="7" rx="0.5" fill="#78350F" />
      <path d="M24,97 Q28,99 32,97" fill="none" stroke="#78350F" strokeWidth="1" />
      <rect x="60" y="92" width="6" height="5" rx="1" fill="#78350F" />
      <rect x="59" y="90" width="2" height="7" rx="0.5" fill="#78350F" />
      <path d="M58,97 Q62,99 66,97" fill="none" stroke="#78350F" strokeWidth="1" />
      <ellipse cx="106" cy="94" rx="5" ry="4" fill="#92400E" />
      <ellipse cx="106" cy="93" rx="4.5" ry="3" fill="#B45309" />
      <line x1="102" y1="93" x2="110" y2="93" stroke="#78350F" strokeWidth="0.5" />
      <ellipse cx="116" cy="94" rx="4.5" ry="3.5" fill="#92400E" />
      <ellipse cx="116" cy="93" rx="4" ry="2.5" fill="#B45309" />
      <line x1="112.5" y1="93" x2="119.5" y2="93" stroke="#78350F" strokeWidth="0.5" />
      <rect x="100" y="100" width="10" height="8" rx="1" fill="#D97706" />
      <line x1="105" y1="100" x2="105" y2="108" stroke="#92400E" strokeWidth="0.5" />
      <line x1="100" y1="104" x2="110" y2="104" stroke="#92400E" strokeWidth="0.5" />
      <rect x="112" y="101" width="8" height="7" rx="1" fill="#B45309" />
      <line x1="116" y1="101" x2="116" y2="108" stroke="#78350F" strokeWidth="0.5" />
      <line x1="112" y1="104.5" x2="120" y2="104.5" stroke="#78350F" strokeWidth="0.5" />
      <ellipse cx="98" cy="104" rx="4" ry="5" fill="#D4B896" opacity="0.7" />
      <rect x="108" y="20" width="14" height="10" rx="1" fill="#6B7280" />
      <rect x="110" y="22" width="10" height="6" rx="3" fill="#4B5563" />
      <Car x={40} y={172} color="#A16207" rot={90} />
      <Car x={108} y={172} color="#DC2626" rot={90} />
      <Car x={143} y={172} color="#D4D4D4" rot={90} />
      <circle cx="10" cy="22" r="6" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="22" r="4" fill="#22c55e" opacity="0.4" />
      <circle cx="10" cy="82" r="5" fill="#166534" opacity="0.6" />
      <circle cx="10" cy="82" r="3" fill="#22c55e" opacity="0.4" />
      <circle cx="140" cy="96" r="5" fill="#166534" opacity="0.6" />
      <circle cx="140" cy="96" r="3" fill="#22c55e" opacity="0.4" />
      <rect x="144" y="18" width="22" height="16" rx="2" fill="#374151" />
      <rect x="144" y="18" width="22" height="4" rx="1" fill="#4B5563" />
    </ParkingLot>
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
