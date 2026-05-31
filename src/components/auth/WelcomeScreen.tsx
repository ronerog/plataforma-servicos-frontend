'use client';

import AuthLayout from './AuthLayout';
import PrimaryButton from '../ui/PrimaryButton';
import Icon from '../ui/Icon';

interface Props {
  onLogin: () => void;
  onCadastro: (perfil: 'cidadao' | 'prestador') => void;
}

export default function WelcomeScreen({ onLogin, onCadastro }: Props) {
  return (
    <AuthLayout>
      <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6, marginBottom: 8 }}>
        Bem-vindo de volta 👋
      </h2>
      <p style={{ fontSize: 14.5, color: 'var(--ink-3)', marginBottom: 32, lineHeight: 1.5 }}>
        Acesse sua conta ou crie uma nova para começar a ajudar ou ser ajudado.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryButton onClick={onLogin} icon={<Icon name="arrow" size={18}/>}>
          Entrar na minha conta
        </PrimaryButton>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => onCadastro('cidadao')} style={{
            padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid var(--line)',
            background: 'var(--paper)', cursor: 'pointer',
            textAlign: 'left', transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <div style={{ color: 'var(--coral)', marginBottom: 8 }}>
              <Icon name="user" size={22}/>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Sou cidadão</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Quero encontrar serviços voluntários na minha comunidade
            </div>
          </button>

          <button onClick={() => onCadastro('prestador')} style={{
            padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid var(--line)',
            background: 'var(--paper)', cursor: 'pointer',
            textAlign: 'left', transition: 'border-color .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <div style={{ color: 'var(--coral)', marginBottom: 8 }}>
              <Icon name="handshake" size={22}/>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Sou prestador</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
              Quero oferecer meus serviços voluntários à comunidade
            </div>
          </button>
        </div>
      </div>

      <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 12, background: 'var(--coral-tint)', border: '1px solid var(--coral-soft)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--coral)', marginBottom: 4 }}>
          Plataforma 100% gratuita
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Mãos Dadas conecta cidadãos e voluntários sem nenhum custo. Sua contribuição é o seu tempo e talento.
        </div>
      </div>
    </AuthLayout>
  );
}
