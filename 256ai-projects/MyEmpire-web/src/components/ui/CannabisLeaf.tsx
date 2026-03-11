interface Props {
  size?: number;
  className?: string;
}

// 5-finger neon marijuana leaf — each leaflet is a separate serrated path, rotated from hub
// Hub at (0,0) in local space; transformed to (100,158) in viewBox space
export default function CannabisLeaf({ size = 24, className = '' }: Props) {
  // Each path: hub at origin (0,0), pointing straight up (-y), serrated edges
  const center = `M 0,0
    L 5,-10 L 12,-18 L 5,-26 L 13,-34 L 5,-42 L 14,-50
    L 5,-58 L 13,-66 L 5,-74 L 10,-83 L 3,-91 L 0,-100
    L -3,-91 L -10,-83 L -5,-74 L -13,-66 L -5,-58 L -14,-50
    L -5,-42 L -13,-34 L -5,-26 L -12,-18 L -5,-10 Z`;

  const upper = `M 0,0
    L 4,-8 L 10,-15 L 4,-23 L 10,-30 L 4,-38
    L 10,-45 L 4,-52 L 9,-60 L 4,-67 L 7,-74 L 2,-80 L 0,-82
    L -2,-80 L -7,-74 L -4,-67 L -9,-60 L -4,-52
    L -10,-45 L -4,-38 L -10,-30 L -4,-23 L -10,-15 L -4,-8 Z`;

  const lower = `M 0,0
    L 3,-7 L 8,-13 L 3,-20 L 8,-27 L 3,-34
    L 8,-40 L 3,-47 L 7,-53 L 3,-59 L 6,-64 L 2,-68 L 0,-70
    L -2,-68 L -6,-64 L -3,-59 L -7,-53 L -3,-47
    L -8,-40 L -3,-34 L -8,-27 L -3,-20 L -8,-13 L -3,-7 Z`;

  const T = 'translate(100,158)';

  const leaves = [
    { d: center, t: T },
    { d: upper,  t: `${T} rotate(40)`  },
    { d: upper,  t: `${T} rotate(-40)` },
    { d: lower,  t: `${T} rotate(67)`  },
    { d: lower,  t: `${T} rotate(-67)` },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <filter id="cl-outer" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.1  0 0 0 0 1  0 0 0 0 0.1  0 0 0 1 0" result="green" />
          <feMerge>
            <feMergeNode in="green" />
            <feMergeNode in="green" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="cl-inner" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow */}
      <g filter="url(#cl-outer)" stroke="#39ff14" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <line x1="100" y1="210" x2="100" y2="158" />
        {leaves.map((l, i) => <path key={i} d={l.d} transform={l.t} />)}
      </g>

      {/* Sharp inner line */}
      <g filter="url(#cl-inner)" stroke="#ccffcc" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
        <line x1="100" y1="210" x2="100" y2="158" />
        {leaves.map((l, i) => <path key={i} d={l.d} transform={l.t} />)}
      </g>
    </svg>
  );
}
