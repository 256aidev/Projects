/**
 * Top-down SVG sprites for the Home Turf operations block.
 * Each sprite fits in a 72×72 tile. ViewBox 200×200 for detail.
 */

interface SP { w?: number; h?: number }

/* ── Grow Rooms ────────────────────────────────────────────── */

export function GrandmaHouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Grass yard */}
      <rect x="5" y="5" width="190" height="190" rx="8" fill="#1a3a1a" />
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#0d2a0d" opacity="0.4" />
      {/* House body */}
      <rect x="30" y="50" width="110" height="90" rx="4" fill="#8B7355" />
      <rect x="35" y="55" width="100" height="80" rx="2" fill="#a08060" />
      {/* Roof */}
      <polygon points="25,55 85,15 145,55" fill="#6d4c30" />
      <polygon points="30,55 85,20 140,55" fill="#8b6640" />
      {/* Door */}
      <rect x="70" y="95" width="20" height="35" rx="2" fill="#5a3a20" />
      <circle cx="86" cy="114" r="2" fill="#fbbf24" />
      {/* Windows */}
      <rect x="42" y="68" width="18" height="16" rx="1" fill="#93c5fd" opacity="0.7" />
      <rect x="100" y="68" width="18" height="16" rx="1" fill="#93c5fd" opacity="0.7" />
      <line x1="51" y1="68" x2="51" y2="84" stroke="#5a3a20" strokeWidth="1.5" />
      <line x1="109" y1="68" x2="109" y2="84" stroke="#5a3a20" strokeWidth="1.5" />
      {/* Chimney */}
      <rect x="110" y="20" width="14" height="30" rx="2" fill="#666" />
      {/* Garden flowers */}
      <circle cx="160" cy="80" r="4" fill="#f472b6" />
      <circle cx="170" cy="90" r="3" fill="#fb923c" />
      <circle cx="155" cy="95" r="3.5" fill="#a78bfa" />
      {/* Fence */}
      {[15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map(x => (
        <rect key={x} x={x} y="150" width="3" height="20" rx="1" fill="#8B7355" opacity="0.5" />
      ))}
      <rect x="15" y="155" width="155" height="2" fill="#8B7355" opacity="0.4" />
    </svg>
  );
}

export function ShedSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Dirt ground */}
      <rect x="5" y="5" width="190" height="190" rx="8" fill="#2a2218" />
      {/* Shed body */}
      <rect x="40" y="55" width="100" height="85" rx="3" fill="#78716C" />
      <rect x="45" y="60" width="90" height="75" rx="2" fill="#8a8278" />
      {/* Corrugated roof lines */}
      {[58, 65, 72, 79].map(y => (
        <line key={y} x1="35" y1={y} x2="145" y2={y} stroke="#5a564e" strokeWidth="2" opacity="0.6" />
      ))}
      <polygon points="35,60 90,30 145,60" fill="#5a564e" />
      <polygon points="40,60 90,35 140,60" fill="#6b655c" />
      {/* Big door */}
      <rect x="55" y="85" width="40" height="50" rx="2" fill="#4a4440" />
      <line x1="75" y1="85" x2="75" y2="135" stroke="#3a3430" strokeWidth="2" />
      {/* Padlock */}
      <rect x="71" y="105" width="8" height="7" rx="1" fill="#fbbf24" />
      <path d="M73,105 Q75,100 77,105" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
      {/* Weeds */}
      <line x1="20" y1="170" x2="25" y2="155" stroke="#4ade80" strokeWidth="2" />
      <line x1="165" y1="165" x2="170" y2="150" stroke="#4ade80" strokeWidth="2" />
      <line x1="160" y1="170" x2="162" y2="155" stroke="#22c55e" strokeWidth="1.5" />
    </svg>
  );
}

