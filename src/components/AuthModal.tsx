import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAILS = ['ahinessa@yandex.ru'];

type RoleMeta = {
  label: string;
  badgeBg: string;
  type: 'auto' | 'verified';
  hint: string;
};

const ROLE_CONFIG: Record<string, RoleMeta> = {
  creator: {
    label: 'Создатель проекта',
    badgeBg: '#CCFF00',
    type: 'verified',
    hint: 'Полный доступ к модерации, подтверждению статусов и управлению каталогом'
  },
  trusted: {
    label: 'Доверенный автор',
    badgeBg: '#CCFF00',
    type: 'verified',
    hint: 'Проверенный участник: добавленные вами места публикуются на карту сразу без премодерации'
  },
  owner: {
    label: 'Владелец места',
    badgeBg: '#CCFF00',
    type: 'verified',
    hint: 'Подтверждённый представитель магазина: управление карточкой точки и анонсы завозов'
  },
  organizer: {
    label: 'Организатор маркетов',
    badgeBg: '#CCFF00',
    type: 'verified',
    hint: 'Подтверждённый создатель маркетов, гараж-сейлов и свопов'
  },
  scout: {
    label: 'Находчик',
    badgeBg: '#e4f796',
    type: 'auto',
    hint: 'Автостатус: присвоен за 3+ проверенных и одобренных места на карте'
  },
  enthusiast: {
    label: 'Любитель',
    badgeBg: '#f3f2ed',
    type: 'auto',
    hint: 'Автостатус: присвоен за 5+ сохранённых любимых мест и активность на карте'
  },
  visitor: {
    label: 'Визитёр',
    badgeBg: '#f3f2ed',
    type: 'auto',
    hint: 'Базовый статус: сохраняйте любимые места или предлагайте точки, чтобы повысить статус'
  }
};

