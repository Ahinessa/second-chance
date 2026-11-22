import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { City, categories } from '../data/mockData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALL_VALID_CATEGORIES = ['clothes', 'home', 'media', 'antiques', 'flea'];

export function AddPlaceModal({
  user,
  city,
  onClose,
  onSuccess,
  onNotify
}: {
  user: any;
  city: City;
  onClose: () => void;
  onSuccess: (resolvedCityId: string) => void;
  onNotify: (msg: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  async function resolveCityUuid(targetCity: City): Promise<string | null> {
    if (UUID_REGEX.test(targetCity.id)) return targetCity.id;

    const { data: existing } = await supabase
      .from('cities')
      .select('id')
      .ilike('name', targetCity.name)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const slug = targetCity.slug || `city-${Date.now()}`;
    const { data: created } = await supabase
      .from('cities')
      .insert({
        name: targetCity.name,
        country: targetCity.country || 'Россия',
        currency: '₽',
        slug,
        lat: targetCity.lat,
        lng: targetCity.lng
      })
      .select('id')
      .single();

    return created?.id || null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) {
      onNotify('Войдите в аккаунт, чтобы предложить место');
      return;
    }

    setSubmitting(true);
    const f = new FormData(e.currentTarget);

    const realCityId = await resolveCityUuid(city);
    if (!realCityId) {
      setSubmitting(false);
      onNotify('Не удалось определить город. Попробуйте выбрать его заново.');
      return;
    }

    const rawLink = String(f.get('verify_link') || '').trim();
    const selectedCat = String(f.get('category') || 'all');

    // Если выбрано «Всё подряд» ('all'), отправляем массив всех разрешённых базой категорий
    const mappedCategories =
      selectedCat === 'all' ? ALL_VALID_CATEGORIES : [selectedCat];

    const userRole = user.user_metadata?.role;
    const isAutoApproved =
      user.email?.toLowerCase() === 'ahinessa@yandex.ru' ||
      ['trusted', 'owner', 'organizer'].includes(userRole);

    const basePayload = {
      city_id: realCityId,
      owner_id: user.id,
      name: String(f.get('name') || '').trim(),
      address: String(f.get('address') || '').trim(),
      social_links: rawLink ? [rawLink] : [],
      categories: mappedCategories,
      place_type: 'shop',
      lat: city.lat,
      lng: city.lng
    };

    let { error } = await supabase.from('places').insert({
      ...basePayload,
      status: isAutoApproved ? 'approved' : 'pending'
    });

    if (error && isAutoApproved) {
      const fallback = await supabase.from('places').insert({
        ...basePayload,
        status: 'pending'
      });
      error = fallback.error;
    }

    setSubmitting(false);

    if (error) {
      onNotify('Не удалось отправить заявку. Проверьте заполненные поля.');
      return;
    }

    onClose();
    onSuccess(realCityId);
    onNotify(
      isAutoApproved
        ? 'Место опубликовано на карте! Спасибо ♥'
        : 'Отправлено на проверку! Спасибо ♥'
    );
  }

  return (
    <div className="modalback" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Добавить место"
        onClick={e => e.stopPropagation()}
      >
        <header className="modal-head" style={{ borderBottom: 'none', paddingBottom: '8px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>ДОБАВИТЬ МЕСТО</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <input name="name" required placeholder="Название места" />
          <input name="address" required placeholder="Адрес (улица, дом)" />
          <input
            name="verify_link"
            type="url"
            required
            placeholder="Ссылка для проверки информации (сайт, Telegram, ВК, карты)"
          />
          <select name="category">
            {categories.map(([id, n]) => (
              <option value={id} key={id}>
                {n}
              </option>
            ))}
          </select>
          <button className="lime-button" disabled={submitting}>
            {submitting ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ НА ПРОВЕРКУ'}
          </button>
        </form>
      </section>
    </div>
  );
}
