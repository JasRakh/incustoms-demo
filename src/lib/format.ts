export const money = (n: number, cur = 'сум') =>
  `${Math.round(n).toLocaleString('ru-RU').replace(/[  ,]/g, ' ')} ${cur}`;
export const num = (n: number, digits = 2) =>
  n
    .toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    .replace(/[  ]/g, ' ');
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
export const fmtShort = (d: string) => new Date(d).toLocaleDateString('ru-RU');
export const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export const fmtDateTime = (d: string) => `${fmtDate(d)} в ${fmtTime(d)}`;
export const fmtSize = (b: number) =>
  b < 1024
    ? `${b} B`
    : b < 1048576
      ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / 1048576).toFixed(1)} MB`;
export const initials = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || 'U';
export const today = () => new Date().toISOString().slice(0, 10);

export function relative(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  const days = Math.round(h / 24);
  return days === 1 ? '1 день назад' : `${days} дн. назад`;
}

export function downloadText(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
