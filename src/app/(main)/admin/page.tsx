'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminScreen from '@/components/admin/AdminScreen';

export default function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) router.push('/vitrine');
  }, [isAdmin, isLoading, router]);

  if (!isAdmin) return null;
  return <AdminScreen/>;
}
