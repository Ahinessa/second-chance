import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from './lib/supabase';
import {
  City,
  Place,
  Event,
  Market,
  categories,
  validTabs,
  norm,
  seed,
  mockPlaces,
  mockEvents,
  mockOnline,
  formatDateSafe,
  formatPriceRange
} from './data/mockData';
import { SizeTable } from './components/SizeTable';
import { PlaceModal } from './components/PlaceModal';
import { AuthModal } from './components/AuthModal';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validCategoriesStored() {
  const v = sessionStorage.getItem('sc-category');
  return categories.some(x => x[0] === v) ? v : 'all';
}

function validTabStored() {
  const v = sessionStorage.getItem('sc-tab');
  return validTabs.includes(v || '') ? v : 'place';
}

const placeIcon = L.divIcon({ className: 'sc-marker-wrap', html: '<span class="sc-marker sc-place"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
const marketIcon = L.divIcon({ className: 'sc-marker-wrap', html: '<span class="sc-marker sc-market"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="empty-state">
      <p>По этим фильтрам пока ничего не найдено.</p>
      <button className="lime-button" onClick={onReset}>ПОКАЗАТЬ ВСЕ МЕСТА В ГОРОДЕ</button>
    </div>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="modalback" onClick={close}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="close-button" aria-label="Закрыть" onClick={close}>✕</button>
        </header>
        {children}
      </section>
    </div>
  );
}

const QUICK_CITIES = ['Казань', 'Москва', 'Санкт-Петербург'];

export default function App() {
  const [cities, setCities] = useState(seed);
  const [city, setCity] = useState(seed[0]);
  const [cat, setCat] = useState(validCategoriesStored());
  const [tab, setTab] = useState(validTabStored());
  const [view, setView] = useState('map');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('sc-favorites') || '[]'); } catch { return []; }
  });
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [osm, setOsm] = useState<any[]>([]);
  const [selected, setSelected] = useState<Place | Event | null>(null);
  const [route, setRoute] = useState<Place[]>(() => {
    try { return JSON.parse(localStorage.getItem('sc-route') || '[]'); } catch { return []; }
  });
  const [user, setUser] = useState<any>(null);
  const [auth, setAuth] = useState(false);
  const [sizes, setSizes] = useState(false);
  const [add, setAdd] = useState(false);
  const [notice, setNotice] = useState('');
  const [welcome, setWelcome] = useState(!sessionStorage.getItem('sc-welcome-done'));
  const [welcomeCity, setWelcomeCity] = useState(sessionStorage.getItem('sc-city-name') || 'Казань');
  const [welcomeCat, setWelcomeCat] = useState(sessionStorage.getItem('sc-category') || 'all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supabase.from('cities').select('*').then(({ data }) => {
      if (data?.length) {
        // Приоритет отдаём городам из БД (у них настоящий UUID), дополняем недостающими из seed
        const merged: City[] = [...data];
        seed.forEach(s => {
          if (!merged.some(m => norm(m.name) === norm(s.name))) merged.push(s);
        });
        setCities(merged);
        const remembered = sessionStorage.getItem('sc-city-name');
        setCity(merged.find(c => norm(c.name) === norm(remembered) || c.slug === remembered) || merged.find(c => norm(c.name) === 'казань') || merged[0]);
      }
    });
  }, []);

  useEffect(() => { refresh(); }, [city]);

  async function refresh() {
    const isUuid = UUID_REGEX.test(city.id);

    const [p, e, m] = await Promise.all([
      isUuid
        ? supabase.from('places').select('*').eq('city_id', city.id).eq('status', 'approved')
        : Promise.resolve({ data: [] as Place[] }),
      isUuid
        ? supabase.from('events').select('*').eq('city_id', city.id).eq('status', 'approved').gte('end_date', new Date().toISOString())
        : Promise.resolve({ data: [] as Event[] }),
      isUuid
        ? supabase.from('online_markets').select('*').or(`city_id.eq.${city.id},city_id.is.null`)
        : supabase.from('online_markets').select('*').is('city_id', null)
    ]);

    setPlaces([...(p.data || []), ...mockPlaces(city)]);
    setEvents([...(e.data || []), ...mockEvents(city)]);
    setMarkets([...(m.data || []), ...mockOnline(city)]);
    if (!p.data?.length) osmSearch(city);
  }

  async function osmSearch(c: City) {
    const query = `[out:json][timeout:20];(node(around:6000,${c.lat},${c.lng})[shop~"second_hand|antiques"];way(around:6000,${c.lat},${c.lng})[shop~"second_hand|antiques"];node(around:6000,${c.lat},${c.lng})[amenity=marketplace];);out center tags;`;
    try {
      const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
      setOsm((await r.json()).elements || []);
    } catch {
      setOsm([]);
    }
  }

  async function citySearch(name: string) {
    if (!name.trim()) return;
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(name));
      const d = await r.json();
      if (d[0]) {
        const c = {
          id: 'search-' + Date.now(),
          name: d[0].name || d[0].display_name.split(',')[0],
          country: d[0].display_name.split(',').at(-1) || 'Россия',
          currency: '₽',
          slug: '',
          lat: +d[0].lat,
          lng: +d[0].lon
        };
        setCity(c);
        setWelcomeCity(c.name);
        sessionStorage.setItem('sc-city-name', c.name);
      }
    } catch {
      setNotice('Не удалось найти город. Попробуйте другое название.');
    }
  }

  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem('sc-favorites', JSON.stringify(next));
  }

  const list = useMemo(
    () =>
      places.filter(
        p =>
          norm(p.city_id) === norm(city.id) &&
          (norm(cat) === 'all' || (p.categories || []).some(c => norm(c) === norm(cat))) &&
          (!onlyFavs || favorites.includes(p.id))
      ),
    [places, cat, city, onlyFavs, favorites]
  );

  const eventList = useMemo(
    () =>
      events.filter(
        e => (!e.city_id || norm(e.city_id) === norm(city.id)) && (!onlyFavs || favorites.includes(e.id))
      ),
    [events, city, onlyFavs, favorites]
  );

  const onlineList = useMemo(() => markets.filter(m => !m.city_id || norm(m.city_id) === norm(city.id)), [markets, city]);

  function resetFilters() {
    setCity(cities.find(c => norm(c.name) === 'казань') || seed[0]);
    setCat('all');
    setTab('place');
    setOnlyFavs(false);
    sessionStorage.removeItem('sc-city-name');
    sessionStorage.removeItem('sc-category');
    sessionStorage.removeItem('sc-tab');
    sessionStorage.removeItem('sc-welcome-done');
    setWelcome(false);
  }

  async function confirm(closed: boolean) {
    if (!selected) return;
    if (!UUID_REGEX.test(selected.id)) {
      setNotice(closed ? 'Спасибо! Отчёт по демо-карточке учтён.' : 'Спасибо! Статус демо-карточки подтверждён.');
      setSelected(null);
      return;
    }
    const { error } = await supabase.rpc('confirm_place_status', { place_uuid: selected.id, is_closed: closed });
    setNotice(error?.message || (closed ? 'Спасибо! Отчёт о закрытии отправлен.' : 'Спасибо, статус актуальности обновлён.'));
    setSelected(null);
    refresh();
  }

  function routeToggle(p: Place) {
    const n = route.some(x => x.id === p.id) ? route.filter(x => x.id !== p.id) : [...route, p];
    setRoute(n);
    localStorage.setItem('sc-route', JSON.stringify(n));
  }

  // Находим или создаём настоящий UUID города в таблице cities перед записью в places
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

  async function addPlace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!user) return;

    const realCityId = await resolveCityUuid(city);
    if (!realCityId) {
      setNotice('Не удалось определить ID города в базе. Проверьте таблицу cities в Supabase.');
      return;
    }

    const rawLink = String(f.get('verify_link') || '').trim();
    const userRole = user.user_metadata?.role;
    const isAutoApproved =
      user.email?.toLowerCase() === 'ahinessa@yandex.ru' ||
      ['trusted', 'owner', 'organizer'].includes(userRole);

    const { error } = await supabase.from('places').insert({
      city_id: realCityId,
      owner_id: user.id,
      name: f.get('name'),
      address: f.get('address'),
      social_links: rawLink ? [rawLink] : [],
      categories: [f.get('category')],
      place_type: 'shop',
      status: isAutoApproved ? 'approved' : 'pending',
      lat: city.lat,
      lng: city.lng
    });

    if (!error && !UUID_REGEX.test(city.id)) {
      setCity({ ...city, id: realCityId });
    }

    setNotice(
      error?.message ||
        (isAutoApproved ? 'Место добавлено на карту!' : 'Отправлено на модерацию')
    );
    setAdd(false);
    refresh();
  }

  async function applyWelcome() {
    const nextCat = categories.some(x => x[0] === welcomeCat) ? welcomeCat : 'all';
    setCat(nextCat);
    sessionStorage.setItem('sc-welcome-done', '1');
    sessionStorage.setItem('sc-city-name', welcomeCity);
    sessionStorage.setItem('sc-category', nextCat);

    const matchedCity = cities.find(c => norm(c.name) === norm(welcomeCity)) || seed.find(c => norm(c.name) === norm(welcomeCity));
    if (matchedCity) {
      setCity(matchedCity);
    } else {
      await citySearch(welcomeCity);
    }

    setWelcome(false);
  }

  const tabs = [
    ['place', 'МЕСТА', 'Постоянные магазины, секонды, свопы'],
    ['market', 'МАРКЕТЫ', 'Поп-ап ярмарки, гараж-сейлы на 1–2 дня'],
    ['online', 'ОНЛАЙН', 'Сайты, Авито, ТГ-каналы']
  ];

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div>
          <h1>SECOND <span>CHANCE</span></h1>
          <p className="mono">КАРТА ОСОЗНАННОГО ПОТРЕБЛЕНИЯ</p>
        </div>
        <div className="header-actions">
          <button className="stamp" onClick={() => setSizes(true)}>ТАБЛИЦА РАЗМЕРОВ</button>
          <button className="stamp" onClick={() => setAuth(true)}>{user ? 'ПРОФИЛЬ' : 'ВХОД / РЕГИСТРАЦИЯ'}</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <nav className="compact-nav w-full">
          <div className="tab-row format-tabs w-full">
            {tabs.map(([t, n, sub]) => (
              <button
                key={t}
                className={'main-tab ' + (tab === t ? 'active' : '')}
                onClick={() => { setTab(t); sessionStorage.setItem('sc-tab', t); }}
              >
                <strong>{n}</strong>
                <small>{sub}</small>
              </button>
            ))}
          </div>
          <div className="quick-filters filter-controls w-full">
            <button className="filter-chip" onClick={() => setWelcome(true)}>ГОРОД: {city.name} ✎</button>
            <button className="filter-chip" onClick={() => setWelcome(true)}>КАТЕГОРИЯ: {categories.find(x => x[0] === cat)?.[1]} ✎</button>
            {tab !== 'online' && (
              <button
                className="filter-chip"
                onClick={() => setOnlyFavs(!onlyFavs)}
                style={{ backgroundColor: onlyFavs ? '#CCFF00' : undefined }}
              >
                {onlyFavs ? '♥ ЛЮБИМЫЕ' : '♡ ЛЮБИМЫЕ'} {favorites.length > 0 ? `(${favorites.length})` : ''}
              </button>
            )}
            <button className="filter-chip reset-filters" onClick={resetFilters}>СБРОСИТЬ ФИЛЬТРЫ</button>
            {tab !== 'online' && (
              <div className="view-switch ml-auto">
                <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>КАРТА</button>
                <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>СПИСОК</button>
              </div>
            )}
          </div>
        </nav>

        {(tab === 'place' || tab === 'market') && (
          <div className={view === 'map' ? 'grid lg:grid-cols-2 gap-5 w-full' : 'w-full col-span-full'}>
            {view === 'map' && (
              <div className={tab === 'market' ? 'map market-map' : 'map'}>
                <MapContainer key={city.id} center={[city.lat, city.lng]} zoom={13}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                  {tab === 'place' && list.map(p => p.lat && p.lng && (
                    <Marker key={p.id} position={[p.lat, p.lng]} icon={placeIcon}>
                      <Popup>
                        <b>{p.name.replace(/\(пример карточки\)/gi, '').trim()}</b><br />
                        ПОСТОЯННО · Магазин<br />
                        <button className="popup-action" onClick={() => setSelected(p)}>ОТКРЫТЬ КАРТОЧКУ</button>
                      </Popup>
                    </Marker>
                  ))}
                  {tab === 'market' && eventList.map(e => e.lat && e.lng && (
                    <Marker key={e.id} position={[e.lat, e.lng]} icon={marketIcon}>
                      <Popup>
                        <b>{e.title}</b><br />
                        СОБЫТИЕ / 1 ДЕНЬ<br />
                        {formatDateSafe(e.start_date)}<br />
                        <button className="popup-action" onClick={() => setSelected(e)}>ОТКРЫТЬ КАРТОЧКУ</button>
                      </Popup>
                    </Marker>
                  ))}
                  {tab === 'place' && !onlyFavs && osm.map(o => {
                    const lat = o.lat || o.center?.lat, lon = o.lon || o.center?.lon;
                    return lat && lon ? (
                      <Marker key={o.id} position={[lat, lon]} icon={o.tags?.amenity === 'marketplace' ? marketIcon : placeIcon}>
                        <Popup>
                          <b>{o.tags?.name || 'Место OSM'}</b><br />
                          {o.tags?.amenity === 'marketplace' ? 'МАРКЕТ' : 'ПОСТОЯННО · Магазин'}<br />
                          <span>Ассортимент не проверен</span>
                        </Popup>
                      </Marker>
                    ) : null;
                  })}
                </MapContainer>
              </div>
            )}

            <div className={view === 'list' ? 'place-list-grid w-full' : 'space-y-4'}>
              {(tab === 'place' ? list : eventList).map(item => {
                const isMarket = tab === 'market';
                const rawName = isMarket ? (item as Event).title : (item as Place).name;
                const cardName = rawName.replace(/\(пример карточки\)/gi, '').trim();
                const rawAddress = (isMarket ? (item as Event).address : (item as Place).address || '').replace(/\(пример адреса\)/gi, '').trim();
                const cardAddress = rawAddress ? (rawAddress.toLowerCase().includes(city.name.toLowerCase()) ? rawAddress : `${city.name}, ${rawAddress}`) : `${city.name} (адрес уточняется)`;
                const cardDescription = (item.description || '')
                  .replace(/Тестовая карточка для наполнения каталога\.\s*Проверить точный адрес, ассортимент и график перед публикацией\./gi, '')
                  .trim();
                const cardPrice = isMarket ? 'Вход / цены уточняйте' : formatPriceRange(item as Place, '₽');
                const startStr = isMarket ? formatDateSafe((item as Event).start_date) : '';
                const endStr = isMarket ? formatDateSafe((item as Event).end_date) : '';
                const cardDate = startStr ? (endStr && endStr !== startStr ? `${startStr} – ${endStr}` : startStr) : 'Дата уточняется';
                const isFav = favorites.includes(item.id);

                const routeItem = isMarket
                  ? ({ id: item.id, name: cardName, city_id: city.id, place_type: 'market', categories: [], price_min: 0, price_max: 0, price_note: cardPrice, address: cardAddress, lat: (item as Event).lat ?? null, lng: (item as Event).lng ?? null, description: cardDescription, status: 'approved', is_point_verified: false, is_assortment_verified: false, owner_id: null, live_signal_text: null, live_signal_expires_at: null } as Place)
                  : (item as Place);

                return (
                  <article className="card place-card" key={item.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className={'format-tag ' + (isMarket ? 'market-tag' : '')}>
                        {isMarket ? 'СОБЫТИЕ / 1 ДЕНЬ' : 'ПОСТОЯННО · МАГАЗИН'}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(item.id)}
                        className="stamp cursor-pointer"
                        style={{ backgroundColor: isFav ? '#CCFF00' : '#fff' }}
                        title={isFav ? 'Убрать из любимых' : 'Добавить в любимые'}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>
                    </div>
                    <h2>{cardName}</h2>
                    <p className="place-address">⌖ {cardAddress}</p>
                    {isMarket && <p className="event-date mono">ДАТА: {cardDate}</p>}
                    {cardDescription && <p>{cardDescription}</p>}
                    {!isMarket && (item as Place).live_signal_text && (item as Place).live_signal_expires_at && new Date((item as Place).live_signal_expires_at!) > new Date() && (
                      <div className="signal p-2 mt-2 mono">🔥 {(item as Place).live_signal_text}</div>
                    )}
                    <p className="mono text-xs">{cardPrice}</p>
                    <div className="card-actions">
                      <button className="lime-button" onClick={() => setSelected(item)}>ОТКРЫТЬ КАРТОЧКУ</button>
                      <button className="outline-button" onClick={() => routeToggle(routeItem)}>
                        {route.some(x => x.id === item.id) ? '✓' : '+'} В МАРШРУТ
                      </button>
                    </div>
                  </article>
                );
              })}

              {tab === 'place' && !list.length && <EmptyState onReset={() => { setCat('all'); setOnlyFavs(false); sessionStorage.setItem('sc-category', 'all'); }} />}
              {tab === 'market' && !eventList.length && <EmptyState onReset={resetFilters} />}
            </div>
          </div>
        )}

        {tab === 'place' && view === 'map' && !onlyFavs && osm.length > 0 && (
          <section className="osm-note">
            <b className="mono">[ OSM — АССОРТИМЕНТ НЕ ПРОВЕРЕН ]</b>
            {osm.slice(0, 15).map(o => <p key={o.id}>{o.tags?.name || o.tags?.shop || 'Место OSM'}</p>)}
          </section>
        )}

        {tab === 'online' && (
          <div className="grid md:grid-cols-3 gap-4">
            {onlineList.map(m => (
              <article className="card place-card" key={m.id}>
                <div className="format-tag online-tag">ОНЛАЙН</div>
                <h2>{m.name}</h2>
                <p>{m.guide_text}</p>
                <div className="flex flex-wrap gap-2 my-2">
                  <span className="stamp">{m.requires_local_phone ? 'МЕСТНАЯ SIM' : 'SIM НЕ НУЖНА'}</span>
                  <span className="stamp">{m.has_delivery ? 'ДОСТАВКА' : 'УТОЧНИТЬ'}</span>
                </div>
                <a className="lime-button inline-block mt-3 text-center" href={m.url} target="_blank" rel="noreferrer">
                  ПЕРЕЙТИ В СОЦСЕТИ / НА САЙТ ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black p-4 mono text-xs">SECOND CHANCE · BETA</footer>

      {route.length > 0 && (
        <aside className="fixed bottom-3 right-3 z-[900] receipt p-3 w-72">
          <b>ЧЕК ПРОГУЛКИ · {route.length} ТОЧЕК</b>
          {route.map(p => <p key={p.id}>{p.name} <button onClick={() => routeToggle(p)}>−</button></p>)}
          <p>Оценка: {route.reduce((a, p) => a + (p.price_min || 0), 0)}–{route.reduce((a, p) => a + (p.price_max || 0), 0)} ₽</p>
          <button onClick={() => { setRoute([]); localStorage.removeItem('sc-route'); }}>ОЧИСТИТЬ</button>
        </aside>
      )}

      {selected && (
        <PlaceModal
          selected={selected}
          city={city}
          isFavorite={favorites.includes(selected.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelected(null)}
          onConfirm={confirm}
        />
      )}

      {sizes && <Modal title="ТАБЛИЦА РАЗМЕРОВ" close={() => setSizes(false)}><SizeTable /></Modal>}

      {auth && (
        <AuthModal
          user={user}
          favoritesCount={favorites.length}
          onClose={() => setAuth(false)}
          onOpenAddPlace={() => setAdd(true)}
          onShowFavorites={() => {
            setOnlyFavs(true);
            if (tab === 'online') setTab('place');
          }}
          onNotify={setNotice}
        />
      )}

      {add && (
        <Modal title="ДОБАВИТЬ МЕСТО" close={() => setAdd(false)}>
          <form onSubmit={addPlace} className="auth-form">
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
                <option value={id} key={id}>{n}</option>
              ))}
            </select>
            <button className="lime-button">ОТПРАВИТЬ НА МОДЕРАЦИЮ</button>
          </form>
        </Modal>
      )}

      {user && <button className="fixed bottom-3 left-3 lime-button z-50" onClick={() => setAdd(true)}>+ ДОБАВИТЬ</button>}
      {notice && <button className="toast" onClick={() => setNotice('')}>{notice} ×</button>}

      {welcome && (
        <div className="modalback welcome-backdrop">
          <section className="modal welcome-modal" onClick={e => e.stopPropagation()}>
            <p className="mono text-xs">SECOND CHANCE / СТАРТ</p>
            <h2>01 / ГДЕ?</h2>
            <div className="city-buttons">
              {QUICK_CITIES.map(c => (
                <button key={c} className={welcomeCity === c ? 'active' : ''} onClick={() => setWelcomeCity(c)}>{c}</button>
              ))}
            </div>
            <label className="mono">ИЛИ ВВЕДИТЕ ДРУГОЙ ГОРОД</label>
            <input
              className="welcome-input"
              placeholder="Название города"
              value={QUICK_CITIES.includes(welcomeCity) ? '' : welcomeCity}
              onChange={e => setWelcomeCity(e.target.value)}
            />
            <h2>02 / ЧТО?</h2>
            <div className="category-buttons">
              {categories.map(([id, label]) => (
                <button key={id} className={welcomeCat === id ? 'active' : ''} onClick={() => setWelcomeCat(id)}>{label}</button>
              ))}
            </div>
            <button className="lime-button welcome-submit" onClick={applyWelcome}>ПЕРЕЙТИ К КАРТЕ →</button>
          </section>
        </div>
      )}
    </div>
  );
}
