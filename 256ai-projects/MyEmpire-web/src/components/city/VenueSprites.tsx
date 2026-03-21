/**
 * Top-down (bird's eye) SVG sprites for Casino, Jewelry, Car Dealership, Bank.
 * ViewBox 200×200, rendered at actual size.
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

/** Lucky 7 Casino — neon-lit rooftop from above */
export function CasinoSprite({ w = 164, h = 130 }: SP) {
  return (
    <svg viewBox="0 0 400 260" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="400" height="260" fill="#1a1a2a" />
      {/* Parking lot base */}
      <rect x="5" y="5" width="390" height="250" rx="6" fill="#222" />
      {/* Shadow */}
      <rect x="28" y="18" width="300" height="140" rx="5" fill="#000" opacity="0.25" />
      {/* Casino roof — big flashy building */}
      <rect x="15" y="8" width="300" height="140" rx="5" fill="#EAB308" opacity="0.12" />
      <rect x="18" y="11" width="294" height="134" rx="4" fill="#1a1a10" />
      {/* Neon border glow */}
      <rect x="15" y="8" width="300" height="140" rx="5" fill="none" stroke="#EAB308" strokeWidth="2" opacity="0.35" />
      {/* "7" painted on roof */}
      <text x="165" y="80" textAnchor="middle" fontSize="50" fill="#EAB308" opacity="0.15" fontWeight="bold">7</text>
      {/* Roof sign strip */}
      <rect x="80" y="14" width="170" height="12" rx="3" fill="#EAB308" opacity="0.25" />
      {/* AC units */}
      <rect x="30" y="20" width="24" height="16" rx="2" fill="#555" />
      <rect x="33" y="23" width="18" height="10" rx="4" fill="#444" />
      <rect x="275" y="20" width="24" height="16" rx="2" fill="#555" />
      <rect x="278" y="23" width="18" height="10" rx="4" fill="#444" />
      {/* Skylights / game floor glow */}
      <rect x="50" y="55" width="50" height="35" rx="3" fill="#EAB308" opacity="0.06" />
      <rect x="120" y="55" width="50" height="35" rx="3" fill="#ef4444" opacity="0.06" />
      <rect x="190" y="55" width="50" height="35" rx="3" fill="#22c55e" opacity="0.06" />
      {/* Valet area */}
      <rect x="100" y="148" width="120" height="8" rx="1" fill="#666" />
      {/* Red carpet entrance from above */}
      <rect x="140" y="148" width="40" height="30" rx="1" fill="#dc2626" opacity="0.3" />
      {/* Parked luxury cars */}
      <Car x={50} y={200} color="#1a1a1a" rot={0} />
      <Car x={130} y={200} color="#fbbf24" rot={0} />
      <Car x={210} y={200} color="#ef4444" rot={0} />
      <Car x={290} y={200} color="#f5f5f4" rot={0} />
      {/* Parking lines */}
      {[30, 90, 150, 210, 270, 330].map(x => (
        <rect key={x} x={x} y="185" width="2" height="35" fill="#555" opacity="0.3" />
      ))}
      {/* Fountain in front */}
      <circle cx="330" cy="100" r="18" fill="#0ea5e9" opacity="0.15" />
      <circle cx="330" cy="100" r="10" fill="#38bdf8" opacity="0.12" />
      {/* Palm trees */}
      <circle cx="340" cy="40" r="12" fill="#166534" opacity="0.4" />
      <circle cx="340" cy="40" r="7" fill="#22c55e" opacity="0.3" />
      <circle cx="340" cy="170" r="12" fill="#166534" opacity="0.4" />
      <circle cx="340" cy="170" r="7" fill="#22c55e" opacity="0.3" />
    </svg>
  );
}

