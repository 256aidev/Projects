/**
 * Top-down (bird's eye) SVG sprites for Dealer Network tiers,
 * Dirty Jobs, and the Income tile.
 * ViewBox 200×200, rendered at 72×72.
 */

interface SP { w?: number; h?: number }

function Car({ x, y, color, rot = 0 }: { x: number; y: number; color: string; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x="-14" y="-7" width="28" height="14" rx="4" fill={color} />
      <rect x="5" y="-5" width="7" height="10" rx="2" fill="#1e293b" opacity="0.7" />
      <rect x="-11" y="-4" width="5" height="8" rx="1.5" fill="#1e293b" opacity="0.5" />
    </g>
  );
}

function Person({ x, y, color = '#fbbf24' }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <circle cx={x} cy={y - 4} r="4" fill={color} opacity="0.8" />
      <ellipse cx={x} cy={y + 5} rx="3.5" ry="5" fill={color} opacity="0.6" />
    </g>
  );
}

/* ═══════════════════════════════════════════
   DEALER NETWORK TIER SPRITES
   ═══════════════════════════════════════════ */

/** Corner Boys — street corner, one guy standing by a lamppost */
export function CornerBoysSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Sidewalk / intersection from above */}
      <rect x="0" y="80" width="200" height="40" fill="#333" opacity="0.4" />
      <rect x="80" y="0" width="40" height="200" fill="#333" opacity="0.4" />
      {/* Crosswalk lines */}
      {[82, 88, 94, 100, 106, 112].map(x => (
        <rect key={x} x={x} y="78" width="3" height="44" fill="#fbbf24" opacity="0.2" />
      ))}
      {/* Street lamp from above */}
      <circle cx="75" cy="75" r="5" fill="#fbbf24" opacity="0.3" />
      <circle cx="75" cy="75" r="12" fill="#fbbf24" opacity="0.08" />
      {/* Dealer standing at corner */}
      <Person x={65} y={90} color="#6366F1" />
      {/* Customer approaching */}
      <Person x={90} y={110} color="#888" />
      {/* Trash can */}
      <circle cx="50" cy="70" r="4" fill="#444" />
      {/* Newspaper box */}
      <rect x="40" y="108" width="8" height="6" rx="1" fill="#3b82f6" opacity="0.4" />
    </svg>
  );
}

/** Street Crew — small alley with a few guys and a lookout */
export function StreetCrewSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Alley between buildings */}
      <rect x="0" y="0" width="60" height="200" fill="#222" />
      <rect x="140" y="0" width="60" height="200" fill="#222" />
      {/* Alley floor */}
      <rect x="60" y="0" width="80" height="200" fill="#2a2a2a" />
      {/* Dumpster from above */}
      <rect x="65" y="15" width="28" height="18" rx="2" fill="#374151" />
      <rect x="65" y="15" width="28" height="4" fill="#4B5563" />
      {/* Crew members */}
      <Person x={80} y={60} color="#8B5CF6" />
      <Person x={100} y={75} color="#8B5CF6" />
      <Person x={115} y={55} color="#8B5CF6" />
      {/* Lookout at entrance */}
      <Person x={100} y={170} color="#fbbf24" />
      {/* Cash on ground */}
      <rect x="90" y="95" width="8" height="5" rx="1" fill="#22c55e" opacity="0.4" />
      {/* Graffiti mark on wall */}
      <rect x="55" y="100" width="4" height="15" rx="1" fill="#ef4444" opacity="0.3" />
      {/* Fire escape ladder (top-down = line on building) */}
      <line x1="30" y1="30" x2="30" y2="160" stroke="#555" strokeWidth="2" opacity="0.3" />
    </svg>
  );
}

