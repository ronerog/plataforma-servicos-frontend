export function validarCpf(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const n = d.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += n[i] * (10 - i);
  let rem = sum % 11;
  if (n[9] !== (rem < 2 ? 0 : 11 - rem)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += n[i] * (11 - i);
  rem = sum % 11;
  return n[10] === (rem < 2 ? 0 : 11 - rem);
}

export function validarCnpj(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const n = d.split('').map(Number);

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = w1.reduce((acc, w, i) => acc + n[i] * w, 0);
  let rem = sum % 11;
  if (n[12] !== (rem < 2 ? 0 : 11 - rem)) return false;

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = w2.reduce((acc, w, i) => acc + n[i] * w, 0);
  rem = sum % 11;
  return n[13] === (rem < 2 ? 0 : 11 - rem);
}
