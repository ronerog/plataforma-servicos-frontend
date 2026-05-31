'use client';

import { useRouter, usePathname } from 'next/navigation';
import Icon from '../ui/Icon';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  kind?: 'section';
  id?: string;
  label: string;
  icon?: string;
  badge?: number;
  href?: string;
}

interface Props {
  area: 'cidadao' | 'prestador';
  isPrestadorAprovado?: boolean;
  isPrestadorPendente?: boolean;
}

export default function Sidebar({ area, isPrestadorAprovado, isPrestadorPendente }: Props) {
  const { isPrestador, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const cidadaoItems: NavItem[] = [
    { kind: 'section', label: 'Cidadão' },
    { id: 'vitrine', label: 'Buscar serviços', icon: 'search', href: '/vitrine' },
    { id: 'solicitacoes', label: 'Minhas solicitações', icon: 'list', href: '/solicitacoes' },
    { id: 'avaliacoes', label: 'Avaliações pendentes', icon: 'star', href: '/avaliacoes' },
    { kind: 'section', label: 'Conta' },
    { id: 'perfil', label: 'Meu perfil', icon: 'user', href: '/perfil' },
  ];

  const prestadorItems: NavItem[] = [
    { kind: 'section', label: 'Prestador' },
    ...(!isPrestador ? [{ id: 'gate', label: 'Tornar-se prestador', icon: 'handshake', href: '/prestador' }] : []),
    ...(isPrestador && isPrestadorPendente ? [{ id: 'pendente', label: 'Aguardando aprovação', icon: 'clock', href: '/prestador' }] : []),
    ...(isPrestador && isPrestadorAprovado ? [
      { id: 'dashboard', label: 'Painel', icon: 'home', href: '/prestador' },
      { id: 'servicos', label: 'Meus serviços', icon: 'list', href: '/prestador/servicos' },
      { id: 'recebidas', label: 'Solicitações recebidas', icon: 'bell', href: '/prestador/recebidas' },
      { kind: 'section' as const, label: 'Conta' },
      { id: 'perfil-prestador', label: 'Meu perfil', icon: 'user', href: '/prestador/perfil' },
    ] : []),
    ...(isAdmin ? [
      { kind: 'section' as const, label: 'Administração' },
      { id: 'admin', label: 'Painel Admin', icon: 'settings', href: '/admin' },
    ] : []),
  ];

  const items = area === 'cidadao' ? cidadaoItems : prestadorItems;

  function isActive(href?: string) {
    if (!href) return false;
    if (href === '/vitrine') return pathname === '/' || pathname === '/vitrine';
    return pathname.startsWith(href);
  }

  return (
    <aside style={{
      width: 'var(--sidebar-w)', flexShrink: 0,
      background: 'var(--paper)', borderRight: '1px solid var(--line-2)',
      display: 'flex', flexDirection: 'column', padding: '16px 12px',
      overflowY: 'auto',
    }}>
      {items.map((item, i) => {
        if (item.kind === 'section') {
          return (
            <div key={i} style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8,
              textTransform: 'uppercase', color: 'var(--ink-3)',
              padding: '16px 10px 6px', marginTop: i === 0 ? 0 : 4,
            }}>
              {item.label}
            </div>
          );
        }

        const active = isActive(item.href);

        return (
          <button key={item.id} onClick={() => item.href && router.push(item.href)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: active ? 'var(--coral-tint)' : 'transparent',
            color: active ? 'var(--coral)' : 'var(--ink-2)',
            fontWeight: active ? 700 : 600, fontSize: 13.5,
            width: '100%', textAlign: 'left', transition: 'background .12s',
          }}
          onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--cream)'; }}
          onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {item.icon && <Icon name={item.icon} size={16} strokeWidth={active ? 2.5 : 2}/>}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span style={{
                background: 'var(--coral)', color: '#fff',
                fontSize: 10.5, fontWeight: 800,
                minWidth: 18, height: 18, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 5px',
              }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}
