'use client';

import { useState, useRef } from 'react';
import AuthLayout from './AuthLayout';
import PrimaryButton from '../ui/PrimaryButton';
import Icon from '../ui/Icon';
import { cadastrarCidadao, cadastrarPrestador, login as apiLogin, uploadAnexoPrestador } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { buscarCep } from '@/lib/viacep';
import { validarCpf, validarCnpj } from '@/lib/validators';
import { toast } from 'sonner';

type Perfil = 'cidadao' | 'prestador';

interface Props {
  perfil: Perfil;
  onBack: () => void;
  onComplete: (perfil: Perfil) => void;
}

const GENEROS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTROS', label: 'Outros' },
  { value: 'PREFIRO_NAO_INFORMAR', label: 'Prefiro não informar' },
];

const TIPOS_DOCUMENTO = [
  { value: 'RG',                   label: 'RG' },
  { value: 'CPF',                  label: 'CPF' },
  { value: 'CNPJ',                 label: 'Cartão CNPJ' },
  { value: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de residência' },
  { value: 'DOCUMENTO',            label: 'Outro documento' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', height: 44, padding: '0 14px',
        background: 'var(--paper)', borderRadius: 10,
        border: '1.5px solid var(--line)',
        fontSize: 14, fontWeight: 500,
        transition: 'border-color .15s',
        ...props.style,
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  );
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%', height: 44, padding: '0 14px',
        background: 'var(--paper)', borderRadius: 10,
        border: '1.5px solid var(--line)',
        fontSize: 14, fontWeight: 500, cursor: 'pointer',
        ...props.style,
      }}
    />
  );
}

