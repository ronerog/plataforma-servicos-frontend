'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import {
  getTodasCategorias, criarCategoria, inativarCategoria, ativarCategoria, renomearCategoria,
  getCidadaos, getPrestadores, criarOcorrencia, aprovarPrestador, reprovarPrestador,
  listarAnexosPrestador, downloadAnexo,
} from '@/lib/api';
import { toast } from 'sonner';

interface Categoria { id: number; nomeCategoria: string; ativo: boolean }
interface Usuario { id: number; nomeRazaoSocial?: string; nome?: string; cpfCnpj?: string; cpf?: string }
interface Prestador { id: number; nomeRazaoSocial: string; cpfCnpj: string; statusPrestador: string }

type Tab = 'categorias' | 'cidadaos' | 'prestadores' | 'ocorrencias';

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>('categorias');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cidadaos, setCidadaos] = useState<Usuario[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criarError, setCriarError] = useState('');
  const [criarLoading, setCriarLoading] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    if (tab === 'categorias') getTodasCategorias().then(r => { setCategorias(r.data); setLoading(false); }).catch(() => setLoading(false));
    else if (tab === 'cidadaos') getCidadaos().then(r => { setCidadaos(r.data); setLoading(false); }).catch(() => setLoading(false));
    else if (tab === 'prestadores') getPrestadores().then(r => { setPrestadores(r.data); setLoading(false); }).catch(() => setLoading(false));
    else setLoading(false);
  }, [tab]);

  async function handleCriarCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setCriarLoading(true);
    setCriarError('');
    try {
      const res = await criarCategoria(novaCategoria.trim());
      setCategorias(cs => [...cs, res.data]);
      setNovaCategoria('');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
      setCriarError(data?.erro ?? data?.message ?? 'Erro ao criar categoria.');
    } finally {
      setCriarLoading(false);
    }
  }

  async function handleToggle(cat: Categoria) {
    setActionLoading(cat.id);
    try {
      const res = cat.ativo ? await inativarCategoria(cat.id) : await ativarCategoria(cat.id);
      setCategorias(cs => cs.map(c => c.id === cat.id ? res.data : c));
    } catch { /* silently ignore */ }
    finally { setActionLoading(null); }
  }

  function startEdit(cat: Categoria) {
    setEditandoId(cat.id);
    setNomeEditado(cat.nomeCategoria);
  }

  async function saveEdit(id: number) {
    if (!nomeEditado.trim()) { setEditandoId(null); return; }
    setActionLoading(id);
    try {
      const res = await renomearCategoria(id, nomeEditado.trim());
      setCategorias(cs => cs.map(c => c.id === id ? res.data : c));
      setEditandoId(null);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string> } })?.response?.data;
      toast.error(data?.erro ?? 'Erro ao renomear categoria.');
    } finally {
      setActionLoading(null); }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'categorias', label: 'Categorias', icon: 'list' },
    { id: 'cidadaos', label: 'Cidadãos', icon: 'user' },
    { id: 'prestadores', label: 'Prestadores', icon: 'handshake' },
    { id: 'ocorrencias', label: 'Ocorrências', icon: 'alertCircle' },
  ];

  return (
    <div>
      <PageHeader title="Painel administrativo" subtitle="Gestão de categorias, usuários e ocorrências"/>

      <div style={{ display: 'flex', gap: 4, background: 'var(--paper)', padding: 4, borderRadius: 12, border: '1px solid var(--line-2)', marginBottom: 22, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: tab === t.id ? 'var(--coral)' : 'transparent',
            color: tab === t.id ? '#fff' : 'var(--ink-2)',
            fontWeight: 700, fontSize: 13, transition: 'background .15s',
          }}>
            <Icon name={t.icon} size={14}/> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Carregando…</div>
      ) : (
        <>
          {tab === 'categorias' && (
            <div style={{ maxWidth: 640 }}>
              <form onSubmit={handleCriarCategoria} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)}
                    placeholder="Nome da nova categoria…"
                    style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14 }}/>
                  <button type="submit" disabled={criarLoading} style={{
                    height: 44, padding: '0 20px', borderRadius: 10, border: 'none',
                    background: 'var(--coral)', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: criarLoading ? 0.7 : 1,
                  }}>
                    <Icon name="plus" size={16}/> {criarLoading ? 'Criando…' : 'Criar'}
                  </button>
                </div>
                {criarError && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>
                    {criarError}
                  </div>
                )}
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categorias.map(c => {
                  const busy = actionLoading === c.id;
                  const editing = editandoId === c.id;
                  return (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line-2)',
                      opacity: c.ativo ? 1 : 0.6,
                    }}>
                      {editing ? (
                        <input
                          value={nomeEditado}
                          onChange={e => setNomeEditado(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(c.id); if (e.key === 'Escape') setEditandoId(null); }}
                          autoFocus
                          style={{ flex: 1, height: 36, padding: '0 12px', borderRadius: 8, border: '1.5px solid var(--coral)', fontSize: 14, fontWeight: 700 }}
                        />
                      ) : (
                        <div style={{ flex: 1, fontWeight: 700, color: c.ativo ? 'var(--ink)' : 'var(--ink-3)' }}>
                          {c.nomeCategoria}
                        </div>
                      )}

                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, flexShrink: 0,
                        background: c.ativo ? 'var(--green-soft)' : 'var(--red-soft)',
                        color: c.ativo ? 'var(--green)' : 'var(--red)',
                      }}>
                        {c.ativo ? 'Ativa' : 'Inativa'}
                      </span>

                      {editing ? (
                        <>
                          <button onClick={() => saveEdit(c.id)} disabled={busy} style={btnStyle('var(--green)', 'var(--green-soft)')}>
                            {busy ? '…' : 'Salvar'}
                          </button>
                          <button onClick={() => setEditandoId(null)} style={btnStyle('var(--ink-3)', 'var(--cream)')}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(c)} disabled={busy} style={btnStyle('var(--ink-2)', 'var(--cream)')}>
                            Renomear
                          </button>
                          <button onClick={() => handleToggle(c)} disabled={busy} style={btnStyle(
                            c.ativo ? 'var(--amber)' : 'var(--green)',
                            c.ativo ? 'var(--amber-soft)' : 'var(--green-soft)',
                          )}>
                            {busy ? '…' : c.ativo ? 'Inativar' : 'Ativar'}
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
                {categorias.length === 0 && <EmptyState icon="list" title="Nenhuma categoria criada"/>}
              </div>
            </div>
          )}

          {tab === 'cidadaos' && (
            <div style={{ maxWidth: 800 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cidadaos.map((u: Usuario) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line-2)',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="user" size={18} color="var(--ink-3)"/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{u.nome ?? '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>ID: {u.id} · {u.cpf ?? ''}</div>
                    </div>
                    <OcorrenciaButton idUsuario={u.id}/>
                  </div>
                ))}
                {cidadaos.length === 0 && <EmptyState icon="users" title="Nenhum cidadão encontrado"/>}
              </div>
            </div>
          )}

          {tab === 'prestadores' && (
            <div style={{ maxWidth: 800 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prestadores.map((p: Prestador) => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: 'var(--paper)', borderRadius: 12, border: '1px solid var(--line-2)',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="user" size={18} color="var(--ink-3)"/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{p.nomeRazaoSocial}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>ID: {p.id} · {p.cpfCnpj}</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 6, marginRight: 8,
                      background: p.statusPrestador === 'APROVADO' ? 'var(--green-soft)' : p.statusPrestador === 'REPROVADO' ? 'var(--red-soft)' : 'var(--amber-soft, #FFF8E6)',
                      color: p.statusPrestador === 'APROVADO' ? 'var(--green)' : p.statusPrestador === 'REPROVADO' ? 'var(--red)' : 'var(--amber)',
                    }}>
                      {p.statusPrestador === 'APROVADO' ? 'Aprovado' : p.statusPrestador === 'REPROVADO' ? 'Reprovado' : 'Pendente'}
                    </span>
                    {p.statusPrestador === 'PENDENTE_APROVACAO' && (
                      <>
                        <AprovarButton idPerfil={p.id} onAprovado={() =>
                          setPrestadores(ps => ps.map(x => x.id === p.id ? { ...x, statusPrestador: 'APROVADO' } : x))
                        }/>
                        <ReprovarButton idPerfil={p.id} onReprovado={() =>
                          setPrestadores(ps => ps.map(x => x.id === p.id ? { ...x, statusPrestador: 'REPROVADO' } : x))
                        }/>
                      </>
                    )}
                    <AnexosButton idPerfil={p.id}/>
                    <OcorrenciaButton idUsuario={p.id}/>
                  </div>
                ))}
                {prestadores.length === 0 && <EmptyState icon="users" title="Nenhum prestador encontrado"/>}
              </div>
            </div>
          )}

          {tab === 'ocorrencias' && (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <EmptyState icon="alertCircle" title="Registre ocorrências" body="Use o botão 'Registrar ocorrência' nos perfis de usuários."/>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function btnStyle(color: string, bg: string): React.CSSProperties {
  return {
    height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
    background: bg, color, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  };
}

function ReprovarButton({ idPerfil, onReprovado }: { idPerfil: number; onReprovado: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleReprovar() {
    if (!confirm('Reprovar este prestador?')) return;
    setLoading(true);
    try {
      await reprovarPrestador(idPerfil);
      onReprovado();
    } catch { toast.error('Erro ao reprovar prestador.'); }
    finally { setLoading(false); }
  }

  return (
    <button onClick={handleReprovar} disabled={loading} style={{
      padding: '7px 14px', borderRadius: 8, border: '1px solid var(--red)',
      background: 'none', color: 'var(--red)',
      cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 6,
      opacity: loading ? 0.7 : 1, marginRight: 6,
    }}>
      <Icon name="alertCircle" size={14}/> {loading ? 'Reprovando…' : 'Reprovar'}
    </button>
  );
}

interface Anexo { id: number; tipoDocumento: string; nomeArquivo: string; tipoMime: string }

function AnexosButton({ idPerfil }: { idPerfil: number }) {
  const [open, setOpen] = useState(false);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await listarAnexosPrestador(idPerfil);
      setAnexos(res.data);
    } catch { setAnexos([]); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button onClick={handleOpen} style={{
        padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)',
        background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)',
        display: 'flex', alignItems: 'center', gap: 6, marginRight: 6,
      }}>
        <Icon name="paperclip" size={14}/> Anexos
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--paper)', borderRadius: 18, padding: 24, width: 480, boxShadow: 'var(--shadow-md)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Documentos enviados</div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)' }}>Carregando…</div>
            ) : anexos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)', fontSize: 14 }}>Nenhum documento enviado.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {anexos.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--cream)', borderRadius: 10 }}>
                    <Icon name="paperclip" size={16} color="var(--coral)"/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{a.tipoDocumento}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{a.nomeArquivo}</div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const res = await downloadAnexo(a.id);
                          const url = URL.createObjectURL(new Blob([res.data], { type: a.tipoMime }));
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                        } catch { toast.error('Erro ao abrir arquivo.'); }
                      }}
                      style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--coral)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                    >
                      Ver
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setOpen(false)} style={{ marginTop: 16, width: '100%', height: 42, borderRadius: 10, border: '1.5px solid var(--line)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}

function AprovarButton({ idPerfil, onAprovado }: { idPerfil: number; onAprovado: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handleAprovar() {
    setLoading(true);
    try {
      await aprovarPrestador(idPerfil);
      onAprovado();
    } catch { toast.error('Erro ao aprovar prestador.'); }
    finally { setLoading(false); }
  }

  return (
    <button onClick={handleAprovar} disabled={loading} style={{
      padding: '7px 14px', borderRadius: 8, border: 'none',
      background: 'var(--green)', color: '#fff',
      cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
      display: 'flex', alignItems: 'center', gap: 6,
      opacity: loading ? 0.7 : 1, marginRight: 6,
    }}>
      <Icon name="check" size={14}/> {loading ? 'Aprovando…' : 'Aprovar'}
    </button>
  );
}

function OcorrenciaButton({ idUsuario }: { idUsuario: number }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('ALERTA');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim()) { toast.warning('Descreva a ocorrência.'); return; }
    setLoading(true);
    try {
      await criarOcorrencia({ idUsuario, tipo, afetaRole: 'ROLE_CIDADAO', descricao: desc });
      setOpen(false);
      setDesc('');
      toast.success('Ocorrência registrada com sucesso.');
    } catch { toast.error('Erro ao registrar ocorrência.'); }
    finally { setLoading(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        padding: '7px 14px', borderRadius: 8, border: '1px solid var(--line)',
        background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Icon name="alertCircle" size={14}/> Ocorrência
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={e => e.stopPropagation()} style={{ background: 'var(--paper)', borderRadius: 18, padding: 24, width: 420, boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Registrar ocorrência</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, cursor: 'pointer' }}>
                <option value="ALERTA">Alerta</option>
                <option value="INADIMPLENCIA">Inadimplência</option>
                <option value="SUSPENSAO">Suspensão</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>Descrição *</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}/>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--line)', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              <button type="submit" disabled={loading} style={{ flex: 2, height: 44, borderRadius: 10, border: 'none', background: 'var(--coral)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {loading ? 'Salvando…' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