export function GarageSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Concrete pad */}
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#2a2a2a" />
      {/* Garage body */}
      <rect x="25" y="40" width="130" height="110" rx="4" fill="#CA8A04" opacity="0.3" />
      <rect x="30" y="45" width="120" height="100" rx="3" fill="#3a3520" />
      {/* Garage door */}
      <rect x="40" y="65" width="100" height="70" rx="2" fill="#555" />
      {[75, 85, 95, 105, 115, 125].map(y => (
        <line key={y} x1="42" y1={y} x2="138" y2={y} stroke="#444" strokeWidth="1.5" />
      ))}
      {/* Door handle */}
      <rect x="85" y="128" width="10" height="3" rx="1" fill="#888" />
      {/* Roof */}
      <rect x="20" y="38" width="140" height="8" rx="2" fill="#CA8A04" opacity="0.5" />
      {/* Toolbox */}
      <rect x="155" y="100" width="20" height="12" rx="2" fill="#dc2626" opacity="0.7" />
      {/* Oil stain */}
      <ellipse cx="90" cy="160" rx="15" ry="8" fill="#1a1a1a" opacity="0.5" />
    </svg>
  );
}

export function GrowHouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Dark interior glow */}
      <rect x="10" y="10" width="180" height="180" rx="6" fill="#0a2a0a" />
      {/* Building */}
      <rect x="25" y="35" width="130" height="120" rx="4" fill="#16A34A" opacity="0.25" />
      <rect x="30" y="40" width="120" height="110" rx="3" fill="#1a3a1a" />
      {/* Grow lights (purple glow) */}
      <rect x="45" y="50" width="90" height="6" rx="2" fill="#a855f7" opacity="0.8" />
      <rect x="45" y="80" width="90" height="6" rx="2" fill="#a855f7" opacity="0.8" />
      {/* Plants in rows */}
      {[60, 70, 90, 100].map(y => (
        <g key={y}>
          {[55, 75, 95, 115].map(x => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="6" fill="#22c55e" opacity="0.7" />
              <circle cx={x} cy={y} r="3" fill="#4ade80" opacity="0.8" />
            </g>
          ))}
        </g>
      ))}
      {/* Ventilation */}
      <rect x="70" y="35" width="40" height="8" rx="3" fill="#555" />
      <circle cx="80" cy="39" r="2" fill="#333" />
      <circle cx="100" cy="39" r="2" fill="#333" />
      {/* Water pipes */}
      <line x1="40" y1="115" x2="140" y2="115" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

export function GrowFacilitySprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="8" y="8" width="184" height="184" rx="6" fill="#0a1a2a" />
      {/* Large building */}
      <rect x="15" y="25" width="150" height="140" rx="5" fill="#0EA5E9" opacity="0.15" />
      <rect x="20" y="30" width="140" height="130" rx="4" fill="#0d2040" />
      {/* Multiple grow rooms */}
      <rect x="28" y="38" width="55" height="50" rx="2" fill="#16A34A" opacity="0.2" />
      <rect x="92" y="38" width="55" height="50" rx="2" fill="#16A34A" opacity="0.2" />
      <rect x="28" y="98" width="55" height="50" rx="2" fill="#16A34A" opacity="0.2" />
      <rect x="92" y="98" width="55" height="50" rx="2" fill="#16A34A" opacity="0.2" />
      {/* Grow lights per room */}
      {[48, 108].map(y => [35, 99].map(x => (
        <rect key={`${x}-${y}`} x={x} y={y} width="40" height="3" rx="1" fill="#a855f7" opacity="0.7" />
      )))}
      {/* Plants */}
      {[55, 65, 115, 125].map(y => [40, 55, 104, 119].map(x => (
        <circle key={`p${x}-${y}`} cx={x} cy={y} r="4" fill="#4ade80" opacity="0.6" />
      )))}
      {/* Industrial AC units on roof */}
      <rect x="165" y="40" width="20" height="15" rx="2" fill="#555" />
      <rect x="165" y="65" width="20" height="15" rx="2" fill="#555" />
      {/* Loading dock */}
      <rect x="60" y="160" width="50" height="12" rx="2" fill="#444" />
    </svg>
  );
}

