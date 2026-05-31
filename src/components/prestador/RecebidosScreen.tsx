'use client';

import { useEffect, useState } from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import { getSolicitacoesRecebidas, aceitarSolicitacao, recusarSolicitacao, concluirSolicitacao, avaliarComoPrestador } from '@/lib/api';
import { toast } from 'sonner';

interface Solicitacao {
  id: number;
  nomeServico: string;
  nomeCidadao: string;
  celularCidadao: string;
  dataSolicitacao: string;
  prazoAvaliacao: string;
  statusSolicitacao: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDENTE:   { bg: 'var(--amber-soft)', color: 'var(--amber)',  label: 'Pendente'  },
  ACEITA:     { bg: 'var(--green-soft)', color: 'var(--green)',  label: 'Aceita'    },
  CONCLUIDA:  { bg: 'var(--cream)',      color: 'var(--ink-3)',  label: 'Concluída' },
  RECUSADA:   { bg: 'var(--red-soft)',   color: 'var(--red)',    label: 'Recusada'  },
};

export default function RecebidosScreen() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [avaliacaoModal, setAvaliacaoModal] = useState<Solicitacao | null>(null);

  useEffect(() => {
    getSolicitacoesRecebidas()
      .then(r => setSolicitacoes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(updated: Solicitacao) {
    setSolicitacoes(list => list.map(s => s.id === updated.id ? { ...s, ...updated } : s));
  }

  async function handleAceitar(id: number) {
    setActionLoading(id);
    try { update((await aceitarSolicitacao(id)).data); }
    catch { toast.error('Erro ao aceitar a solicitação.'); }
    finally { setActionLoading(null); }
  }

  async function handleRecusar(id: number) {
    if (!window.confirm('Recusar esta solicitação?')) return;
    setActionLoading(id);
    try { update((await recusarSolicitacao(id)).data); }
    catch { toast.error('Erro ao recusar a solicitação.'); }
    finally { setActionLoading(null); }
  }

  async function handleConcluir(id: number) {
    setActionLoading(id);
    try { update((await concluirSolicitacao(id)).data); }
    catch { toast.error('Erro ao marcar como concluída.'); }
    finally { setActionLoading(null); }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHeader title="Solicitações recebidas" subtitle="Cidadãos que solicitaram seus serviços"/>

      {avaliacaoModal && (
        <AvaliacaoModal
          solicitacao={avaliacaoModal}
          onClose={() => setAvaliacaoModal(null)}
          onSaved={() => setAvaliacaoModal(null)}
        />
      )}

      {loading && <div style={{ color: 'var(--ink-3)', fontSize: 14 }}>Carregando…</div>}

      {!loading && solicitacoes.length === 0 && (
        <EmptyState icon="bell" title="Nenhuma solicitação ainda" body="Quando um cidadão solicitar um dos seus serviços, aparecerá aqui."/>
      )}

      {!loading && solicitacoes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {solicitacoes.map(s => {
            const st = STATUS_STYLE[s.statusSolicitacao] ?? { bg: 'var(--cream)', color: 'var(--ink-3)', label: s.statusSolicitacao };
            const busy = actionLoading === s.id;
            const whatsappUrl = s.celularCidadao
              ? `https://wa.me/55${s.celularCidadao.replace(/\D/g, '')}`
              : null;

            return (
              <div key={s.id} style={{
                background: 'var(--paper)', borderRadius: 14,
                border: '1px solid var(--line-2)', padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                    background: 'var(--coral-soft)', color: 'var(--coral)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name="user" size={20}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800 }}>{s.nomeCidadao}</div>
                      <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                      {s.nomeServico} · {new Date(s.dataSolicitacao).toLocaleDateString('pt-BR')}
                    </div>
                    {s.statusSolicitacao === 'ACEITA' && whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noreferrer" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--green)',
                        textDecoration: 'none',
                      }}>
                        <Icon name="whatsapp" size={14} color="var(--green)"/>
                        Contatar via WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {(s.statusSolicitacao === 'PENDENTE' || s.statusSolicitacao === 'ACEITA' || s.statusSolicitacao === 'CONCLUIDA') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-2)', flexWrap: 'wrap' }}>
                    {s.statusSolicitacao === 'PENDENTE' && (
                      <>
                        <Btn onClick={() => handleAceitar(s.id)} disabled={busy} color="var(--green)" bg="var(--green-soft)">
                          Aceitar
                        </Btn>
                        <Btn onClick={() => handleRecusar(s.id)} disabled={busy} color="var(--red)" bg="var(--red-soft)">
                          Recusar
                        </Btn>
                      </>
                    )}
                    {s.statusSolicitacao === 'ACEITA' && (
                      <Btn onClick={() => handleConcluir(s.id)} disabled={busy} color="var(--ink-2)" bg="var(--cream)">
                        Marcar como concluída
                      </Btn>
                    )}
                    {s.statusSolicitacao === 'CONCLUIDA' && (
                      <Btn onClick={() => setAvaliacaoModal(s)} disabled={busy} color="var(--coral)" bg="var(--coral-tint)">
                        Avaliar cidadão
                      </Btn>
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

function Btn({ children, onClick, disabled, color, bg }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; color: string; bg: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 34, padding: '0 16px', borderRadius: 8, border: 'none',
      background: bg, color, fontSize: 13, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

function AvaliacaoModal({ solicitacao, onClose, onSaved }: { solicitacao: Solicitacao; onClose: () => void; onSaved: () => void }) {
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [servicoRealizado, setServicoRealizado] = useState(true);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!comentario.trim()) { toast.warning('Escreva um comentário.'); return; }
    if (!servicoRealizado && !motivo.trim()) { toast.warning('Informe o motivo de não realização.'); return; }
    setLoading(true);
    try {
      await avaliarComoPrestador({
        idSolicitacao: solicitacao.id,
        nota, comentario,
        servicoRealizado,
        motivoNaoRealizacao: !servicoRealizado ? motivo : undefined,
      });
      onSaved();
    } catch {
      toast.error('Erro ao salvar avaliação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--paper)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Avaliar cidadão</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>{solicitacao.nomeCidadao} · {solicitacao.nomeServico}</div>

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
            {([true, false] as const).map(v => (
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Motivo *</div>
            <input value={motivo} onChange={e => setMotivo(e.target.value)}
              placeholder="Por que o serviço não foi realizado?"
              style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14 }}/>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Comentário *</div>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
            placeholder="Descreva como foi a experiência com este cidadão…"
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
