import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthModal({
  user,
  favoritesCount,
  onClose,
  onOpenAddPlace,
  onNotify
}: {
  user: any;
  favoritesCount: number;
  onClose: () => void;
  onOpenAddPlace: () => void;
  onNotify: (msg: string) => void;
}) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result =
      authMode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password: pw })
        : await supabase.auth.signUp({ email, password: pw });
    setLoading(false);

    if (result.error) {
      onNotify(result.error.message);
    } else {
      onNotify(
        authMode === 'signup'
          ? 'Проверьте email для подтверждения регистрации'
          : 'Вы вошли!'
      );
      onClose();
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    onClose();
    onNotify('Вы вышли из аккаунта');
  }

  return (
    <div className="modalback" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={user ? 'Профиль' : 'Аккаунт Second Chance'}
        onClick={e => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2>{user ? 'ПРОФИЛЬ' : 'АККАУНТ SECOND CHANCE'}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        {user ? (
          <div className="space-y-4 text-sm">
            <div style={{ padding: '14px', border: '1px solid #000', backgroundColor: '#fff' }}>
              <p style={{ margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Ваш email:</span> {user.email}
              </p>
              <p style={{ margin: '8px 0 0 0' }}>
                <span style={{ fontWeight: 600 }}>В любимых местах:</span> {favoritesCount}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="lime-button"
                onClick={() => {
                  onClose();
                  onOpenAddPlace();
                }}
              >
                + ДОБАВИТЬ МЕСТО
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={handleSignOut}
              >
                ВЫЙТИ ИЗ АККАУНТА
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => setAuthMode('login')}
              >
                ВХОД
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'active' : ''}
                onClick={() => setAuthMode('signup')}
              >
                РЕГИСТРАЦИЯ
              </button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Email
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </label>
              <label>
                Пароль
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Минимум 6 символов"
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                />
              </label>
              <button className="lime-button" disabled={loading}>
                {loading
                  ? 'ПОДОЖДИТЕ...'
                  : authMode === 'login'
                  ? 'ВОЙТИ'
                  : 'СОЗДАТЬ АККАУНТ'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