export function LargeGrowSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="5" y="5" width="190" height="190" rx="6" fill="#0d0d20" />
      {/* Massive warehouse */}
      <rect x="10" y="15" width="170" height="155" rx="6" fill="#7C3AED" opacity="0.12" />
      <rect x="15" y="20" width="160" height="145" rx="4" fill="#15102a" />
      {/* 3×3 grow rooms */}
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <g key={`${r}-${c}`}>
          <rect x={23 + c * 50} y={28 + r * 44} width={42} height={36} rx="2" fill="#7C3AED" opacity="0.1" />
          <rect x={28 + c * 50} y={30 + r * 44} width={32} height="3" rx="1" fill="#a855f7" opacity="0.6" />
          {[0, 1, 2].map(p => (
            <circle key={p} cx={35 + c * 50 + p * 10} cy={44 + r * 44} r="4" fill="#4ade80" opacity="0.5" />
          ))}
        </g>
      )))}
      {/* Security camera */}
      <circle cx="185" cy="10" r="4" fill="#ef4444" opacity="0.6" />
      <line x1="185" y1="14" x2="185" y2="22" stroke="#666" strokeWidth="1.5" />
      {/* Biohazard sign */}
      <circle cx="100" cy="175" r="8" fill="#fbbf24" opacity="0.5" />
      <text x="100" y="179" textAnchor="middle" fontSize="10" fill="#1a1a1a" fontWeight="bold">☣</text>
    </svg>
  );
}

/* ── Special Buildings ────────────────────────────────────── */

export function LegalDistroSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="8" y="8" width="184" height="184" rx="6" fill="#1a2a1a" />
      {/* Dispensary building */}
      <rect x="25" y="40" width="120" height="100" rx="4" fill="#16A34A" opacity="0.2" />
      <rect x="30" y="45" width="110" height="90" rx="3" fill="#1a3020" />
      {/* Green cross sign */}
      <rect x="65" y="15" width="40" height="30" rx="4" fill="#16A34A" opacity="0.6" />
      <rect x="79" y="20" width="12" height="20" rx="1" fill="#fff" opacity="0.8" />
      <rect x="72" y="27" width="26" height="6" rx="1" fill="#fff" opacity="0.8" />
      {/* Display cases */}
      <rect x="40" y="60" width="35" height="20" rx="2" fill="#22c55e" opacity="0.15" />
      <rect x="85" y="60" width="35" height="20" rx="2" fill="#22c55e" opacity="0.15" />
      {/* Counter */}
      <rect x="40" y="100" width="90" height="8" rx="2" fill="#5a4a3a" />
      {/* Door */}
      <rect x="68" y="112" width="30" height="20" rx="2" fill="#333" />
      {/* Security bars */}
      {[70, 76, 82, 92].map(x => (
        <line key={x} x1={x} y1="112" x2={x} y2="132" stroke="#555" strokeWidth="1" opacity="0.5" />
      ))}
    </svg>
  );
}

export function GarageCarSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="8" y="8" width="184" height="184" rx="6" fill="#222" />
      {/* Large garage */}
      <rect x="15" y="25" width="150" height="130" rx="4" fill="#333" />
      {/* Bay doors */}
      <rect x="25" y="40" width="60" height="70" rx="2" fill="#444" />
      <rect x="95" y="40" width="60" height="70" rx="2" fill="#444" />
      {[50, 60, 70, 80, 90, 100].map(y => (
        <g key={y}>
          <line x1="27" y1={y} x2="83" y2={y} stroke="#3a3a3a" strokeWidth="1.5" />
          <line x1="97" y1={y} x2="153" y2={y} stroke="#3a3a3a" strokeWidth="1.5" />
        </g>
      ))}
      {/* Car inside left bay */}
      <g transform="translate(55,75) rotate(90)">
        <rect x="-12" y="-6" width="24" height="12" rx="3" fill="#ef4444" />
        <rect x="4" y="-4" width="6" height="8" rx="1.5" fill="#1e293b" opacity="0.7" />
      </g>
      {/* Car inside right bay */}
      <g transform="translate(125,75) rotate(90)">
        <rect x="-12" y="-6" width="24" height="12" rx="3" fill="#3b82f6" />
        <rect x="4" y="-4" width="6" height="8" rx="1.5" fill="#1e293b" opacity="0.7" />
      </g>
      {/* Tool wall */}
      <rect x="25" y="120" width="130" height="25" rx="2" fill="#2a2a2a" />
      {[40, 60, 80, 100, 120, 140].map(x => (
        <line key={x} x1={x} y1="122" x2={x} y2="140" stroke="#666" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export function HouseSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  const colors = ['#78716C', '#a08060', '#d4a054', '#fbbf24', '#f59e0b'];
  const fill = colors[level] ?? colors[0];
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Lawn */}
      <rect x="5" y="5" width="190" height="190" rx="8" fill="#1a3a1a" />
      {/* House — grows with level */}
      <rect x={35 - level * 5} y={50 - level * 5} width={110 + level * 10} height={90 + level * 5} rx="4" fill={fill} opacity="0.35" />
      <rect x={40 - level * 5} y={55 - level * 5} width={100 + level * 10} height={80 + level * 5} rx="3" fill={fill} opacity="0.2" />
      {/* Roof */}
      <polygon points={`${30 - level * 5},${55 - level * 5} ${85},${15 - level * 3} ${140 + level * 5},${55 - level * 5}`} fill={fill} opacity="0.4" />
      {/* Door */}
      <rect x="72" y={100 - level * 2} width={20 + level * 2} height={35 + level * 2} rx="2" fill="#3a2a1a" />
      <circle cx={88 + level} cy={118 - level} r="2" fill="#fbbf24" />
      {/* Windows — more with higher level */}
      <rect x="44" y="68" width="18" height="16" rx="1" fill="#fde68a" opacity="0.5" />
      <rect x="102" y="68" width="18" height="16" rx="1" fill="#fde68a" opacity="0.5" />
      {level >= 2 && <rect x="130" y="68" width="18" height="16" rx="1" fill="#fde68a" opacity="0.5" />}
      {level >= 3 && <rect x="44" y="45" width="18" height="14" rx="1" fill="#fde68a" opacity="0.4" />}
      {/* Pool at level 2+ */}
      {level >= 2 && (
        <ellipse cx="165" cy="150" rx={15 + level * 3} ry={10 + level * 2} fill="#38bdf8" opacity="0.5" />
      )}
      {/* Crown at max */}
      {level >= 4 && <text x="90" y="12" textAnchor="middle" fontSize="14">👑</text>}
    </svg>
  );
}

