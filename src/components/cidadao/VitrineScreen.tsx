'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import EmptyState from '../ui/EmptyState';
import { getServicos, getCategorias, criarSolicitacao, getFotoUrl, getAvaliacoesServico } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Categoria { id: number; nomeCategoria: string; ativo: boolean }
interface Servico {
  id: number; titulo: string; descricao: string;
  nomeCategoria: string; statusServico: string; nomePrestador: string;
  whatsapp?: string; fotoIds: number[];
}
interface Avaliacao {
  id: number; nota: number; comentario: string;
  nomeAvaliador: string; dataAvaliacao: string; servicoRealizado: boolean;
}

export default function VitrineScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [q, setQ] = useState('');
  const [catFiltro, setCatFiltro] = useState('all');
  const [loading, setLoading] = useState(true);
  const [solicitandoId, setSolicitandoId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);

  const detalhe = idParam ? (servicos.find(s => String(s.id) === idParam) ?? null) : null;

  useEffect(() => {
    Promise.all([getServicos(), getCategorias()]).then(([sv, ct]) => {
      setServicos(sv.data);
      setCategorias(ct.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!detalhe) { setAvaliacoes([]); return; }
    setLoadingAvaliacoes(true);
    getAvaliacoesServico(detalhe.id)
      .then(r => setAvaliacoes(r.data))
      .catch(() => setAvaliacoes([]))
      .finally(() => setLoadingAvaliacoes(false));
  }, [detalhe?.id]);

  const filtered = servicos.filter(s => {
    if (catFiltro !== 'all') {
      if (s.nomeCategoria !== categorias.find(c => String(c.id) === catFiltro)?.nomeCategoria) return false;
    }
    if (q) {
      const ql = q.toLowerCase();
      return s.titulo.toLowerCase().includes(ql) || s.nomePrestador.toLowerCase().includes(ql) || s.nomeCategoria.toLowerCase().includes(ql);
    }
    return true;
  });

  async function solicitar(idServico: number) {
    if (!user) return;
    setSolicitandoId(idServico);
    try {
      await criarSolicitacao(idServico);
      setSuccessMsg('Solicitação enviada! Verifique em "Minhas Solicitações".');
      router.push('/vitrine');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      toast.error('Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setSolicitandoId(null);
    }
  }

  function formatDate(s: string) {
    if (!s) return '';
    return new Date(s).toLocaleDateString('pt-BR');
  }

  if (detalhe) {
    const mediaNotas = avaliacoes.length > 0
      ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
      : null;

    return (
      <div>
        <PageHeader
          title={detalhe.titulo}
          subtitle={`Publicado por ${detalhe.nomePrestador}`}
          breadcrumb={['Serviços', detalhe.nomeCategoria, detalhe.titulo]}
          actions={[
            <button key="back" onClick={() => router.push('/vitrine')} style={{
              height: 40, padding: '0 14px', borderRadius: 10,
              background: 'var(--paper)', border: '1px solid var(--line)',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 700, color: 'var(--ink-2)',
            }}>
              <Icon name="chevronLeft" size={16}/> Voltar
            </button>,
          ]}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>
            {detalhe.fotoIds.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
                {detalhe.fotoIds.map(id => (
                  <img key={id} src={getFotoUrl(id)} alt="Foto do serviço" style={{
                    width: '100%', height: 160, objectFit: 'cover',
                    borderRadius: 12, border: '1px solid var(--line-2)',
                  }}/>
                ))}
              </div>
            )}

            <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
                {detalhe.nomeCategoria}
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>
                {detalhe.descricao || 'Nenhuma descrição fornecida.'}
              </p>
            </div>

            <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>Avaliações</div>
                {mediaNotas && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--coral)' }}>{mediaNotas}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} style={{ fontSize: 14, color: n <= Math.round(Number(mediaNotas)) ? '#F2552B' : 'var(--line)' }}>★</span>
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>({avaliacoes.length})</span>
                  </div>
                )}
              </div>

              {loadingAvaliacoes ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Carregando avaliações…</div>
              ) : avaliacoes.length === 0 ? (
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Nenhuma avaliação ainda.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {avaliacoes.map(a => (
                    <div key={a.id} style={{ borderBottom: '1px solid var(--line-2)', paddingBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <Avatar name={a.nomeAvaliador} size={30}/>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{a.nomeAvaliador}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{formatDate(a.dataAvaliacao)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ fontSize: 13, color: n <= a.nota ? '#F2552B' : 'var(--line)' }}>★</span>
                          ))}
                        </div>
                      </div>
                      {!a.servicoRealizado && (
                        <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, marginBottom: 4 }}>
                          Serviço não foi realizado
                        </div>
                      )}
                      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>{a.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <Avatar name={detalhe.nomePrestador} size={44}/>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{detalhe.nomePrestador}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Prestador voluntário</div>
                </div>
              </div>
              {user ? (
                <button onClick={() => solicitar(detalhe.id)} disabled={solicitandoId === detalhe.id} style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none',
                    background: 'var(--coral)', color: '#fff',
                    fontWeight: 800, fontSize: 15, cursor: 'pointer',
                    opacity: solicitandoId === detalhe.id ? 0.7 : 1,
                  }}>
                    {solicitandoId === detalhe.id ? 'Enviando…' : 'Solicitar serviço'}
                  </button>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '8px 0' }}>
                  Faça login para solicitar este serviço.
                </div>
              )}
            </div>
            <div style={{ background: 'var(--coral-tint)', borderRadius: 12, padding: 14, border: '1px solid var(--coral-soft)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <strong>Como funciona:</strong> Faça a solicitação e aguarde a confirmação do prestador. Após aceite, o WhatsApp é liberado para vocês combinarem os detalhes. Sem custo algum!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Buscar serviços"
        subtitle="Encontre voluntários da sua comunidade dispostos a ajudar"
      />

      {successMsg && (
        <div style={{
          padding: '12px 16px', marginBottom: 18, borderRadius: 10,
          background: 'var(--green-soft)', border: '1px solid rgba(31,138,91,0.25)',
          fontSize: 14, color: 'var(--green)', fontWeight: 700,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <Icon name="checkCircle" size={16}/> {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
          height: 48, background: 'var(--paper)', borderRadius: 12,
          border: '1px solid var(--line-2)',
        }}>
          <Icon name="search" size={17} color="var(--ink-3)"/>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Busque por serviço, categoria, prestador…"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 500 }}/>
          {q && (
            <button onClick={() => setQ('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
              <Icon name="close" size={15}/>
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Chip active={catFiltro === 'all'} onClick={() => setCatFiltro('all')}>Todas categorias</Chip>
        {categorias.filter(c => c.ativo).map(c => (
          <Chip key={c.id} active={catFiltro === String(c.id)} onClick={() => setCatFiltro(String(c.id))}>
            {c.nomeCategoria}
          </Chip>
        ))}
      </div>

      <div style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 14 }}>
        <strong style={{ color: 'var(--ink)' }}>{filtered.length} serviços</strong> encontrados
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Carregando serviços…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="search" title="Nenhum serviço encontrado" body="Tente outra categoria ou termo de busca."/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
          {filtered.map(s => (
            <ServiceCard key={s.id} servico={s} onClick={() => router.push(`/vitrine?id=${s.id}`)}/>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999,
      border: `1.5px solid ${active ? 'var(--coral)' : 'var(--line)'}`,
      background: active ? 'var(--coral)' : 'var(--paper)',
      color: active ? '#fff' : 'var(--ink-2)',
      fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .12s',
    }}>
      {children}
    </button>
  );
}

function ServiceCard({ servico, onClick }: { servico: Servico; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--paper)', borderRadius: 16,
      border: '1px solid var(--line-2)', overflow: 'hidden',
      cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
      display: 'flex', flexDirection: 'column',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
    >
      {servico.fotoIds.length > 0 ? (
        <img src={getFotoUrl(servico.fotoIds[0])} alt="" style={{ width: '100%', height: 120, objectFit: 'cover' }}/>
      ) : (
        <div style={{ height: 6, background: 'var(--coral)' }}/>
      )}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10.5, color: 'var(--coral)', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>
          {servico.nomeCategoria}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: 'var(--ink)', flex: 1,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {servico.titulo}
        </div>
        {servico.descricao && (
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {servico.descricao}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-2)' }}>
          <Avatar name={servico.nomePrestador} size={26}/>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {servico.nomePrestador}
          </span>
        </div>
      </div>
    </div>
  );
}
