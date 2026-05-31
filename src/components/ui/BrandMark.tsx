'use client';

export default function BrandMark({ size = 36, light = false }: { size?: number; light?: boolean }) {
  const fill = light ? '#fff' : 'var(--coral)';
  const stroke = light ? 'rgba(255,255,255,0.9)' : '#fff';
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ flexShrink: 0 }}>
      <rect width="80" height="80" rx="22" fill={fill}/>
      <g stroke={stroke} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 62 C16 46, 16 20, 30 12 C35 9, 41 12, 40 22 C39 12, 45 9, 50 12 C64 20, 64 46, 40 62Z"/>
        <path d="M32 36 L38 44 L50 30"/>
      </g>
    </svg>
  );
}
