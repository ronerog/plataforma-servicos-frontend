'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../ui/PageHeader';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';
import { getMinhasSolicitacoes, avaliarComoCidadao } from '@/lib/api';
import { toast } from 'sonner';

interface Solicitacao {
  id: number;
  nomeServico: string;
  nomePrestador: string;
  dataSolicitacao: string;
  prazoAvaliacao: string;
  statusSolicitacao: string;
  cidadaoAvaliou: boolean;
}

export default function AvaliacoesScreen() {
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Solicitacao | null>(null);

  useEffect(() => {
    getMinhasSolicitacoes().then(r => {
      const p = r.data.filter((s: Solicitacao) =>
        s.statusSolicitacao === 'CONCLUIDA' && !s.cidadaoAvaliou
      );
      setPendentes(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function avaliar(idSolicitacao: number, nota: number, comentario: string, servicoRealizado: boolean) {
    await avaliarComoCidadao({ idSolicitacao, nota, comentario, servicoRealizado });
    setPendentes(ps => ps.filter(p => p.id !== idSolicitacao));
    setModal(null);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Carregando…</div>;

  return (
    <div>
      <PageHeader
        title="Avaliações pendentes"
        subtitle="Serviços aguardando sua avaliação"
      />

      {pendentes.length === 0 ? (
        <EmptyState icon="star" title="Nenhuma avaliação pendente" body="Quando você concluir uma solicitação, ela aparecerá aqui para avaliação."/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendentes.map(s => (
            <div key={s.id} style={{
              background: 'var(--paper)', borderRadius: 14,
              border: '1px solid var(--line-2)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{s.nomeServico}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  Prestador: {s.nomePrestador} · {new Date(s.dataSolicitacao).toLocaleDateString('pt-BR')}
                </div>
                {s.prazoAvaliacao && (
                  <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 4, fontWeight: 600 }}>
                    <Icon name="clock" size={13}/> Prazo: {new Date(s.prazoAvaliacao).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
              <button onClick={() => setModal(s)} style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: 'var(--coral)', color: '#fff',
                fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
              }}>
                Avaliar
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <AvaliacaoRapida
          solicitacao={modal}
          onClose={() => setModal(null)}
          onSubmit={avaliar}
        />
      )}
    </div>
  );
}

function AvaliacaoRapida({
  solicitacao, onClose, onSubmit,
}: { solicitacao: Solicitacao; onClose: () => void; onSubmit: (id: number, nota: number, comentario: string, realizado: boolean) => void }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [realizado, setRealizado] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!comentario.trim()) { toast.warning('Escreva um comentário.'); return; }
    setLoading(true);
    try { await onSubmit(solicitacao.id, nota, comentario, realizado); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper)', borderRadius: 20, padding: 28, width: 460, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Avaliar serviço</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>{solicitacao.nomeServico}</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Nota</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setNota(n)} style={{
                width: 44, height: 44, borderRadius: 8, border: 'none',
                background: n <= nota ? 'var(--coral)' : 'var(--cream)',
                color: n <= nota ? '#fff' : 'var(--ink-3)', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Serviço realizado?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setRealizado(v)} style={{
                flex: 1, padding: 10, borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${realizado === v ? 'var(--coral)' : 'var(--line)'}`,
                background: realizado === v ? 'var(--coral-tint)' : 'transparent',
                color: realizado === v ? 'var(--coral)' : 'var(--ink-2)', fontWeight: 700, fontSize: 13,
              }}>{v ? 'Sim' : 'Não'}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Comentário *</div>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
            placeholder="Como foi a experiência?"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}/>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--line)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
          <button onClick={submit} disabled={loading} style={{ flex: 2, height: 44, borderRadius: 10, border: 'none', background: 'var(--coral)', color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Enviando…' : 'Enviar avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}
