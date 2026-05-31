'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandMark from '../ui/BrandMark';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  area: 'cidadao' | 'prestador';
  onAreaChange: (a: 'cidadao' | 'prestador') => void;
}

export default function Header({ area, onAreaChange }: Props) {
  const { user, logout, isPrestador } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push('/auth');
  }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '0 24px', height: 'var(--header-h)',
      background: 'var(--paper)',
      borderBottom: '1px solid var(--line-2)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <BrandMark size={34}/>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>Mãos Dadas</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: 1.2, marginTop: 2 }}>Serviços comunitários</div>
        </div>
      </div>

      {/* Area toggle */}
      <div style={{
        display: 'flex', background: 'var(--cream)',
        borderRadius: 12, padding: 4,
        border: '1px solid var(--line-2)', marginLeft: 8, flexShrink: 0,
      }}>
        {([
          { id: 'cidadao', label: 'Área Cidadão', icon: 'user' },
          { id: 'prestador', label: 'Área Prestador', icon: 'handshake' },
        ] as const).map(a => {
          const active = area === a.id;
          return (
            <button key={a.id} onClick={() => onAreaChange(a.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: active ? 'var(--coral)' : 'transparent',
              color: active ? '#fff' : 'var(--ink-2)',
              fontWeight: 700, fontSize: 13, letterSpacing: -0.1,
              transition: 'background .15s', whiteSpace: 'nowrap',
            }}>
              <Icon name={a.icon} size={15} strokeWidth={2}/>
              {a.label}
              {a.id === 'prestador' && !isPrestador && (
                <span style={{
                  background: active ? 'rgba(255,255,255,0.25)' : 'var(--coral-soft)',
                  color: active ? '#fff' : 'var(--coral)',
                  fontSize: 9, fontWeight: 800, padding: '2px 6px',
                  borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase',
                }}>Novo</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }}/>

      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setMenuOpen(v => !v)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 14px 6px 6px', borderRadius: 10,
          background: menuOpen ? 'var(--cream)' : 'transparent',
          border: '1px solid ' + (menuOpen ? 'var(--line)' : 'transparent'),
          cursor: 'pointer', transition: 'background .15s',
        }}>
          <Avatar name={user?.email ?? 'U'} size={32}/>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
              {user?.email?.split('@')[0] ?? 'Usuário'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {user?.roles?.includes('ROLE_ADMIN') ? 'Admin' :
               user?.roles?.includes('ROLE_PRESTADOR') ? 'Prestador' : 'Cidadão'}
            </div>
          </div>
          <Icon name="chevronDown" size={14} color="var(--ink-3)"/>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
            background: 'var(--paper)', border: '1px solid var(--line-2)',
            borderRadius: 12, boxShadow: 'var(--shadow-md)',
            width: 200, zIndex: 100, overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-2)' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 2 }}>Conectado como</div>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '12px 14px', border: 'none',
              background: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13.5, fontWeight: 600, color: 'var(--red)',
            }}>
              <Icon name="logout" size={16}/> Sair da conta
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