/** Ice Box Jewelers — upscale storefront from above */
export function JewelrySprite({ w = 164, h = 180 }: SP) {
  return (
    <svg viewBox="0 0 400 440" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="400" height="440" fill="#1a1a2a" />
      {/* Upscale street */}
      <rect x="5" y="5" width="390" height="430" rx="6" fill="#1a1a2a" />
      {/* Shadow */}
      <rect x="28" y="18" width="340" height="200" rx="5" fill="#000" opacity="0.25" />
      {/* Store roof */}
      <rect x="15" y="8" width="340" height="200" rx="5" fill="#06B6D4" opacity="0.1" />
      <rect x="18" y="11" width="334" height="194" rx="4" fill="#0d1520" />
      {/* Diamond-shaped skylight */}
      <polygon points="185,60 230,105 185,150 140,105" fill="#06B6D4" opacity="0.08" />
      <polygon points="185,70 220,105 185,140 150,105" fill="#38bdf8" opacity="0.06" />
      {/* Security vault (thick walls visible) */}
      <rect x="260" y="40" width="70" height="60" rx="4" fill="#333" opacity="0.4" />
      <rect x="265" y="45" width="60" height="50" rx="3" fill="#222" />
      {/* Display case rows from above */}
      {[50, 80, 110, 140].map(y => (
        <rect key={y} x="40" y={y} width="180" height="8" rx="1" fill="#06B6D4" opacity="0.08" />
      ))}
      {/* Sparkle dots (gems visible through skylight) */}
      {[
        [70, 55], [120, 85], [160, 55], [90, 115], [140, 145], [55, 140], [180, 110],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="#fff" opacity="0.15" />
      ))}
      {/* Entrance canopy */}
      <rect x="130" y="206" width="110" height="10" rx="2" fill="#06B6D4" opacity="0.2" />
      {/* Sidewalk */}
      <rect x="20" y="218" width="330" height="12" fill="#444" opacity="0.2" />
      {/* Velvet rope / bollards */}
      {[140, 160, 180, 200, 220].map(x => (
        <circle key={x} cx={x} cy="230" r="3" fill="#fbbf24" opacity="0.3" />
      ))}
      {/* Parked luxury cars */}
      <Car x={80} y={280} color="#1a1a1a" rot={0} />
      <Car x={200} y={280} color="#06B6D4" rot={0} />
      <Car x={300} y={280} color="#f5f5f4" rot={0} />
      {/* Parking lines */}
      {[40, 120, 200, 280, 340].map(x => (
        <rect key={x} x={x} y="265" width="2" height="35" fill="#555" opacity="0.3" />
      ))}
      {/* Trees */}
      <circle cx="370" cy="60" r="14" fill="#166534" opacity="0.4" />
      <circle cx="370" cy="60" r="8" fill="#22c55e" opacity="0.3" />
      <circle cx="370" cy="180" r="14" fill="#166534" opacity="0.4" />
      <circle cx="370" cy="180" r="8" fill="#22c55e" opacity="0.3" />
      {/* Security guard */}
      <circle cx="130" cy="230" r="4" fill="#fbbf24" opacity="0.5" />
      <ellipse cx="130" cy="238" rx="3" ry="5" fill="#fbbf24" opacity="0.35" />
    </svg>
  );
}