export function BackyardSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      {/* Grass base */}
      <rect x="5" y="5" width="190" height="190" rx="8" fill={level === 0 ? '#2a2218' : '#1a3a1a'} />
      {level === 0 && (
        <>
          {/* Dirt and weeds */}
          {[30, 80, 130, 60, 160].map((x, i) => (
            <line key={i} x1={x} y1={170 - i * 15} x2={x + 5} y2={150 - i * 15} stroke="#4a6a2a" strokeWidth="2" opacity="0.6" />
          ))}
        </>
      )}
      {level >= 1 && (
        <>
          {/* Nice grass */}
          <rect x="15" y="15" width="170" height="170" rx="6" fill="#22c55e" opacity="0.1" />
          {/* Path */}
          <rect x="85" y="140" width="30" height="50" rx="2" fill="#8B7355" opacity="0.3" />
        </>
      )}
      {level >= 2 && (
        <>
          {/* Pool */}
          <ellipse cx="100" cy="80" rx="45" ry="30" fill="#0ea5e9" opacity="0.4" />
          <ellipse cx="100" cy="80" rx="38" ry="24" fill="#38bdf8" opacity="0.3" />
          {/* Pool deck */}
          <rect x="50" y="105" width="100" height="8" rx="2" fill="#d4a054" opacity="0.3" />
        </>
      )}
      {level >= 3 && (
        <>
          {/* Garden */}
          {[30, 50, 150, 170].map(x => (
            <circle key={x} cx={x} cy={140} r="8" fill="#22c55e" opacity="0.3" />
          ))}
          {/* Gazebo */}
          <polygon points="140,20 170,35 140,50 110,35" fill="#8B7355" opacity="0.4" />
        </>
      )}
      {level >= 4 && (
        <>
          {/* Palm trees */}
          {[25, 175].map(x => (
            <g key={x}>
              <rect x={x - 2} y="30" width="4" height="40" rx="2" fill="#8B6640" />
              <circle cx={x} cy="25" r="15" fill="#22c55e" opacity="0.4" />
            </g>
          ))}
          {/* Waterfall */}
          <rect x="85" y="55" width="30" height="4" rx="2" fill="#60a5fa" opacity="0.6" />
          <line x1="100" y1="59" x2="100" y2="75" stroke="#60a5fa" strokeWidth="3" opacity="0.4" />
        </>
      )}
    </svg>
  );
}

