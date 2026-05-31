import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Mãos Dadas — Serviços Comunitários',
  description: 'Conectamos cidadãos e voluntários na sua comunidade.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
          <Toaster position="bottom-right" richColors duration={4000}/>
        </AuthProvider>
      </body>
    </html>
  );
}
