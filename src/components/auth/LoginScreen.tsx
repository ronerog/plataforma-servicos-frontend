'use client';

import { useState } from 'react';
import AuthLayout from './AuthLayout';
import PrimaryButton from '../ui/PrimaryButton';
import Icon from '../ui/Icon';
import { login as apiLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onCadastro: () => void;
}

export default function LoginScreen({ onBack, onSuccess, onCadastro }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha) { setError('Preencha e-mail e senha.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(email, senha);
      const { token, roles, id } = res.data;
      login(email, roles, token, id);
      onSuccess();
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <button onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: 'var(--ink-3)', fontWeight: 600, marginBottom: 24,
      }}>
        <Icon name="chevronLeft" size={16}/> Voltar
      </button>

      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
        Entrar na sua conta
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 28 }}>
        Bem-vindo de volta à Mãos Dadas
      </p>

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          background: 'var(--red-soft)', border: '1px solid rgba(214,62,21,0.2)',
          fontSize: 13.5, color: 'var(--red)', fontWeight: 600,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <Icon name="alertCircle" size={16}/> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            E-mail
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px', height: 48,
            background: 'var(--paper)', borderRadius: 12,
            border: `1.5px solid ${email ? 'var(--coral)' : 'var(--line)'}`,
            transition: 'border-color .15s',
          }}>
            <Icon name="mail" size={17} color="var(--ink-3)"/>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 500 }}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            Senha
          </label>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 14px', height: 48,
            background: 'var(--paper)', borderRadius: 12,
            border: `1.5px solid ${senha ? 'var(--coral)' : 'var(--line)'}`,
            transition: 'border-color .15s',
          }}>
            <Icon name="lock" size={17} color="var(--ink-3)"/>
            <input
              type={showSenha ? 'text' : 'password'} value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14.5, fontWeight: 500 }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowSenha(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
              <Icon name={showSenha ? 'eyeOff' : 'eye'} size={17}/>
            </button>
          </div>
        </div>

        <PrimaryButton type="submit" disabled={loading} style={{ marginTop: 6 }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </PrimaryButton>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-3)' }}>
        Não tem conta?{' '}
        <button onClick={onCadastro} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--coral)', fontWeight: 700, fontSize: 13.5,
        }}>
          Cadastre-se gratuitamente
        </button>
      </div>
    </AuthLayout>
  );
}
