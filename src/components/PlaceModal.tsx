import { useState } from 'react';
import { City, Place, Event, formatDateSafe, formatPriceRange } from '../data/mockData';

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

function getLocalVerifiedAt(id: string): number | null {
  try {
    const raw = localStorage.getItem(`sc-verified-${id}`);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
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
  const isEvent = 'title' in selected;
  const rawTitle = isEvent ? selected.title : selected.name;
  const cleanTitle = rawTitle
    .replace(/\(пример карточки\)/gi, '')
    .replace(/\(пример\)/gi, '')
    .trim();

  const escapedCity = city.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleWithoutCity = cleanTitle.replace(new RegExp(`^${escapedCity}\\s*[·\\-–—:|]\\s*`, 'i'), '').trim();

  const rawAddress = (selected.address || '').replace(/\(пример адреса\)/gi, '').trim();
  const fullAddress = rawAddress
    ? rawAddress.toLowerCase().includes(city.name.toLowerCase())
      ? rawAddress
      : `${city.name}, ${rawAddress}`
    : `${city.name} (адрес уточняется)`;

  const cleanDesc = (selected.description || '')
    .replace(/Тестовая карточка для наполнения каталога\.\s*Проверить точный адрес, ассортимент и график перед публикацией\./gi, '')
    .replace(/Демонстрационная запись; сведения требуют проверки\./gi, '')
    .replace(/Тестовая запись для категории [a-z]+\./gi, '')
    .trim();

  const rawImages: string[] = Array.isArray((selected as any).images)
    ? (selected as any).images.filter(Boolean).slice(0, 3)
    : [];
  const photoSlots: (string | null)[] = [
    rawImages[0] || null,
    rawImages[1] || null,
    rawImages[2] || null
  ];

  const socialLinks: string[] = Array.isArray((selected as any).social_links)
    ? (selected as any).social_links.filter(Boolean)
    : [];

  const openingHours: string = (selected as any).opening_hours || '';
  const confirmationsCount: number = (selected as any).confirmations_count || 0;

  const dbVerifiedTs = (selected as any).last_verified_at
    ? new Date((selected as any).last_verified_at).getTime()
    : null;
  const localVerifiedTs = getLocalVerifiedAt(selected.id);
  const latestVerifiedTs = Math.max(dbVerifiedTs || 0, localVerifiedTs || 0) || null;

  const [verifiedRecently, setVerifiedRecently] = useState<boolean>(() => {
    if (!latestVerifiedTs) return false;
    return Date.now() - latestVerifiedTs < FIFTEEN_DAYS_MS;
  });

  const startStr = isEvent ? formatDateSafe(selected.start_date) : '';
  const endStr = isEvent ? formatDateSafe(selected.end_date) : '';
  const dateLabel = startStr
    ? endStr && endStr !== startStr
      ? `${startStr} – ${endStr}`
      : startStr
    : 'Дата уточняется';

  function handleMarkActual() {
    try {
      localStorage.setItem(`sc-verified-${selected.id}`, String(Date.now()));
    } catch {}
    setVerifiedRecently(true);
    onConfirm(false);
  }

  return (
    <div className="modalback" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={titleWithoutCity}
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка карточки */}
        <header className="modal-head" style={{ borderBottom: 'none', marginBottom: '12px' }}>
          <div>
            <div className={'format-tag ' + (isEvent ? 'market-tag' : '')} style={{ marginBottom: '10px' }}>
              {isEvent ? 'СОБЫТИЕ / 1 ДЕНЬ' : 'ПОСТОЯННО · МАГАЗИН'}
            </div>
            <h2 style={{ margin: 0 }}>{titleWithoutCity}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleFavorite(selected.id)}
              className="cursor-pointer"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontSize: '32px',
                lineHeight: 1,
                color: isFavorite ? '#CCFF00' : '#111',
                WebkitTextStroke: isFavorite ? '1px #111' : '0px'
              }}
              title={isFavorite ? 'Убрать из любимых' : 'Добавить в любимые'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
            <button className="close-button" aria-label="Закрыть" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        {/* Единый шрифт и никаких разделительных линий */}
        <div className="place-detail" style={{ gap: '10px', fontSize: '15px' }}>
          <p className="place-address" style={{ margin: 0, fontWeight: 500 }}>
            ⌖ {fullAddress}
          </p>

          {isEvent && (
            <p style={{ margin: 0 }}>
              Дата: {dateLabel}
            </p>
          )}

          {openingHours && (
            <p style={{ margin: 0, border: 'none', padding: 0 }}>
              Часы работы: {openingHours}
            </p>
          )}

          {!isEvent && (
            <p style={{ margin: 0 }}>
              {formatPriceRange(selected, '₽')}
            </p>
          )}

          {cleanDesc && (
            <p className="description" style={{ margin: '4px 0 0 0' }}>
              {cleanDesc}
            </p>
          )}

          {/* Бейджи статуса проверки и ссылки */}
          {( (!isEvent && ((selected as Place).is_point_verified || (selected as Place).is_assortment_verified)) || socialLinks.length > 0 ) && (
            <div className="detail-tags" style={{ marginTop: '4px' }}>
              {!isEvent && (selected as Place).is_point_verified && (
                <span className="stamp">✓ ТОЧКА ПРОВЕРЕНА</span>
              )}
              {!isEvent && (selected as Place).is_assortment_verified && (
                <span className="stamp">✓ АССОРТИМЕНТ ПРОВЕРЕН</span>
              )}
              {socialLinks.map((url, idx) => {
                let label = 'САЙТ / СОЦСЕТИ';
                if (url.includes('t.me')) label = 'TELEGRAM';
                else if (url.includes('vk.com')) label = 'ВКОНТАКТЕ';
                else if (url.includes('yandex') || url.includes('google') || url.includes('2gis')) label = 'НА КАРТАХ';
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="stamp hover:bg-[#CCFF00] transition-colors"
                  >
                    {label} ↗
                  </a>
                );
              })}
            </div>
          )}

          {/* Коллаж из 3 фотографий */}
          <div className="grid grid-cols-3 gap-2" style={{ marginTop: '6px' }}>
            {photoSlots.map((src, idx) =>
              src ? (
                <img
                  key={idx}
                  src={src}
                  alt={`${titleWithoutCity} — фото ${idx + 1}`}
                  className="place-photo"
                  style={{ aspectRatio: '4 / 3' }}
                />
              ) : (
                <div
                  key={idx}
                  className="photo-placeholder"
                  style={{ aspectRatio: '4 / 3', fontSize: '11px', padding: '8px' }}
                >
                  ФОТО {idx + 1}
                </div>
              )
            )}
          </div>

          {/* Кнопки актуальности без верхней разделительной линии */}
          {!isEvent && (
            <div
              className="status-actions"
              style={{ borderTop: 'none', paddingTop: '6px', marginTop: '4px' }}
            >
              {verifiedRecently ? (
                <div
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #111',
                    backgroundColor: '#CCFF00',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  ✓ Данные актуальны — место проверено недавно
                  {confirmationsCount > 0 ? ` (подтверждений: ${confirmationsCount})` : ''}
                </div>
              ) : (
                <>
                  <button type="button" className="lime-button" onClick={handleMarkActual}>
                    АКТУАЛЬНО
                  </button>
                  <button type="button" className="closed-button" onClick={() => onConfirm(true)}>
                    ЗАКРЫЛОСЬ
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