export default function CadastroScreen({ perfil, onBack, onComplete }: Props) {
  const { login } = useAuth();
  const isCidadao = perfil === 'cidadao';

  // cidadão: 3 steps | prestador: 5 steps
  const totalSteps = isCidadao ? 3 : 5;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState({
    // step 1 — conta
    email: '', senha: '', celular: '',
    // step 2 — dados pessoais (cidadão)
    nome: '', cpf: '', dataNascimento: '', genero: '',
    // step 3 (prestador) — dados profissionais
    nomeRazaoSocial: '', cpfCnpj: '', whatsapp: '', biografia: '',
    // step 3 (cidadão) / step 4 (prestador) — endereço
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', estado: '',
  });

  // step 5 (prestador) — documentos
  const [documentos, setDocumentos] = useState<{ tipo: string; file: File }[]>([]);
  const [tipoDoc, setTipoDoc] = useState('RG');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  function maskCpf(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_,a,b,c,e) => [a,b,c].filter(Boolean).join('.') + (e ? '-'+e : ''));
  }
  function maskCpfCnpj(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 11)
      return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_,a,b,c,e) => [a,b,c].filter(Boolean).join('.') + (e ? '-'+e : ''));
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_,a,b,c,d2,e) => `${a}.${b}.${c}/${d2}` + (e ? '-'+e : ''));
  }
  function maskPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_,a,b,c) => `(${a}) ${b}` + (c ? '-'+c : ''));
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_,a,b,c) => `(${a}) ${b}` + (c ? '-'+c : ''));
  }
  function maskCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{5})(\d{0,3})/, (_,a,b) => a + (b ? '-'+b : ''));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo muito grande. Máximo: 10 MB.'); return; }
    setDocumentos(prev => [...prev, { tipo: tipoDoc, file }]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeDoc(idx: number) {
    setDocumentos(prev => prev.filter((_, i) => i !== idx));
  }

  function formatCpf(v: string) {
    const d = v.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    return v;
  }
  function formatCpfCnpj(v: string) {
    const d = v.replace(/\D/g, '');
    if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    if (d.length === 14) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
    return v;
  }
  function formatCep(v: string) {
    const d = v.replace(/\D/g, '');
    if (d.length === 8) return `${d.slice(0,5)}-${d.slice(5)}`;
    return v;
  }

  function parseError(err: unknown): string {
    const data = (err as { response?: { data?: unknown } })?.response?.data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, string>;
      if (d.erro) return d.erro;
      const msgs = Object.entries(d)
        .filter(([, v]) => typeof v === 'string')
        .map(([k, v]) => `${k}: ${v}`);
      if (msgs.length) return msgs.join(' · ');
    }
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 401) return 'Sessão inválida. Tente novamente.';
    return 'Erro inesperado. Verifique os dados e tente novamente.';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < totalSteps) {
      if (step === 2) {
        if (!validarCpf(form.cpf)) {
          setError('CPF inválido. Verifique os dígitos verificadores.');
          return;
        }
      }
      if (!isCidadao && step === 3) {
        const cnpjDigits = form.cpfCnpj.replace(/\D/g, '');
        if (cnpjDigits.length > 0 && !validarCnpj(form.cpfCnpj)) {
          setError('CNPJ inválido. Verifique os dígitos verificadores.');
          return;
        }
      }
      setError('');
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const celularDigits = form.celular.replace(/\D/g, '');
      const enderecoPayload = {
        cep: formatCep(form.cep), logradouro: form.logradouro, numero: form.numero,
        complemento: form.complemento || undefined, bairro: form.bairro,
        municipio: form.municipio, estado: form.estado.toUpperCase(),
      };

      if (isCidadao) {
        await cadastrarCidadao({
          email: form.email, senha: form.senha, celular: celularDigits,
          nome: form.nome, cpf: formatCpf(form.cpf),
          dataNascimento: form.dataNascimento, genero: form.genero,
          ...enderecoPayload,
        });
        const loginRes = await apiLogin(form.email, form.senha);
        const { token, roles, id } = loginRes.data;
        login(form.email, roles, token, id);
      } else {
        // 1. Criar conta base como cidadão
        await cadastrarCidadao({
          email: form.email, senha: form.senha, celular: celularDigits,
          nome: form.nome, cpf: formatCpf(form.cpf),
          dataNascimento: form.dataNascimento, genero: form.genero,
          ...enderecoPayload,
        });
        // 2. Fazer login — token entra no localStorage para as próximas chamadas autenticadas
        const loginRes = await apiLogin(form.email, form.senha);
        const { token, roles, id } = loginRes.data;
        login(form.email, roles, token, id);
        // 3. Criar perfil de prestador (autenticado via token no localStorage)
        await cadastrarPrestador({
          nomeRazaoSocial: form.nomeRazaoSocial,
          cpfCnpj: form.cpfCnpj.replace(/\D/g, '').length >= 14 ? formatCpfCnpj(form.cpfCnpj) : undefined,
          biografia: form.biografia || undefined,
          whatsapp: form.whatsapp.replace(/\D/g, ''),
          ...enderecoPayload,
        });
        // 4. Atualizar contexto com ROLE_PRESTADOR (backend já concedeu a role)
        login(form.email, [...roles, 'ROLE_PRESTADOR'], token, id);
        // 5. Enviar documentos (opcional)
        for (const doc of documentos) {
          await uploadAnexoPrestador(doc.file, doc.tipo);
        }
      }

      onComplete(perfil);
    } catch (err: unknown) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── step labels ──────────────────────────────────────────────────────────
  function stepSubtitle() {
    if (step === 1) return 'Informações de acesso';
    if (isCidadao) {
      if (step === 2) return 'Dados pessoais';
      if (step === 3) return 'Endereço';
    } else {
      if (step === 2) return 'Dados pessoais (conta cidadão)';
      if (step === 3) return 'Dados profissionais';
      if (step === 4) return 'Endereço';
      if (step === 5) return 'Documentos (opcional)';
    }
    return '';
  }

  const enderecoStep = isCidadao ? 3 : 4;
  const isLastStep = step === totalSteps;

  return (
    <AuthLayout step={step} totalSteps={totalSteps}>
      <button onClick={step === 1 ? onBack : () => setStep(s => s - 1)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 20,
      }}>
        <Icon name="chevronLeft" size={16}/> Voltar
      </button>

      <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
        {isCidadao ? 'Cadastro de cidadão' : 'Cadastro de prestador'}
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>{stepSubtitle()}</p>

      {error && (
        <div style={{
          padding: '12px 14px', borderRadius: 10, marginBottom: 16,
          background: 'var(--red-soft)', border: '1px solid rgba(214,62,21,0.2)',
          fontSize: 13, color: 'var(--red)', fontWeight: 600,
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Icon name="alertCircle" size={16}/>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: conta ── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="E-mail *">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required autoComplete="email"/>
            </Field>
            <Field label="Senha *" hint="Mínimo 8 caracteres">
              <Input type="password" value={form.senha} onChange={set('senha')} placeholder="••••••••" required minLength={8} autoComplete="new-password"/>
            </Field>
            <Field label="Celular *" hint="Com DDD, ex: (82) 99999-9999">
              <Input type="tel" value={form.celular}
                onChange={e => setForm(f => ({ ...f, celular: maskPhone(e.target.value) }))}
                placeholder="(82) 99999-9999" required/>
            </Field>
          </div>
        )}

        {/* ── Step 2: dados pessoais (cidadão base) ── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nome completo *">
              <Input value={form.nome} onChange={set('nome')} required/>
            </Field>
            <Field label="CPF *" hint="Pode digitar só os números">
              <Input value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: maskCpf(e.target.value) }))}
                placeholder="000.000.000-00" required/>
            </Field>
            <Field label="Data de nascimento *">
              <Input type="date" value={form.dataNascimento} onChange={set('dataNascimento')} required/>
            </Field>
            <Field label="Gênero *">
              <Select value={form.genero} onChange={set('genero')} required>
                <option value="">Selecione…</option>
                {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </Select>
            </Field>
          </div>
        )}

        {/* ── Step 3 (prestador): dados profissionais ── */}
        {!isCidadao && step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Nome / Razão social *">
              <Input value={form.nomeRazaoSocial} onChange={set('nomeRazaoSocial')} required/>
            </Field>
            <Field label="CNPJ (opcional)" hint="Preencha apenas se atuar como pessoa jurídica">
              <Input value={form.cpfCnpj}
                onChange={e => setForm(f => ({ ...f, cpfCnpj: maskCpfCnpj(e.target.value) }))}
                placeholder="00.000.000/0001-00"/>
            </Field>
            <Field label="WhatsApp *" hint="Com DDD, ex: (82) 99999-9999">
              <Input type="tel" value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: maskPhone(e.target.value) }))}
                placeholder="(82) 99999-9999" required/>
            </Field>
            <Field label="Biografia (opcional)">
              <textarea value={form.biografia} onChange={set('biografia')} rows={3}
                placeholder="Conte um pouco sobre você e como pode ajudar…"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', background: 'var(--paper)' }}/>
            </Field>
          </div>
        )}

        {/* ── Endereço (step 3 cidadão / step 4 prestador) ── */}
        {step === enderecoStep && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="CEP *" hint={cepLoading ? 'Buscando endereço…' : 'Pode digitar só os números'}>
              <Input value={form.cep}
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
                placeholder="57036-610" required/>
            </Field>
            <Field label="Logradouro *">
              <Input value={form.logradouro} onChange={set('logradouro')} required/>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Número *"><Input value={form.numero} onChange={set('numero')} required/></Field>
              <Field label="Complemento"><Input value={form.complemento} onChange={set('complemento')}/></Field>
            </div>
            <Field label="Bairro *"><Input value={form.bairro} onChange={set('bairro')} required/></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <Field label="Município *"><Input value={form.municipio} onChange={set('municipio')} required/></Field>
              <Field label="UF *"><Input value={form.estado} onChange={set('estado')} maxLength={2} placeholder="AL" required/></Field>
            </div>
          </div>
        )}

        {/* ── Step 5 (prestador): documentos ── */}
        {!isCidadao && step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Envie documentos para agilizar sua aprovação. Aceitos: imagens (JPG, PNG) e PDF. Máx. 10 MB por arquivo.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={tipoDoc}
                onChange={e => setTipoDoc(e.target.value)}
                style={{ height: 42, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, background: 'var(--paper)', cursor: 'pointer' }}
              >
                {TIPOS_DOCUMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button type="button" onClick={() => fileRef.current?.click()} style={{
                height: 42, padding: '0 16px', borderRadius: 10, border: 'none',
                background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="paperclip" size={16}/> Selecionar arquivo
              </button>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileSelect}/>
            </div>

            {documentos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {documentos.map((d, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--line-2)',
                  }}>
                    <Icon name="paperclip" size={15} color="var(--coral)"/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{d.tipo}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file.name}</div>
                    </div>
                    <button type="button" onClick={() => removeDoc(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}>
                      <Icon name="x" size={15}/>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                Nenhum documento selecionado. Você pode pular e enviar depois.
              </div>
            )}
          </div>
        )}

        <PrimaryButton type="submit" disabled={loading} style={{ marginTop: 20 }}
          icon={!isLastStep ? <Icon name="arrow" size={18}/> : undefined}>
          {loading
            ? (isLastStep ? 'Criando conta…' : 'Aguarde…')
            : isLastStep
              ? (isCidadao ? 'Criar conta' : 'Finalizar cadastro')
              : 'Continuar'}
        </PrimaryButton>
      </form>

      {step === 1 && (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
          Já tem conta?{' '}
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--coral)', fontWeight: 700, fontSize: 13 }}>
            Entrar
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
