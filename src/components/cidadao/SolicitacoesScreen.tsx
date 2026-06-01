'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { getMinhasSolicitacoes, avaliarComoCidadao } from '@/lib/api';
import { toast } from 'sonner';

interface Solicitacao {
  id: number;
  nomeServico: string;
  nomePrestador: string;
  whatsappPrestador: string;
  dataSolicitacao: string;
  prazoAvaliacao: string;
  statusSolicitacao: string;
  cidadaoAvaliou: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDENTE:   { bg: 'var(--amber-soft)', color: 'var(--amber)',  label: 'Pendente'  },
  ACEITA:     { bg: 'var(--green-soft)', color: 'var(--green)',  label: 'Aceita'    },
  RECUSADA:   { bg: 'var(--red-soft)',   color: 'var(--red)',    label: 'Recusada'  },
  CONCLUIDA:  { bg: 'var(--cream)',      color: 'var(--ink-3)',  label: 'Concluída' },
};

export default function SolicitacoesScreen() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [avaliacaoModal, setAvaliacaoModal] = useState<Solicitacao | null>(null);

  useEffect(() => {
    getMinhasSolicitacoes().then(r => {
      setSolicitacoes(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function formatDate(s: string) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('pt-BR');
  }

  function handleAvaliado(id: number, nota: number) {
    setSolicitacoes(prev =>
      prev.map(s => s.id === id ? { ...s, cidadaoAvaliou: true, _nota: nota } as Solicitacao & { _nota: number } : s)
    );
    setAvaliacaoModal(null);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Carregando…</div>;

  return (
    <div>
      <PageHeader title="Minhas solicitações" subtitle="Histórico de serviços que você pediu"/>

      {avaliacaoModal && (
        <AvaliacaoModal
          solicitacao={avaliacaoModal}
          onClose={() => setAvaliacaoModal(null)}
          onSave={handleAvaliado}
        />
      )}

      {solicitacoes.length === 0 ? (
        <EmptyState icon="list" title="Nenhuma solicitação ainda" body="Vá em Buscar Serviços e faça sua primeira solicitação."/>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {solicitacoes.map(s => {
            const st = STATUS_COLORS[s.statusSolicitacao] ?? { bg: 'var(--cream)', color: 'var(--ink-3)', label: s.statusSolicitacao };
            const isAceita = s.statusSolicitacao === 'ACEITA';
            const isConcluida = s.statusSolicitacao === 'CONCLUIDA';
            const nota = (s as Solicitacao & { _nota?: number })._nota;
            const whatsappUrl = isAceita && s.whatsappPrestador
              ? `https://wa.me/55${s.whatsappPrestador.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Minha solicitação de "${s.nomeServico}" foi aceita e gostaria de combinar os detalhes.`)}`
              : null;

            return (
              <div key={s.id} style={{
                background: 'var(--paper)', borderRadius: 14,
                border: '1px solid var(--line-2)', padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{s.nomeServico}</div>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span><Icon name="user" size={13}/> {s.nomePrestador}</span>
                      <span><Icon name="calendar" size={13}/> {formatDate(s.dataSolicitacao)}</span>
                    </div>
                  </div>
                  {isConcluida && (
                    s.cidadaoAvaliou ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ fontSize: 14, color: n <= (nota ?? 5) ? '#F2552B' : 'var(--line)' }}>★</span>
                          ))}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)' }}>Avaliado</span>
                      </div>
                    ) : (
                      <button onClick={() => setAvaliacaoModal(s)} style={{
                        padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--coral)',
                        background: 'transparent', color: 'var(--coral)',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                        Avaliar
                      </button>
                    )
                  )}
                </div>
                {isAceita && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--line-2)' }}>
                    <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginBottom: 8 }}>
                      Solicitação aceita! Combine os detalhes pelo WhatsApp.
                    </div>
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 38, padding: '0 16px', borderRadius: 10,
                        background: '#25D366', color: '#fff',
                        fontWeight: 700, fontSize: 13, textDecoration: 'none',
                      }}>
                        <Icon name="whatsapp" size={15} color="#fff"/> Contatar {s.nomePrestador}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AvaliacaoModal({ solicitacao, onClose, onSave }: { solicitacao: Solicitacao; onClose: () => void; onSave: (id: number, nota: number) => void }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [servicoRealizado, setServicoRealizado] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!comentario.trim()) { toast.warning('Escreva um comentário.'); return; }
    setLoading(true);
    try {
      await avaliarComoCidadao({
        idSolicitacao: solicitacao.id,
        nota, comentario,
        servicoRealizado,
        motivoNaoRealizacao: !servicoRealizado ? motivo : undefined,
      });
      onSave(solicitacao.id, nota);
    } catch {
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--paper)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Avaliar serviço</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>{solicitacao.nomeServico} · {solicitacao.nomePrestador}</div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Nota</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setNota(n)} style={{
                width: 40, height: 40, borderRadius: 8, border: 'none',
                background: n <= nota ? 'var(--coral)' : 'var(--cream)',
                color: n <= nota ? '#fff' : 'var(--ink-3)',
                fontWeight: 800, fontSize: 15, cursor: 'pointer',
              }}>{n}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>O serviço foi realizado?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setServicoRealizado(v)} style={{
                flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${servicoRealizado === v ? 'var(--coral)' : 'var(--line)'}`,
                background: servicoRealizado === v ? 'var(--coral-tint)' : 'transparent',
                color: servicoRealizado === v ? 'var(--coral)' : 'var(--ink-2)',
                fontWeight: 700, fontSize: 13,
              }}>
                {v ? 'Sim' : 'Não'}
              </button>
            ))}
          </div>
        </div>

        {!servicoRealizado && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Motivo</div>
            <input value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Por que o serviço não foi realizado?"
              style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14 }}/>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Comentário *</div>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
            placeholder="Conte como foi sua experiência…"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}/>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--line)', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} style={{
            flex: 2, height: 44, borderRadius: 10, border: 'none',
            background: 'var(--coral)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Salvando…' : 'Enviar avaliação'}
          </button>
        </div>
      </div>
    </div>
  );
}
