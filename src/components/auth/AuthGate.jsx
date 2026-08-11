import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase.js';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';

const AUTH_REQUIRED = String(import.meta.env.VITE_REQUIRE_AUTH ?? 'false').toLowerCase() === 'true';

export function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(AUTH_REQUIRED);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!AUTH_REQUIRED) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (loginError) setError('No se pudo iniciar sesión. Verifica correo y contraseña.');
    setSubmitting(false);
  };

  if (!AUTH_REQUIRED) return children;

  if (loading) {
    return <main style={{ maxWidth: 460, margin: '80px auto', padding: 24 }}>Comprobando sesión…</main>;
  }

  if (!session) {
    return (
      <main style={{ maxWidth: 460, margin: '64px auto', padding: 24 }}>
        <h1>Gaby Tours 2021</h1>
        <p>Acceso administrativo. Inicia sesión para gestionar viajes y pasajeros.</p>
        <form onSubmit={login} style={{ display: 'grid', gap: 16 }}>
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--higo-danger, #c62828)' }}>{error}</p>}
          <Button type="submit" fullWidth loading={submitting}>Entrar</Button>
        </form>
      </main>
    );
  }

  return children;
}
