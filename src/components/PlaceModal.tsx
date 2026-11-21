import {
  Place,
  Event,
  City,
  categories,
  buildGoogleMapsUrl,
  formatPriceRange,
  formatDateSafe
} from '../data/mockData';

function getSocialLabel(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('t.me') || u.includes('telegram')) return 'Telegram';
  if (u.includes('vk.com') || u.includes('vkontakte')) return 'ВКонтакте';
  if (u.includes('instagram.com')) return 'Instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YouTube';
  if (u.includes('avito.ru')) return 'Avito';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Ссылка';
  }
}

function PhotoCollage({
  images,
  singleUrl,
  alt
}: {
  images?: string[];
  singleUrl?: string | null;
  alt: string;
}) {
  const photos = (images && images.length ? images : singleUrl ? [singleUrl] : []).slice(0, 3);

  const renderSlot = (idx: number) => {
    const src = photos[idx];
    if (src) {
      return (
        <img
          src={src}
          alt={`${alt} — фото ${idx + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid #000' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
      );
    }
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: 'rgba(0,0,0,0.55)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: 'repeating-linear-gradient(-45deg, #f3f2ed, #f3f2ed 6px, #e7e5de 6px, #e7e5de 12px)'
        }}
      >
        Фото {idx + 1}
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        height: '380px',
        width: '100%'
      }}
    >
      <div style={{ height: '100%', overflow: 'hidden' }}>{renderSlot(0)}</div>
      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px', height: '100%', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflow: 'hidden' }}>{renderSlot(1)}</div>
        <div style={{ height: '100%', overflow: 'hidden' }}>{renderSlot(2)}</div>
      </div>
    </div>
  );
}

export function PlaceModal({
  selected,
  city,
  isFavorite,
  onToggleFavorite,
  onClose,
  onConfirm
}: {
  selected: Place | Event;
  city: City;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onConfirm: (closed: boolean) => void;
}) {
  const isSelectedPlace = 'place_type' in selected;
  const rawTitle = isSelectedPlace ? (selected as Place).name : (selected as Event).title;
  const title = rawTitle.replace(/\(пример карточки\)/gi, '').trim();

  const rawAddress = (selected.address || '').replace(/\(пример адреса\)/gi, '').trim();
  const displayAddress = rawAddress
    ? (rawAddress.toLowerCase().includes(city.name.toLowerCase()) ? rawAddress : `${city.name}, ${rawAddress}`)
    : `${city.name} (посмотреть на карте)`;

  const rawRecord = selected as Record<string, any>;

  // Собираем фотографии из массива images или отдельных колонок image_1, image_2, image_3 из Supabase
  const collectedImages: string[] = Array.isArray(rawRecord.images) && rawRecord.images.length
    ? rawRecord.images
    : [rawRecord.image_1, rawRecord.image_2, rawRecord.image_3, selected.imageUrl].filter(Boolean);

  // Собираем несколько соцсетей: поддерживаем массив social_links или строку с разделителями (запятая / пробел / перенос)
  const rawSocials: string[] = Array.isArray(rawRecord.social_links)
    ? rawRecord.social_links
    : String(
        rawRecord.social_link ||
        rawRecord.social_url ||
        rawRecord.url ||
        rawRecord.website ||
        rawRecord.link ||
        ''
      )
        .split(/[\s,;]+/)
        .map(s => s.trim())
        .filter(s => s.startsWith('http'));

  const socialLinks = rawSocials.length > 0
    ? rawSocials
    : ['https://t.me/second_chance_place', 'https://vk.com/second_chance_place'];

  const googleMapsUrl = buildGoogleMapsUrl(rawAddress, city.name, selected.lat, selected.lng);

  const cleanDescription = (selected.description || '')
    .replace(/Тестовая карточка для наполнения каталога\.\s*Проверить точный адрес, ассортимент и график перед публикацией\./gi, '')
    .trim();

  // Единый аккуратный стиль для меток (не мелкий и не перегруженный)
  const badgeStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
    border: '1px solid #000',
    lineHeight: '1.2',
    letterSpacing: '0.02em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px'
  };

  return (
    <div className="modalback" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="modal-head" style={{ borderBottom: 'none', paddingBottom: '6px' }}>
          <h2>{title}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>✕</button>
        </header>

        <div className="place-detail space-y-4">
          {/* 1. Метки категорий / формата + кнопка «В любимые» */}
          <div className="flex flex-wrap items-center gap-2">
            {isSelectedPlace ? (
              <>
                <span style={{ ...badgeStyle, backgroundColor: '#CCFF00' }}>Постоянно · Магазин</span>
                {(selected as Place).categories?.map(c => (
                  <span style={{ ...badgeStyle, backgroundColor: '#fff' }} key={c}>
                    {categories.find(x => x[0] === c)?.[1] || c}
                  </span>
                ))}
                {(selected as Place).is_point_verified && (
                  <span style={{ ...badgeStyle, backgroundColor: '#fff' }}>Точка проверена</span>
                )}
              </>
            ) : (
              <span style={{ ...badgeStyle, backgroundColor: '#fb923c' }}>Событие / Маркет</span>
            )}

            <button
              type="button"
              onClick={() => onToggleFavorite(selected.id)}
              className="ml-auto cursor-pointer transition-colors"
              style={{
                ...badgeStyle,
                backgroundColor: isFavorite ? '#CCFF00' : '#fff'
              }}
              title="Сохранить в любимые места"
            >
              <span>{isFavorite ? '♥' : '♡'}</span>
              <span>{isFavorite ? 'В любимых' : 'В любимые'}</span>
            </button>
          </div>

          {/* 2. Адрес, цены, время работы (Google Карты без ссылки на Яндекс), соцсети */}
          <div className="info-block pt-1 space-y-2.5 text-sm" style={{ fontWeight: 400 }}>
            <p style={{ fontWeight: 400, margin: 0 }}>
              <span style={{ fontWeight: 600 }}>Адрес:</span>{' '}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:bg-[#CCFF00] transition-colors"
                title="Открыть на Google Картах"
              >
                {displayAddress} ↗
              </a>
            </p>

            {isSelectedPlace ? (
              <>
                <p style={{ fontWeight: 400, margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>Ценовой диапазон:</span>{' '}
                  {formatPriceRange(selected as Place, city.currency)}
                </p>
                <p style={{ fontWeight: 400, margin: 0 }}>
                  <span style={{ fontWeight: 600 }}>Время работы:</span>{' '}
                  {(selected as Place).opening_hours || 'Ежедневно, 11:00 – 20:00'}{' '}
                  <span style={{ color: 'rgba(0,0,0,0.55)', fontSize: '12px' }}>(данные Google Карт)</span>
                </p>
              </>
            ) : (
              <p style={{ fontWeight: 400, margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Даты проведения:</span>{' '}
                {(() => {
                  const s = formatDateSafe((selected as Event).start_date);
                  const e = formatDateSafe((selected as Event).end_date);
                  if (!s) return 'Уточняются у организаторов';
                  return e && e !== s ? `${s} – ${e}` : s;
                })()}
              </p>
            )}

            {/* Несколько социальных сетей аккуратными плашками без запятых */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2" style={{ margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Социальные сети:</span>
                {socialLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:bg-[#CCFF00] transition-colors"
                    style={{
                      fontSize: '13px',
                      padding: '2px 8px',
                      border: '1px solid rgba(0,0,0,0.4)',
                      backgroundColor: '#fff',
                      textDecoration: 'none'
                    }}
                  >
                    {getSocialLabel(link)} ↗
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 3. Описание */}
          {cleanDescription && (
            <p className="description pt-1 text-sm leading-relaxed">
              {cleanDescription}
            </p>
          )}

          {/* 4. Коллаж из 3 фото */}
          <div style={{ paddingTop: '4px' }}>
            <PhotoCollage images={collectedImages} singleUrl={selected.imageUrl} alt={title} />
          </div>

          {/* 5. Кнопки статуса */}
          {isSelectedPlace && (
            <div className="status-actions pt-2" style={{ borderTop: 'none' }}>
              <button className="lime-button" onClick={() => onConfirm(false)}>БЫЛ(А) — АКТУАЛЬНО</button>
              <button className="closed-button" onClick={() => onConfirm(true)}>ЗАКРЫЛОСЬ</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
