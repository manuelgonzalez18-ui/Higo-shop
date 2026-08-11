const url = (process.env.VITE_SUPABASE_URL ?? '').trim();
const key = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.warn('WARN: VITE_SUPABASE_URL falta o no tiene formato válido; el cliente usará la URL pública conocida del proyecto Higo Shop.');
}
if (key.length < 20) {
  console.error('ERROR: VITE_SUPABASE_ANON_KEY falta o es inválida.');
  process.exit(1);
}
console.log('Supabase environment OK.');
