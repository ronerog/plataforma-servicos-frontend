'use client';

import { ReactNode } from 'react';

export default function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 16,
      border: '1px solid var(--line-2)', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: '1px solid var(--line-2)',
      }}>
        <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: -0.1 }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}
