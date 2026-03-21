/**
 * Top-down (bird's eye) SVG sprites for Home Turf operations.
 * ViewBox 200×200, rendered at 72×72. Looking straight down at rooftops.
 */

interface SP { w?: number; h?: number }

// Parked car shape (top-down, ~28×14)
function Car({ x, y, color, rot = 0 }: { x: number; y: number; color: string; rot?: number }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rot})`}>
      <rect x="-14" y="-7" width="28" height="14" rx="4" fill={color} />
      <rect x="5" y="-5" width="7" height="10" rx="2" fill="#1e293b" opacity="0.7" />
      <rect x="-11" y="-4" width="5" height="8" rx="1.5" fill="#1e293b" opacity="0.5" />
      <circle cx="13" cy="-4" r="1.2" fill="#fde68a" />
      <circle cx="13" cy="4" r="1.2" fill="#fde68a" />
    </g>
  );
}

function Tree({ x, y, r = 10, shade = '#166534', leaf = '#22c55e' }: { x: number; y: number; r?: number; shade?: string; leaf?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={shade} opacity="0.7" />
      <circle cx={x} cy={y} r={r * 0.65} fill={leaf} opacity="0.6" />
    </g>
  );
}

/* ── Grow Rooms ────────────────────────────────────────────── */

export function GrandmaHouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Grass yard */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#1a3a1a" />
      {/* Building shadow */}
      <rect x="28" y="28" width="105" height="80" rx="3" fill="#000" opacity="0.25" />
      {/* Roof (seen from above — peaked roof = two toned halves) */}
      <rect x="22" y="20" width="105" height="80" rx="3" fill="#8B7355" />
      <rect x="22" y="20" width="105" height="40" rx="3" fill="#a08060" />
      {/* Roof ridge line */}
      <line x1="22" y1="60" x2="127" y2="60" stroke="#6d4c30" strokeWidth="2" />
      {/* Chimney (small square on roof) */}
      <rect x="105" y="25" width="14" height="12" rx="2" fill="#666" />
      <rect x="107" y="27" width="10" height="8" rx="1" fill="#444" />
      {/* Front porch / walkway */}
      <rect x="55" y="100" width="30" height="25" rx="1" fill="#8B7355" opacity="0.5" />
      {/* Fence around yard */}
      <rect x="8" y="8" width="184" height="184" rx="3" fill="none" stroke="#8B7355" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
      {/* Garden beds */}
      <rect x="140" y="30" width="45" height="20" rx="3" fill="#2d5a1a" />
      {[150, 160, 170].map(x => <circle key={x} cx={x} cy={40} r="4" fill="#f472b6" opacity="0.6" />)}
      {/* Trees */}
      <Tree x={160} y={140} r={14} />
      <Tree x={25} y={150} r={10} />
      {/* Driveway */}
      <rect x="55" y="125" width="30" height="70" rx="1" fill="#333" opacity="0.4" />
      {/* Parked car in driveway */}
      <Car x={70} y={165} color="#8b6640" rot={0} />
    </svg>
  );
}

export function ShedSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Dirt/gravel ground */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#2a2218" />
      <defs>
        <pattern id="gravel" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r="0.8" fill="#3a3228" />
          <circle cx="6" cy="6" r="0.6" fill="#3a3228" />
        </pattern>
      </defs>
      <rect x="5" y="5" width="190" height="190" fill="url(#gravel)" opacity="0.5" />
      {/* Shadow */}
      <rect x="38" y="42" width="95" height="70" rx="2" fill="#000" opacity="0.2" />
      {/* Shed roof (corrugated metal, top-down) */}
      <rect x="32" y="35" width="95" height="70" rx="2" fill="#78716C" />
      {/* Corrugation lines */}
      {[42, 49, 56, 63, 70, 77, 84, 91, 98].map(y => (
        <line key={y} x1="34" y1={y} x2="125" y2={y} stroke="#6b655c" strokeWidth="1.5" />
      ))}
      {/* Roof ridge */}
      <line x1="80" y1="35" x2="80" y2="105" stroke="#5a564e" strokeWidth="3" />
      {/* Door area visible from above */}
      <rect x="65" y="105" width="28" height="8" rx="1" fill="#4a4440" />
      {/* Weeds around shed */}
      {[20, 140, 155, 30].map((x, i) => (
        <circle key={i} cx={x} cy={[130, 80, 150, 170][i]} r="5" fill="#4ade80" opacity="0.25" />
      ))}
      {/* Old barrel */}
      <circle cx="150" cy="50" r="8" fill="#5a4a3a" />
      <circle cx="150" cy="50" r="5" fill="#4a3a2a" />
      {/* Woodpile */}
      <rect x="140" y="110" width="30" height="15" rx="2" fill="#8B6640" opacity="0.6" />
      <line x1="145" y1="110" x2="145" y2="125" stroke="#6d4c30" strokeWidth="1" />
      <line x1="155" y1="110" x2="155" y2="125" stroke="#6d4c30" strokeWidth="1" />
      <line x1="165" y1="110" x2="165" y2="125" stroke="#6d4c30" strokeWidth="1" />
    </svg>
  );
}

export function GarageSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Concrete pad */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#2a2a2a" />
      {/* Shadow */}
      <rect x="28" y="28" width="120" height="90" rx="3" fill="#000" opacity="0.2" />
      {/* Garage roof (flat) */}
      <rect x="20" y="20" width="120" height="90" rx="3" fill="#CA8A04" opacity="0.3" />
      <rect x="22" y="22" width="116" height="86" rx="2" fill="#3a3520" />
      {/* Roof edge accent */}
      <rect x="20" y="20" width="120" height="4" rx="1" fill="#CA8A04" opacity="0.5" />
      {/* AC unit on roof */}
      <rect x="100" y="30" width="25" height="18" rx="2" fill="#555" />
      <rect x="103" y="33" width="19" height="12" rx="5" fill="#444" />
      {/* Vent pipe */}
      <circle cx="45" cy="40" r="5" fill="#555" />
      <circle cx="45" cy="40" r="3" fill="#444" />
      {/* Garage door (seen from above = threshold strip) */}
      <rect x="35" y="108" width="80" height="6" rx="1" fill="#666" />
      {/* Driveway */}
      <rect x="50" y="114" width="50" height="80" rx="1" fill="#333" opacity="0.5" />
      {/* Oil stain on driveway */}
      <ellipse cx="75" cy="150" rx="12" ry="8" fill="#1a1a1a" opacity="0.4" />
      {/* Toolbox outside */}
      <rect x="150" y="50" width="18" height="10" rx="2" fill="#dc2626" opacity="0.6" />
      {/* Parked car */}
      <Car x={75} y={170} color="#64748b" rot={0} />
    </svg>
  );
}

export function GrowHouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Dark lot */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#0d1a0d" />
      {/* Shadow */}
      <rect x="23" y="23" width="130" height="100" rx="3" fill="#000" opacity="0.25" />
      {/* Roof — flat with green tint */}
      <rect x="15" y="15" width="130" height="100" rx="3" fill="#16A34A" opacity="0.2" />
      <rect x="17" y="17" width="126" height="96" rx="2" fill="#1a2a1a" />
      {/* Grow lights glow through skylights (purple strips) */}
      {[30, 50, 70, 90].map(y => (
        <rect key={y} x="30" y={y} width="100" height="8" rx="2" fill="#a855f7" opacity="0.35" />
      ))}
      {/* Plant rows visible through skylights */}
      {[34, 54, 74, 94].map(y => (
        <g key={y}>
          {[40, 55, 70, 85, 100, 115].map(x => (
            <circle key={x} cx={x} cy={y} r="3" fill="#4ade80" opacity="0.5" />
          ))}
        </g>
      ))}
      {/* HVAC units on roof */}
      <rect x="148" y="25" width="22" height="16" rx="2" fill="#555" />
      <rect x="151" y="28" width="16" height="10" rx="4" fill="#444" />
      <rect x="148" y="55" width="22" height="16" rx="2" fill="#555" />
      <rect x="151" y="58" width="16" height="10" rx="4" fill="#444" />
      {/* Exhaust vent */}
      <circle cx="155" cy="100" r="8" fill="#555" />
      <circle cx="155" cy="100" r="5" fill="#444" />
      {/* Fence */}
      <rect x="12" y="12" width="176" height="176" rx="3" fill="none" stroke="#333" strokeWidth="2" />
      {/* Back door threshold */}
      <rect x="60" y="115" width="35" height="5" rx="1" fill="#444" />
    </svg>
  );
}

export function GrowFacilitySprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#0a1520" />
      {/* Shadow */}
      <rect x="18" y="18" width="155" height="120" rx="4" fill="#000" opacity="0.25" />
      {/* Large flat roof */}
      <rect x="10" y="10" width="155" height="120" rx="4" fill="#0EA5E9" opacity="0.12" />
      <rect x="12" y="12" width="151" height="116" rx="3" fill="#0d1a2a" />
      {/* 4 skylights with purple glow (4 grow rooms) */}
      <rect x="20" y="20" width="60" height="45" rx="2" fill="#a855f7" opacity="0.15" />
      <rect x="90" y="20" width="60" height="45" rx="2" fill="#a855f7" opacity="0.15" />
      <rect x="20" y="75" width="60" height="45" rx="2" fill="#a855f7" opacity="0.15" />
      <rect x="90" y="75" width="60" height="45" rx="2" fill="#a855f7" opacity="0.15" />
      {/* Plant dots in each room */}
      {[35, 90].map(ox => [35, 90].map(oy => (
        <g key={`${ox}-${oy}`}>
          {[0, 15, 30, 45].map(dx => [0, 12, 24].map(dy => (
            <circle key={`${dx}-${dy}`} cx={ox + dx} cy={oy + dy} r="2.5" fill="#4ade80" opacity="0.4" />
          )))}
        </g>
      )))}
      {/* Industrial AC units on roof */}
      <rect x="168" y="20" width="22" height="30" rx="2" fill="#555" />
      <rect x="171" y="23" width="16" height="24" rx="5" fill="#444" />
      <rect x="168" y="60" width="22" height="30" rx="2" fill="#555" />
      <rect x="171" y="63" width="16" height="24" rx="5" fill="#444" />
      {/* Loading dock (from above = rectangle at bottom) */}
      <rect x="50" y="132" width="70" height="14" rx="2" fill="#444" />
      <rect x="55" y="134" width="25" height="10" rx="1" fill="#333" />
      <rect x="85" y="134" width="25" height="10" rx="1" fill="#333" />
      {/* Delivery truck from above */}
      <rect x="58" y="155" width="40" height="20" rx="3" fill="#f5f5f4" />
      <rect x="60" y="157" width="36" height="8" rx="2" fill="#1e293b" opacity="0.5" />
      {/* Security fence */}
      <rect x="7" y="7" width="186" height="186" rx="3" fill="none" stroke="#555" strokeWidth="1.5" strokeDasharray="4 3" />
    </svg>
  );
}

export function LargeGrowSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#0d0d1a" />
      {/* Shadow */}
      <rect x="13" y="13" width="175" height="140" rx="4" fill="#000" opacity="0.3" />
      {/* Massive warehouse roof */}
      <rect x="5" y="5" width="175" height="140" rx="4" fill="#7C3AED" opacity="0.1" />
      <rect x="7" y="7" width="171" height="136" rx="3" fill="#12102a" />
      {/* 3×3 skylights */}
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <rect key={`${r}-${c}`} x={15 + c * 55} y={15 + r * 40} width={45} height={30} rx="2"
          fill="#a855f7" opacity="0.12" />
      )))}
      {/* Plants visible */}
      {[0, 1, 2].map(r => [0, 1, 2].map(c => (
        <g key={`p${r}-${c}`}>
          {[0, 10, 20, 30].map(dx => [0, 8, 16].map(dy => (
            <circle key={`${dx}-${dy}`} cx={22 + c * 55 + dx} cy={20 + r * 40 + dy} r="2" fill="#4ade80" opacity="0.35" />
          )))}
        </g>
      )))}
      {/* Huge HVAC bank */}
      <rect x="10" y="150" width="170" height="20" rx="3" fill="#444" />
      {[20, 45, 70, 95, 120, 145].map(x => (
        <rect key={x} x={x} y="153" width="16" height="14" rx="4" fill="#333" />
      ))}
      {/* Security camera spots */}
      <circle cx="10" cy="10" r="4" fill="#ef4444" opacity="0.4" />
      <circle cx="180" cy="10" r="4" fill="#ef4444" opacity="0.4" />
      {/* Razor wire fence */}
      <rect x="3" y="3" width="194" height="194" rx="4" fill="none" stroke="#666" strokeWidth="2" />
      {/* Guard booth */}
      <rect x="170" y="170" width="22" height="22" rx="2" fill="#555" />
      <rect x="173" y="173" width="16" height="16" rx="1" fill="#444" />
    </svg>
  );
}

/* ── Special Buildings ────────────────────────────────────── */

export function LegalDistroSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#0d1a0d" />
      {/* Shadow */}
      <rect x="23" y="23" width="120" height="80" rx="3" fill="#000" opacity="0.2" />
      {/* Building roof */}
      <rect x="15" y="15" width="120" height="80" rx="3" fill="#16A34A" opacity="0.25" />
      <rect x="17" y="17" width="116" height="76" rx="2" fill="#1a2a1a" />
      {/* Green cross painted on roof */}
      <rect x="63" y="30" width="14" height="40" rx="1" fill="#22c55e" opacity="0.5" />
      <rect x="50" y="43" width="40" height="14" rx="1" fill="#22c55e" opacity="0.5" />
      {/* AC unit */}
      <rect x="110" y="22" width="16" height="12" rx="2" fill="#555" />
      <rect x="112" y="24" width="12" height="8" rx="3" fill="#444" />
      {/* Front entrance (threshold from above) */}
      <rect x="50" y="93" width="40" height="6" rx="1" fill="#333" />
      {/* Sidewalk */}
      <rect x="20" y="100" width="110" height="12" rx="1" fill="#444" opacity="0.3" />
      {/* Parking lot */}
      {[15, 45, 75, 105].map(x => (
        <rect key={x} x={x} y="145" width="1.5" height="35" fill="#555" opacity="0.5" />
      ))}
      <rect x="15" y="143" width="120" height="2" fill="#555" opacity="0.4" />
      {/* Parked cars */}
      <Car x={30} y={165} color="#22c55e" rot={0} />
      <Car x={90} y={165} color="#f5f5f4" rot={0} />
      {/* Tree */}
      <Tree x={160} y={40} r={16} />
      <Tree x={165} y={160} r={12} />
    </svg>
  );
}

export function GarageCarSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Concrete */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#252525" />
      {/* Shadow */}
      <rect x="18" y="18" width="140" height="100" rx="3" fill="#000" opacity="0.2" />
      {/* Garage roof — two bays */}
      <rect x="10" y="10" width="140" height="100" rx="3" fill="#555" opacity="0.25" />
      <rect x="12" y="12" width="136" height="96" rx="2" fill="#222" />
      {/* Bay divider */}
      <line x1="80" y1="12" x2="80" y2="108" stroke="#444" strokeWidth="2" />
      {/* Skylight strips */}
      <rect x="20" y="25" width="50" height="6" rx="1" fill="#555" opacity="0.3" />
      <rect x="90" y="25" width="50" height="6" rx="1" fill="#555" opacity="0.3" />
      {/* Cars visible through skylights */}
      <Car x={45} y={60} color="#ef4444" rot={90} />
      <Car x={115} y={60} color="#3b82f6" rot={90} />
      {/* Door thresholds */}
      <rect x="20" y="108" width="50" height="5" rx="1" fill="#666" />
      <rect x="90" y="108" width="50" height="5" rx="1" fill="#666" />
      {/* Driveway */}
      <rect x="25" y="113" width="110" height="80" rx="1" fill="#333" opacity="0.3" />
      {/* Third car parked outside */}
      <Car x={80} y={155} color="#fbbf24" rot={0} />
      {/* Tool cabinet against wall from above */}
      <rect x="155" y="20" width="10" height="70" rx="1" fill="#555" opacity="0.4" />
    </svg>
  );
}

export function HouseSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  const roofSize = 80 + level * 15;
  const roofColor = ['#78716C', '#a08060', '#d4a054', '#fbbf24', '#f59e0b'][level];
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      {/* Lawn */}
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#1a3a1a" />
      {/* Building shadow */}
      <rect x={100 - roofSize / 2 + 8} y={80 - roofSize * 0.35 + 8} width={roofSize} height={roofSize * 0.7} rx="3" fill="#000" opacity="0.2" />
      {/* Roof */}
      <rect x={100 - roofSize / 2} y={80 - roofSize * 0.35} width={roofSize} height={roofSize * 0.7} rx="3" fill={roofColor} opacity="0.5" />
      <rect x={100 - roofSize / 2 + 2} y={80 - roofSize * 0.35 + 2} width={roofSize - 4} height={roofSize * 0.7 - 4} rx="2" fill={roofColor} opacity="0.25" />
      {/* Roof ridge */}
      <line x1={100 - roofSize / 2} y1={80} x2={100 + roofSize / 2} y2={80} stroke={roofColor} strokeWidth="2" opacity="0.7" />
      {/* Chimney */}
      <rect x={100 + roofSize / 2 - 20} y={80 - roofSize * 0.35 + 5} width="12" height="10" rx="2" fill="#666" />
      {/* Pool at level 2+ */}
      {level >= 2 && (
        <>
          <rect x="130" y="130" width={30 + level * 5} height={20 + level * 3} rx="4" fill="#0ea5e9" opacity="0.5" />
          <rect x="133" y="133" width={24 + level * 5} height={14 + level * 3} rx="3" fill="#38bdf8" opacity="0.3" />
        </>
      )}
      {/* Walkway */}
      <rect x="85" y={80 + roofSize * 0.35} width="30" height="30" rx="1" fill="#8B7355" opacity="0.3" />
      {/* Driveway */}
      <rect x="15" y="150" width="50" height="40" rx="1" fill="#333" opacity="0.4" />
      <Car x={40} y={170} color="#8b6640" rot={0} />
      {/* Trees */}
      <Tree x={170} y={30} r={level >= 3 ? 16 : 12} />
      <Tree x={20} y={40} r={10} />
      {level >= 4 && <>
        <Tree x={170} y={170} r={14} shade="#0d5a0d" leaf="#16a34a" />
        <Tree x={25} y={170} r={12} shade="#0d5a0d" leaf="#16a34a" />
      </>}
      {/* Crown at max */}
      {level >= 4 && <text x="100" y="20" textAnchor="middle" fontSize="16">👑</text>}
    </svg>
  );
}

export function BackyardSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill={level === 0 ? '#2a2218' : '#1a3a1a'} />
      {level === 0 && <>
        {/* Dirt patches */}
        <ellipse cx="60" cy="80" rx="25" ry="15" fill="#332a18" opacity="0.5" />
        <ellipse cx="140" cy="120" rx="20" ry="12" fill="#332a18" opacity="0.4" />
        {/* Scattered weeds */}
        {[40, 80, 120, 160].map((x, i) => (
          <circle key={i} cx={x} cy={[60, 140, 100, 50][i]} r="4" fill="#4ade80" opacity="0.2" />
        ))}
      </>}
      {level >= 1 && <>
        {/* Nice grass */}
        <rect x="15" y="15" width="170" height="170" rx="4" fill="#22c55e" opacity="0.08" />
        {/* Stone path */}
        {[80, 100, 120, 140, 160].map(y => (
          <ellipse key={y} cx="100" cy={y} rx="10" ry="5" fill="#8B7355" opacity="0.3" />
        ))}
      </>}
      {level >= 2 && <>
        {/* Pool from above */}
        <rect x="40" y="30" width="100" height="60" rx="12" fill="#0ea5e9" opacity="0.5" />
        <rect x="45" y="35" width="90" height="50" rx="10" fill="#38bdf8" opacity="0.4" />
        {/* Pool deck */}
        <rect x="35" y="90" width="110" height="10" rx="2" fill="#d4a054" opacity="0.3" />
      </>}
      {level >= 3 && <>
        {/* Garden beds */}
        <rect x="15" y="120" width="40" height="25" rx="3" fill="#166534" opacity="0.4" />
        <rect x="140" y="120" width="40" height="25" rx="3" fill="#166534" opacity="0.4" />
        {[25, 35, 45].map(x => <circle key={x} cx={x} cy={132} r="4" fill="#f472b6" opacity="0.5" />)}
        {[150, 160, 170].map(x => <circle key={x} cx={x} cy={132} r="4" fill="#fbbf24" opacity="0.5" />)}
        {/* Gazebo (octagonal shape from above) */}
        <polygon points="100,155 115,160 120,175 115,185 100,190 85,185 80,175 85,160" fill="#8B7355" opacity="0.35" />
        <circle cx="100" cy="173" r="6" fill="#8B6640" opacity="0.4" />
      </>}
      {level >= 4 && <>
        {/* Palm trees */}
        <Tree x={20} y={30} r={16} shade="#0d5a0d" leaf="#16a34a" />
        <Tree x={180} y={30} r={16} shade="#0d5a0d" leaf="#16a34a" />
        {/* Waterfall feature */}
        <ellipse cx="100" cy="25" rx="15" ry="8" fill="#38bdf8" opacity="0.5" />
        <rect x="95" y="25" width="10" height="8" fill="#60a5fa" opacity="0.4" />
      </>}
    </svg>
  );
}

export function HQSprite({ w = 72, h = 72, level = 0 }: SP & { level: number }) {
  if (level === 0) {
    return (
      <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
        <rect width="200" height="200" fill="#1a1a2a" />
        <rect x="5" y="5" width="190" height="190" rx="4" fill="#1a1a2a" />
        {/* Empty lot — gravel */}
        <ellipse cx="100" cy="100" rx="60" ry="40" fill="#2a2a2a" opacity="0.3" />
        {/* "No HQ" circle */}
        <circle cx="100" cy="90" r="25" fill="none" stroke="#ef4444" strokeWidth="3" opacity="0.25" />
        <line x1="82" y1="72" x2="118" y2="108" stroke="#ef4444" strokeWidth="3" opacity="0.25" />
      </svg>
    );
  }
  const bw = [0, 80, 110, 140, 165][level];
  const bh = [0, 55, 75, 95, 115][level];
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#12122a" />
      {/* Shadow */}
      <rect x={100 - bw / 2 + 6} y={85 - bh / 2 + 6} width={bw} height={bh} rx="3" fill="#000" opacity="0.25" />
      {/* Roof */}
      <rect x={100 - bw / 2} y={85 - bh / 2} width={bw} height={bh} rx="3" fill="#6366F1" opacity="0.2" />
      <rect x={100 - bw / 2 + 2} y={85 - bh / 2 + 2} width={bw - 4} height={bh - 4} rx="2" fill="#1a1a3a" />
      {/* Roof edge accent */}
      <rect x={100 - bw / 2} y={85 - bh / 2} width={bw} height="4" rx="1" fill="#6366F1" opacity="0.4" />
      {/* AC units — more with higher level */}
      {Array.from({ length: level }).map((_, i) => (
        <g key={i}>
          <rect x={100 - bw / 2 + 8 + i * 25} y={85 - bh / 2 + 8} width="18" height="12" rx="2" fill="#555" />
          <rect x={100 - bw / 2 + 10 + i * 25} y={85 - bh / 2 + 10} width="14" height="8" rx="4" fill="#444" />
        </g>
      ))}
      {/* Satellite dish at level 3+ */}
      {level >= 3 && (
        <>
          <circle cx={100 + bw / 2 - 15} cy={85 - bh / 2 + 12} r="8" fill="#888" opacity="0.5" />
          <circle cx={100 + bw / 2 - 15} cy={85 - bh / 2 + 12} r="3" fill="#aaa" opacity="0.5" />
        </>
      )}
      {/* Helipad at level 4 */}
      {level >= 4 && (
        <>
          <circle cx="100" cy="85" r="22" fill="none" stroke="#6366F1" strokeWidth="2" opacity="0.4" />
          <text x="100" y="91" textAnchor="middle" fontSize="18" fill="#6366F1" opacity="0.5" fontWeight="bold">H</text>
        </>
      )}
      {/* Guard posts at level 4 */}
      {level >= 4 && (
        <>
          <rect x="10" y="10" width="16" height="16" rx="2" fill="#555" />
          <circle cx="18" cy="18" r="3" fill="#ef4444" opacity="0.5" />
          <rect x="174" y="10" width="16" height="16" rx="2" fill="#555" />
          <circle cx="182" cy="18" r="3" fill="#ef4444" opacity="0.5" />
        </>
      )}
      {/* Entrance door from above */}
      <rect x="88" y={85 + bh / 2 - 2} width="24" height="5" rx="1" fill="#444" />
      {/* Parking area */}
      <rect x="20" y="155" width="160" height="2" fill="#555" opacity="0.3" />
      {level >= 2 && <Car x={50} y={175} color="#1e293b" rot={0} />}
      {level >= 3 && <Car x={120} y={175} color="#333" rot={0} />}
      {/* Security fence at level 2+ */}
      {level >= 2 && (
        <rect x="7" y="7" width="186" height="186" rx="3" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.3" />
      )}
    </svg>
  );
}

export function WarehouseSprite({ w = 72, h = 72 }: SP) {
  return (
    <svg viewBox="0 0 200 200" width={w} height={h} className="block" style={{ borderRadius: 6 }}>
      <rect width="200" height="200" fill="#1a1a2a" />
      <rect x="5" y="5" width="190" height="190" rx="4" fill="#1a1008" />
      {/* Shadow */}
      <rect x="18" y="18" width="130" height="95" rx="3" fill="#000" opacity="0.2" />
      {/* Warehouse roof */}
      <rect x="10" y="10" width="130" height="95" rx="3" fill="#92400E" opacity="0.2" />
      <rect x="12" y="12" width="126" height="91" rx="2" fill="#1a1008" />
      {/* Roof ridges (corrugated) */}
      {[20, 30, 40, 50, 60, 70, 80, 90].map(y => (
        <line key={y} x1="14" y1={y} x2="136" y2={y} stroke="#92400E" strokeWidth="1" opacity="0.2" />
      ))}
      {/* Loading bay from above */}
      <rect x="35" y="105" width="75" height="10" rx="1" fill="#555" />
      <rect x="40" y="107" width="28" height="6" rx="1" fill="#444" />
      <rect x="75" y="107" width="28" height="6" rx="1" fill="#444" />
      {/* Delivery truck from above */}
      <rect x="45" y="125" width="50" height="25" rx="3" fill="#f5f5f4" opacity="0.7" />
      <rect x="47" y="127" width="46" height="10" rx="2" fill="#1e293b" opacity="0.5" />
      {/* Forklift from above */}
      <rect x="150" y="50" width="14" height="20" rx="2" fill="#fbbf24" opacity="0.5" />
      <rect x="153" y="45" width="3" height="8" fill="#888" />
      <rect x="159" y="45" width="3" height="8" fill="#888" />
      {/* Stacked pallets visible through skylight */}
      <rect x="25" y="25" width="15" height="15" rx="1" fill="#92400E" opacity="0.3" />
      <rect x="50" y="25" width="15" height="15" rx="1" fill="#a0522d" opacity="0.3" />
      <rect x="75" y="25" width="15" height="15" rx="1" fill="#92400E" opacity="0.25" />
      <rect x="25" y="50" width="15" height="15" rx="1" fill="#b5651d" opacity="0.25" />
      <rect x="50" y="50" width="15" height="15" rx="1" fill="#92400E" opacity="0.3" />
      {/* Security light */}
      <circle cx="145" cy="15" r="4" fill="#fbbf24" opacity="0.3" />
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
