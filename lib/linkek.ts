// Kimenő linkek a zynai.hu főoldalra, egységes UTM-paraméterekkel (a forgalom eredete mérhető legyen).
// A `hely` a link helyét jelöli az eszközön belül (pl. "fejlec", "lablec", "kezdooldal-csapat").

const ZYNAI = 'https://zynai.hu';

export function zynaiUrl(utvonal: string, hely: string): string {
  const u = new URL(utvonal, ZYNAI);
  if (u.origin !== ZYNAI) throw new Error(`Nem zynai.hu-útvonal: ${utvonal}`);
  u.searchParams.set('utm_source', 'ai-munkaprofil');
  u.searchParams.set('utm_medium', 'referral');
  u.searchParams.set('utm_campaign', 'ai-munkaprofil');
  u.searchParams.set('utm_content', hely);
  return u.toString();
}