/** Distribution Network — warehouse district, van loading */
export function DistributionNetworkSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Warehouse area */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#1a1520" />
      {/* Small warehouse roof */}
      <rect x="10" y="10" width="100" height="70" rx="3" fill="#A855F7" opacity="0.12" />
      <rect x="12" y="12" width="96" height="66" rx="2" fill="#1a1a2a" />
      {/* Loading dock lines */}
      <rect x="30" y="78" width="50" height="6" rx="1" fill="#555" />
      {/* Van from above */}
      <rect x="25" y="95" width="55" height="28" rx="4" fill="#f5f5f4" opacity="0.7" />
      <rect x="28" y="97" width="49" height="12" rx="2" fill="#1e293b" opacity="0.4" />
      {/* Second van */}
      <rect x="25" y="135" width="55" height="28" rx="4" fill="#d4d4d4" opacity="0.5" />
      <rect x="28" y="137" width="49" height="12" rx="2" fill="#1e293b" opacity="0.3" />
      {/* Workers loading */}
      <Person x={100} y={100} color="#A855F7" />
      <Person x={120} y={115} color="#A855F7" />
      {/* Pallets from above */}
      <rect x="130" y="20" width="18" height="18" rx="1" fill="#92400E" opacity="0.3" />
      <rect x="155" y="20" width="18" height="18" rx="1" fill="#92400E" opacity="0.25" />
      <rect x="130" y="45" width="18" height="18" rx="1" fill="#a0522d" opacity="0.3" />
      {/* Road markings */}
      <rect x="5" y="180" width="190" height="3" fill="#fbbf24" opacity="0.15" />
    </svg>
  );
}

/** City Syndicate — penthouse rooftop, suits */
export function CitySyndicateSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* City block from above — several building roofs */}
      <rect x="5" y="5" width="60" height="90" rx="2" fill="#333" />
      <rect x="70" y="5" width="60" height="50" rx="2" fill="#2a2a3a" />
      <rect x="135" y="5" width="60" height="70" rx="2" fill="#2a2a2a" />
      <rect x="5" y="100" width="90" height="50" rx="2" fill="#2a2a3a" />
      {/* Main penthouse roof with pool */}
      <rect x="70" y="60" width="125" height="80" rx="3" fill="#7C3AED" opacity="0.15" />
      <rect x="72" y="62" width="121" height="76" rx="2" fill="#1a1a3a" />
      {/* Rooftop pool */}
      <rect x="120" y="70" width="35" height="20" rx="4" fill="#0ea5e9" opacity="0.4" />
      {/* Helipad circle */}
      <circle cx="95" cy="100" r="15" fill="none" stroke="#7C3AED" strokeWidth="1.5" opacity="0.3" />
      <text x="95" y="105" textAnchor="middle" fontSize="12" fill="#7C3AED" opacity="0.4" fontWeight="bold">H</text>
      {/* Suited figures meeting */}
      <Person x={80} y={80} color="#7C3AED" />
      <Person x={100} y={80} color="#7C3AED" />
      <Person x={90} y={70} color="#fbbf24" />
      {/* Limo parked below */}
      <rect x="10" y="165" width="45" height="14" rx="4" fill="#1a1a1a" />
      <rect x="13" y="167" width="39" height="5" rx="1.5" fill="#333" opacity="0.5" />
      {/* AC units on other roofs */}
      <rect x="15" y="15" width="14" height="10" rx="2" fill="#555" />
      <rect x="145" y="15" width="14" height="10" rx="2" fill="#555" />
    </svg>
  );
}

