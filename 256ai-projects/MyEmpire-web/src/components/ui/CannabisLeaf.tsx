interface Props {
  size?: number;
  className?: string;
}

// Neon outline cannabis leaf — matches the glow sign style
export default function CannabisLeaf({ size = 24, className = '' }: Props) {
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
        {/* Outer wide glow */}
        <filter id="neon-outer" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
          <feColorMatrix in="blur" type="matrix"
            values="0 0 0 0 0.1  0 0 0 0 1  0 0 0 0 0.1  0 0 0 1 0" result="green"/>
          <feMerge>
            <feMergeNode in="green"/>
            <feMergeNode in="green"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        {/* Inner sharp glow */}
        <filter id="neon-inner" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow layer */}
      <g filter="url(#neon-outer)">
        <path
          d="M100 210 L100 168
             C 95 165 78 172 58 182
             C 68 170 82 162 100 158
             C 78 153 50 158 25 170
             C 38 150 70 146 100 143
             C 68 130 35 135 10 150
             C 26 126 65 120 100 118
             C 78 95 58 68 54 42
             C 60 30 72 16 100 8
             C 128 16 140 30 146 42
             C 142 68 122 95 100 118
             C 135 120 174 126 190 150
             C 165 135 132 130 100 143
             C 130 146 162 150 175 170
             C 150 158 122 153 100 158
             C 118 162 132 170 142 182
             C 122 172 105 165 100 168 Z"
          stroke="#39ff14"
          strokeWidth="5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Stem */}
        <line x1="100" y1="210" x2="100" y2="185" stroke="#39ff14" strokeWidth="5" strokeLinecap="round"/>
      </g>

      {/* Sharp inner line on top */}
      <g filter="url(#neon-inner)">
        <path
          d="M100 210 L100 168
             C 95 165 78 172 58 182
             C 68 170 82 162 100 158
             C 78 153 50 158 25 170
             C 38 150 70 146 100 143
             C 68 130 35 135 10 150
             C 26 126 65 120 100 118
             C 78 95 58 68 54 42
             C 60 30 72 16 100 8
             C 128 16 140 30 146 42
             C 142 68 122 95 100 118
             C 135 120 174 126 190 150
             C 165 135 132 130 100 143
             C 130 146 162 150 175 170
             C 150 158 122 153 100 158
             C 118 162 132 170 142 182
             C 122 172 105 165 100 168 Z"
          stroke="#ccffcc"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line x1="100" y1="210" x2="100" y2="185" stroke="#ccffcc" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  );
}
