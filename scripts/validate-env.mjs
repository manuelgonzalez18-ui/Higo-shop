const url = (process.env.VITE_SUPABASE_URL ?? '').trim();
const key = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.error('ERROR: VITE_SUPABASE_URL falta o no tiene formato válido.');
  process.exit(1);
}
if (key.length < 20) {
  console.error('ERROR: VITE_SUPABASE_ANON_KEY falta o es inválida.');
  process.exit(1);
}
console.log('Supabase environment OK.');
