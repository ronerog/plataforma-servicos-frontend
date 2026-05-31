'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMeuPerfilPrestador } from '@/lib/api';
import GateScreen from '@/components/prestador/GateScreen';
import PendenteScreen from '@/components/prestador/PendenteScreen';
import ReprovadoScreen from '@/components/prestador/ReprovadoScreen';
import DashboardScreen from '@/components/prestador/DashboardScreen';

export default function PrestadorPage() {
  const { isPrestador } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPrestador) { setLoading(false); return; }
    getMeuPerfilPrestador()
      .then(r => setStatus(r.data.statusPrestador))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [isPrestador]);

  if (!isPrestador) return <GateScreen/>;
  if (loading) return null;
  if (status === 'REPROVADO') return <ReprovadoScreen onResubmitted={() => setStatus('PENDENTE_APROVACAO')}/>;
  if (status !== 'APROVADO') return <PendenteScreen/>;
  return <DashboardScreen/>;
}
