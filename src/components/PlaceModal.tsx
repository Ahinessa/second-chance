import {
  Place,
  Event,
  City,
  categories,
  buildGoogleMapsUrl,
  buildYandexMapsUrl,
  formatPriceRange,
  formatDateSafe
} from '../data/mockData';

function PhotoCollage({ images, singleUrl, alt }: { images?: string[]; singleUrl?: string | null; alt: string }) {
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
  const dbSocialLink = String(
    rawRecord.social_link ||
    rawRecord.social_url ||
    rawRecord.url ||
    rawRecord.website ||
    rawRecord.link ||
    ''
  ).trim();

  const socialLink = dbSocialLink || 'https://t.me/second_chance_place';
  const googleMapsUrl = buildGoogleMapsUrl(rawAddress, city.name, selected.lat, selected.lng);
  const yandexMapsUrl = buildYandexMapsUrl(rawAddress, city.name, title);

  // Очищаем техническое описание из базы, если оно осталось от старого сида
  const cleanDescription = (selected.description || '')
    .replace(/Тестовая карточка для наполнения каталога\.\s*Проверить точный адрес, ассортимент и график перед публикацией\./gi, '')
    .trim();

  return (
    <div className="modalback" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="modal-head" style={{ borderBottom: 'none', paddingBottom: '4px' }}>
          <h2>{title}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>✕</button>
        </header>

        <div className="place-detail space-y-4">
          {/* 1. Плашки категорий / формата + кнопка «Любимое» */}
          <div className="detail-tags flex flex-wrap items-center gap-2">
            {isSelectedPlace ? (
              <>
                <span className="stamp bg-[#CCFF00]">ПОСТОЯННО · МАГАЗИН</span>
                {(selected as Place).categories?.map(c => (
                  <span className="stamp" key={c}>{categories.find(x => x[0] === c)?.[1] || c}</span>
                ))}
                {(selected as Place).is_point_verified && <span className="stamp">ТОЧКА ПРОВЕРЕНА</span>}
                {(selected as Place).is_assortment_verified && <span className="stamp">АССОРТИМЕНТ ПОДТВЕРЖДЁН</span>}
              </>
            ) : (
              <span className="stamp bg-orange-400">СОБЫТИЕ / МАРКЕТ</span>
            )}

            <button
              type="button"
              onClick={() => onToggleFavorite(selected.id)}
              className="stamp ml-auto cursor-pointer transition-colors"
              style={{
                backgroundColor: isFavorite ? '#CCFF00' : '#fff',
                fontWeight: 600
              }}
              title="Сохранить в любимые места, чтобы следить за завозами"
            >
              {isFavorite ? '♥ В ЛЮБИМЫХ' : '♡ В ЛЮБИМЫЕ'}
            </button>
          </div>

          {/* 2. Адрес, цены, время работы / даты, соцсети — БЕЗ разделительных линий и с одинаковой жирностью */}
          <div className="info-block pt-1 space-y-2 text-sm" style={{ fontWeight: 400 }}>
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
                  {(selected as Place).opening_hours ? (
                    <span>{(selected as Place).opening_hours} · </span>
                  ) : null}
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:bg-[#CCFF00] transition-colors"
                  >
                    Google Карты ↗
                  </a>
                  {' / '}
                  <a
                    href={yandexMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:bg-[#CCFF00] transition-colors"
                  >
                    Яндекс.Карты ↗
                  </a>
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

            {socialLink && (
              <p style={{ fontWeight: 400, margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Социальные сети:</span>{' '}
                <a
                  href={socialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:bg-[#CCFF00] transition-colors break-all"
                >
                  {socialLink} ↗
                </a>
              </p>
            )}
          </div>

          {/* 3. Описание (показываем только если оно есть и не пустое) */}
          {cleanDescription && (
            <p className="description pt-1 text-sm leading-relaxed">
              {cleanDescription}
            </p>
          )}

          {/* 4. Коллаж из 3 фото */}
          <div style={{ paddingTop: '4px' }}>
            <PhotoCollage images={selected.images} singleUrl={selected.imageUrl} alt={title} />
          </div>

          {/* 5. Кнопки статуса — без верхней линии */}
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