export function AuthModal({
  user,
  favoritesCount,
  onClose,
  onOpenAddPlace,
  onShowFavorites,
  onNotify
}: {
  user: any;
  favoritesCount: number;
  onClose: () => void;
  onOpenAddPlace: () => void;
  onShowFavorites?: () => void;
  onNotify: (msg: string) => void;
}) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  const isCreator = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const defaultNameFromEmail = user?.email
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1)
    : '';

  const [viewMode, setViewMode] = useState<'view' | 'editName' | 'requestRole'>('view');
  const [displayName, setDisplayName] = useState('');
  const [manualRole, setManualRole] = useState<string | null>(null);
  const [approvedCount, setApprovedCount] = useState<number>(0);
  const [pendingRequestRole, setPendingRequestRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Поля заявки на ручной статус
  const [reqRole, setReqRole] = useState<'trusted' | 'owner' | 'organizer'>('trusted');
  const [reqContact, setReqContact] = useState('');
  const [reqComment, setReqComment] = useState('');

  useEffect(() => {
    if (!user) return;
    setViewMode('view');
    const meta = user.user_metadata || {};
    const initialName = meta.full_name || defaultNameFromEmail;
    setDisplayName(initialName);
    setPendingRequestRole(meta.pending_role_request || null);

    if (isCreator) {
      setManualRole('creator');
    } else if (['trusted', 'owner', 'organizer'].includes(meta.role)) {
      setManualRole(meta.role);
    } else {
      setManualRole(null);
    }

    // 1. Проверяем профиль в Supabase (если ты вручную назначила статус)
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        if (data) {
          if (data.full_name) setDisplayName(data.full_name);
          if (!isCreator && ['trusted', 'owner', 'organizer'].includes(data.role)) {
            setManualRole(data.role);
          }
        } else {
          supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: initialName,
            role: isCreator ? 'creator' : 'visitor'
          });
        }
      });

    // 2. Считаем одобренные места пользователя для автоматического статуса «Находчик»
    supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('status', 'approved')
      .then(({ count }) => {
        if (typeof count === 'number') setApprovedCount(count);
      });
  }, [user, isCreator, defaultNameFromEmail]);

  // Вычисляем итоговый статус: ручной (если одобрен админом) либо автоматический по активности
  const effectiveRoleKey = (() => {
    if (isCreator) return 'creator';
    if (manualRole && ROLE_CONFIG[manualRole]) return manualRole;
    if (approvedCount >= 3) return 'scout';
    if (favoritesCount >= 5) return 'enthusiast';
    return 'visitor';
  })();

  const currentRoleInfo = ROLE_CONFIG[effectiveRoleKey] || ROLE_CONFIG.visitor;

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

  async function handleSaveName(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const cleanName = displayName.trim() || defaultNameFromEmail;

    const { error } = await supabase.auth.updateUser({
      data: { full_name: cleanName }
    });

    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: cleanName,
      role: effectiveRoleKey
    });

    setSaving(false);

    if (error) {
      onNotify(error.message);
    } else {
      setDisplayName(cleanName);
      setViewMode('view');
      onNotify('Имя сохранено');
    }
  }

  async function handleSendRoleRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    await supabase.from('role_requests').insert({
      user_id: user.id,
      user_email: user.email,
      requested_role: reqRole,
      place_or_contact: reqContact.trim(),
      comment: reqComment.trim(),
      status: 'pending'
    });

    await supabase.auth.updateUser({
      data: { pending_role_request: reqRole }
    });

    setSaving(false);
    setPendingRequestRole(reqRole);
    setViewMode('view');
    onNotify('Заявка отправлена! После проверки мы обновим ваш статус.');
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
        <header className="modal-head" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
          <h2 style={{ fontSize: '24px', margin: 0 }}>{user ? 'ПРОФИЛЬ' : 'АККАУНТ SECOND CHANCE'}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        {user ? (
          <div className="space-y-4 text-sm">
            {viewMode === 'view' && (
              <>
                <div
                  style={{
                    padding: '16px',
                    border: '1px solid #000',
                    backgroundColor: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Имя + текущий статус + кнопка редактирования имени */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span style={{ fontSize: '18px', fontWeight: 700 }}>
                        {displayName || defaultNameFromEmail}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '3px 10px',
                          border: '1px solid #000',
                          backgroundColor: currentRoleInfo.badgeBg
                        }}
                      >
                        {currentRoleInfo.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewMode('editName')}
                      className="cursor-pointer hover:bg-[#CCFF00] transition-colors"
                      style={{
                        fontSize: '13px',
                        padding: '4px 10px',
                        border: '1px solid #000',
                        backgroundColor: '#fff'
                      }}
                    >
                      ✎ Изменить имя
                    </button>
                  </div>

                  {/* Описание статуса */}
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(0,0,0,0.68)' }}>
                    {currentRoleInfo.hint}
                  </p>

                  {/* Прогресс автоматических званий для базовых пользователей */}
                  {!isCreator && !manualRole && effectiveRoleKey !== 'scout' && (
                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#f8f7f3',
                        border: '1px solid rgba(0,0,0,0.2)',
                        fontSize: '12px'
                      }}
                    >
                      {effectiveRoleKey === 'visitor' && (
                        <span>
                          До автостатуса <b>«Любитель»</b>: сохраните ещё {Math.max(0, 5 - favoritesCount)} мест в любимые (сейчас {favoritesCount}/5).
                        </span>
                      )}
                      {effectiveRoleKey === 'enthusiast' && (
                        <span>
                          До автостатуса <b>«Находчик»</b>: добавьте {Math.max(0, 3 - approvedCount)} проверенных места на карту (сейчас {approvedCount}/3).
                        </span>
                      )}
                    </div>
                  )}

                  {/* Статус отправленной заявки на ручное повышение */}
                  {!isCreator && pendingRequestRole && !manualRole && (
                    <div
                      style={{
                        padding: '8px 10px',
                        border: '1px dashed #000',
                        backgroundColor: '#f8f7f3',
                        fontSize: '12px'
                      }}
                    >
                      ⏳ Заявка на статус <b>«{ROLE_CONFIG[pendingRequestRole]?.label}»</b> на проверке.
                    </div>
                  )}

                  {/* Основные данные */}
                  <div style={{ paddingTop: '2px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <p style={{ margin: 0 }}>
                      <span style={{ fontWeight: 600 }}>Email:</span> {user.email}
                    </p>
                    <p style={{ margin: 0 }}>
                      <span style={{ fontWeight: 600 }}>Любимые места:</span>{' '}
                      {onShowFavorites && favoritesCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onShowFavorites();
                          }}
                          className="underline hover:bg-[#CCFF00] cursor-pointer"
                          style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                        >
                          {favoritesCount} (показать на карте ↗)
                        </button>
                      ) : (
                        <span>{favoritesCount}</span>
                      )}
                    </p>
                    {approvedCount > 0 && (
                      <p style={{ margin: 0 }}>
                        <span style={{ fontWeight: 600 }}>Одобрено ваших мест:</span> {approvedCount}
                      </p>
                    )}
                  </div>
                </div>

                {/* Кнопки действий */}
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

                  {!isCreator && (
                    <button
                      type="button"
                      className="outline-button"
                      onClick={() => setViewMode('requestRole')}
                    >
                      ПОДАТЬ ЗАЯВКУ НА ИЗМЕНЕНИЕ СТАТУСА
                    </button>
                  )}

                  <button
                    type="button"
                    className="outline-button"
                    onClick={handleSignOut}
                  >
                    ВЫЙТИ ИЗ АККАУНТА
                  </button>
                </div>
              </>
            )}

            {viewMode === 'editName' && (
              <form
                onSubmit={handleSaveName}
                style={{
                  padding: '16px',
                  border: '1px solid #000',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 600 }}>
                  Ваше имя или никнейм
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Как к вам обращаться"
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #000',
                      fontWeight: 400,
                      fontSize: '14px'
                    }}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="lime-button" disabled={saving}>
                    {saving ? 'СОХРАНЕНИЕ...' : 'СОХРАНИТЬ'}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setViewMode('view')}
                  >
                    ОТМЕНА
                  </button>
                </div>
              </form>
            )}

            {viewMode === 'requestRole' && (
              <form
                onSubmit={handleSendRoleRequest}
                style={{
                  padding: '16px',
                  border: '1px solid #000',
                  backgroundColor: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '15px' }}>
                  Заявка на проверенный статус
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: 600 }}>Выберите роль (выдаётся после проверки):</span>
                  {[
                    {
                      id: 'trusted' as const,
                      title: 'Доверенный автор',
                      desc: 'Ваши новые места публикуются на карту сразу без ручной проверки'
                    },
                    {
                      id: 'owner' as const,
                      title: 'Владелец места',
                      desc: 'Подтверждённый владелец секонда или винтажного магазина'
                    },
                    {
                      id: 'organizer' as const,
                      title: 'Организатор маркетов / шоу',
                      desc: 'Создатель поп-ап маркетов, гараж-сейлов и свопов'
                    }
                  ].map(opt => (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        border: '1px solid #000',
                        backgroundColor: reqRole === opt.id ? '#CCFF00' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="reqRole"
                        checked={reqRole === opt.id}
                        onChange={() => setReqRole(opt.id)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{opt.title}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.75)' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                  {reqRole === 'owner'
                    ? 'Название магазина и ссылка на его соцсети'
                    : reqRole === 'organizer'
                    ? 'Название маркета / проекта и ссылка'
                    : 'Telegram или ВК для связи'}
                  <input
                    type="text"
                    required
                    value={reqContact}
                    onChange={e => setReqContact(e.target.value)}
                    placeholder={
                      reqRole === 'owner'
                        ? 'Например: Секонд «Второй круг», https://t.me/...'
                        : reqRole === 'organizer'
                        ? 'Например: Гараж-сейл, https://t.me/...'
                        : '@username или ссылка на профиль'
                    }
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #000',
                      fontWeight: 400,
                      fontSize: '14px'
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                  Комментарий для проверки
                  <textarea
                    rows={2}
                    value={reqComment}
                    onChange={e => setReqComment(e.target.value)}
                    placeholder="Кратко опишите, почему запрашиваете этот статус"
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #000',
                      fontWeight: 400,
                      fontSize: '14px'
                    }}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="lime-button" disabled={saving}>
                    {saving ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ ЗАЯВКУ'}
                  </button>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() => setViewMode('view')}
                  >
                    ОТМЕНА
                  </button>
                </div>
              </form>
            )}
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
