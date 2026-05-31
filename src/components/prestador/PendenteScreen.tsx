'use client';

import PageHeader from '../ui/PageHeader';
import Icon from '../ui/Icon';

export default function PendenteScreen() {
  const steps = [
    { t: 'Identidade verificada',  sub: 'Dados em conformidade',    done: true  },
    { t: 'Endereço confirmado',    sub: 'Localização validada',      done: true  },
    { t: 'Aguardando moderação',   sub: 'Análise manual em até 48h', done: false, current: true },
  ];

  return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="Cadastro em análise" subtitle="Em até 48h liberaremos sua conta de prestador"/>

      <div style={{ background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line-2)', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'var(--amber-soft)', color: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="clock" size={30}/>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>Em análise</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Aguardando moderação</div>
          </div>
        </div>

        <p style={{ margin: '0 0 20px', fontSize: 14.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          Recebemos seus dados e seu cadastro está na fila de validação. Você receberá um e-mail assim que sua conta estiver liberada para publicar serviços.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map((it, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              background: it.current ? 'var(--amber-soft)' : 'var(--cream)',
              borderRadius: 12, border: '1px solid ' + (it.current ? '#F0D58E' : 'var(--line-2)'),
            }}>
              <Icon name={it.done ? 'checkCircle' : 'clock'} size={20} color={it.done ? 'var(--green)' : 'var(--amber)'}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{it.t}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{it.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
