'use client';

import Icon from './Icon';

export default function EmptyState({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 32px', textAlign: 'center', color: 'var(--ink-3)',
    }}>
      <div style={{ marginBottom: 16, opacity: 0.4 }}>
        <Icon name={icon} size={48} strokeWidth={1.5}/>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>{title}</div>
      {body && <div style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 360 }}>{body}</div>}
    </div>
  );
}