/** Regional Cartel — compound with guards and cars */
export function RegionalCartelSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Walled compound */}
      <rect x="10" y="10" width="180" height="180" rx="4" fill="#1a0a0a" />
      <rect x="10" y="10" width="180" height="180" rx="4" fill="none" stroke="#DC2626" strokeWidth="2" opacity="0.3" />
      {/* Main building roof */}
      <rect x="30" y="20" width="120" height="80" rx="4" fill="#DC2626" opacity="0.15" />
      <rect x="32" y="22" width="116" height="76" rx="3" fill="#1a1a1a" />
      {/* Gold trim */}
      <rect x="30" y="20" width="120" height="4" rx="1" fill="#fbbf24" opacity="0.3" />
      {/* Satellite dishes */}
      <circle cx="130" cy="35" r="8" fill="#888" opacity="0.4" />
      <circle cx="130" cy="35" r="3" fill="#aaa" opacity="0.4" />
      {/* Guard towers */}
      <rect x="12" y="12" width="16" height="16" rx="2" fill="#555" />
      <circle cx="20" cy="20" r="3" fill="#ef4444" opacity="0.5" />
      <rect x="172" y="12" width="16" height="16" rx="2" fill="#555" />
      <circle cx="180" cy="20" r="3" fill="#ef4444" opacity="0.5" />
      {/* Armed guards */}
      <Person x={50} y={50} color="#DC2626" />
      <Person x={120} y={50} color="#DC2626" />
      {/* Armored SUVs in courtyard */}
      <Car x={60} y={140} color="#1a1a1a" rot={0} />
      <Car x={120} y={140} color="#1a1a1a" rot={0} />
      {/* Stash in corner */}
      <rect x="150" y="110" width="25" height="20" rx="2" fill="#22c55e" opacity="0.1" />
      {/* Crown */}
      <text x="90" y="70" textAnchor="middle" fontSize="16">👑</text>
    </svg>
  );
}

/** Income tile */
export function IncomeTileSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#22c55e" opacity="0.06" />
      {/* Dollar signs floating */}
      <text x="100" y="70" textAnchor="middle" fontSize="40" fill="#22c55e" opacity="0.3">$</text>
      <text x="50" y="100" textAnchor="middle" fontSize="24" fill="#22c55e" opacity="0.2">$</text>
      <text x="150" y="110" textAnchor="middle" fontSize="28" fill="#22c55e" opacity="0.2">$</text>
      <text x="70" y="150" textAnchor="middle" fontSize="20" fill="#22c55e" opacity="0.15">$</text>
      <text x="140" y="55" textAnchor="middle" fontSize="18" fill="#22c55e" opacity="0.15">$</text>
      {/* Cash stacks */}
      <rect x="70" y="105" width="60" height="8" rx="2" fill="#22c55e" opacity="0.25" />
      <rect x="75" y="98" width="50" height="8" rx="2" fill="#22c55e" opacity="0.2" />
      <rect x="80" y="91" width="40" height="8" rx="2" fill="#22c55e" opacity="0.15" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   DIRTY JOBS SPRITES
   ═══════════════════════════════════════════ */

/** Fast Food — kitchen/restaurant from above */
export function FastFoodSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Building roof */}
      <rect x="10" y="10" width="130" height="80" rx="3" fill="#dc2626" opacity="0.2" />
      <rect x="12" y="12" width="126" height="76" rx="2" fill="#2a1a1a" />
      {/* Drive-thru lane */}
      <path d="M 140 50 Q 170 50 170 80 Q 170 130 140 130 L 140 140" fill="none" stroke="#444" strokeWidth="8" />
      {/* Menu board from above */}
      <rect x="155" y="45" width="15" height="10" rx="1" fill="#fbbf24" opacity="0.4" />
      {/* Roof sign */}
      <rect x="35" y="15" width="50" height="14" rx="2" fill="#fbbf24" opacity="0.5" />
      {/* Parking */}
      {[15, 45, 75, 105].map(x => (
        <rect key={x} x={x} y="140" width="1.5" height="35" fill="#555" opacity="0.4" />
      ))}
      <Car x={30} y={160} color="#64748b" rot={0} />
      <Car x={90} y={160} color="#ef4444" rot={0} />
      {/* Dumpster */}
      <rect x="145" y="10" width="22" height="14" rx="2" fill="#374151" />
      {/* AC unit */}
      <rect x="100" y="18" width="16" height="12" rx="2" fill="#555" />
    </svg>
  );
}