/** Prestige Motors — car dealership from above */
export function PrestigeMotorsSprite({ w = 164, h = 100 }: SP) {
  return (
    <svg viewBox="0 0 400 240" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="400" height="240" fill="#1a1a2a" />
      <rect x="5" y="5" width="390" height="230" rx="6" fill="#1a0a0a" />
      {/* Shadow */}
      <rect x="23" y="18" width="260" height="100" rx="4" fill="#000" opacity="0.2" />
      {/* Showroom roof */}
      <rect x="10" y="8" width="260" height="100" rx="4" fill="#EF4444" opacity="0.1" />
      <rect x="13" y="11" width="254" height="94" rx="3" fill="#1a1010" />
      {/* Glass roof / showroom skylight */}
      <rect x="25" y="20" width="230" height="70" rx="3" fill="#EF4444" opacity="0.04" />
      {/* Cars on display floor (seen through glass) */}
      <Car x={60} y={50} color="#ef4444" rot={90} />
      <Car x={130} y={50} color="#fbbf24" rot={90} />
      <Car x={200} y={50} color="#3b82f6" rot={90} />
      {/* Red accent trim */}
      <rect x="10" y="8" width="260" height="4" rx="1" fill="#EF4444" opacity="0.3" />
      {/* Sign on roof */}
      <rect x="70" y="14" width="130" height="10" rx="2" fill="#EF4444" opacity="0.2" />
      {/* Test drive lot */}
      <rect x="290" y="15" width="100" height="90" rx="3" fill="#222" />
      {[300, 340].map(x => (
        <rect key={x} x={x} y="20" width="2" height="80" fill="#555" opacity="0.3" />
      ))}
      <Car x={320} y={40} color="#22c55e" rot={90} />
      <Car x={360} y={40} color="#f5f5f4" rot={90} />
      <Car x={320} y={80} color="#7C3AED" rot={90} />
      {/* Entrance */}
      <rect x="100" y="107" width="80" height="6" rx="1" fill="#666" />
      {/* Road */}
      <rect x="5" y="125" width="390" height="3" fill="#fbbf24" opacity="0.1" />
      {/* Customer parking */}
      <Car x={60} y={165} color="#64748b" rot={0} />
      <Car x={180} y={165} color="#d4d4d4" rot={0} />
      <Car x={300} y={165} color="#92400E" rot={0} />
      {/* Flag banner poles */}
      {[20, 130, 250].map(x => (
        <g key={x}>
          <circle cx={x} cy="120" r="2" fill="#EF4444" opacity="0.4" />
          <rect x={x - 5} y="115" width="10" height="4" rx="1" fill="#EF4444" opacity="0.2" />
        </g>
      ))}
    </svg>
  );
}

/** First National Bank — solid building from above */
export function BankSprite({ w = 164, h = 80 }: SP) {
  return (
    <svg viewBox="0 0 400 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="400" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="390" height="190" rx="6" fill="#0d1a15" />
      {/* Shadow */}
      <rect x="28" y="18" width="280" height="90" rx="4" fill="#000" opacity="0.2" />
      {/* Bank roof — classical/pillared building */}
      <rect x="15" y="8" width="280" height="90" rx="4" fill="#10B981" opacity="0.1" />
      <rect x="18" y="11" width="274" height="84" rx="3" fill="#0d1a15" />
      {/* Roof edge — classical pediment */}
      <rect x="15" y="8" width="280" height="5" rx="1" fill="#10B981" opacity="0.25" />
      {/* Pillar shadows (from above = rectangles along front) */}
      {[35, 75, 115, 155, 195, 235].map(x => (
        <rect key={x} x={x} y="75" width="8" height="20" rx="1" fill="#10B981" opacity="0.1" />
      ))}
      {/* Vault skylight */}
      <rect x="200" y="25" width="60" height="40" rx="3" fill="#333" opacity="0.4" />
      <rect x="205" y="30" width="50" height="30" rx="2" fill="#222" />
      <circle cx="230" cy="45" r="8" fill="#10B981" opacity="0.08" />
      {/* AC units */}
      <rect x="40" y="20" width="20" height="14" rx="2" fill="#555" />
      <rect x="43" y="23" width="14" height="8" rx="3" fill="#444" />
      {/* Drive-thru ATM lane */}
      <rect x="310" y="20" width="70" height="50" rx="3" fill="#222" />
      <rect x="330" y="30" width="15" height="12" rx="2" fill="#10B981" opacity="0.15" />
      {/* Entrance steps (from above) */}
      <rect x="80" y="98" width="150" height="10" rx="2" fill="#444" opacity="0.3" />
      <rect x="90" y="108" width="130" height="8" rx="1" fill="#333" opacity="0.25" />
      {/* Parking */}
      <Car x={70} y={155} color="#64748b" rot={0} />
      <Car x={180} y={155} color="#333" rot={0} />
      <Car x={290} y={155} color="#f5f5f4" rot={0} />
      {/* Armored truck */}
      <rect x="340" y="100" width="40" height="22" rx="3" fill="#555" opacity="0.5" />
      <rect x="343" y="102" width="34" height="8" rx="2" fill="#333" opacity="0.4" />
      {/* Security bollards */}
      {[70, 100, 130, 160, 190, 220].map(x => (
        <circle key={x} cx={x} cy="120" r="2.5" fill="#888" opacity="0.3" />
      ))}
    </svg>
  );
}
