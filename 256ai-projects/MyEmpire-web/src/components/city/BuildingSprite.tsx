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

// ─── Sprite router ────────────────────────────────────────────────────────────

const SPRITE_MAP: Record<string, (props: SpriteProps) => React.ReactNode> = {
  tasty_toads: TacoStand,
  desert_burger: DesertBurger,
};

export default function BuildingSprite({ businessDefId, w = 72, h = 72 }: { businessDefId: string; w?: number; h?: number }) {
  const Sprite = SPRITE_MAP[businessDefId];
  if (!Sprite) return null;
  return <>{Sprite({ w, h })}</>;
}

export function hasSprite(businessDefId: string): boolean {
  return businessDefId in SPRITE_MAP;
}
