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
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
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
        const merged = [...seed];
        data.forEach(d => {
          if (!merged.some(m => norm(m.name) === norm(d.name))) merged.push(d);
        });
        setCities(merged);
        const remembered = sessionStorage.getItem('sc-city-name');
        setCity(merged.find(c => norm(c.name) === norm(remembered) || c.slug === remembered) || merged[0]);
      }
    });
  }, []);

  useEffect(() => { refresh(); }, [city]);

  async function refresh() {
    const [p, e, m] = await Promise.all([
      supabase.from('places').select('*').eq('city_id', city.id).eq('status', 'approved'),
      supabase.from('events').select('*').eq('city_id', city.id).eq('status', 'approved').gte('end_date', new Date().toISOString()),
      supabase.from('online_markets').select('*').or(`city_id.eq.${city.id},city_id.is.null`)
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

  async function login() {
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw });
    if (result.error) setNotice(result.error.message);
    else {
      setNotice(authMode === 'signup' ? 'Проверьте email для подтверждения регистрации' : 'Вы вошли!');
      setAuth(false);
    }
  }

  async function addPlace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!user) return;
    const { error } = await supabase.from('places').insert({
      city_id: city.id,
      owner_id: user.id,
      name: f.get('name'),
      address: f.get('address'),
      description: f.get('description'),
      categories: [f.get('category')],
      place_type: 'shop',
      status: 'pending',
      lat: city.lat,
      lng: city.lng
    });
    setNotice(error?.message || 'Отправлено на модерацию');
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
    }
