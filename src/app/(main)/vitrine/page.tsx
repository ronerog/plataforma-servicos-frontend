import { Suspense } from 'react';
import VitrineScreen from '@/components/cidadao/VitrineScreen';
export default function VitrinePage() {
  return (
    <Suspense>
      <VitrineScreen />
    </Suspense>
  );
}
