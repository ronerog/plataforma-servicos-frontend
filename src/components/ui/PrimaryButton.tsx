'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export default function PrimaryButton({
  children, icon, fullWidth = true, variant = 'primary', size = 'md', style: extraStyle, ...rest
}: Props) {
  const heights = { sm: 36, md: 44, lg: 52 };
  const fontSizes = { sm: 13, md: 14.5, lg: 15.5 };
  const paddings = { sm: '0 14px', md: '0 20px', lg: '0 28px' };

  const bg = variant === 'primary' ? 'var(--coral)' : variant === 'outline' ? 'var(--paper)' : 'transparent';
  const color = variant === 'primary' ? '#fff' : variant === 'outline' ? 'var(--ink-2)' : 'var(--ink-2)';
  const border = variant === 'outline' ? '1.5px solid var(--line)' : variant === 'ghost' ? 'none' : 'none';

  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, width: fullWidth ? '100%' : 'auto',
        height: heights[size], padding: paddings[size],
        borderRadius: 12, border,
        background: bg, color,
        fontWeight: 700, fontSize: fontSizes[size],
        cursor: 'pointer', transition: 'opacity .15s, transform .1s',
        ...extraStyle,
      }}
      onMouseEnter={e => { (e.target as HTMLButtonElement).style.opacity = '0.88'; }}
      onMouseLeave={e => { (e.target as HTMLButtonElement).style.opacity = '1'; }}
    >
      {children}
      {icon}
    </button>
  );
}
