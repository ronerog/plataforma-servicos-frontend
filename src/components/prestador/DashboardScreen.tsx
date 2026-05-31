'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { getServicos, getMinhasSolicitacoes } from '@/lib/api';

interface Servico { id: number; titulo: string; nomeCategoria: string; statusServico: string }
interface Solicitacao { id: number; nomeServico: string; nomePrestador?: string; dataSolicitacao: string; statusSolicitacao: string }

function KpiCard({ label, value, sub, icon, tint }: { label: string; value: string | number; sub: string; icon: string; tint: string }) {
  return (
    <div style={{
      background: 'var(--paper)', borderRadius: 14, border: '1px solid var(--line-2)',
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${tint}18`, color: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={20}/>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 600, marginTop: 3 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServicos().then(r => { setServicos(r.data.slice(0, 5)); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Painel do prestador"
        subtitle="Sua atividade como voluntário"
        actions={[
          <button key="new" onClick={() => router.push('/prestador/servicos')} style={{
            height: 44, padding: '0 18px', borderRadius: 12, border: 'none',
            background: 'var(--coral)', color: '#fff',
            fontWeight: 800, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="plus" size={16}/> Novo serviço
          </button>,
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Serviços publicados" value={servicos.length} sub="ativos na plataforma" icon="list" tint="var(--coral)"/>
        <KpiCard label="Plataforma" value="Ativa" sub="sua conta está aprovada" icon="checkCircle" tint="var(--green)"/>
        <KpiCard label="Atendimentos" value="—" sub="acesse Minhas Solicitações" icon="handshake" tint="var(--amber)"/>
      </div>

      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 13.5 }}>Meus serviços recentes</span>
          <button onClick={() => router.push('/prestador/servicos')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontWeight: 700, fontSize: 13 }}>
            Ver todos
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-3)' }}>Carregando…</div>
        ) : servicos.length === 0 ? (
          <EmptyState icon="list" title="Nenhum serviço ainda" body="Publique seu primeiro serviço para começar."/>
        ) : (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {servicos.map(s => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px',
                borderRadius: 10, border: '1px solid transparent',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--coral-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="list" size={16} color="var(--coral)"/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.nomeCategoria}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  background: s.statusServico === 'PUBLICADO' ? 'var(--green-soft)' : 'var(--cream)',
                  color: s.statusServico === 'PUBLICADO' ? 'var(--green)' : 'var(--ink-3)',
                }}>
                  {s.statusServico}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