export function HQSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  if (level === 0) {
    return (
      <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        <rect width="200" height="200" fill="#1a1a1a" />
        <rect x="8" y="8" width="184" height="184" rx="6" fill="#1a1a2a" />
        {/* Empty lot with "no HQ" vibe */}
        <circle cx="100" cy="80" r="30" fill="#ef4444" opacity="0.15" />
        <line x1="80" y1="60" x2="120" y2="100" stroke="#ef4444" strokeWidth="4" opacity="0.3" />
        <text x="100" y="140" textAnchor="middle" fontSize="16" fill="#666" opacity="0.5">NO HQ</text>
      </svg>
    );
  }
  const sizes = [0, 80, 110, 140, 160];
  const bw = sizes[level];
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="8" y="8" width="184" height="184" rx="6" fill="#12122a" />
      {/* Building */}
      <rect x={100 - bw / 2} y={150 - bw * 0.7} width={bw} height={bw * 0.7} rx="4" fill="#6366F1" opacity="0.2" />
      <rect x={100 - bw / 2 + 5} y={155 - bw * 0.7} width={bw - 10} height={bw * 0.7 - 10} rx="3" fill="#1a1a3a" />
      {/* Windows grid */}
      {Array.from({ length: Math.min(level + 1, 4) }).map((_, r) =>
        Array.from({ length: Math.min(level + 1, 4) }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={100 - bw / 2 + 12 + c * (bw / (level + 2))}
            y={160 - bw * 0.7 + 10 + r * 18}
            width="8" height="8" rx="1"
            fill="#6366F1" opacity="0.3"
          />
        ))
      )}
      {/* Antenna at level 3+ */}
      {level >= 3 && (
        <>
          <line x1="100" y1={150 - bw * 0.7 - 15} x2="100" y2={150 - bw * 0.7} stroke="#888" strokeWidth="2" />
          <circle cx="100" cy={150 - bw * 0.7 - 18} r="3" fill="#ef4444" opacity="0.8" />
        </>
      )}
      {/* Guard towers at level 4 */}
      {level >= 4 && (
        <>
          <rect x="20" y="60" width="20" height="30" rx="2" fill="#6366F1" opacity="0.25" />
          <rect x="160" y="60" width="20" height="30" rx="2" fill="#6366F1" opacity="0.25" />
          <circle cx="30" cy="55" r="3" fill="#ef4444" opacity="0.6" />
          <circle cx="170" cy="55" r="3" fill="#ef4444" opacity="0.6" />
        </>
      )}
      {/* Door */}
      <rect x="90" y="130" width="20" height="15" rx="2" fill="#333" />
    </svg>
  );
}

export function WarehouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a1a" />
      <rect x="8" y="8" width="184" height="184" rx="6" fill="#2a1a0a" />
      {/* Warehouse body */}
      <rect x="20" y="35" width="140" height="110" rx="4" fill="#92400E" opacity="0.25" />
      <rect x="25" y="40" width="130" height="100" rx="3" fill="#2a1a0d" />
      {/* Roll-up door */}
      <rect x="50" y="65" width="80" height="65" rx="2" fill="#555" />
      {[75, 85, 95, 105, 115, 125].map(y => (
        <line key={y} x1="52" y1={y} x2="128" y2={y} stroke="#444" strokeWidth="2" />
      ))}
      {/* Stacked boxes inside */}
      <rect x="60" y="85" width="18" height="15" rx="1" fill="#92400E" opacity="0.5" />
      <rect x="82" y="80" width="18" height="20" rx="1" fill="#a0522d" opacity="0.5" />
      <rect x="104" y="88" width="16" height="12" rx="1" fill="#92400E" opacity="0.4" />
      <rect x="66" y="73" width="14" height="12" rx="1" fill="#b5651d" opacity="0.4" />
      {/* Forklift */}
      <rect x="160" y="110" width="18" height="12" rx="2" fill="#fbbf24" opacity="0.5" />
      <rect x="163" y="105" width="2" height="12" fill="#888" />
      <rect x="173" y="105" width="2" height="12" fill="#888" />
    </svg>
  );
}

/** Map roomTypeId to its sprite component */
export const ROOM_SPRITE_MAP: Record<string, (props: SP) => JSX.Element> = {
  closet: GrandmaHouseSprite,
  shed: ShedSprite,
  garage: GarageSprite,
  small_grow: GrowHouseSprite,
  grow_facility: GrowFacilitySprite,
  large_grow: LargeGrowSprite,
};
