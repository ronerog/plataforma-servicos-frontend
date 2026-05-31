'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomeScreen from '@/components/auth/WelcomeScreen';
import LoginScreen from '@/components/auth/LoginScreen';
import CadastroScreen from '@/components/auth/CadastroScreen';

type Shell = 'welcome' | 'login' | 'cadastro';
type Perfil = 'cidadao' | 'prestador';

export default function AuthPage() {
  const router = useRouter();
  const [shell, setShell] = useState<Shell>('welcome');
  const [perfil, setPerfil] = useState<Perfil>('cidadao');

  function handleLoginSuccess() {
    router.push('/vitrine');
  }

  function handleCadastroComplete(p: Perfil) {
    if (p === 'prestador') router.push('/prestador');
    else router.push('/vitrine');
  }

  if (shell === 'login') {
    return (
      <LoginScreen
        onBack={() => setShell('welcome')}
        onSuccess={handleLoginSuccess}
        onCadastro={() => setShell('cadastro')}
      />
    );
  }

  if (shell === 'cadastro') {
    return (
      <CadastroScreen
        perfil={perfil}
        onBack={() => setShell('welcome')}
        onComplete={handleCadastroComplete}
      />
    );
  }

  return (
    <WelcomeScreen
      onLogin={() => setShell('login')}
      onCadastro={(p) => { setPerfil(p); setShell('cadastro'); }}
    />
  );
}
