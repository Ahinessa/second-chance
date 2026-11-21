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
  { id: 'moscow', name: 'Москва', country: 'Россия', currency: '₽', slug: 'moscow', lat: 55.7558, lng: 37.6173 },
  { id: 'spb', name: 'Санкт-Петербург', country: 'Россия', currency: '₽', slug: 'spb', lat: 59.9343, lng: 30.3351 }
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
    social_link: 'https://t.me/second_chance_ru'
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
    social_link: 'https://t.me/vintage_dom_ru'
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
    social_link: 'https://t.me/garage_sale_ru',
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
    name: 'Авито',
    url: 'https://www.avito.ru',
    guide_text: 'Крупнейшая площадка частных объявлений в России: одежда, винтаж, мебель и книги с Авито Доставкой.',
    requires_local_phone: false,
    has_delivery: true
  },
  {
    id: 'demo-online-' + city.slug + '-2',
    city_id: city.id,
    name: 'Telegram · локальные барахолки и свопы',
    url: 'https://t.me/',
    guide_text: `Городские каналы и чаты (${city.name}): отдам даром, расхламление, ресейл-подборки.`,
    requires_local_phone: false,
    has_delivery: false
  },
  {
    id: 'demo-online-' + city.slug + '-3',
    city_id: city.id,
    name: 'ВКонтакте · Барахолки и ресейл-сообщества',
    url: 'https://vk.com',
    guide_text: `Тематические паблики и локальные объявления в городе ${city.name}.`,
    requires_local_phone: false,
    has_delivery: true
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
 * Единые ценовые метки в рублях (₽)
 */
export function formatPriceRange(p: Place, currency = '₽') {
  const cur = currency || '₽';

  if (p.price_min === 0 && p.price_max === 0) {
    return 'Бесплатно / обмен';
  }

  const maxVal = p.price_max ?? p.price_min;

  if (maxVal != null) {
    if (maxVal <= 500) return `Очень дёшево (до 500 ${cur})`;
    if (maxVal <= 1500) return `Бюджетно (500–1 500 ${cur})`;
    if (maxVal <= 4000) return `Средний сегмент (1 500–4 000 ${cur})`;
    return `Винтаж и селектив (от 4 000 ${cur})`;
  }

  return `Бюджетно (до 1 500 ${cur})`;
}
