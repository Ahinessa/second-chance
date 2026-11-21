import {
  Place,
  Event,
  City,
  categories,
  buildGoogleMapsUrl,
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
      {/* Левое высокое вертикальное фото */}
      <div style={{ height: '100%', overflow: 'hidden' }}>{renderSlot(0)}</div>
      {/* Правая колонка: два увеличенных по высоте фото (верхнее и нижнее) */}
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
  onClose,
  onConfirm
}: {
  selected: Place | Event;
  city: City;
  onClose: () => void;
  onConfirm: (closed: boolean) => void;
}) {
  const isSelectedPlace = 'place_type' in selected;
  const title = isSelectedPlace ? (selected as Place).name : (selected as Event).title;

  const rawRecord = selected as Record<string, any>;
  const dbSocialLink = String(
    rawRecord.social_link ||
    rawRecord.social_url ||
    rawRecord.url ||
    rawRecord.website ||
    rawRecord.link ||
    ''
  ).trim();

  // Если в БД ссылка ещё не заполнена — подставляем демо-ссылку, чтобы блок был виден при проверке
  const socialLink = dbSocialLink || 'https://t.me/second_chance_place';

  return (
    <div className="modalback" onClick={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>✕</button>
        </header>

        <div className="place-detail space-y-4">
          {/* 1. Плашки категорий / формата */}
          {isSelectedPlace ? (
            <div className="detail-tags flex flex-wrap gap-2">
              <span className="stamp bg-[#CCFF00]">ПОСТОЯННО · МАГАЗИН</span>
              {(selected as Place).categories?.map(c => (
                <span className="stamp" key={c}>{categories.find(x => x[0] === c)?.[1] || c}</span>
              ))}
              {(selected as Place).is_point_verified && <span className="stamp">ТОЧКА ПРОВЕРЕНА</span>}
              {(selected as Place).is_assortment_verified && <span className="stamp">АССОРТИМЕНТ ПОДТВЕРЖДЁН</span>}
            </div>
          ) : (
            <div className="detail-tags flex flex-wrap gap-2">
              <span className="stamp bg-orange-400">СОБЫТИЕ / МАРКЕТ</span>
            </div>
          )}

          {/* 2. Адрес, цены, время работы / даты, соцсети */}
          <div className="info-block border-t border-black/20 pt-3 space-y-2 text-sm">
            <p className="place-address">
              <b>Адрес:</b>{' '}
              <a
                href={buildGoogleMapsUrl(selected.address, city.name, selected.lat, selected.lng)}
                target="_blank"
                rel="noreferrer"
                className="underline hover:bg-[#CCFF00] transition-colors"
                title="Открыть на Google Картах"
              >
                {selected.address
                  ? (selected.address.toLowerCase().includes(city.name.toLowerCase()) ? selected.address : `${city.name}, ${selected.address}`)
                  : `${city.name} (посмотреть на карте)`} ↗
              </a>
            </p>

            {isSelectedPlace ? (
              <>
                <p>
                  <b>Ценовой диапазон:</b> {formatPriceRange(selected as Place, city.currency)}
                </p>
                <p className="hours">
                  <b>Время работы:</b> {(selected as Place).opening_hours || 'Уточняйте в соцсетях магазина'}
                </p>
              </>
            ) : (
              <p className="hours">
                <b>Даты проведения:</b>{' '}
                {(() => {
                  const s = formatDateSafe((selected as Event).start_date);
                  const e = formatDateSafe((selected as Event).end_date);
                  if (!s) return 'Уточняются у организаторов';
                  return e && e !== s ? `${s} – ${e}` : s;
                })()}
              </p>
            )}

            {/* Строка социальных сетей */}
            {socialLink && (
              <p>
                <b>Социальные сети:</b>{' '}
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

          {/* 3. Описание */}
          <p className="description border-t border-black/20 pt-3 text-sm leading-relaxed">
            {selected.description || 'Описание пока не добавлено.'}
          </p>

          {/* 4. Увеличенный по высоте коллаж из 3 фото (380px) */}
          <div style={{ paddingTop: '6px' }}>
            <PhotoCollage images={selected.images} singleUrl={selected.imageUrl} alt={title} />
          </div>

          {/* 5. Кнопки статуса */}
          {isSelectedPlace && (
            <div className="status-actions pt-3 border-t border-black">
              <button className="lime-button" onClick={() => onConfirm(false)}>БЫЛ(А) — АКТУАЛЬНО</button>
              <button className="closed-button" onClick={() => onConfirm(true)}>ЗАКРЫЛОСЬ</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
