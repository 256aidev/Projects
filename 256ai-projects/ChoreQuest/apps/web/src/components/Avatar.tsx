interface AvatarProps {
  name: string;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export default function Avatar({ name, color, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const bg = color ?? '#6366f1';

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizes[size]}`}
      style={{ backgroundColor: bg }}
    >
      {initial}
    </div>
  );
}
