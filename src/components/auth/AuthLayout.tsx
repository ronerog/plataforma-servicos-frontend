'use client';

import { ReactNode } from 'react';
import BrandMark from '../ui/BrandMark';

interface AuthLayoutProps {
  children: ReactNode;
  step?: number;
  totalSteps?: number;
}

export default function AuthLayout({ children, step, totalSteps }: AuthLayoutProps) {
  const stats = [
    { n: '4.2k+', l: 'Voluntários ativos' },
    { n: '12.8k', l: 'Pedidos atendidos' },
    { n: '4.8', l: 'Nota média' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left hero */}
      <div style={{
        width: '46%', minWidth: 480, position: 'relative',
        background: 'linear-gradient(180deg, #F2552B 0%, #D63E15 100%)',
        color: '#fff', padding: '48px 56px',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Decorative stripes */}
        <svg viewBox="0 0 700 1000" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, opacity: 0.13, pointerEvents: 'none' }}>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={i * 38 - 80} y={-30} width={14} height={1100} fill="#fff" transform="rotate(-22, 350, 500)"/>
          ))}
        </svg>

        {/* Brand */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={44} light/>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6 }}>Mãos Dadas</div>
            <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: 0.5, textTransform: 'uppercase' }}>Serviços comunitários</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontSize: 52, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.02 }}>
            Sua comunidade<br/>tem braços abertos.
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, opacity: 0.92 }}>
            Encontre vizinhos dispostos a ajudar — ou ofereça seu talento. Tudo gratuito, tudo perto, tudo na confiança.
          </p>
          <div style={{ display: 'flex', gap: 28, marginTop: 12 }}>
            {stats.map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6 }}>{s.n}</div>
                <div style={{ fontSize: 11.5, opacity: 0.85, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12, opacity: 0.78 }}>
          © 2026 Mãos Dadas · Plataforma 100% gratuita
        </div>
      </div>

      {/* Right form */}
      <div style={{
        flex: 1, background: 'var(--cream)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '48px 56px',
        overflowY: 'auto',
      }}>
        {step !== undefined && totalSteps !== undefined && (
          <div style={{ width: '100%', maxWidth: 480, marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < step ? 'var(--coral)' : 'var(--line-2)',
                  transition: 'background .3s',
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, fontWeight: 600 }}>
              Passo {step} de {totalSteps}
            </div>
          </div>
        )}
        <div style={{ width: '100%', maxWidth: 480 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
