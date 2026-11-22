import { useState } from 'react';
import { City, Place, Event, categories, formatDateSafe, formatPriceRange } from '../data/mockData';

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
  const titleWithoutCity = cleanTitle
    .replace(new RegExp(`^${escapedCity}\\s*[·\\-–—:\vert{}]\\s*`, 'i'), '') .trim();  const rawAddress = (selected.address \vert{}\vert{} '') .replace(/\(пример адреса\)/gi, '') .replace(/\(пример зоны\)/gi, '') .trim(); const fullAddress = rawAddress ? rawAddress.toLowerCase().includes(city.name.toLowerCase()) ? rawAddress : `${city.name}, ${rawAddress}` : `${city.name} (адрес уточняется)`;

  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;  const cleanDesc = (selected.description \vert{}\vert{} '') .replace(/Тестовая карточка для наполнения каталога\.\s*Проверить точный адрес, ассортимент и график перед публикацией\./gi, '') .replace(/Демонстрационная запись; сведения требуют проверки\./gi, '') .replace(/Тестовая запись для категории [a-z]+\./gi, '') .trim();  // Названия категорий для плашек рядом с тегом «Постоянно · Магазин» const placeCategoryLabels: string[] = !isEvent && Array.isArray((selected as Place).categories) ? (selected as Place).categories .filter(c => c && c !== 'all') .map(c => categories.find(x => x[0] === c)?.[1] \vert{}\vert{} c) : [];  // Ровно 3 слота под фотографии для асимметричного коллажа (1 большое слева + 2 справа) const rawImages: string[] = Array.isArray((selected as any).images) ? (selected as any).images.filter(Boolean).slice(0, 3) : []; const photo1 = rawImages[0] \vert{}\vert{} null; const photo2 = rawImages[1] \vert{}\vert{} null; const photo3 = rawImages[2] \vert{}\vert{} null;  const socialLinks: string[] = Array.isArray((selected as any).social_links) ? (selected as any).social_links.filter(Boolean) : [];  const openingHours: string = (selected as any).opening_hours \vert{}\vert{} ''; const confirmationsCount: number = (selected as any).confirmations_count \vert{}\vert{} 0;  const dbVerifiedTs = (selected as any).last_verified_at ? new Date((selected as any).last_verified_at).getTime() : null; const localVerifiedTs = getLocalVerifiedAt(selected.id); const latestVerifiedTs = Math.max(dbVerifiedTs \vert{}\vert{} 0, localVerifiedTs \vert{}\vert{} 0) \vert{}\vert{} null;  const [verifiedRecently, setVerifiedRecently] = useState<boolean>(() => { if (!latestVerifiedTs) return false; return Date.now() - latestVerifiedTs < FIFTEEN_DAYS_MS; });  const startStr = isEvent ? formatDateSafe(selected.start_date) : ''; const endStr = isEvent ? formatDateSafe(selected.end_date) : ''; const dateLabel = startStr ? endStr && endStr !== startStr ? `${startStr} – ${endStr}` : startStr : 'Дата уточняется';  function handleMarkActual() { try { localStorage.setItem(`sc-verified-${selected.id}`, String(Date.now()));
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
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {/* 1. Заголовок и кнопка закрытия */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '12px'
          }}
        >
          <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 700, lineHeight: 1.15, margin: 0 }}>
            {titleWithoutCity}
          </h2>
          <button className="close-button" aria-label="Закрыть" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* 2. Строка тегов слева + «В любимые» с крупным сердечком справа */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                backgroundColor: isEvent ? '#FFB000' : '#CCFF00',
                border: '1px solid #111',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              {isEvent ? 'Событие · 1 день' : 'Постоянно · Магазин'}
            </span>

            {placeCategoryLabels.map((catLabel, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #111',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 400
                }}
              >
                {catLabel}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(selected.id)}
            className="cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              padding: 0,
              fontSize: '14px',
              fontWeight: 400,
              color: '#111'
            }}
          >
            <span>{isFavorite ? 'В любимых' : 'В любимые'}</span>
            <span
              style={{
                fontSize: '30px',
                lineHeight: 1,
                color: isFavorite ? '#CCFF00' : '#111',
                WebkitTextStroke: isFavorite ? '1px #111' : '0px',
                transition: 'transform 0.12s ease'
              }}
            >
              {isFavorite ? '♥' : '♡'}
            </span>
          </button>
        </div>

        {/* 3. Единый информационный блок (без линий и смены шрифтов) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '15px', lineHeight: 1.45 }}>
          <div>
            <span style={{ fontWeight: 600 }}>Адрес: </span>
            <a
              href={mapSearchUrl}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: 'underline', textUnderlineOffset: '3px', color: '#111' }}
            >
              {fullAddress} ↗
            </a>
          </div>

          {isEvent && (
            <div>
              <span style={{ fontWeight: 600 }}>Дата проведения: </span>
              <span>{dateLabel}</span>
            </div>
          )}

          {!isEvent && (
            <div>
              <span style={{ fontWeight: 600 }}>Ценовой диапазон: </span>
              <span>{formatPriceRange(selected, '₽')}</span>
            </div>
          )}

          {openingHours && (
            <div>
              <span style={{ fontWeight: 600 }}>Время работы: </span>
              <span>{openingHours} </span>
              <span style={{ color: 'rgba(17, 17, 17, 0.5)', fontSize: '13px' }}>
                (данные Google Карт)
              </span>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontWeight: 600 }}>Социальные сети:</span>
              {socialLinks.map((url, idx) => {
                let label = 'Сайт / соцсети';
                if (url.includes('t.me')) label = 'Telegram';
                else if (url.includes('vk.com')) label = 'ВКонтакте';
                else if (url.includes('yandex') || url.includes('google') || url.includes('2gis')) label = 'На картах';
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:bg-[#CCFF00] transition-colors"
                    style={{
                      display: 'inline-block',
                      border: '1px solid #111',
                      backgroundColor: '#fff',
                      padding: '3px 10px',
                      fontSize: '13px',
                      color: '#111',
                      textDecoration: 'none'
                    }}
                  >
                    {label} ↗
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Описание места */}
        {cleanDesc && (
          <p style={{ margin: '16px 0 0 0', fontSize: '15px', lineHeight: 1.6 }}>
            {cleanDesc}
          </p>
        )}

        {/* 5. Асимметричный коллаж из 3 фотографий (ФОТО 1 большое слева + ФОТО 2 и ФОТО 3 друг под другом справа) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '150px 150px',
            gap: '10px',
            marginTop: '18px'
          }}
        >
          {/* ФОТО 1 (на всю высоту левой колонки) */}
          <div style={{ gridRow: 'span 2', height: '100%' }}>
            {photo1 ? (
              <img
                src={photo1}
                alt={`${titleWithoutCity} — фото 1`} style={{ width: '100\%', height: '100\%', objectFit: 'cover', border: '1px solid #111' }} /> ) : ( <div className="photo-placeholder" style={{ width: '100\%', height: '100\%', aspectRatio: 'auto' }}> ФОТО 1 </div> )} </div>  {/* ФОТО 2 (верхнее правое) */} <div style={{ height: '100\%' }}> {photo2 ? ( <img src={photo2} alt={`${titleWithoutCity} — фото 2`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid #111' }}
              />
            ) : (
              <div className="photo-placeholder" style={{ width: '100%', height: '100%', aspectRatio: 'auto' }}>
                ФОТО 2
              </div>
            )}
          </div>

          {/* ФОТО 3 (нижнее правое) */}
          <div style={{ height: '100%' }}>
            {photo3 ? (
              <img
                src={photo3}
                alt={`${titleWithoutCity} — фото 3`} style={{ width: '100\%', height: '100\%', objectFit: 'cover', border: '1px solid #111' }} /> ) : ( <div className="photo-placeholder" style={{ width: '100\%', height: '100\%', aspectRatio: 'auto' }}> ФОТО 3 </div> )} </div> </div>  {/* 6. Кнопки актуальности внизу (без разделительных линий) */} {!isEvent && ( <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '18px' }}> {verifiedRecently ? ( <div style={{ width: '100\%', padding: '10px 14px', border: '1px solid #111', backgroundColor: '#CCFF00', fontSize: '13px', fontWeight: 500 }} > ✓ Данные актуальны — место проверено недавно {confirmationsCount > 0 ? ` (подтверждений: ${confirmationsCount})` : ''}
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
      </section>
    </div>
  );
}
