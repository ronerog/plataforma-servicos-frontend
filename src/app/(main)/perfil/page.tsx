'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/Icon';
import {
  getMeuPerfilCidadaoCompleto,
  getMeuPerfilPrestadorCompleto,
  atualizarPerfilCidadao,
  atualizarPerfilPrestador,
  excluirMinhaConta,
} from '@/lib/api';
import { buscarCep } from '@/lib/viacep';
import { toast } from 'sonner';

// ── helpers ──────────────────────────────────────────────────────────────────

function maskWhatsapp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}` + (c ? '-' + c : ''));
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}` + (c ? '-' + c : ''));
}
function maskCelular(v: string) { return maskWhatsapp(v); }
function maskCep(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.replace(/(\d{5})(\d{0,3})/, (_, a, b) => a + (b ? '-' + b : ''));
}
function formatCep(v: string) {
  const d = v.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : v;
}

// ── shared sub-components ────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { readOnly?: boolean }) {
  return (
    <input
      {...props}
      style={{
        width: '100%', height: 44, padding: '0 14px',
        background: props.readOnly ? 'var(--cream)' : 'var(--paper)',
        borderRadius: 10, border: '1.5px solid var(--line)',
        fontSize: 14, fontWeight: 500,
        color: props.readOnly ? 'var(--ink-3)' : 'inherit',
        transition: 'border-color .15s',
        ...props.style,
      }}
      onFocus={e => { if (!props.readOnly) e.target.style.borderColor = 'var(--coral)'; }}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-3)', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 }}>
      {children}
    </div>
  );
}

// ── Cidadão form ─────────────────────────────────────────────────────────────

type CidadaoData = {
  id: number; nome: string; cpf: string; dataNascimento: string;
  genero: string; celular: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; municipio: string; estado: string;
};

