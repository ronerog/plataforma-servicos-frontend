'use client';

import { useState, useRef } from 'react';
import Icon from '../ui/Icon';
import { resubmeterPrestador, uploadAnexoPrestador } from '@/lib/api';
import { buscarCep } from '@/lib/viacep';
import { validarCnpj } from '@/lib/validators';
import { toast } from 'sonner';

const TIPOS_DOCUMENTO = [
  { value: 'RG',                    label: 'RG' },
  { value: 'CPF',                   label: 'CPF' },
  { value: 'CNPJ',                  label: 'Cartão CNPJ' },
  { value: 'COMPROVANTE_RESIDENCIA', label: 'Comprovante de residência' },
  { value: 'DOCUMENTO',             label: 'Outro documento' },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%', height: 44, padding: '0 14px',
        background: 'var(--paper)', borderRadius: 10,
        border: '1.5px solid var(--line)', fontSize: 14, fontWeight: 500,
        transition: 'border-color .15s', ...props.style,
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--coral)')}
      onBlur={e => (e.target.style.borderColor = 'var(--line)')}
    />
  );
}

export default function ReprovadoScreen({ onResubmitted }: { onResubmitted: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);

  const [form, setForm] = useState({
    nomeRazaoSocial: '', cpfCnpj: '', biografia: '', whatsapp: '',
    cep: '', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', estado: '',
  });

  const [documentos, setDocumentos] = useState<{ tipo: string; file: File }[]>([]);
  const [tipoDoc, setTipoDoc] = useState('RG');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  function maskCpfCnpj(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14);
    if (d.length <= 11)
      return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_,a,b,c,e) => [a,b,c].filter(Boolean).join('.') + (e ? '-'+e : ''));
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_,a,b,c,d2,e) => `${a}.${b}.${c}/${d2}` + (e ? '-'+e : ''));
  }
  function maskWhatsapp(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, (_,a,b,c) => `(${a}) ${b}` + (c ? '-'+c : ''));
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, (_,a,b,c) => `(${a}) ${b}` + (c ? '-'+c : ''));
  }
  function maskCep(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.replace(/(\d{5})(\d{0,3})/, (_,a,b) => a + (b ? '-'+b : ''));
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo muito grande. Máximo: 10 MB.'); return; }
    setDocumentos(prev => [...prev, { tipo: tipoDoc, file }]);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < totalSteps) {
      if (step === 1) {
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
      await resubmeterPrestador({
        nomeRazaoSocial: form.nomeRazaoSocial,
        cpfCnpj: form.cpfCnpj.replace(/\D/g, '').length >= 14 ? formatCpfCnpj(form.cpfCnpj) : undefined,
        biografia: form.biografia || undefined,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        cep: formatCep(form.cep), logradouro: form.logradouro, numero: form.numero,
        complemento: form.complemento || undefined,
        bairro: form.bairro, municipio: form.municipio, estado: form.estado.toUpperCase(),
      });
      for (const doc of documentos) {
        await uploadAnexoPrestador(doc.file, doc.tipo);
      }
      onResubmitted();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      let msg = '';
      if (data && typeof data === 'object') {
        const d = data as Record<string, string>;
        if (d.erro) msg = d.erro;
        else msg = Object.entries(d).filter(([, v]) => typeof v === 'string').map(([k, v]) => `${k}: ${v}`).join(' · ');
      }
      setError(msg || 'Erro ao enviar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <div style={{ maxWidth: 520 }}>
        <div style={{
          background: 'var(--red-soft)', border: '1px solid rgba(214,62,21,0.25)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
          display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <Icon name="alertCircle" size={22} color="var(--red)"/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--red)', marginBottom: 6 }}>Cadastro reprovado</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              Seu cadastro de prestador foi reprovado. Revise seus dados, corrija as informações necessárias e reenvie para nova análise.
            </div>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          height: 48, padding: '0 24px', borderRadius: 12, border: 'none',
          background: 'var(--coral)', color: '#fff',
          fontWeight: 800, fontSize: 15, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="pencil" size={16} color="#fff"/> Corrigir e reenviar
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <button onClick={step === 1 ? () => setShowForm(false) : () => setStep(s => s - 1)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 14,
        }}>
          <Icon name="chevronLeft" size={16}/> Voltar
        </button>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? 'var(--coral)' : 'var(--line-2)', transition: 'background .3s' }}/>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Passo {step} de {totalSteps}</div>
      </div>

      <div style={{ background: 'var(--paper)', borderRadius: 18, border: '1px solid var(--line-2)', padding: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
          {step === 1 && 'Dados do prestador'}
          {step === 2 && 'Endereço'}
          {step === 3 && 'Documentos (opcional)'}
        </h2>
        <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 20 }}>
          {step === 1 && 'Corrija suas informações de prestador'}
          {step === 2 && 'Confirme ou atualize seu endereço'}
          {step === 3 && 'Envie documentos para agilizar a aprovação'}
        </p>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', gap: 8 }}>
            <Icon name="alertCircle" size={16}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 1 && (
            <>
              <Field label="Nome ou Razão Social *">
                <Input value={form.nomeRazaoSocial} onChange={set('nomeRazaoSocial')} placeholder="Seu nome completo ou nome da empresa" required/>
              </Field>
              <Field label="CNPJ (opcional)" hint="Preencha apenas se atuar como pessoa jurídica">
                <Input value={form.cpfCnpj}
                  onChange={e => setForm(f => ({ ...f, cpfCnpj: maskCpfCnpj(e.target.value) }))}
                  placeholder="00.000.000/0001-00"/>
              </Field>
              <Field label="WhatsApp *" hint="Cidadãos entrarão em contato por aqui">
                <Input type="tel" value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: maskWhatsapp(e.target.value) }))}
                  placeholder="(82) 99999-9999" required/>
              </Field>
              <Field label="Biografia (opcional)">
                <textarea value={form.biografia} onChange={set('biografia')} rows={3}
                  placeholder="Conte sobre você e como pode ajudar a comunidade…"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit', background: 'var(--paper)' }}/>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="CEP *" hint={cepLoading ? 'Buscando endereço…' : undefined}>
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
                <Field label="Estado *"><Input value={form.estado} onChange={set('estado')} maxLength={2} placeholder="AL" required/></Field>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Envie documentos para agilizar sua aprovação. Aceitos: imagens (JPG, PNG) e PDF. Máx. 10 MB por arquivo.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <select value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}
                  style={{ height: 42, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--line)', fontSize: 14, background: 'var(--paper)', cursor: 'pointer' }}>
                  {TIPOS_DOCUMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button type="button" onClick={() => fileRef.current?.click()} style={{
                  height: 42, padding: '0 16px', borderRadius: 10, border: 'none',
                  background: 'var(--coral)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>
                  Selecionar arquivo
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFileSelect}/>
              </div>
              {documentos.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documentos.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 10, border: '1px solid var(--line-2)' }}>
                      <Icon name="paperclip" size={15} color="var(--coral)"/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{d.tipo}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.file.name}</div>
                      </div>
                      <button type="button" onClick={() => setDocumentos(prev => prev.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}>
                        <Icon name="x" size={15}/>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>Nenhum documento selecionado. Você pode finalizar sem enviar.</div>
              )}
            </>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 6, width: '100%', height: 48, borderRadius: 12, border: 'none',
            background: 'var(--coral)', color: '#fff',
            fontWeight: 800, fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Enviando…' : step < totalSteps ? 'Continuar' : 'Reenviar cadastro'}
          </button>
        </form>
      </div>
    </div>
  );
}
