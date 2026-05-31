'use client';

export default function StarRating({ value, max = 5, size = 14 }: { value: number; max?: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < value ? '#F2552B' : 'none'} stroke="#F2552B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l2.7 6 6.3.6-4.8 4.4 1.5 6.5L12 17l-5.7 3.5 1.5-6.5L3 9.6l6.3-.6L12 3z"/>
        </svg>
      ))}
    </div>
  );
}
