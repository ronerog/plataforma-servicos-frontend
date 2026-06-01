'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';
import EmptyState from '../ui/EmptyState';
import {
  getMeusServicos, getCategorias, criarServico, atualizarServico,
  publicarServico, inativarServico, excluirServico,
  uploadFotoServico, getFotoUrl,
} from '@/lib/api';
import { toast } from 'sonner';

interface Categoria { id: number; nomeCategoria: string; ativo: boolean }
interface Servico {
  id: number; titulo: string; descricao: string;
  nomeCategoria: string; statusServico: string; nomePrestador: string;
  whatsapp?: string; fotoIds: number[];
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  PUBLICADO: { bg: 'var(--green-soft)', color: 'var(--green)', label: 'Publicado' },
  RASCUNHO:  { bg: 'var(--amber-soft)', color: 'var(--amber)',  label: 'Rascunho'  },
  INATIVO:   { bg: 'var(--cream)',       color: 'var(--ink-3)', label: 'Inativo'   },
};

export default function MeusServicosScreen() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalServico, setModalServico] = useState<Servico | 'novo' | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getMeusServicos(), getCategorias()]).then(([sv, ct]) => {
      setServicos(sv.data);
      setCategorias(ct.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handlePublicar(id: number) {
    setActionLoading(id);
    try {
      const res = await publicarServico(id);
      setServicos(sv => sv.map(s => s.id === id ? { ...s, statusServico: res.data.statusServico } : s));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  }

  async function handleInativar(id: number) {
    setActionLoading(id);
    try {
      const res = await inativarServico(id);
      setServicos(sv => sv.map(s => s.id === id ? { ...s, statusServico: res.data.statusServico } : s));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  }

  function handleExcluir(id: number) {
    toast('Excluir este serviço permanentemente?', {
      action: { label: 'Excluir', onClick: () => confirmarExcluir(id) },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  }

  async function confirmarExcluir(id: number) {
    setActionLoading(id);
    try {
      await excluirServico(id);
      setServicos(sv => sv.filter(s => s.id !== id));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  }

  function handleSaved(updated: Servico) {
    setServicos(sv => {
      const exists = sv.find(s => s.id === updated.id);
      if (exists) return sv.map(s => s.id === updated.id ? { ...s, ...updated } : s);
      return [...sv, updated];
    });
    setModalServico(null);
  }

  return (
    <div>
      <PageHeader
        title="Meus serviços"
        subtitle="Serviços que você oferece à comunidade"
        actions={[
          <button key="new" onClick={() => setModalServico('novo')} style={{
            height: 44, padding: '0 18px', borderRadius: 12, border: 'none',
            background: 'var(--coral)', color: '#fff',
            fontWeight: 800, fontSize: 14, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="plus" size={16}/> Novo serviço
          </button>,
        ]}
      />

      {modalServico !== null && (
        <ServicoModal
          servico={modalServico === 'novo' ? null : modalServico}
          categorias={categorias}
          onClose={() => setModalServico(null)}
          onSaved={handleSaved}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-3)' }}>Carregando…</div>
      ) : servicos.length === 0 ? (
        <EmptyState icon="list" title="Nenhum serviço criado" body="Crie seu primeiro serviço voluntário para que cidadãos possam te encontrar."/>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {servicos.map(s => {
            const st = STATUS[s.statusServico] ?? STATUS.INATIVO;
            const busy = actionLoading === s.id;
            return (
              <div key={s.id} style={{
                background: 'var(--paper)', borderRadius: 14,
                border: '1px solid var(--line-2)', overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}>
                {s.fotoIds.length > 0 ? (
                  <img src={getFotoUrl(s.fotoIds[0])} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }}/>
                ) : (
                  <div style={{ height: 6, background: 'var(--coral)' }}/>
                )}
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, color: 'var(--coral)', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
                        {s.nomeCategoria}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.25 }}>{s.titulo}</div>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 6, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  {s.descricao && (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.descricao}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--line-2)', marginTop: 'auto' }}>
                    {s.statusServico !== 'PUBLICADO' && (
                      <ActionBtn onClick={() => handlePublicar(s.id)} disabled={busy} color="var(--green)" bg="var(--green-soft)">Publicar</ActionBtn>
                    )}
                    {s.statusServico === 'PUBLICADO' && (
                      <ActionBtn onClick={() => handleInativar(s.id)} disabled={busy} color="var(--amber)" bg="var(--amber-soft)">Inativar</ActionBtn>
                    )}
                    <ActionBtn onClick={() => setModalServico(s)} disabled={busy} color="var(--ink-2)" bg="var(--cream)">
                      Editar{s.fotoIds.length > 0 ? ` · ${s.fotoIds.length} foto${s.fotoIds.length > 1 ? 's' : ''}` : ''}
                    </ActionBtn>
                    <ActionBtn onClick={() => handleExcluir(s.id)} disabled={busy} color="var(--red)" bg="var(--red-soft)">Excluir</ActionBtn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, disabled, color, bg }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; color: string; bg: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
      background: bg, color, fontSize: 12, fontWeight: 700,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

function ServicoModal({
  servico, categorias, onClose, onSaved,
}: {
  servico: Servico | null;
  categorias: Categoria[];
  onClose: () => void;
  onSaved: (s: Servico) => void;
}) {
  const isEdit = servico !== null;
  const [titulo, setTitulo] = useState(servico?.titulo ?? '');
  const [descricao, setDescricao] = useState(servico?.descricao ?? '');
  const [idCategoria, setIdCategoria] = useState(
    servico ? String(categorias.find(c => c.nomeCategoria === servico.nomeCategoria)?.id ?? '') : ''
  );
  const [fotoIds, setFotoIds] = useState<number[]>(servico?.fotoIds ?? []);
  const [loading, setLoading] = useState<false | 'rascunho' | 'publicar' | 'editar'>(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (!servico) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.warning('Imagem muito grande. Máximo 5MB.'); return; }
    setUploading(true);
    try {
      const res = await uploadFotoServico(servico.id, file, fotoIds.length);
      setFotoIds(ids => [...ids, res.data.id]);
    } catch {
      toast.error('Erro ao enviar foto.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function submitEdit() {
    if (!titulo.trim() || !idCategoria) { setError('Título e categoria são obrigatórios.'); return; }
    setLoading('editar');
    setError('');
    try {
      const res = await atualizarServico(servico!.id, { titulo, descricao, idCategoria: Number(idCategoria) });
      onSaved({ ...res.data, fotoIds });
    } catch (err: unknown) {
      setError(parseErr(err));
      setLoading(false);
    }
  }

  async function submitCriar(publicar: boolean) {
    if (!titulo.trim() || !idCategoria) { setError('Título e categoria são obrigatórios.'); return; }
    setLoading(publicar ? 'publicar' : 'rascunho');
    setError('');
    try {
      const res = await criarServico({ titulo, descricao, idCategoria: Number(idCategoria), publicar });
      onSaved({ ...res.data, fotoIds: [] });
    } catch (err: unknown) {
      setError(parseErr(err));
      setLoading(false);
    }
  }

  function parseErr(err: unknown) {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, string>;
      if (d.erro) return d.erro;
      const msgs = Object.entries(d).filter(([, v]) => typeof v === 'string').map(([k, v]) => `${k}: ${v}`);
      if (msgs.length) return msgs.join(' · ');
    }
    return 'Erro ao salvar. Tente novamente.';
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--paper)', borderRadius: 20, padding: 28, width: 540,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{isEdit ? 'Editar serviço' : 'Novo serviço'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
            <Icon name="close" size={20}/>
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Aulas de reforço — Matemática"
              style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14 }}/>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Categoria *</label>
            <select value={idCategoria} onChange={e => setIdCategoria(e.target.value)}
              style={{ width: '100%', height: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, cursor: 'pointer' }}>
              <option value="">Selecione uma categoria…</option>
              {categorias.filter(c => c.ativo).map(c => <option key={c.id} value={c.id}>{c.nomeCategoria}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4}
              placeholder="Descreva o serviço, limitações, disponibilidade…"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }}/>
          </div>

          {isEdit && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 10 }}>
                Fotos do portfólio {fotoIds.length > 0 && <span style={{ fontWeight: 400, color: 'var(--ink-3)' }}>({fotoIds.length})</span>}
              </label>
              {fotoIds.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                  {fotoIds.map(id => (
                    <img key={id} src={getFotoUrl(id)} alt="" style={{
                      width: '100%', aspectRatio: '4/3', objectFit: 'cover',
                      borderRadius: 8, border: '1px solid var(--line-2)',
                    }}/>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }}/>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                width: '100%', height: 40, borderRadius: 10, border: '1.5px dashed var(--line)',
                background: 'var(--cream)', color: 'var(--ink-2)', fontWeight: 700, fontSize: 13,
                cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1,
              }}>
                {uploading ? 'Enviando…' : '+ Adicionar foto'}
              </button>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5 }}>JPG, PNG ou WebP · Máx. 5MB</div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="button" onClick={onClose} disabled={!!loading} style={{
            flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--line)',
            background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            Cancelar
          </button>
          {isEdit ? (
            <button type="button" onClick={submitEdit} disabled={!!loading} style={{
              flex: 2, height: 44, borderRadius: 10, border: 'none',
              background: 'var(--coral)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading === 'editar' ? 'Salvando…' : 'Salvar alterações'}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => submitCriar(false)} disabled={!!loading} style={{
                flex: 1, height: 44, borderRadius: 10, border: '1.5px solid var(--amber)',
                background: 'var(--amber-soft)', color: 'var(--amber)',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                opacity: loading && loading !== 'rascunho' ? 0.5 : 1,
              }}>
                {loading === 'rascunho' ? 'Salvando…' : 'Rascunho'}
              </button>
              <button type="button" onClick={() => submitCriar(true)} disabled={!!loading} style={{
                flex: 1, height: 44, borderRadius: 10, border: 'none',
                background: 'var(--coral)', color: '#fff',
                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                opacity: loading && loading !== 'publicar' ? 0.5 : 1,
              }}>
                {loading === 'publicar' ? 'Publicando…' : 'Publicar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