/** Retail — mall store from above */
export function RetailSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Mall roof section */}
      <rect x="10" y="10" width="180" height="100" rx="4" fill="#3b82f6" opacity="0.1" />
      <rect x="12" y="12" width="176" height="96" rx="3" fill="#1a1a2a" />
      {/* Skylights (store sections) */}
      <rect x="20" y="20" width="50" height="35" rx="2" fill="#3b82f6" opacity="0.1" />
      <rect x="80" y="20" width="50" height="35" rx="2" fill="#3b82f6" opacity="0.1" />
      <rect x="140" y="20" width="40" height="35" rx="2" fill="#3b82f6" opacity="0.1" />
      {/* Clothing racks visible through skylights */}
      {[30, 45, 90, 105].map(x => (
        <line key={x} x1={x} y1="65" x2={x} y2="80" stroke="#555" strokeWidth="2" opacity="0.3" />
      ))}
      {/* Front entrance (from above = glass doors) */}
      <rect x="70" y="108" width="60" height="6" rx="1" fill="#666" />
      {/* Parking lot */}
      <rect x="10" y="125" width="180" height="2" fill="#555" opacity="0.3" />
      {[20, 50, 80, 110, 140, 170].map(x => (
        <rect key={x} x={x} y="127" width="1.5" height="30" fill="#555" opacity="0.3" />
      ))}
      <Car x={35} y={145} color="#f5f5f4" rot={0} />
      <Car x={95} y={145} color="#3b82f6" rot={0} />
      <Car x={155} y={145} color="#fbbf24" rot={0} />
      {/* Shopping carts from above */}
      <rect x="180" y="120" width="6" height="4" rx="1" fill="#888" opacity="0.3" />
      <rect x="180" y="126" width="6" height="4" rx="1" fill="#888" opacity="0.25" />
    </svg>
  );
}

/** Office Clerk — office building from above */
export function OfficeClerkSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Office building roof */}
      <rect x="20" y="15" width="140" height="110" rx="4" fill="#6B7280" opacity="0.15" />
      <rect x="22" y="17" width="136" height="106" rx="3" fill="#1a1a22" />
      {/* Roof edge */}
      <rect x="20" y="15" width="140" height="4" rx="1" fill="#6B7280" opacity="0.3" />
      {/* AC units in grid */}
      {[35, 75, 115].map(x => (
        <g key={x}>
          <rect x={x} y="25" width="20" height="14" rx="2" fill="#555" />
          <rect x={x + 2} y="27" width="16" height="10" rx="4" fill="#444" />
        </g>
      ))}
      {/* Stairwell access */}
      <rect x="140" y="100" width="14" height="14" rx="1" fill="#444" />
      {/* Entrance canopy */}
      <rect x="65" y="123" width="50" height="10" rx="2" fill="#6B7280" opacity="0.3" />
      {/* Sidewalk */}
      <rect x="20" y="135" width="140" height="8" fill="#444" opacity="0.2" />
      {/* Bus stop */}
      <rect x="170" y="80" width="12" height="20" rx="2" fill="#3b82f6" opacity="0.2" />
      {/* Workers arriving */}
      <Person x={80} y={155} color="#6B7280" />
      <Person x={100} y={158} color="#6B7280" />
      <Car x={50} y={175} color="#64748b" rot={0} />
    </svg>
  );
}

/** Warehouse Manager — warehouse from above */
export function WarehouseManagerSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Warehouse roof */}
      <rect x="10" y="10" width="160" height="110" rx="4" fill="#92400E" opacity="0.15" />
      <rect x="12" y="12" width="156" height="106" rx="3" fill="#1a1408" />
      {/* Corrugated lines */}
      {[20, 30, 40, 50, 60, 70, 80, 90, 100, 110].map(y => (
        <line key={y} x1="14" y1={y} x2="166" y2={y} stroke="#92400E" strokeWidth="1" opacity="0.15" />
      ))}
      {/* Loading bays */}
      <rect x="30" y="120" width="40" height="6" rx="1" fill="#555" />
      <rect x="85" y="120" width="40" height="6" rx="1" fill="#555" />
      {/* Trucks docked */}
      <rect x="33" y="130" width="34" height="20" rx="3" fill="#f5f5f4" opacity="0.5" />
      <rect x="88" y="130" width="34" height="20" rx="3" fill="#d4d4d4" opacity="0.4" />
      {/* Forklift */}
      <rect x="175" y="60" width="12" height="18" rx="2" fill="#fbbf24" opacity="0.4" />
      {/* Parking */}
      <Car x={50} y={175} color="#8b6640" rot={0} />
      <Car x={120} y={175} color="#555" rot={0} />
    </svg>
  );
}