function CidadaoForm({ initial }: { initial: CidadaoData }) {
  const [form, setForm] = useState({
    nome: initial.nome ?? '',
    dataNascimento: initial.dataNascimento ?? '',
    genero: initial.genero ?? '',
    celular: initial.celular ?? '',
    cep: initial.cep ?? '',
    logradouro: initial.logradouro ?? '',
    numero: initial.numero ?? '',
    complemento: initial.complemento ?? '',
    bairro: initial.bairro ?? '',
    municipio: initial.municipio ?? '',
    estado: initial.estado ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      await atualizarPerfilCidadao({
        nome: form.nome,
        dataNascimento: form.dataNascimento || undefined,
        genero: form.genero || undefined,
        celular: form.celular.replace(/\D/g, '') || undefined,
        cep: formatCep(form.cep) || undefined,
        logradouro: form.logradouro || undefined,
        numero: form.numero || undefined,
        complemento: form.complemento || undefined,
        bairro: form.bairro || undefined,
        municipio: form.municipio || undefined,
        estado: form.estado.toUpperCase() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      const d = data as Record<string, string> | undefined;
      setError(d?.erro ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Dados pessoais</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="CPF">
          <Input value={initial.cpf} readOnly/>
        </Field>
        <Field label="Celular">
          <Input type="tel" value={maskCelular(form.celular)}
            onChange={e => setForm(f => ({ ...f, celular: maskCelular(e.target.value) }))}
            placeholder="(82) 99999-9999"/>
        </Field>
      </div>

      <Field label="Nome completo *">
        <Input value={form.nome} onChange={set('nome')} required/>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Data de nascimento">
          <Input type="date" value={form.dataNascimento} onChange={set('dataNascimento')}/>
        </Field>
        <Field label="Gênero">
          <select value={form.genero} onChange={set('genero')} style={{
            width: '100%', height: 44, padding: '0 12px', borderRadius: 10,
            border: '1.5px solid var(--line)', fontSize: 14, background: 'var(--paper)', cursor: 'pointer',
          }}>
            <option value="">Prefiro não informar</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="OUTROS">Outros</option>
            <option value="PREFIRO_NAO_INFORMAR">Prefiro não informar</option>
          </select>
        </Field>
      </div>

      <SectionTitle>Endereço</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <Field label="CEP" hint={cepLoading ? 'Buscando endereço…' : undefined}>
          <Input value={maskCep(form.cep)}
            onChange={async e => {
              const masked = maskCep(e.target.value);
              setForm(f => ({ ...f, cep: masked }));
              const digits = masked.replace(/\D/g, '');
              if (digits.length === 8) {
                setCepLoading(true);
                const addr = await buscarCep(digits);
                setCepLoading(false);
                if (addr) {
                  setForm(f => ({ ...f, logradouro: addr.logradouro, bairro: addr.bairro, municipio: addr.localidade, estado: addr.uf }));
                } else {
                  toast.warning('CEP não encontrado.');
                }
              }
            }}
            placeholder="57036-610"/>
        </Field>
        <Field label="Logradouro">
          <Input value={form.logradouro} onChange={set('logradouro')}/>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Número"><Input value={form.numero} onChange={set('numero')}/></Field>
        <Field label="Complemento"><Input value={form.complemento} onChange={set('complemento')}/></Field>
      </div>

      <Field label="Bairro"><Input value={form.bairro} onChange={set('bairro')}/></Field>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <Field label="Município"><Input value={form.municipio} onChange={set('municipio')}/></Field>
        <Field label="Estado"><Input value={form.estado} onChange={set('estado')} maxLength={2} placeholder="AL"/></Field>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="alertCircle" size={15}/> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--green-soft)', color: 'var(--green)', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="checkCircle" size={15}/> Perfil atualizado com sucesso!
        </div>
      )}

      <button type="submit" disabled={saving} style={{
        height: 46, borderRadius: 12, border: 'none', background: 'var(--coral)', color: '#fff',
        fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}

// ── Prestador form ───────────────────────────────────────────────────────────

type PrestadorData = {
  id: number; nomeRazaoSocial: string; cpfCnpj: string; biografia: string;
  whatsapp: string; statusPrestador: string; celular: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; municipio: string; estado: string;
};

function PrestadorForm({ initial }: { initial: PrestadorData }) {
  const [form, setForm] = useState({
    nomeRazaoSocial: initial.nomeRazaoSocial ?? '',
    biografia: initial.biografia ?? '',
    whatsapp: initial.whatsapp ?? '',
    celular: initial.celular ?? '',
    cep: initial.cep ?? '',
    logradouro: initial.logradouro ?? '',
    numero: initial.numero ?? '',
    complemento: initial.complemento ?? '',
    bairro: initial.bairro ?? '',
    municipio: initial.municipio ?? '',
    estado: initial.estado ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      await atualizarPerfilPrestador({
        nomeRazaoSocial: form.nomeRazaoSocial,
        biografia: form.biografia || undefined,
        whatsapp: form.whatsapp.replace(/\D/g, '') || undefined,
        celular: form.celular.replace(/\D/g, '') || undefined,
        cep: formatCep(form.cep) || undefined,
        logradouro: form.logradouro || undefined,
        numero: form.numero || undefined,
        complemento: form.complemento || undefined,
        bairro: form.bairro || undefined,
        municipio: form.municipio || undefined,
        estado: form.estado.toUpperCase() || undefined,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      const d = data as Record<string, string> | undefined;
      setError(d?.erro ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionTitle>Dados do prestador</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="CPF / CNPJ">
          <Input value={initial.cpfCnpj} readOnly/>
        </Field>
        <Field label="Celular">
          <Input type="tel" value={maskCelular(form.celular)}
            onChange={e => setForm(f => ({ ...f, celular: maskCelular(e.target.value) }))}
            placeholder="(82) 99999-9999"/>
        </Field>
      </div>

      <Field label="Nome ou Razão Social *">
        <Input value={form.nomeRazaoSocial} onChange={set('nomeRazaoSocial')} required/>
      </Field>

      <Field label="WhatsApp">
        <Input type="tel" value={maskWhatsapp(form.whatsapp)}
          onChange={e => setForm(f => ({ ...f, whatsapp: maskWhatsapp(e.target.value) }))}
          placeholder="(82) 99999-9999"/>
      </Field>

      <Field label="Biografia">
        <textarea value={form.biografia} onChange={set('biografia')} rows={3}
          placeholder="Conte sobre você e como pode ajudar a comunidade…"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid var(--line)', fontSize: 14,
            resize: 'vertical', fontFamily: 'inherit', background: 'var(--paper)',
          }}/>
      </Field>

      <SectionTitle>Endereço</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <Field label="CEP" hint={cepLoading ? 'Buscando endereço…' : undefined}>
          <Input value={maskCep(form.cep)}
            onChange={async e => {
              const masked = maskCep(e.target.value);
              setForm(f => ({ ...f, cep: masked }));
              const digits = masked.replace(/\D/g, '');
              if (digits.length === 8) {
                setCepLoading(true);
                const addr = await buscarCep(digits);
                setCepLoading(false);
                if (addr) {
                  setForm(f => ({ ...f, logradouro: addr.logradouro, bairro: addr.bairro, municipio: addr.localidade, estado: addr.uf }));
                } else {
                  toast.warning('CEP não encontrado.');
                }
              }
            }}
            placeholder="57036-610"/>
        </Field>
        <Field label="Logradouro">
          <Input value={form.logradouro} onChange={set('logradouro')}/>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Número"><Input value={form.numero} onChange={set('numero')}/></Field>
        <Field label="Complemento"><Input value={form.complemento} onChange={set('complemento')}/></Field>
      </div>

      <Field label="Bairro"><Input value={form.bairro} onChange={set('bairro')}/></Field>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <Field label="Município"><Input value={form.municipio} onChange={set('municipio')}/></Field>
        <Field label="Estado"><Input value={form.estado} onChange={set('estado')} maxLength={2} placeholder="AL"/></Field>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="alertCircle" size={15}/> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--green-soft)', color: 'var(--green)', fontSize: 13, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
          <Icon name="checkCircle" size={15}/> Perfil atualizado com sucesso!
        </div>
      )}

      <button type="submit" disabled={saving} style={{
        height: 46, borderRadius: 12, border: 'none', background: 'var(--coral)', color: '#fff',
        fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { user, isPrestador, isCidadao, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<CidadaoData | PrestadorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isPrestador) {
      getMeuPerfilPrestadorCompleto()
        .then(r => setData(r.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else if (isCidadao) {
      getMeuPerfilCidadaoCompleto()
        .then(r => setData(r.data))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isPrestador, isCidadao]);

  return (
    <div>
      <PageHeader title="Meu perfil" subtitle="Edite suas informações pessoais"/>
      <div style={{ maxWidth: 620 }}>
        {/* Card de identidade */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar name={user?.email ?? 'U'} size={56}/>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {(data as PrestadorData)?.nomeRazaoSocial ?? (data as CidadaoData)?.nome ?? user?.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{user?.email}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {user?.roles?.map(r => (
                  <span key={r} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'var(--coral-soft)', color: 'var(--coral)', fontSize: 10.5, fontWeight: 800, marginRight: 4 }}>
                    {r.replace('ROLE_', '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 24, marginBottom: 20 }}>
          {loading && (
            <div style={{ color: 'var(--ink-3)', fontSize: 14 }}>Carregando perfil…</div>
          )}
          {!loading && !data && (
            <div style={{ color: 'var(--ink-3)', fontSize: 14 }}>Não foi possível carregar os dados do perfil.</div>
          )}
          {!loading && data && isPrestador && (
            <PrestadorForm initial={data as PrestadorData}/>
          )}
          {!loading && data && !isPrestador && isCidadao && (
            <CidadaoForm initial={data as CidadaoData}/>
          )}
        </div>

        {/* Zona de perigo */}
        <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid rgba(214,62,21,0.25)', padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--red)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>
            Zona de perigo
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Excluir minha conta</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Remove permanentemente sua conta, perfis, serviços e histórico. Esta ação não pode ser desfeita.
              </div>
            </div>
            <button onClick={() => setShowDeleteModal(true)} style={{
              height: 40, padding: '0 18px', borderRadius: 10,
              border: '1.5px solid var(--red)', background: 'transparent',
              color: 'var(--red)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Excluir conta
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          email={user?.email ?? ''}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={async () => {
            await excluirMinhaConta();
            logout();
            router.push('/auth');
          }}
        />
      )}
    </div>
  );
}

// ── Modal de confirmação de exclusão ─────────────────────────────────────────

function DeleteModal({ email, onClose, onConfirm }: {
  email: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = confirmText === 'EXCLUIR';

  async function handleConfirm() {
    if (!isValid) return;
    setLoading(true);
    try {
      await onConfirm();
    } catch {
      toast.error('Erro ao excluir a conta. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--paper)', borderRadius: 20, padding: 28,
        width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--red-soft)', color: 'var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alertCircle" size={22}/>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Excluir conta permanentemente</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{email}</div>
          </div>
        </div>

        <div style={{
          padding: '12px 14px', borderRadius: 10, marginBottom: 20,
          background: 'var(--red-soft)', border: '1px solid rgba(214,62,21,0.2)',
          fontSize: 13, color: 'var(--red)', lineHeight: 1.55,
        }}>
          Isso vai apagar <strong>definitivamente</strong> sua conta, perfis, serviços publicados, solicitações e histórico de avaliações. Não há como recuperar.
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>
            Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
          </label>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
            style={{
              width: '100%', height: 44, padding: '0 14px',
              borderRadius: 10, fontSize: 14, fontWeight: 700,
              border: `1.5px solid ${isValid ? 'var(--red)' : 'var(--line)'}`,
              background: 'var(--paper)', letterSpacing: 1,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, height: 44, borderRadius: 10,
            border: '1.5px solid var(--line)', background: 'none',
            cursor: 'pointer', fontWeight: 700, fontSize: 14,
          }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={!isValid || loading} style={{
            flex: 2, height: 44, borderRadius: 10, border: 'none',
            background: isValid ? 'var(--red)' : 'var(--line-2)',
            color: isValid ? '#fff' : 'var(--ink-3)',
            cursor: isValid ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: 14,
            opacity: loading ? 0.7 : 1, transition: 'background .15s, color .15s',
          }}>
            {loading ? 'Excluindo…' : 'Excluir minha conta'}
          </button>
        </div>
      </div>
    </div>
  );
}
