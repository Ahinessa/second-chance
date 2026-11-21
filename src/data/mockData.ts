export type City = {
  id: string;
  name: string;
  country: string;
  currency: string;
  slug: string;
  lat: number;
  lng: number;
};

export type Place = {
  id: string;
  city_id: string;
  name: string;
  place_type: string;
  categories: string[];
  price_min: number | null;
  price_max: number | null;
  price_note: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  status: string;
  is_point_verified: boolean;
  is_assortment_verified: boolean;
  owner_id: string | null;
  live_signal_text: string | null;
  live_signal_expires_at: string | null;
  imageUrl?: string | null;
  images?: string[];
  opening_hours?: string | null;
  social_link?: string | null;
};

export type Event = {
  id: string;
  city_id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  social_link?: string | null;
  imageUrl?: string | null;
  images?: string[];
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

export type Market = {
  id: string;
  city_id?: string | null;
  name: string;
  url: string;
  guide_text: string;
  requires_local_phone: boolean;
  has_delivery: boolean;
};

export const categories = [
  ['all', 'Всё подряд'],
  ['clothes', 'Одежда'],
  ['home', 'Дом'],
  ['media', 'Книги и винил'],
  ['antiques', 'Антиквариат'],
  ['flea', 'Разное']
] as const;

export const validTabs = ['place', 'market', 'online'];

export const norm = (v: string | undefined | null) => String(v ?? '').trim().toLowerCase();

export const seed: City[] = [
  { id: 'kazan', name: 'Казань', country: 'Россия', currency: '₽', slug: 'kazan', lat: 55.7961, lng: 49.1064 },
  { id: 'novi-sad', name: 'Нови-Сад', country: 'Сербия', currency: 'RSD', slug: 'novi-sad', lat: 45.2671, lng: 19.8335 }
];

export const mockPlaces = (city: City): Place[] => [
  {
    id: 'demo-' + city.slug + '-1',
    city_id: city.id,
    name: city.name + ' · Секонд-хенд «Второй круг»',
    place_type: 'shop',
    categories: ['clothes'],
    price_min: 300,
    price_max: 1500,
    price_note: '300–1500 ' + city.currency,
    address: city.name + ', Центральная улица, 12',
    lat: city.lat + 0.006,
    lng: city.lng + 0.004,
    description: 'Демо-карточка для проверки фильтров и карты. Не реальное место.',
    status: 'approved',
    is_point_verified: false,
    is_assortment_verified: false,
    owner_id: null,
    live_signal_text: null,
    live_signal_expires_at: null,
    opening_hours: 'Ежедневно, 11:00 – 21:00',
    social_link: 'https://t.me/second_chance_demo'
  },
  {
    id: 'demo-' + city.slug + '-2',
    city_id: city.id,
    name: city.name + ' · Винтаж и дом',
    place_type: 'shop',
    categories: ['home', 'antiques'],
    price_min: 500,
    price_max: 3000,
    price_note: '500–3000 ' + city.currency,
    address: city.name + ', Улица рынка, 8',
    lat: city.lat - 0.005,
    lng: city.lng + 0.007,
    description: 'Демо-карточка: винтаж, вещи для дома и декор.',
    status: 'approved',
    is_point_verified: false,
    is_assortment_verified: false,
    owner_id: null,
    live_signal_text: null,
    live_signal_expires_at: null,
    opening_hours: 'Вт–Вс, 12:00 – 20:00'
  },
  {
    id: 'demo-' + city.slug + '-3',
    city_id: city.id,
    name: city.name + ' · Обмен вещами',
    place_type: 'swap',
    categories: ['clothes', 'flea'],
    price_min: 0,
    price_max: 0,
    price_note: 'Бесплатно / обмен',
    address: city.name + ', Парк, зона встреч',
    lat: city.lat - 0.004,
    lng: city.lng - 0.006,
    description: 'Демо-карточка для теста фильтра «Разное».',
    status: 'approved',
    is_point_verified: false,
    is_assortment_verified: false,
    owner_id: null,
    live_signal_text: null,
    live_signal_expires_at: null,
    opening_hours: 'Сб–Вс, 13:00 – 18:00'
  }
];

export const mockEvents = (city: City): Event[] => [
  {
    id: 'demo-market-' + city.slug + '-1',
    city_id: city.id,
    title: city.name + ' · Гараж-сейл',
    address: city.name + ', Арт-пространство, 5',
    description: 'Демо-событие для проверки вкладки. Не является реальным мероприятием.',
    start_date: new Date(Date.now() + 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    social_link: 'https://t.me/garage_sale_demo',
    lat: city.lat + 0.01,
    lng: city.lng - 0.006
  },
  {
    id: 'demo-market-' + city.slug + '-2',
    city_id: city.id,
    title: city.name + ' · Винтажный маркет',
    address: city.name + ', Центральный двор',
    description: 'Тестовая карточка маркета.',
    start_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    social_link: '',
    lat: city.lat - 0.008,
    lng: city.lng + 0.003
  },
  {
    id: 'demo-market-' + city.slug + '-3',
    city_id: city.id,
    title: city.name + ' · Своп выходного дня',
    address: city.name + ', Культурный центр',
    description: 'Демо-событие для визуальной проверки.',
    start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    social_link: '',
    lat: city.lat + 0.002,
    lng: city.lng + 0.009
  }
];

export const mockOnline = (city: City): Market[] => [
  {
    id: 'demo-online-' + city.slug + '-1',
    city_id: city.id,
    name: 'Avito / KupujemProdajem',
    url: city.slug === 'kazan' ? 'https://www.avito.ru' : 'https://www.kupujemprodajem.com',
    guide_text: 'Демо-подборка площадок для города. Проверяйте продавца и условия доставки.',
    requires_local_phone: city.slug !== 'kazan',
    has_delivery: true
  },
  {
    id: 'demo-online-' + city.slug + '-2',
    city_id: city.id,
    name: 'Telegram · локальные барахолки',
    url: 'https://t.me/',
    guide_text: 'Поиск локальных каналов и групп. Демо-карточка.',
    requires_local_phone: false,
    has_delivery: false
  },
  {
    id: 'demo-online-' + city.slug + '-3',
    city_id: city.id,
    name: 'Facebook Marketplace',
    url: 'https://www.facebook.com/marketplace/',
    guide_text: 'Демо-карточка онлайн-площадки.',
    requires_local_phone: false,
    has_delivery: false
  }
];

export function formatDateSafe(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU');
}

export function buildGoogleMapsUrl(address: string | null | undefined, cityName: string, lat?: number | null, lng?: number | null) {
  if (address && address.trim()) {
    const query = address.toLowerCase().includes(cityName.toLowerCase()) ? address : `${cityName}, ${address}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`;
}

export function formatPriceRange(p: Place, currency: string) {
  if (p.price_min != null && p.price_max != null) {
    if (p.price_min === 0 && p.price_max === 0) return 'Бесплатно / обмен';
    return `${p.price_min}–${p.price_max} ${currency}`.trim();
  }
  if (p.price_min != null) return `от ${p.price_min} ${currency}`.trim();
  if (p.price_max != null) return `до ${p.price_max} ${currency}`.trim();
  return p.price_note || 'Диапазон уточняется';
}