/** Finance Bro — skyscraper rooftop from above */
export function FinanceBroSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Surrounding shorter buildings */}
      <rect x="5" y="5" width="45" height="60" rx="2" fill="#222" />
      <rect x="150" y="5" width="45" height="45" rx="2" fill="#222" />
      <rect x="5" y="140" width="50" height="55" rx="2" fill="#222" />
      {/* Main skyscraper roof — tall = big shadow */}
      <rect x="55" y="15" width="90" height="130" rx="4" fill="#fbbf24" opacity="0.08" />
      <rect x="57" y="17" width="86" height="126" rx="3" fill="#15151a" />
      {/* Gold trim */}
      <rect x="55" y="15" width="90" height="3" rx="1" fill="#fbbf24" opacity="0.3" />
      {/* Communication tower */}
      <line x1="100" y1="50" x2="100" y2="20" stroke="#888" strokeWidth="2" />
      <circle cx="100" cy="18" r="3" fill="#ef4444" opacity="0.5" />
      {/* Satellite dishes */}
      <circle cx="70" cy="35" r="6" fill="#888" opacity="0.3" />
      <circle cx="130" cy="40" r="5" fill="#888" opacity="0.25" />
      {/* Rooftop garden */}
      <rect x="65" y="80" width="70" height="30" rx="3" fill="#22c55e" opacity="0.1" />
      {/* Stock ticker (tiny screen glow) */}
      <rect x="80" y="120" width="40" height="8" rx="1" fill="#22c55e" opacity="0.2" />
      {/* Helicopter on pad */}
      <circle cx="100" cy="65" r="12" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/** Corporate Exec — massive corporate campus */
export function CorporateExecSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Campus grounds */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#0d1a0d" />
      {/* Main tower roof */}
      <rect x="55" y="15" width="90" height="80" rx="4" fill="#7C3AED" opacity="0.1" />
      <rect x="57" y="17" width="86" height="76" rx="3" fill="#15102a" />
      {/* Wing buildings */}
      <rect x="10" y="35" width="40" height="45" rx="2" fill="#7C3AED" opacity="0.08" />
      <rect x="150" y="35" width="40" height="45" rx="2" fill="#7C3AED" opacity="0.08" />
      {/* Helipad */}
      <circle cx="100" cy="55" r="18" fill="none" stroke="#7C3AED" strokeWidth="2" opacity="0.25" />
      <text x="100" y="61" textAnchor="middle" fontSize="14" fill="#7C3AED" opacity="0.35" fontWeight="bold">H</text>
      {/* Fountains in courtyard */}
      <circle cx="60" cy="140" r="12" fill="#0ea5e9" opacity="0.2" />
      <circle cx="60" cy="140" r="6" fill="#38bdf8" opacity="0.15" />
      <circle cx="140" cy="140" r="12" fill="#0ea5e9" opacity="0.2" />
      <circle cx="140" cy="140" r="6" fill="#38bdf8" opacity="0.15" />
      {/* Executive parking */}
      <Car x={30} y={175} color="#1a1a1a" rot={0} />
      <Car x={100} y={175} color="#1a1a1a" rot={0} />
      <Car x={170} y={175} color="#fbbf24" rot={0} />
      {/* Security fence */}
      <rect x="7" y="7" width="186" height="186" rx="3" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.2" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   LOOKUP MAPS
   ═══════════════════════════════════════════ */

export const DEALER_SPRITE_MAP: Record<string, (props: SP) => JSX.Element> = {
  corner: CornerBoysSprite,
  crew: StreetCrewSprite,
  network: DistributionNetworkSprite,
  syndicate: CitySyndicateSprite,
  cartel: RegionalCartelSprite,
};

export const JOB_SPRITE_MAP: Record<string, (props: SP) => JSX.Element> = {
  fast_food: FastFoodSprite,
  retail: RetailSprite,
  clerk: OfficeClerkSprite,
  warehouse: WarehouseManagerSprite,
  finance: FinanceBroSprite,
  corporate: CorporateExecSprite,
};
