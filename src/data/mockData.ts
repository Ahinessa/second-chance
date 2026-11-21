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
    price_min: 150,
    price_max: 500,
    price_note: null,
    address: city.name + ', Центральная улица, 12',
    lat: city.lat + 0.006,
    lng: city.lng + 0.004,
    description: 'Большой выбор базовой повседневной одежды, денима и верхней одежды с регулярными обновлениями зала.',
    status: 'approved',
    is_point_verified: false,
    is_assortment_verified: false,
    owner_id: null,
    live_signal_text: null,
    live_signal_expires_at: null,
    opening_hours: 'Ежедневно, 11:00 – 21:00',
    social_link: 'https://t.me/second_chance_kazan'
  },
  {
    id: 'demo-' + city.slug + '-2',
    city_id: city.id,
    name: city.name + ' · Винтаж и дом',
    place_type: 'shop',
    categories: ['home', 'antiques'],
    price_min: 500,
    price_max: 1500,
    price_note: null,
    address: city.name + ', Улица рынка, 8',
    lat: city.lat - 0.005,
    lng: city.lng + 0.007,
    description: 'Селективный винтаж, посуда, предметы интерьера, книги и редкие находки для дома.',
    status: 'approved',
    is_point_verified: false,
    is_assortment_verified: false,
    owner_id: null,
    live_signal_text: null,
    live_signal_expires_at: null,
    opening_hours: 'Вт–Вс, 12:00 – 20:00',
    social_link: 'https://t.me/vintage_dom_kzn'
  },
  {
    id: 'demo-' + city.slug + '-3',
    city_id: city.id,
    name: city.name + ' · Обмен вещами',
    place_type: 'swap',
    categories: ['clothes', 'flea'],
    price_min: 0,
    price_max: 0,
    price_note: null,
    address: city.name + ', Парк, зона встреч',
    lat: city.lat - 0.004,
    lng: city.lng - 0.006,
    description: 'Свободный обмен одеждой, книгами и полезными мелочами без денег.',
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
    description: 'Городская распродажа гардеробов, винила, керамики и локальных проектов.',
    start_date: new Date(Date.now() + 86400000).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    social_link: 'https://t.me/garage_sale_kzn',
    lat: city.lat + 0.01,
    lng: city.lng - 0.006
  },
  {
    id: 'demo-market-' + city.slug + '-2',
    city_id: city.id,
    title: city.name + ' · Винтажный маркет',
    address: city.name + ', Центральный двор',
    description: 'Выходной маркет от локальных коллекционеров и винтажных лавок.',
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
    description: 'Открытый обмен вещами, растениями и книгами.',
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
    guide_text: 'Крупнейшая доска объявлений для поиска одежды, мебели и техники с рук.',
    requires_local_phone: city.slug !== 'kazan',
    has_delivery: true
  },
  {
    id: 'demo-online-' + city.slug + '-2',
    city_id: city.id,
    name: 'Telegram · локальные барахолки',
    url: 'https://t.me/',
    guide_text: 'Локальные каналы и чаты с частными объявлениями и свопами.',
    requires_local_phone: false,
    has_delivery: false
  },
  {
    id: 'demo-online-' + city.slug + '-3',
    city_id: city.id,
    name: 'Facebook Marketplace',
    url: 'https://www.facebook.com/marketplace/',
    guide_text: 'Онлайн-площадка для поиска вещей и предметов интерьера рядом.',
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
    const cleanAddr = address.replace(/\(пример адреса\)/gi, '').trim();
    const query = cleanAddr.toLowerCase().includes(cityName.toLowerCase()) ? cleanAddr : `${cityName}, ${cleanAddr}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`;
}

export function buildYandexMapsUrl(address: string | null | undefined, cityName: string, placeName?: string) {
  const cleanAddr = (address || '').replace(/\(пример адреса\)/gi, '').trim();
  const cleanName = (placeName || '').replace(/\(пример карточки\)/gi, '').trim();
  const query = [cityName, cleanName, cleanAddr].filter(Boolean).join(', ');
  return `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`;
}

/**
 * Единые ценовые метки в зависимости от валюты города (₽ для Казани / RSD для Сербии)
 */
export function formatPriceRange(p: Place, currency: string) {
  const isRsd = norm(currency) === 'rsd';
  const cur = isRsd ? 'RSD' : '₽';

  if (p.price_min === 0 && p.price_max === 0) {
    return 'Бесплатно / обмен';
  }

  const maxVal = p.price_max ?? p.price_min;

  if (maxVal != null) {
    if (!isRsd) {
      if (maxVal <= 500) return `Очень дёшево (до 500 ${cur})`;
      if (maxVal <= 1500) return `Бюджетно (500–1 500 ${cur})`;
      if (maxVal <= 4000) return `Средний сегмент (1 500–4 000 ${cur})`;
      return `Винтаж и селектив (от 4 000 ${cur})`;
    } else {
      if (maxVal <= 600) return `Очень дёшево (до 600 ${cur})`;
      if (maxVal <= 2000) return `Бюджетно (600–2 000 ${cur})`;
      if (maxVal <= 5000) return `Средний сегмент (2 000–5 000 ${cur})`;
      return `Винтаж и селектив (от 5 000 ${cur})`;
    }
  }

  // Дефолтная метка для Казани/города, если конкретные цифры в базе ещё не проставлены
  return isRsd ? `Бюджетно (до 2 000 ${cur})` : `Бюджетно (до 1 500 ${cur})`;
}
