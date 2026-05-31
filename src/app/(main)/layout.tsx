'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/shell/Header';
import Sidebar from '@/components/shell/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { getMeuPerfilPrestador } from '@/lib/api';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isPrestador } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [area, setArea] = useState<'cidadao' | 'prestador'>(
    pathname?.startsWith('/prestador') || pathname?.startsWith('/admin') ? 'prestador' : 'cidadao'
  );
  const [prestadorStatus, setPrestadorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isPrestador) {
      getMeuPerfilPrestador()
        .then(r => setPrestadorStatus(r.data.statusPrestador))
        .catch(() => {});
    }
  }, [isPrestador]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth');
    }
  }, [user, isLoading, router]);

  function handleAreaChange(a: 'cidadao' | 'prestador') {
    setArea(a);
    if (a === 'cidadao') router.push('/vitrine');
    else router.push('/prestador');
  }

  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--coral)', borderTopColor: 'transparent' }}/>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header area={area} onAreaChange={handleAreaChange}/>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          area={area}
          isPrestadorAprovado={prestadorStatus === 'APROVADO'}
          isPrestadorPendente={isPrestador && prestadorStatus !== null && prestadorStatus !== 'APROVADO'}
        />
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 32px', background: 'var(--cream)',
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
