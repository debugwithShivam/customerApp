import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useColorScheme, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SplashScreen from 'expo-splash-screen';
import { LocationMap, type MapPin } from '@/components/location-map';
import { api, backendUrl, clearLoginToken, fetchDocument, hasBackendUrl, hasLoginToken, readAppearanceSetting, readCustomerArea, saveAppearanceSetting, saveCustomerArea, saveLoginToken } from '@/services/medical-api';
import { DEMO_BANNERS, DEMO_CATEGORIES, DEMO_DOCTORS, DEMO_LABS, DEMO_PRODUCTS } from '@/services/demo-data';

type Page = 'Home' | 'Categories' | 'Subcategories' | 'Category products' | 'Product details' | 'Medical Orders' | 'Cart' | 'My Account' | 'Lab Tests' | 'Consult a Doctor' | 'Booking' | 'Prescription Centre' | 'Notifications' | 'Personal details' | 'Health log' | 'Refunds' | 'Saved products' | 'Delivery addresses' | 'Wallet' | 'Help and support' | 'Sign in';

type Subcategory = {
  id: number;
  category_id: number;
  name: string;
  slug?: string;
  image_full_url?: string;
};

type Category = {
  id: number;
  name: string;
  image_full_url?: string;
  subcategories?: Subcategory[];
};

type Product = {
  id: number;
  name: string;
  description?: string;
  unit?: string;
  price: number;
  discount_price?:
  number | null;
  stock: number;
  medicine_type?: string;
  category_id?: number;
  category_name?: string;
  subcategory_id?: number | null;
  subcategory_name?: string;
  thumbnail_full_url?: string;
  is_demo?: boolean
};

type Banner = {
  id: number;
  title?: string;
  subtitle?: string;
  image_full_url?: string;
  action_text?: string
};

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
  thumbnail_full_url?: string;
  stock?: number
};

type Zone = {
  id: number;
  name: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number | string;
  longitude?: number | string
};

type LocationChoice = MapPin & {
  address: string;
  pincode?: string;
  city?: string
};

type Summary = {
  subtotal: number;
  medicine_discount: number;
  coupon_discount: number;
  total_discount: number;
  tax_total: number;
  delivery_charge: number;
  platform_fee: number;
  extra_discount_threshold: number;
  total: number;
  items_count: number
};

type Profile = {
  id: number;
  name: string;
  phone: string;
  email?: string
};

const darkPalette = {
  bg: '#050a0b',
  homeTop: '#082522',
  card: '#141a1d',
  raised: '#1c2428',
  line: '#273136',
  teal: '#00b7a7',
  tealDark: '#087f78',
  mint: '#c7fff3',
  muted: '#879398',
  white: '#f5f8f8',
  red: '#ff8888',
  headerLine: '#152022',
  searchLine: '#20292c',
  arrow: '#89969b',
  demoBadge: '#ffca72',
  dot: '#415151',
  reportLine: '#27655f',
  reportBg: '#172423',
  allProductsLine: '#17645e',
  inputBg: '#20272b',
  inputLine: '#293135',
  slotOnBg: '#0b554e',
  softText: '#d2dadd',
  textSofter: '#c3cccf',
  chipOnBg: '#064d48',
  zoneOnBg: '#063d3a',
  zoneText: '#bdc7ca',
  productLine: '#1d272a',
  tileBg: '#20282c',
  heartBg: '#0c1416',
  rxNote: '#e5bd80',
  disabledBg: '#454c4e',
  tabsBorder: '#20282b',
  tabsBg: '#090e10',
  tabIcon: '#728085',
  tabLabel: '#879297',
  configBg: '#15322e',
  configText: '#b3c5c5',
  noticeBg: '#3d2c16',
  noticeText: '#f6dcaa',
  emptyTitle: '#e5eeee',
  nudgeBg: '#0b4239',
  nudgeGlyph: '#8ef6cc',
  nudgeText: '#d4ffec',
  qtyBg: '#253033',
  summaryLabel: '#b1bcbe',
  summaryValue: '#e8eeee',
  green: '#78e4aa',
  loginPromptBg: '#123433',
  outlineLine: '#185350',
  fieldLabel: '#dbe3e4',
  chatMineBg: '#075d55',
  menuBg: '#0b1113',
  menuBorder: '#263135',
  menuSection: '#78878c',
  menuItemText: '#e0e8e9',
  menuItemLine: '#1b2629',
  menuSignoutLine: '#20413e',
  menuFooter: '#657277',
  sheetBg: '#101719'
};

const lightPalette: Palette = {
  bg: '#f1f5f4',
  homeTop: '#e5f0ee',
  card: '#ffffff',
  raised: '#e9efee',
  line: '#d8e2e0',
  teal: '#00968a',
  tealDark: '#0a8f86',
  mint: '#066d64',
  muted: '#5c6a6d',
  white: '#152120',
  red: '#c0392b',
  headerLine: '#e0e7e6',
  searchLine: '#dbe3e2',
  arrow: '#667478',
  demoBadge: '#8a6116',
  dot: '#b6c2c1',
  reportLine: '#a4d8d2',
  reportBg: '#e6f3f1',
  allProductsLine: '#a4d8d2',
  inputBg: '#eef3f2',
  inputLine: '#d8e2e0',
  slotOnBg: '#c4ebe6',
  softText: '#3c4a4c',
  textSofter: '#44514f',
  chipOnBg: '#d2efeb',
  zoneOnBg: '#d2efeb',
  zoneText: '#4c5a5c',
  productLine: '#e3e9e8',
  tileBg: '#e9efee',
  heartBg: '#f6f9f8',
  rxNote: '#8a6116',
  disabledBg: '#bac3c2',
  tabsBorder: '#e0e7e6',
  tabsBg: '#ffffff',
  tabIcon: '#7f8d90',
  tabLabel: '#6a777a',
  configBg: '#dcf0ec',
  configText: '#3d5a55',
  noticeBg: '#fbeecd',
  noticeText: '#7a5410',
  emptyTitle: '#223030',
  nudgeBg: '#d7f2ea',
  nudgeGlyph: '#0c7d5f',
  nudgeText: '#0d5c48',
  qtyBg: '#dee5e4',
  summaryLabel: '#4a595b',
  summaryValue: '#223030',
  green: '#0c8a5f',
  loginPromptBg: '#d9efec',
  outlineLine: '#a4d8d2',
  fieldLabel: '#3c4a4c',
  chatMineBg: '#c4ebe6',
  menuBg: '#ffffff',
  menuBorder: '#dbe3e2',
  menuSection: '#6a777a',
  menuItemText: '#223030',
  menuItemLine: '#e9efee',
  menuSignoutLine: '#a4d8d2',
  menuFooter: '#7f8d90',
  sheetBg: '#ffffff'
};

type Palette = typeof darkPalette;

const money = (value = 0) => `₹${Number(value || 0)
  .toLocaleString('en-IN',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  )}`;

const cleanProviderName = (value?: string) =>
  String(value ?? '')
    .replace(/\bDEMO ONLY\b/gi, '')
    .replace(/\bDEMO\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*[-·]\s*/g, ' ')
    .trim();

const calendarDays = (month: Date): (Date | null)[] => {
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, day) => new Date(month.getFullYear(), month.getMonth(), day + 1))];
};

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

let demoRecordSequence = 1;

const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite) || (lat1 === 0 && lon1 === 0) || (lat2 === 0 && lon2 === 0)) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1), dLon = radians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export function CustomerApp() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bannerWidth = Math.min(windowWidth, 480);
  const [page, setPage] = useState<Page>('Home');
  const [history, setHistory] = useState<Page[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationChoices, setLocationChoices] = useState<LocationChoice[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationChoice | null>(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [configMessage, setConfigMessage] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneId, setZoneId] = useState<number | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [demoCart, setDemoCart] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ subtotal: 0, medicine_discount: 0, coupon_discount: 0, total_discount: 0, tax_total: 0, delivery_charge: 0, platform_fee: 0, extra_discount_threshold: 0, total: 0, items_count: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointment, setAppointment] = useState<{ kind: 'lab' | 'doctor'; id: number } | null>(null);
  const [consultationMode, setConsultationMode] = useState<'online' | 'clinic'>('online');
  const [consultationReason, setConsultationReason] = useState('');
  const [prescriptionAsset, setPrescriptionAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionPaymentMethods, setPrescriptionPaymentMethods] = useState<any[]>([]);
  const [prescriptionPaymentMethod, setPrescriptionPaymentMethod] = useState('cash_on_delivery');
  const [prescriptionPaymentReference, setPrescriptionPaymentReference] = useState('');
  const [doctorConsultations, setDoctorConsultations] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [pickupPharmacies, setPickupPharmacies] = useState<any[]>([]);
  const [addressText, setAddressText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [deliveryType, setDeliveryType] = useState<'express' | 'slot' | 'same_day' | 'next_day'>('express');
  const [deliverySlot, setDeliverySlot] = useState<string>('30-60 mins Express');
  const [bookingSlot, setBookingSlot] = useState('');
  const [orderRows, setOrderRows] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [appearance, setAppearance] = useState('Use device setting');
  const [refreshKey, setRefreshKey] = useState(0);

  const systemColorScheme = useColorScheme();
  const isLightTheme = appearance === 'Light' || (appearance === 'Use device setting' && systemColorScheme === 'light');
  const C: Palette = isLightTheme ? lightPalette : darkPalette;
  const s = useMemo(() => makeStyles(C), [C]);

  const go = (next: Page) => { setMenuOpen(false); setHistory((items) => [...items, page]); setPage(next); setNotice(''); };
  const back = () => { setPage(history.at(-1) ?? 'Home'); setHistory((items) => items.slice(0, -1)); setNotice(''); };
  const apiCall = async <T,>(path: string, options?: { method?: string; body?: unknown }) => api<T>(path, options);

  const openAreaPicker = () => {
    const currentZone = zones.find((zone) => zone.id === zoneId);
    if (!selectedLocation && currentZone?.latitude && currentZone?.longitude) {
      setSelectedLocation({
        latitude: Number(currentZone.latitude),
        longitude: Number(currentZone.longitude),
        address: currentZone.name, city: currentZone.city,
        pincode: currentZone.pincode
      });
    }
    setMenuOpen(false);
    setLocationQuery(selectedLocation?.address ?? '');
    setLocationNotice('');
    setAreaPickerOpen(true);
  };

  const loadPrescriptionCentre = async () => {
    const [data, consultations, pharmacies, savedAddresses] = await Promise.all([
      apiCall<any>('/prescription-requests'),
      apiCall<any>('/consultations'),
      zoneId ? apiCall<any>(`/pharmacies?zone_id=${zoneId}`) : Promise.resolve({ data: [] }),
      apiCall<any>('/customers/addresses'),
    ]);
    setPrescriptions(data.data ?? []);
    setDoctorConsultations(consultations.data ?? []);
    setPickupPharmacies(pharmacies.data ?? []);
    setAddresses(savedAddresses.data ?? []);
    setPrescriptionPaymentMethods(data.payment_methods ?? []);
    if (!(data.payment_methods ?? []).some((method: any) => method.id === prescriptionPaymentMethod))
      setPrescriptionPaymentMethod((data.payment_methods ?? [])[0]?.id ?? '');
  };

  const acceptPrescriptionQuote = async (request: any) => {
    const quoteId = Number(request.quote?.id ?? request.quote_id ?? 0);
    if (!quoteId) {
      setNotice('The pharmacy quote is no longer available. Refresh and try again.'); return;
    }
    setBusy(true);
    try {
      await apiCall(`/prescription-requests/${request.id}/accept-quote`,
        {
          method: 'POST',
          body: {
            quote_id: quoteId
          }
        }
      );
      await loadPrescriptionCentre();
      setNotice('Quote accepted. Review the delivery address and place your medicine order.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not accept this quote.');
    } finally {
      setBusy(false);
    }
  };

  const checkoutPrescriptionQuote = async (request: any) => {
    const savedAddress = addresses.find((item) => Number(item.is_default) === 1) ?? addresses[0];
    if (!savedAddress && !addressText.trim()) {
      setNotice('Add a delivery address before placing this medicine order.');
      go('Delivery addresses');
      return;
    }
    if (!prescriptionPaymentMethod) {
      setNotice('No payment method is currently enabled. Contact the website administrator.');
      return;
    }
    setBusy(true);
    try {
      const result = await apiCall<any>(`/prescription-requests/${request.id}/checkout`, {
        method: 'POST', body: {
          address_id: savedAddress?.id, address: savedAddress ? undefined : addressText.trim(),
          payment_method: prescriptionPaymentMethod, payment_reference: prescriptionPaymentReference.trim(),
        }
      });
      await loadPrescriptionCentre();
      setNotice(`${result.message ?? 'Medicine order placed.'}${result.order_number ? ` Order ${result.order_number}.` : ''}`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not place the medicine order.'); }
    finally { setBusy(false); }
  };

  const loadCart = useCallback(async () => {
    try {
      const response = await apiCall<{ data?: CartItem[]; summary?: Summary }>('/cart');
      const localItems = demoCart;
      setCart([...(response.data ?? []), ...localItems]);
      if (response.summary) {
        const localSubtotal = localItems.reduce((total, item) => total + item.price * item.quantity, 0);
        setSummary({
          ...response.summary,
          subtotal: response.summary.subtotal + localSubtotal,
          total: response.summary.total + localSubtotal,
          items_count: response.summary.items_count + localItems.reduce((total, item) => total + item.quantity,
            0)
        });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load your cart.');
    }
  }, [demoCart]);

  const loadCatalog = useCallback(async (selectedZone: number | null, category = categoryId, search = query, subcategory = selectedSubcategoryId) => {
    const isLocalOrDemo = !hasBackendUrl() || !selectedZone || selectedZone < 0 || (category !== null && category < 0) || (subcategory !== null && subcategory < 0);
    if (isLocalOrDemo) {
      let filtered = DEMO_PRODUCTS;
      if (category !== null && category !== 0) {
        filtered = filtered.filter((item) => item.category_id === category);
      }
      if (subcategory !== null && subcategory !== 0) {
        filtered = filtered.filter((item) => item.subcategory_id === subcategory);
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter((item) => item.name.toLowerCase().includes(q) || (item.subcategory_name && item.subcategory_name.toLowerCase().includes(q)));
      }
      setProducts(filtered as unknown as Product[]);
      setCatalogLoading(false);
      return;
    }
    if (!selectedZone || selectedZone < 0 || (category !== null && category < 0)) {
      setProducts([]);
      setCatalogLoading(false);
      return;
    }
    const params = new URLSearchParams({ limit: '54' });
    if (selectedZone) params.set('zone_id', String(selectedZone));
    if (category) params.set('category_id', String(category));
    if (subcategory) params.set('subcategory_id', String(subcategory));
    if (search.trim()) params.set('query', search.trim());
    const suffix = `?${params.toString()}`;
    const showHome = Boolean(selectedZone && category === null && !subcategory && !search.trim());
    const requests: Promise<any>[] = [apiCall<{ data?: Category[] }>('/categories')];
    if (showHome) requests.push(apiCall<any>(`/home?zone_id=${selectedZone}`));
    else requests.push(apiCall<{ data?: Product[] }>(`${search.trim() ? '/products/search' : '/products'}${suffix}`));
    setCatalogLoading(true);
    try {
      const results = await Promise.all(requests);
      const categoryPayload = results[0];
      const liveCategories = (categoryPayload.data ?? []).map((item: Category) => ({ ...item, id: Number(item.id) }));
      setCategories((previous) => {
        const next = liveCategories.length ? liveCategories : DEMO_CATEGORIES as unknown as Category[];
        return previous.length === next.length && previous.every((item, index) => item.id === next[index]?.id && item.name === next[index]?.name) ? previous : next;
      });
      if (showHome) {
        const home = results[1];
        setBanners(home.banners?.length ? home.banners : DEMO_BANNERS);
        const homeProducts = home.featured_products?.length ? home.featured_products : (home.latest_products ?? []);

        setProducts(homeProducts.length ? homeProducts : DEMO_PRODUCTS as unknown as Product[]);
      } else {
        if (!category && !subcategory && !search.trim()) setBanners([]);
        const liveProducts = results[1].data ?? [];
        const sampleProducts = (DEMO_PRODUCTS as unknown as Product[]).filter((item) => !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase()));
        setProducts(liveProducts.length ? liveProducts : sampleProducts);
      }
    } catch (error) {
      setCategories(DEMO_CATEGORIES as unknown as Category[]); setProducts(DEMO_PRODUCTS as unknown as Product[]);
      setBanners(DEMO_BANNERS); setDoctors(DEMO_DOCTORS); setLabs(DEMO_LABS);
      setZones([{ id: -1, name: 'Central - Prayagraj', city: 'Prayagraj', state: 'Uttar Pradesh', pincode: '211001', latitude: 25.4358, longitude: 81.8463 }]);
      setZoneId(-1); setCategoryId(null); setSelectedSubcategoryId(null);
    } finally {
      setCatalogLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, selectedSubcategoryId, query, categories]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      if (!hasBackendUrl()) {
        setConfigMessage('');
        setCategories(DEMO_CATEGORIES as unknown as Category[]);
        setProducts(DEMO_PRODUCTS as unknown as Product[]);
        setBanners(DEMO_BANNERS);
        setDoctors(DEMO_DOCTORS); setLabs(DEMO_LABS);
        setZones([{ id: -1, name: 'Central - Prayagraj', city: 'Prayagraj', state: 'Uttar Pradesh', pincode: '211001', latitude: 25.4358, longitude: 81.8463 }]);
        setZoneId(-1);
        return;
      }
      setBusy(true);
      try {
        const [settings, cats, zoneResponse, savedArea] = await Promise.all([
          apiCall<any>('/config'),
          apiCall<{ data?: Category[] }>('/categories'),
          apiCall<{ data?: Zone[] }>('/api/v1/zones'),
          readCustomerArea<{ zone_id?: number; location?: LocationChoice }>().catch(() => null),
        ]);
        if (!active) return;
        setConfig(settings);
        const activeZones: Zone[] = (zoneResponse.data?.length ? zoneResponse.data : settings.zones ?? []).map((zone: Zone) => ({ ...zone, id: Number(zone.id) }));
        const serviceZones: Zone[] = activeZones;
        setZones(serviceZones);
        if (savedArea?.location)
          setSelectedLocation(savedArea.location);
        setCategories((cats.data ?? []).map((category) => ({ ...category, id: Number(category.id) })));
        const savedZone = serviceZones.find((zone) => zone.id === Number(savedArea?.zone_id));
        const initialZone = savedZone?.id ?? serviceZones[0]?.id ?? null;
        setZoneId(initialZone);
        if (initialZone === null) {
          setCategories(DEMO_CATEGORIES as unknown as Category[]);
          setProducts(DEMO_PRODUCTS as unknown as Product[]);
          setBanners(DEMO_BANNERS);
          setDoctors(DEMO_DOCTORS);
          setLabs(DEMO_LABS);
          setZones([{
            id: -1,
            name: 'Central - Prayagraj',
            city: 'Prayagraj',
            state: 'Uttar Pradesh',
            pincode: '211001',
            latitude: 25.4358,
            longitude: 81.8463
          }]);
          setZoneId(-1);
        }
        if (initialZone !== null) await loadCatalog(initialZone, null, '');
        const signedIn = await hasLoginToken();
        if (signedIn) {
          try {
            const me = await apiCall<{ data: Profile }>('/customers/profile');
            if (active) {
              setProfile(me.data); setCustomerName(me.data.name ?? '');
              setCustomerPhone(me.data.phone ?? '');
            }
          } catch {
            if (active)
              setProfile(null);
          }
        }
        await loadCart();
      } catch (error) {
        if (active) {
          setCategories(DEMO_CATEGORIES as unknown as Category[]);
          setProducts(DEMO_PRODUCTS as unknown as Product[]);
          setBanners(DEMO_BANNERS);
          setDoctors(DEMO_DOCTORS);
          setLabs(DEMO_LABS);
          setZones([{
            id: -1,
            name: 'Central - Prayagraj',
            city: 'Prayagraj',
            state: 'Uttar Pradesh',
            pincode: '211001',
            latitude: 25.4358,
            longitude: 81.8463
          }]);
          setZoneId(-1);
          setConfigMessage('');
        }
      } finally {
        if (active) setBusy(false);
      }
    };

    void start();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void readAppearanceSetting()
      .then((saved) => {
        if (saved)
          setAppearance(saved);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCatalog(
        zoneId ?? -1,
        categoryId,
        query,
        selectedSubcategoryId
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [zoneId, categoryId, selectedSubcategoryId, query, refreshKey, loadCatalog]);

  const openPage = async (next: Page) => {
    go(next);
    if (!hasBackendUrl()) return;
    try {
      if (next === 'Medical Orders') {
        const [o, l, d] = await Promise.all([apiCall<any>('/orders'),
        apiCall<any>('/lab-bookings'),
        apiCall<any>('/consultations')]);
        setOrders([...(o.data ?? []),
        ...(l.data ?? []).map((x: any) => ({
          ...x,
          order_number: x.test_name,
          order_status: x.status,
          order_amount: x.amount,
          type: 'Lab test'
        })),
        ...(d.data ?? []).map((x: any) => ({
          ...x,
          order_number: x.doctor_name,
          order_status: x.status,
          order_amount: x.amount,
          type: 'Consultation'
        })
        )]);
      } else if (next === 'Health log') {
        const [labs, visits] = await Promise.all([apiCall<any>('/lab-bookings'),
        apiCall<any>('/consultations')]);
        setHealthRecords([...(labs.data ?? [])
          .map((item: any) => ({
            ...item,
            record_type: 'Lab test',
            record_name: item.test_name || item.name || 'Lab test'
          })),
        ...(visits.data ?? []).map((item: any) => ({
          ...item,
          record_type: 'Consultation',
          record_name: item.doctor_name ? 'Dr. ' + item.doctor_name : 'Doctor consultation'
        })
        )].sort((a: any, b: any) => String(b.scheduled_at || b.created_at || '')
          .localeCompare(String(a.scheduled_at || a.created_at || ''))
        ));
      } else if (next === 'Delivery addresses') {
        const data = await apiCall<any>('/customers/addresses');
        setAddresses(data.data ?? []);
      } else if (next === 'Notifications') {
        const data = await apiCall<any>('/notifications');
        setNotifications(data.data ?? []);
      } else if (next === 'Saved products') {
        const data = await apiCall<any>('/wishlist');
        setWishlist(data.data ?? []);
      } else if (next === 'Lab Tests' || next === 'Consult a Doctor') {
        if (!zoneId || zoneId < 0) {
          setLabs(DEMO_LABS);
          setDoctors(DEMO_DOCTORS);
        }
        else {
          const data = await apiCall<any>(`/services?zone_id=${zoneId}`);
          setLabs(data.lab_tests?.length ? data.lab_tests : DEMO_LABS);
          setDoctors(data.doctors?.length ? data.doctors : DEMO_DOCTORS);
        }
      } else if (next === 'Refunds') {
        const data = await apiCall<any>('/refunds');
        setOrders(data.data ?? []);
      } else if (next === 'Wallet') {
        const data = await apiCall<any>('/customers/wallet');
        setConfig((old: any) => ({
          ...old, wallet: {
            ...(data.data ?? {}),
            ledger: data.ledger ?? [],
            withdrawals: data.withdrawals ?? []
          }
        }));
      } else if (next === 'Prescription Centre') {
        await loadPrescriptionCentre();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Unable to load ${next.toLowerCase()}.`);
    }
  };

  const searchLocations = async () => {
    if (locationQuery.trim().length < 3) {
      setLocationNotice('Type at least 3 characters of an address, area, or PIN code.');
      return;
    }
    setLocationBusy(true);
    setLocationNotice('');
    try {
      const result = await apiCall<{ data?: LocationChoice[] }>('/api/v1/zones/search', {
        method: 'POST',
        body: {
          query: locationQuery.trim()
        }
      });
      setLocationChoices(result.data ?? []);
      if (!result.data?.length)
        setLocationNotice('No matching addresses found. Try a nearby landmark or PIN code.');
    } catch (error) {
      setLocationNotice(error instanceof Error ? error.message : 'Could not search for that address.');
    }
    finally {
      setLocationBusy(false);
    }
  };

  const selectMapPin = (pin: MapPin) => {
    const choice = {
      ...pin,
      address: `${pin.latitude.toFixed(5)},
         ${pin.longitude.toFixed(5)}`
    };
    setSelectedLocation(choice);
    setLocationQuery(choice.address);
    setLocationNotice('Pin selected. Add or search an address, then use this location.');
  };

  const applySelectedLocation = async () => {
    if (!selectedLocation) {
      setLocationNotice('Search for an address or tap the map to place a pin first.');
      return;
    }
    setLocationBusy(true);
    setLocationNotice('Checking delivery coverage…');
    try {
      let details: LocationChoice = selectedLocation;
      try {
        const reverse = await apiCall<{
          data?: {
            address?: string;
            pincode?: string;
            city?: string
          }
        }>('/api/v1/zones/reverse-geocode', {
          method: 'POST',
          body: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
          }
        });
        details = {
          ...selectedLocation,
          ...reverse.data,
          address: reverse.data?.address || selectedLocation.address
        };
      } catch { /* Keep the manually entered or map-pin address if reverse lookup is unavailable. */ }
      const resolution = await apiCall<{
        data?: {
          zone?: Zone | null;
          serviceable?: boolean
        }
      }>('/api/v1/zones/resolve',
        {
          method: 'POST',
          body: {
            latitude: details.latitude,
            longitude: details.longitude,
            pincode: details.pincode,
            city: details.city
          }
        });
      setSelectedLocation(details);
      setLocationQuery(details.address);
      setLocationChoices([]);
      setNotice('');
      if (resolution.data?.zone) {
        const zone = {
          ...resolution.data.zone,
          id: Number(resolution.data.zone.id)
        };
        setZones((current) => current.some((item) => item.id === zone.id) ? current : [...current, zone]);
        void saveCustomerArea({
          zone_id: zone.id,
          location: details
        }).catch(() => undefined);
        setZoneId(zone.id);
        setRefreshKey((value) => value + 1);
        setAreaPickerOpen(false);
        setLocationNotice('');
      } else {
        setLocationNotice('This location is outside current delivery coverage. The admin must enable this area before orders can be placed.');
      }
    } catch (error) {
      setLocationNotice(error instanceof Error ? error.message : 'Could not check delivery coverage.');
    }
    finally {
      setLocationBusy(false);
    }
  };

  useEffect(() => {
    if (!profile || page !== 'Prescription Centre') return;
    const timer = setInterval(() => {
      void loadPrescriptionCentre().catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, [profile?.id, page, zoneId]);

  const addToCart = async (product: Product) => {
    if (!zoneId) { setNotice('Choose your delivery area before adding medicines.'); return; }
    try {
      if (product.id < 0 || zoneId < 0) {
        const existing = demoCart.find((item) => item.product_id === product.id);
        const nextDemoCart = existing ? demoCart.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...demoCart, { id: product.id, product_id: product.id, name: product.name, quantity: 1, price: product.discount_price || product.price, unit: product.unit, stock: product.stock }];
        const nextCart = [...cart.filter((item) => item.product_id >= 0), ...nextDemoCart];
        setDemoCart(nextDemoCart);
        setCart(nextCart);
        const subtotal = nextCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setSummary({
          subtotal, medicine_discount: 0,
          coupon_discount: 0,
          total_discount: 0,
          tax_total: 0,
          delivery_charge: 0,
          platform_fee: 0,
          extra_discount_threshold: 0,
          total: subtotal,
          items_count: nextCart.reduce((sum, item) => sum + item.quantity, 0)
        });
        setNotice(`${product.name} added to cart.`);
        return;
      }
      await apiCall('/cart/add', {
        method: 'POST',
        body: {
          product_id: product.id,
          quantity: 1,
          zone_id: zoneId
        }
      });
      setNotice(`${product.name} added to cart.`);
      await loadCart();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not add this medicine.');
    }
  };

  const openProduct = async (product: Product) => {
    setSelectedProduct(product);
    go('Product details');
    if (product.id < 0 || !hasBackendUrl())
      return;
    try {
      const result = await apiCall<{ data?: Product }>(`/products/${product.id}${zoneId ? `?zone_id=${zoneId}` : ''}`);
      if (result.data) setSelectedProduct(result.data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load product details.');
    }
  };

  const updateQuantity = async (item: CartItem, quantity: number) => {
    try {
      if (item.product_id < 0 || item.id < 0 || zoneId === -1) {
        const nextCart = quantity < 1 ? cart.filter((entry) => entry.id !== item.id) : cart.map((entry) => entry.id === item.id ? { ...entry, quantity } : entry);
        const nextDemoCart = nextCart.filter((entry) => entry.product_id < 0);
        setDemoCart(nextDemoCart);
        setCart(nextCart);
        const subtotal = nextCart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);
        setSummary({
          subtotal,
          medicine_discount: 0,
          coupon_discount: 0,
          total_discount: 0,
          tax_total: 0,
          delivery_charge: 0,
          platform_fee: 0,
          extra_discount_threshold: 0,
          total: subtotal,
          items_count: nextCart.reduce((sum, entry) => sum + entry.quantity, 0)
        });
        return;
      }
      if (quantity < 1)
        await apiCall(`/cart/remove?cart_id=${item.id}`,
          {
            method: 'DELETE'
          }
        );
      else
        await apiCall('/cart/update',
          {
            method: 'PUT',
            body: {
              cart_id: item.id,
              quantity
            }
          }
        );
      await loadCart();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update the cart.');
    }
  };

  const submitAuth = async () => {
    if (!authPhone.trim() || !authPassword) {
      setNotice('Enter your phone number and password.');
      return;
    }
    if (authMode === 'register' && !authName.trim()) {
      setNotice('Enter your name to create an account.');
      return;
    }
    setBusy(true);
    try {
      const payload = await apiCall<any>(`/customers/${authMode}`,
        {
          method: 'POST',
          body: {
            name: authName,
            phone: authPhone,
            email: authEmail,
            password: authPassword
          }
        }
      );
      await saveLoginToken(payload.token);
      setProfile(payload.data);
      setCustomerName(payload.data?.name ?? authName);
      setCustomerPhone(payload.data?.phone ?? authPhone);
      setAuthPassword('');
      setNotice(payload.message ?? 'Signed in successfully.');
      setPage('My Account');
      setHistory([]);
      await loadCart();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Sign in failed.');
    }
    finally {
      setBusy(false);
    }
  };

  const saveAddress = async () => {
    if (!addressText.trim()) {
      setNotice('Enter your full delivery address.');
      return;
    }
    if (zoneId === -1) {
      const address = {
        id: -1,
        label: 'Home',
        address: addressText.trim(),
        city: 'Mumbai',
        pincode: '400001',
        is_default: true
      };
      setAddresses((items) => [
        address,
        ...items.filter((item) => !item.is_default)
      ]);
      setAddressText('');
      setNotice('Delivery address saved.');
      return;
    }
    try {
      const payload = await apiCall<any>('/customers/addresses', {
        method: 'POST',
        body: {
          label: 'Home',
          address: addressText,
          contact_name: profile?.name ?? customerName,
          contact_phone: profile?.phone ?? customerPhone,
          is_default: true
        }
      });
      setAddresses(payload.data ?? []);
      setAddressText('');
      setNotice('Delivery address saved.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Address could not be saved.');
    }
  };

  const placeOrder = async () => {
    if (!zoneId) {
      setNotice('Choose your service area before checkout.');
      return;
    }
    if (zoneId < 0 || cart.some((item) => item.product_id < 0)) {
      const number = `AMX-${String(demoRecordSequence++).padStart(6, '0')}`;
      setOrders((items) => [{
        id: number,
        order_number: number,
        order_status: 'confirmed'
        , order_amount: summary.total,
        type: 'Medicine order',
        created_at: 'Just now',
        delivery_type: deliveryType,
        delivery_slot: deliverySlot
      },
      ...items]);
      setCart([]);
      setSummary({
        subtotal: 0,
        medicine_discount: 0,
        coupon_discount: 0,
        total_discount: 0,
        tax_total: 0,
        delivery_charge: 0,
        platform_fee: 0,
        extra_discount_threshold: 0,
        total: 0,
        items_count: 0
      });
      setDemoCart([]);
      setNotice(`Order ${number} placed successfully.`);
      setPage('Medical Orders');
      setHistory([]);
      return;
    }
    if (!addressText.trim() && !addresses.length) {
      setNotice('Add a delivery address before checkout.');
      go('Delivery addresses');
      return;
    }
    setBusy(true);
    try {
      const payload = await apiCall<any>('/orders/place', {
        method: 'POST', body: {
          zone_id: zoneId,
          address_id: addresses.find((item) => Number(item.is_default) === 1)?.id ?? undefined,
          customer_name: profile?.name ?? customerName,
          customer_phone: profile?.phone ?? customerPhone,
          address: addressText || undefined,
          payment_method: 'cash_on_delivery',
          age_confirmed: true,
          delivery_type: deliveryType,
          delivery_slot: deliverySlot,
        }
      });
      setNotice(payload.message ?? 'Your order has been placed.');
      setPage('Medical Orders');
      setHistory([]);
      await loadCart();
      const data = await apiCall<any>('/orders');
      setOrders(data.data ?? []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Checkout could not be completed.');
    }
    finally {
      setBusy(false);
    }
  };

  const saveProfile = async () => {
    try {
      const result = await apiCall<any>('/customers/profile',
        {
          method: 'POST',
          body: {
            name: customerName,
            email: authEmail || profile?.email || ''
          }
        });
      setProfile(result.data);
      setNotice(result.message ?? 'Profile updated.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Profile update failed.');
    }
  };

  const toggleWishlist = async (product: Product) => {
    if (product.id < 0 || zoneId === -1) {
      setWishlist((items) => items.some((item) => item.product_id === product.id) ?
        items.filter((item) => item.product_id !== product.id) : [...items, {
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: product.price,
          discount_price: product.discount_price
        }]);
      setNotice('Saved products updated.');
      return;
    }
    try {
      await apiCall('/wishlist/toggle', {
        method: 'POST',
        body: {
          product_id: product.id
        }
      });
      const result = await apiCall<any>('/wishlist');
      setWishlist(result.data ?? []);
      setNotice('Wishlist updated.');
    }
    catch (error) {
      setNotice(error instanceof Error ? error.message : 'Wishlist could not be updated.');
    }
  };

  const submitBooking = async () => {
    if (!appointment) return;
    if (!bookingTime.trim()) {
      setNotice('Choose a date and time from the calendar.');
      return;
    }
    if (zoneId === -1 || appointment.id < 0) {
      const provider = (appointment.kind === 'doctor' ? DEMO_DOCTORS : DEMO_LABS).find((item) => item.id === appointment.id);
      const name = provider ? ('name' in provider ? provider.name : '') : '';
      const recordId = `AMX-${String(demoRecordSequence++).padStart(6, '0')}`;
      setOrders((items) =>
        [{
          id: recordId,
          order_number: `${name}`,
          order_status: 'requested',
          order_amount: appointment.kind === 'doctor' ?
            DEMO_DOCTORS.find((item) => item.id === appointment.id)?.consultation_fee : DEMO_LABS.find((item) => item.id === appointment.id)?.price, type: appointment.kind === 'doctor' ? 'Consultation' : 'Lab test',
          scheduled_at: bookingTime || 'Preferred time to be confirmed'
        },
        ...items
        ]);
      setAppointment(null);
      setBookingTime('');
      setNotice('Your booking request has been received.');
      setPage('Medical Orders');
      setHistory([]);
      return;
    }
    if (!profile && (!customerName.trim() || !customerPhone.trim())) {
      setNotice('Enter your name and phone number for the booking.');
      return;
    }
    const lab = appointment.kind === 'lab';
    try {
      await apiCall(lab ? '/lab-bookings' : '/consultations', {
        method: 'POST', body: {
          zone_id: zoneId,
          customer_name: profile?.name ?? customerName.trim(),
          customer_phone: profile?.phone ?? customerPhone.trim(),
          scheduled_at: bookingTime,
          ...(lab ? {
            test_id: appointment.id,
            collection_mode: 'home'
          } : {
            doctor_id: appointment.id,
            consultation_mode: consultationMode,
            reason: consultationReason.trim()
          }),
          payment_method: 'cash_on_service',
        }
      });
      setAppointment(null);
      setBookingTime('');
      setConsultationMode('online');
      setConsultationReason('');
      setNotice('Your booking request has been sent.');
      setPage('Medical Orders');
      setHistory([]);
      await openPage('Medical Orders');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Booking request could not be sent.');
    }
  };

  const openDoctorChat = async (consultation: any) => {
    try {
      const result = await apiCall<any>('/chat', {
        method: 'POST',
        body: {
          entity_type: 'consultation',
          entity_id: Number(consultation.id)
        }
      });
      const id = Number(result.data?.id ?? result.conversation?.id);
      if (!id)
        throw new Error('Chat is not available for this appointment yet.');
      const thread = await apiCall<any>(`/chat/${id}/show`);
      setChatId(id);
      setChatMessages(thread.messages ?? []);
      setChatOpen(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not open the doctor chat.');
    }
  };

  const sendDoctorChat = async () => {
    if (!chatId || !chatDraft.trim()) return;
    try {
      const result = await apiCall<any>(`/chat/${chatId}/send`, {
        method: 'POST',
        body: {
          text: chatDraft.trim()
        }
      });
      setChatMessages(result.messages ?? []);
      setChatDraft('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Message could not be sent.');
    }
  };

  useEffect(() => {
    if (!chatOpen || !chatId) return;
    void api(`/chat/${chatId}/read`,
      {
        method: 'POST'
      }).catch(() => undefined);
    const timer = setInterval(() => {
      const lastId = chatMessages.at(-1)?.id ?? 0;
      void api<any>(`/chat/${chatId}/show?after_id=${lastId}`)
        .then((result) => {
          if (result.messages?.length)
            setChatMessages((messages) => [
              ...messages,
              ...result.messages
            ]);
        }).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [chatOpen, chatId, chatMessages]);

  const consultationReportHtml = (visit: any) => {
    const escape = (value: unknown) => String(value ?? '')
      .replace(/[&<>\"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '\"': '&quot;',
        "'": '&#39;'
      }[character]!
      ));
    const medicines = Array.isArray(visit.prescription_items) ? visit.prescription_items : [];
    return `
    <!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font: 14px Arial, sans-serif;
      color: #172324;
      margin: 36px;
    }
    h1 {
      color: #087f78;
      font-size: 22px;
    }
    h2 {
      font-size: 15px;
      margin: 22px 0 8px;
      border-bottom: 1px solid #d7e1df;
      padding-bottom: 6px;
    }
    .meta {
      line-height: 1.8;
      color: #405252;
    }
    .note {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .medicine {
      padding: 8px 0;
      border-bottom: 1px solid #e5ecea;
    }
    .footer {
      margin-top: 28px;
      color: #637170;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <h1>Amedix · Consultation report</h1>

  <div class="meta">
    <b>Patient:</b> ${escape(visit.customer_name || profile?.name)}<br>
    <b>Doctor:</b> Dr. ${escape(visit.doctor_name)}<br>
    <b>Appointment:</b> ${escape(visit.scheduled_at)}<br>
    <b>Mode:</b> ${visit.consultation_mode === 'clinic' ? 'Clinic visit' : 'Online'}<br>
    <b>Status:</b> ${escape(String(visit.status || '').replaceAll('_', ' '))}<br>
    <b>Consultation ID:</b> ${escape(visit.id)}
  </div>

  <h2>Doctor's notes</h2>
  <div class="note">
    ${escape(visit.clinical_note || 'No consultation note was added.')}
  </div>

  <h2>Prescription</h2>
  ${medicines.length
        ? medicines.map((item: any) => `
      <div class="medicine">
        <b>${escape(item.name)}</b>${item.strength ? ` · ${escape(item.strength)}` : ''}<br>
        ${[item.dosage, item.frequency, item.duration, item.instructions]
            .filter(Boolean)
            .map(escape)
            .join(' · ')}
      </div>`).join('')
        : '<div class="note">No medicines prescribed.</div>'}

  <div class="note">${escape(visit.prescription_note || '')}</div>

  <p class="footer">
    This report contains information saved by your doctor. Follow your doctor's advice for care.
  </p>
</body>
</html>
`;
  };

  const shareConsultationFile = async (visit: any, format: 'csv' | 'pdf') => {
    try {
      const fileBase = `amedix-consultation-${Number(visit.id)}`;
      let uri: string;
      if (format === 'pdf') {
        if ((Platform.OS as string) === 'web') {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            setNotice('Allow pop-ups to print or save this report as a PDF.');
            return;
          }
          printWindow.document.open();
          printWindow.document.write(consultationReportHtml(visit));
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          setNotice('Choose “Save as PDF” in the browser print dialog.');
          return;
        }
        ({ uri } = await Print.printToFileAsync({ html: consultationReportHtml(visit) }));
      } else {
        const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const medicines = (
          Array.isArray(visit.prescription_items) ? visit.prescription_items : [])
          .map((item: any) => [
            item.name,
            item.strength,
            item.dosage,
            item.frequency,
            item.duration,
            item.instructions
          ]
            .filter(Boolean)
            .join(' | ')).join('; ');
        const rows = [
          ['Amedix consultation report'],
          ['Patient', visit.customer_name || profile?.name],
          ['Doctor', `Dr. ${visit.doctor_name || ''}`],
          ['Appointment', visit.scheduled_at],
          ['Mode', visit.consultation_mode === 'clinic' ? 'Clinic visit' : 'Online'],
          ['Status', visit.status],
          ['Consultation ID', visit.id],
          ['Doctor notes', visit.clinical_note],
          ['Prescription', medicines || 'No medicines prescribed'],
          ['Prescription note', visit.prescription_note]
        ];
        const csv = `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
        if ((Platform.OS as string) === 'web') {
          const blob = new Blob([csv], {
            type: 'text/csv;charset=utf-8'
          });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${fileBase}.csv`;
          link.click();
          URL.revokeObjectURL(link.href);
          setNotice('Excel-compatible report downloaded.');
          return;
        }
        uri = `${FileSystem.cacheDirectory}${fileBase}.csv`;
        await FileSystem.writeAsStringAsync(
          uri,
          csv,
          {
            encoding: FileSystem.EncodingType.UTF8
          }
        );
      }
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(
          uri,
          {
            mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
            dialogTitle: `Save consultation ${format.toUpperCase()} report`
          }
        );
      else
        setNotice('File created, but sharing is unavailable on this device.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Could not create the ${format.toUpperCase()} report.`);
    }
  };

  const downloadLabReport = async (booking: any) => {
    const reportUrl = String(booking.report_url ?? '').trim();
    if (reportUrl === '') return;
    if (/^https?:\/\//i.test(reportUrl)) {
      await Linking.openURL(reportUrl);
      return;
    }
    try {
      const { data, fileName, mimeType } = await fetchDocument(`/documents/lab-report/${Number(booking.id)}`);
      if ((Platform.OS as string) === 'web') {
        const blob = new Blob([data]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName; link.click();
        URL.revokeObjectURL(link.href);
        setNotice('Lab report downloaded.');
        return;
      }
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, btoa(binary),
        {
          encoding: FileSystem.EncodingType.Base64
        }
      );
      if (await Sharing.isAvailableAsync())
        await Sharing.shareAsync(
          uri,
          {
            mimeType,
            dialogTitle: 'Save lab report'
          }
        );
      else
        setNotice('Report downloaded, but sharing is unavailable on this device.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not download the lab report.');
    }
  };

  const pickPrescription = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (result.canceled || !result.assets[0])
        return;
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        setNotice('Choose a JPG, PNG, WebP or PDF file up to 5 MB.');
        return;
      }
      setPrescriptionAsset(file);
      setNotice('');
    } catch {
      setNotice('Could not open your files. Please try again.');
    }
  };

  const submitPrescription = async () => {
    if (!profile) {
      setNotice('Sign in to upload a prescription.');
      go('Sign in');
      return;
    }
    if (!zoneId) {
      setNotice('Choose your service area before sending the prescription.');
      return;
    }
    if (!prescriptionAsset) {
      setNotice('Choose a prescription image or PDF first.');
      return;
    }
    setBusy(true);
    try {
      let base64 = prescriptionAsset.base64 ?? '';
      if (!base64)
        base64 = await FileSystem.readAsStringAsync(prescriptionAsset.uri, { encoding: 'base64' });
      const mime = prescriptionAsset.mimeType || (prescriptionAsset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const payload = await apiCall<any>('/prescription-requests', {
        method: 'POST', body: {
          customer_name: profile.name,
          customer_phone: profile.phone,
          zone_id: zoneId,
          prescription_base64: `data:${mime};base64,${base64}`,
          file_name: prescriptionAsset.name,
          note: prescriptionNote,
        }
      });
      setPrescriptionAsset(null);
      setPrescriptionNote('');
      setPrescriptions((current) => [payload.data ?? payload, ...current]);
      setNotice('Prescription uploaded. A pharmacist will review it and send a quote.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Prescription upload failed.');
    }
    finally {
      setBusy(false);
    }
  };

  const sendDoctorPrescriptionToPharmacy = async (consultation: any, pharmacy: any) => {
    if (!profile) {
      setNotice('Sign in to request prescription pickup.');
      go('Sign in');
      return;
    }
    try {
      const result = await apiCall<any>('/prescription-requests',
        {
          method: 'POST',
          body: {
            consultation_id: Number(consultation.id),
            pharmacy_id: Number(pharmacy.id)
          }
        });
      const request = result.data ?? result;
      setPrescriptions((current) => [request, ...current.filter((item) => Number(item.id) !== Number(request.id))]);
      setNotice('Prescription sent to the selected pharmacy. We will notify you when it is ready for pickup.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send this prescription to the pharmacy.');
    }
  };

  const confirmPrescriptionPickup = async (request: any) => {
    try {
      await apiCall(`/prescription-requests/${request.id}/collected`,
        {
          method: 'POST',
          body: {}
        }
      );
      setPrescriptions((current) => current.map((item) => Number(item.id) === Number(request.id) ? { ...item, status: 'collected' } : item));
      setNotice('Pickup confirmed. Thank you.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not confirm pickup.');
    }
  };

  const section = (label: string, action?: () => void) =>
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{label}</Text>
      {
        action && <Pressable onPress={action}>
          <Text style={s.seeAll}>See all  ›</Text>
        </Pressable>
      }
    </View>;
  const primaryButton = (label: string, action: () => void, secondary = false) =>
    <Pressable onPress={action} style={[s.button, secondary && s.buttonOutline]}>
      <Text style={[s.buttonText, secondary && s.buttonTextOutline]}>{label}</Text>
    </Pressable>;
  const empty = (glyph: string, heading: string, copy: string) =>
    <View style={s.empty}>
      <Text style={s.emptyGlyph}>{glyph}</Text>
      <Text style={s.emptyTitle}>{heading}</Text>
      <Text style={s.emptyCopy}>{copy}</Text>
    </View>;

  const serviceCard = (glyph: string, title: string, detail: string, target: Page, _accent: string) =>
    <Pressable key={title} accessibilityRole="button" accessibilityLabel={detail ? title + '. ' + detail : title} onPress={() => void openPage(target)} style={s.serviceCard}>
      <View style={s.serviceIcon}>
        <Text style={s.serviceGlyph}>{glyph}</Text>
      </View>
      <Text style={s.serviceTitle}>{title}</Text>
      {detail ? <Text style={s.serviceSub}>{detail}
      </Text> : null}
    </Pressable>;

  const productCards = (items = products) => {
    const visibleItems = items;
    return visibleItems.length ? <View style={s.productGrid}>{visibleItems.map((product) => {
      const currentPrice = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
      const hasDiscount = currentPrice < product.price;
      return <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`View ${product.name} details`} onPress={() => void openProduct(product)} style={s.productCard}>
        <View style={s.productImage}>
          {product.thumbnail_full_url ?
            <Image source={{ uri: product.thumbnail_full_url }} contentFit="contain" style={s.productPhoto} /> : <Text style={s.productFallback}>💊</Text>
          }
          <Pressable onPress={(event) => { event.stopPropagation(); void toggleWishlist(product); }} style={s.heart}><Text style={s.heartText}>{wishlist.some((item) => item.product_id === product.id) ? '♥' : '♡'}</Text></Pressable>
          {hasDiscount && <Text style={s.discountBadge}>{Math.round((1 - currentPrice / product.price) * 100)}% OFF</Text>}
        </View>
        <Text style={s.productCategory}>{product.category_name ?? 'Healthcare'}</Text><Text style={s.productName} numberOfLines={2}>{product.name}</Text><Text style={s.productDesc} numberOfLines={1}>{product.unit || product.description || 'Verified pharmacy product'}</Text>
        {product.medicine_type && product.medicine_type !== 'otc' && <Text style={s.rxNote}>Prescription may be required</Text>}
        <View style={s.productFooter}><View><Text style={s.productPrice}>{money(currentPrice)}</Text>{hasDiscount && <Text style={s.mrp}>MRP <Text style={s.strike}>{money(product.price)}</Text></Text>}</View><Pressable disabled={product.stock < 1} onPress={(event) => { event.stopPropagation(); void addToCart(product); }} style={[s.addButton, product.stock < 1 && s.disabled]}><Text style={s.addButtonText}>{product.stock < 1 ? 'Out' : '+'}</Text></Pressable></View>
      </Pressable>;
    })}</View> : empty('⌕', busy ? 'Loading products…' : 'No products found', 'Try another category or search term.');
  };

  const homeScreen = () => <>
    {configMessage ? <View style={s.configBanner}><Text style={s.configTitle}>Backend connection ready to configure</Text><Text style={s.configText}>{configMessage}</Text></View> : null}
    {notice ? <Pressable onPress={() => setNotice('')} style={s.notice}><Text style={s.noticeText}>{notice}</Text><Text style={s.dismiss}>×</Text></Pressable> : null}
    <View style={s.homeTopPanel}>
      <View style={s.deliveryPromise}><View style={s.deliveryDot} /><Pressable accessibilityRole="button" accessibilityLabel="Browse medicines, 24/7 delivery available" onPress={() => { setCategoryId(null); setSelectedSubcategoryId(null); go('Categories'); }} style={{ flex: 1, minHeight: 48, alignSelf: 'stretch', justifyContent: 'center' }}><Text style={s.deliveryPromiseText}>24/7 medicine delivery available</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={'Open cart, ' + summary.items_count + ' items'} onPress={() => { setHistory((items) => [...items, page]); setPage('Cart'); void loadCart(); }} style={s.homeHeaderAction}><Text style={s.deliveryPromiseIcon}>▢</Text></Pressable></View>
      <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search medicines, brands..." placeholderTextColor={C.muted} accessibilityLabel="Search medicines and brands" style={s.searchInput} returnKeyType="search" /><Text style={s.searchMic}>→</Text></View>
      <View style={s.serviceGrid}>{serviceCard('✚', 'Medicines', '', 'Categories', '#0a4542')}{serviceCard('🧪', 'Lab Tests', '', 'Lab Tests', '#362d5b')}{serviceCard('▣', 'Consult', '', 'Consult a Doctor', '#123c50')}{serviceCard('⇧', 'Prescription', '', 'Prescription Centre', '#1c4a38')}</View>
    </View>
    <View style={s.homeIntro}><View style={{ flex: 1 }}><Text style={s.homeIntroTitle}>Healthcare, all in one place</Text><Text style={s.homeIntroCopy}>Medicines, lab tests and doctor consultations, delivered with care.</Text></View><Text accessibilityElementsHidden style={s.homeIntroArt}>✚  🧪</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Upload a prescription for pharmacist review" onPress={() => go('Prescription Centre')} style={s.prescriptionHomeCard}><View style={{ flex: 1 }}><Text style={s.prescriptionHomeEyebrow}>UPLOAD PRESCRIPTION</Text><Text style={s.prescriptionHomeTitle}>Medicines after pharmacist review</Text><Text style={s.prescriptionHomeCopy}>Upload securely and review the itemised quote before payment.</Text></View><Text accessibilityElementsHidden style={s.prescriptionHomeIcon}>Rx</Text></Pressable>
    {banners.length > 0 ? <><View style={s.bannerScroller}><ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setBannerIndex(Math.round(event.nativeEvent.contentOffset.x / bannerWidth))}>{banners.map((banner) => <Pressable key={banner.id} onPress={() => go('Categories')} style={[s.promo, { width: bannerWidth }]}>
      {banner.image_full_url ? <Image source={{ uri: banner.image_full_url }} contentFit="cover" style={s.promoImage} /> : null}
      <View style={s.promoShade} /><Text style={s.promoBrand}>AIMEDIX  ·  HEALTH & WELLNESS</Text><Text style={s.promoTitle}>{banner.title || 'Good health, great savings.'}</Text><Text style={s.promoCopy}>{banner.subtitle || 'Everyday care, delivered to your door.'}</Text><Text style={s.promoCta}>{banner.action_text || 'SHOP NOW  →'}</Text>
    </Pressable>)}</ScrollView></View><View style={s.dots}>{banners.map((banner, i) => <View key={banner.id} style={[s.dot, i === bannerIndex && s.dotOn]} />)}</View></> : null}
    {zones.length > 1 && <><Pressable accessibilityRole="button" accessibilityLabel="Choose your service area on map" onPress={openAreaPicker} style={s.sectionHead}><Text style={s.sectionTitle}>Choose your service area</Text><Text style={s.seeAll}>Choose on map &gt;</Text></Pressable><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.zoneRow}>{zones.map((zone) => <Pressable key={zone.id} onPress={() => { setZoneId(zone.id); setRefreshKey((value) => value + 1); }} style={[s.zoneChip, zone.id === zoneId && s.zoneSelected]}><Text style={[s.zoneText, zone.id === zoneId && s.zoneTextSelected]}>{zone.name}</Text></Pressable>)}</ScrollView></>}
    {section('Shop by category', () => { setCategoryId(null); setSelectedSubcategoryId(null); go('Categories'); })}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>{categories.map((category) => <Pressable key={category.id} onPress={() => { setCategoryId(category.id); setSelectedSubcategoryId(null); if (category.subcategories && category.subcategories.length > 0) { go('Subcategories'); } else { setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((value) => value + 1); go('Category products'); } }} style={s.categoryTile}>{category.image_full_url ? <Image source={{ uri: category.image_full_url }} contentFit="cover" style={s.categoryImage} /> : <Text style={s.categoryEmoji}>{category.name.toLowerCase().includes('medicine') ? '💊' : category.name.toLowerCase().includes('baby') ? '🍼' : '✚'}</Text>}<Text style={s.categoryText} numberOfLines={2}>{category.name}</Text></Pressable>)}</ScrollView>
    {section('Featured medicines', () => go('Categories'))}{productCards()}
  </>;

  const categoryScreen = () => <>
    {section('Shop by category')}
    <Pressable onPress={() => { setCategoryId(0); setSelectedSubcategoryId(null); setProducts([]); setQuery(''); setCatalogLoading(Boolean(zoneId)); setRefreshKey((value) => value + 1); go('Category products'); }} style={[s.categoryCard, s.allProductsCard]}><Text style={s.categoryEmoji}>▦</Text><View style={{ flex: 1 }}><Text style={s.categoryText}>All products</Text><Text style={s.serviceSub}>Browse every available product across all categories</Text></View></Pressable>
    {categories.length ? <View style={s.categoryGrid}>{categories.map((category) => <Pressable key={category.id} onPress={() => { setCategoryId(category.id); setSelectedSubcategoryId(null); if (category.subcategories && category.subcategories.length > 0) { go('Subcategories'); } else { setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((value) => value + 1); go('Category products'); } }} style={s.categoryCard}>{category.image_full_url ? <Image source={{ uri: category.image_full_url }} contentFit="cover" style={s.categoryCardImage} /> : <Text style={s.categoryEmoji}>{category.name.toLowerCase().includes('medicine') ? '💊' : category.name.toLowerCase().includes('baby') ? '🍼' : '✚'}</Text>}<Text style={s.categoryText}>{category.name}</Text><Text style={s.serviceSub}>{category.subcategories && category.subcategories.length > 0 ? `${category.subcategories.length} subcategories ›` : 'Browse products ›'}</Text></Pressable>)}</View> : empty('▦', 'No categories available', 'Categories added by the pharmacy will appear here.')}
  </>;

  const subcategoriesScreen = () => {
    const currentCategory = categories.find((c) => c.id === categoryId);
    const subList = currentCategory?.subcategories ?? [];
    return <>
      {section(`${currentCategory?.name ?? 'Category'} subcategories`)}
      <Pressable onPress={() => { setSelectedSubcategoryId(null); setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((v) => v + 1); go('Category products'); }} style={[s.categoryCard, s.allProductsCard]}><Text style={s.categoryEmoji}>▦</Text><View style={{ flex: 1 }}><Text style={s.categoryText}>All {currentCategory?.name ?? 'products'}</Text><Text style={s.serviceSub}>Browse all products in this category ›</Text></View></Pressable>
      {subList.length ? <View style={s.categoryGrid}>{subList.map((subcategory) => <Pressable key={subcategory.id} onPress={() => { setSelectedSubcategoryId(subcategory.id); setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((v) => v + 1); go('Category products'); }} style={s.categoryCard}>{subcategory.image_full_url ? <Image source={{ uri: subcategory.image_full_url }} contentFit="cover" style={s.categoryCardImage} /> : <Text style={s.categoryEmoji}>💊</Text>}<Text style={s.categoryText}>{subcategory.name}</Text><Text style={s.serviceSub}>View products ›</Text></Pressable>)}</View> : empty('▦', 'No subcategories found', 'Browse all products in this category.')}
    </>;
  };

  const categoryProductsScreen = () => {
    const currentCategory = categories.find((c) => c.id === categoryId);
    const subList = currentCategory?.subcategories ?? [];
    const activeSub = subList.find((s) => s.id === selectedSubcategoryId);

    return <>
      <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search medicines, brands..." placeholderTextColor={C.muted} style={s.searchInput} /></View>
      {subList.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            <Pressable onPress={() => { setSelectedSubcategoryId(null); setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((v) => v + 1); }} style={[s.filterChip, selectedSubcategoryId === null && s.filterChipOn]}><Text style={[s.filterText, selectedSubcategoryId === null && s.filterTextOn]}>All {currentCategory?.name ?? 'Products'}</Text></Pressable>
            {subList.map((sub) => {
              const isSelected = selectedSubcategoryId === sub.id;
              return (
                <Pressable key={sub.id} onPress={() => { setSelectedSubcategoryId(sub.id); setProducts([]); setCatalogLoading(Boolean(zoneId)); setRefreshKey((v) => v + 1); }} style={[s.filterChip, isSelected && s.filterChipOn]}><Text style={[s.filterText, isSelected && s.filterTextOn]}>{sub.name}</Text></Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
      {section(activeSub ? `${currentCategory?.name ?? 'Category'} › ${activeSub.name}` : (categoryId === null || categoryId === 0 ? 'All products' : currentCategory?.name ?? 'Products'))}
      {!zoneId ? <View style={s.formCard}><Text style={s.formTitle}>Choose your delivery area</Text><Text style={s.formCopy}>Products are shown from approved pharmacies serving your area. Choose a service area to load this category.</Text>{primaryButton('Choose delivery area', openAreaPicker)}</View> : catalogLoading ? empty('⌕', 'Loading products…', 'Loading this category from the catalogue.') : products.length ? productCards() : empty('⌕', 'No products in this category', 'Admin-published products available in your selected area will appear here.')}
    </>;
  };

  const productDetailScreen = () => {
    if (!selectedProduct) return empty('Rx', 'Product unavailable', 'Go back and choose another product.');
    const currentPrice = selectedProduct.discount_price && selectedProduct.discount_price > 0 ? selectedProduct.discount_price : selectedProduct.price;

    return <View style={s.formCard}>
      {selectedProduct.thumbnail_full_url ? <Image source={{ uri: selectedProduct.thumbnail_full_url }} contentFit="contain" style={s.detailPhoto} /> : <View style={[s.detailPhoto, s.detailPhotoFallback]}><Text style={s.productFallback}>💊</Text></View>}

      <Text style={s.productCategory}>{selectedProduct.category_name ?? 'Healthcare'}</Text>
      <Text style={s.detailTitle}>{selectedProduct.name}</Text>
      {selectedProduct.unit ? <Text style={s.formCopy}>Pack: {selectedProduct.unit}</Text> : null}
      <Text style={s.detailPrice}>{money(currentPrice)}{currentPrice < selectedProduct.price ? `  ·  MRP ${money(selectedProduct.price)}` : ''}</Text>
      {selectedProduct.medicine_type && selectedProduct.medicine_type !== 'otc' ? <Text style={s.rxNote}>Prescription may be required</Text> : null}
      <Text style={s.fieldLabel}>Product information</Text>
      <Text style={s.detailDescription}>{selectedProduct.description || 'Product information will be provided by the pharmacy.'}</Text>
      {primaryButton(selectedProduct.stock < 1 ? 'Out of stock' : 'Add to cart', () => void addToCart(selectedProduct))}
    </View>;
  };

  const cartScreen = () => <>
    {!profile && <View style={s.formCard}><Text style={s.fieldLabel}>Contact details for your order</Text><TextInput value={customerName} onChangeText={setCustomerName} placeholder="Full name" placeholderTextColor={C.muted} style={s.input} /><TextInput value={customerPhone} onChangeText={setCustomerPhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={C.muted} style={s.input} /></View>}
    {summary.extra_discount_threshold > 0 && <View style={s.cartNudge}><Text style={s.nudgeGlyph}>✦</Text><Text style={s.nudgeText}>Add {money(summary.extra_discount_threshold)} more to unlock FLAT 20% OFF on your entire order!</Text></View>}
    {cart.length ? cart.map((item) => <View key={item.id} style={s.cartRow}>{item.thumbnail_full_url ? <Image source={{ uri: item.thumbnail_full_url }} contentFit="contain" style={s.cartImage} /> : <View style={[s.cartImage, s.cartFallback]}><Text style={{ color: C.teal, fontSize: 25 }}>💊</Text></View>}<View style={{ flex: 1 }}><Text style={s.cartName}>{item.name}</Text><Text style={s.cartSub}>{money(item.price)}{item.unit ? ` · ${item.unit}` : ''}</Text><View style={s.qtyRow}><Pressable onPress={() => void updateQuantity(item, item.quantity - 1)} style={s.qtyButton}><Text style={s.qtyText}>−</Text></Pressable><Text style={s.qtyValue}>{item.quantity}</Text><Pressable onPress={() => void updateQuantity(item, item.quantity + 1)} style={s.qtyButton}><Text style={s.qtyText}>+</Text></Pressable><Pressable onPress={() => void updateQuantity(item, 0)} style={s.remove}><Text style={s.removeText}>Remove</Text></Pressable></View></View><Text style={s.productPrice}>{money(item.price * item.quantity)}</Text></View>) : empty('▱', 'Your cart is empty', 'Add medicines to get started.')}
    {!!cart.length && <View style={s.summaryCard}><Text style={s.summaryTitle}>Bill summary</Text><SummaryLine styles={s} label="Item total" value={money(summary.subtotal)} /><SummaryLine styles={s} label="Medicine discount" value={`− ${money(summary.medicine_discount)}`} green /><SummaryLine styles={s} label="Coupon discount" value={`− ${money(summary.coupon_discount)}`} green /><SummaryLine styles={s} label="Taxes" value={money(summary.tax_total)} /><SummaryLine styles={s} label="Delivery" value={deliveryType === 'express' ? 'FREE Express' : 'FREE'} green /><SummaryLine styles={s} label="Platform & safety packaging" value={money(summary.platform_fee)} /><View style={s.summaryDivider} /><SummaryLine styles={s} label="To pay" value={money(summary.total)} strong />
      {!profile && <Pressable onPress={() => go('Sign in')} style={s.loginPrompt}><Text style={s.loginPromptText}>Sign in to complete checkout and save your orders  ›</Text></Pressable>}
      <Text style={[s.checkoutAddressTitle, { marginTop: 14 }]}>Delivery speed & timing</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <Pressable
          onPress={() => { setDeliveryType('express'); setDeliverySlot('30-60 mins Express'); }}
          style={[s.choice, { flex: 1, minWidth: '47%', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: deliveryType === 'express' ? C.slotOnBg : C.card, borderColor: deliveryType === 'express' ? C.teal : C.line }]}
        >
          <Text style={{ fontSize: 16 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { fontSize: 13, fontWeight: '700', color: deliveryType === 'express' ? C.mint : C.white }]}>30-60 mint Express</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>Fastest local delivery</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => { setDeliveryType('slot'); if (!['10:00 AM - 12:00 PM', '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM', '06:00 PM - 08:00 PM', '08:00 PM - 10:00 PM'].includes(deliverySlot)) setDeliverySlot('10:00 AM - 12:00 PM'); }}
          style={[s.choice, { flex: 1, minWidth: '47%', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: deliveryType === 'slot' ? C.slotOnBg : C.card, borderColor: deliveryType === 'slot' ? C.teal : C.line }]}
        >
          <Text style={{ fontSize: 16 }}>⏰</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { fontSize: 13, fontWeight: '700', color: deliveryType === 'slot' ? C.mint : C.white }]}>Every 2 hrs Slot</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>10 AM to 10 PM</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => { setDeliveryType('same_day'); setDeliverySlot('Same Day Delivery'); }}
          style={[s.choice, { flex: 1, minWidth: '47%', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: deliveryType === 'same_day' ? C.slotOnBg : C.card, borderColor: deliveryType === 'same_day' ? C.teal : C.line }]}
        >
          <Text style={{ fontSize: 16 }}>🚚</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { fontSize: 13, fontWeight: '700', color: deliveryType === 'same_day' ? C.mint : C.white }]}>Same Day</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>Delivered by today</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => { setDeliveryType('next_day'); setDeliverySlot('Next Day Delivery'); }}
          style={[s.choice, { flex: 1, minWidth: '47%', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: deliveryType === 'next_day' ? C.slotOnBg : C.card, borderColor: deliveryType === 'next_day' ? C.teal : C.line }]}
        >
          <Text style={{ fontSize: 16 }}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowTitle, { fontSize: 13, fontWeight: '700', color: deliveryType === 'next_day' ? C.mint : C.white }]}>Next Day</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>Delivered tomorrow</Text>
          </View>
        </Pressable>
      </View>
      {deliveryType === 'slot' && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Choose a 2-hour delivery slot (10 AM - 10 PM):</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {['10:00 AM - 12:00 PM', '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM', '06:00 PM - 08:00 PM', '08:00 PM - 10:00 PM'].map((slot) => (
              <Pressable
                key={slot}
                onPress={() => setDeliverySlot(slot)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 8,
                  borderWidth: 1,
                  backgroundColor: deliverySlot === slot ? C.slotOnBg : C.card,
                  borderColor: deliverySlot === slot ? C.teal : C.line,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: deliverySlot === slot ? '700' : '500', color: deliverySlot === slot ? C.mint : C.white }}>{slot}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      <Text style={s.checkoutAddressTitle}>Delivery address</Text><TextInput value={addressText} onChangeText={setAddressText} placeholder="House, street, area, city, PIN code" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton(busy ? 'Placing order…' : `Place order · ${money(summary.total)}`, () => void placeOrder())}</View>}
  </>;

  const accountScreen = () => <>
    {profile ? <View style={s.profileBanner}><View style={s.avatar}><Text style={s.avatarText}>{(profile.name || 'A').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={s.profileName}>{profile.name}</Text><Text style={s.profileSub}>{profile.phone}</Text></View><Pressable onPress={() => { void clearLoginToken(); setProfile(null); setNotice('You signed out.'); }}><Text style={s.signout}>Sign out</Text></Pressable></View> : <Pressable onPress={() => go('Sign in')} style={s.profileBanner}><View style={s.avatar}><Text style={s.avatarText}>S</Text></View><View style={{ flex: 1 }}><Text style={s.profileName}>Sign in to Amedix</Text><Text style={s.profileSub}>Manage your healthcare in one place</Text></View><Text style={s.arrow}>›</Text></Pressable>}
    <View style={s.appearanceCard}>
      <Text style={s.sectionTitle}>Appearance</Text>
      <Text style={s.serviceSub}>Choose a comfortable display mode for this device.</Text>
      <View style={s.appearanceOptions}>{(['Light', 'Dark'] as const).map((item) => (
        <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: appearance === item }} accessibilityLabel={item + ' mode'} onPress={() => { setAppearance(item); void saveAppearanceSetting(item); }} style={[s.appearanceOption, appearance === item && s.appearanceOptionSelected]}>
          <Text style={[s.appearanceOptionText, appearance === item && s.appearanceOptionTextSelected]}>{item === 'Light' ? '☀  ' : '☾  '}{item}</Text>
        </Pressable>
      ))}</View>
    </View>
    <View style={s.accountRows}>{([
      ['Personal details', '▣'], ['Medical Orders', '▱'], ['Delivery addresses', '⌖'], ['Saved products', '♡'], ['Refunds', '↶'], ['Wallet', '◉'], ['Notifications', '♧'], ['Prescription Centre', 'Rx'], ['Lab Tests', '⚗'], ['Consult a Doctor', '⚕'], ['Health log', '▤'], ['Help and support', '?'],
    ] as [Page, string][]).map(([target, icon]) => <Pressable key={target} onPress={() => void openPage(target)} style={s.accountRow}><Text style={s.rowIcon}>{icon}</Text><Text style={s.rowTitle}>{target}</Text><Text style={s.arrow}>›</Text></Pressable>)}</View>
  </>;

  const ordersScreen = () => orders.length ? orders.map((order) => <View key={`${order.type || 'order'}-${order.id}`} style={s.orderCard}><View style={{ flex: 1 }}><Text style={s.orderTitle}>{order.order_number || `Order #${order.id}`}</Text><Text style={s.rowSub}>{order.type ? `${order.type} · ` : ''}{String(order.order_status || order.status || 'Pending').replaceAll('_', ' ')} · {order.created_at ?? order.scheduled_at ?? ''}</Text>{Boolean(order.delivery_slot || order.delivery_type) && <View style={{ alignSelf: 'flex-start', marginVertical: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.slotOnBg }}><Text style={{ color: C.mint, fontSize: 12, fontWeight: '700' }}>{order.delivery_slot || (order.delivery_type === 'express' ? '⚡ 30-60 mins Express' : order.delivery_type === 'same_day' ? '🚚 Same Day' : order.delivery_type === 'next_day' ? '📦 Next Day' : 'Delivery Slot')}</Text></View>}{order.type === 'Consultation' ? <><Text style={s.rowSub}>{order.consultation_mode === 'clinic' ? 'Offline · Clinic visit' : 'Online consultation'}{order.reason ? ` · ${order.reason}` : ''}</Text>{order.meeting_url ? <Pressable onPress={() => void Linking.openURL(order.meeting_url)}><Text style={s.seeAll}>Join online consultation ↗</Text></Pressable> : null}<Pressable onPress={() => void openDoctorChat(order)}><Text style={s.seeAll}>Chat with doctor ›</Text></Pressable>{String(order.status) === 'completed' ? <View style={s.reportActions}><Pressable onPress={() => void shareConsultationFile(order, 'pdf')} style={s.reportButton}><Text style={s.reportButtonText}>Download PDF</Text></Pressable><Pressable onPress={() => void shareConsultationFile(order, 'csv')} style={s.reportButton}><Text style={s.reportButtonText}>Excel / CSV</Text></Pressable></View> : null}</> : <><Text style={s.productPrice}>{money(order.order_amount ?? order.amount)}</Text>{String(order.report_url ?? '') !== '' ? <Pressable onPress={() => void downloadLabReport(order)}><Text style={s.seeAll}>Download lab report ↓</Text></Pressable> : null}</>}</View></View>) : empty('▱', 'No bookings yet', 'Your medicine orders, lab tests, and appointments will appear here.');

  const servicesScreen = (isLab: boolean) => {
    const items = isLab ? labs : doctors;
    return <>{items.length ? items.map((item) => <View key={item.id} style={s.serviceListing}>{!isLab && item.image_full_url ? <Image source={{ uri: item.image_full_url }} contentFit="cover" style={s.categoryCardImage} /> : null}<Text style={s.serviceListingTag}>{isLab ? (cleanProviderName(item.provider_name) || 'Diagnostic lab') : (item.speciality || 'Doctor')}</Text><Text style={s.serviceListingName}>{isLab ? item.name : `Dr. ${item.name}`}</Text><Text style={s.serviceSub}>{isLab ? (item.description && !/demo|sample|fictional/i.test(item.description) ? item.description : item.preparation || 'Convenient diagnostic testing with home collection.') : `${item.qualification || 'Qualified clinician'}`}</Text>{!isLab && [item.address, item.address_line, item.landmark, item.city, item.state, item.pincode].filter(Boolean).length > 0 ? <Text style={s.serviceSub}>{[item.address, item.address_line, item.landmark, item.city, item.state, item.pincode].filter(Boolean).join(', ')}</Text> : null}{!isLab && item.availability_text ? <Text style={s.serviceSub}>Availability · {item.availability_text}</Text> : null}{!isLab && item.opening_hours ? <Text style={s.serviceSub}>Clinic hours · {item.opening_hours}</Text> : null}{!isLab && item.description && !/demo|sample|fictional/i.test(item.description) ? <Text style={s.serviceSub}>{item.description}</Text> : null}{!isLab && item.latitude && item.longitude ? <Pressable onPress={() => void Linking.openURL(`https://maps.google.com/?q=${item.latitude},${item.longitude}`)}><Text style={s.seeAll}>View clinic location ↗</Text></Pressable> : null}{isLab && !!item.provider_opening_hours ? <Text style={s.serviceSub}>Lab hours · {item.provider_opening_hours}</Text> : null}{isLab && Number(item.report_hours) > 0 ? <Text style={s.serviceSub}>Report in {item.report_hours} hrs</Text> : null}<View style={s.productFooter}><Text style={s.productPrice}>{money(isLab ? item.price : item.consultation_fee)}</Text>{primaryButton('Book', () => { setAppointment({ kind: isLab ? 'lab' : 'doctor', id: Number(item.id) }); go('Booking'); })}</View></View>) : empty(isLab ? '⚗' : '⚕', isLab ? 'No tests available' : 'No doctors available', 'New services will appear here soon.')}</>;
  };

  const loginScreen = () => <View style={s.formCard}><Text style={s.formTitle}>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</Text><Text style={s.formCopy}>Use your phone number to continue securely.</Text>{authMode === 'register' && <TextInput value={authName} onChangeText={setAuthName} placeholder="Full name" placeholderTextColor={C.muted} style={s.input} />}
    <TextInput value={authPhone} onChangeText={setAuthPhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={C.muted} style={s.input} />{authMode === 'register' && <TextInput value={authEmail} onChangeText={setAuthEmail} placeholder="Email (optional)" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.muted} style={s.input} />}
    <TextInput value={authPassword} onChangeText={setAuthPassword} placeholder="Password (at least 6 characters)" secureTextEntry placeholderTextColor={C.muted} style={s.input} />{primaryButton(busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account', () => void submitAuth())}
    <Pressable onPress={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setNotice(''); }} style={s.modeSwap}><Text style={s.modeSwapText}>{authMode === 'login' ? 'New to Amedix? Create an account' : 'Already have an account? Sign in'}</Text></Pressable>
  </View>;

  const bookingSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const availableBookingSlots = bookingSlots.filter((slot) => {
    if (!bookingDate || localDateKey(bookingDate) !== localDateKey(new Date())) return true;
    const [hour, minute] = slot.split(':').map(Number);
    const now = new Date();
    return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
  });
  const bookingScreen = () => <View style={s.formCard}>
    <Text style={s.formTitle}>{appointment?.kind === 'lab' ? 'Book a lab test' : 'Request a consultation'}</Text>
    <Text style={s.formCopy}>Choose online or visit the clinic. The provider will confirm your appointment.</Text>
    {!profile ? <><TextInput value={customerName} onChangeText={setCustomerName} placeholder="Your full name" placeholderTextColor={C.muted} style={s.input} /><TextInput value={customerPhone} onChangeText={setCustomerPhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={C.muted} style={s.input} /></> : null}
    {appointment?.kind === 'doctor' ? <><Text style={s.fieldLabel}>Consultation type</Text><View style={s.reportActions}><Pressable onPress={() => setConsultationMode('online')} style={[s.reportButton, consultationMode === 'online' && s.reportButtonOn]}><Text style={s.reportButtonText}>Online</Text></Pressable><Pressable onPress={() => setConsultationMode('clinic')} style={[s.reportButton, consultationMode === 'clinic' && s.reportButtonOn]}><Text style={s.reportButtonText}>Offline · Clinic</Text></Pressable></View><TextInput value={consultationReason} onChangeText={setConsultationReason} placeholder="What would you like to discuss? (optional)" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} /></> : null}
    <Text style={s.fieldLabel}>Preferred date and time</Text>
    <Pressable accessibilityRole="button" onPress={() => { const today = new Date(); const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); if (!bookingDate) setBookingDate(todayDate); const slots = bookingSlots.filter((slot) => { const [hour, minute] = slot.split(':').map(Number); return hour * 60 + minute > today.getHours() * 60 + today.getMinutes(); }); if (!bookingSlot) setBookingSlot(slots[0] ?? ''); setDatePickerOpen(true); }} style={s.datePickerButton}><Text style={bookingTime ? s.datePickerValue : s.datePickerPlaceholder}>{bookingTime || 'Choose a date and time'}</Text><Text style={s.seeAll}>Calendar ›</Text></Pressable>
    {primaryButton('Send booking request', () => void submitBooking())}{primaryButton('Cancel', () => { setAppointment(null); back(); }, true)}
  </View>;

  const pageBody = () => {
    if (page === 'Home') return homeScreen();
    if (page === 'Categories') return categoryScreen();
    if (page === 'Subcategories') return subcategoriesScreen();
    if (page === 'Category products') return categoryProductsScreen();
    if (page === 'Product details') return productDetailScreen();
    if (page === 'Cart') return cartScreen();
    if (page === 'My Account') return accountScreen();
    if (page === 'Medical Orders') return ordersScreen();
    if (page === 'Sign in') return loginScreen();
    if (page === 'Booking') return bookingScreen();
    if (page === 'Lab Tests') return servicesScreen(true);
    if (page === 'Consult a Doctor') return servicesScreen(false);
    if (page === 'Delivery addresses') return <>{addresses.map((item) => <View key={item.id} style={s.accountRow}><Text style={s.rowIcon}>⌖</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>{item.label || 'Address'}</Text><Text style={s.rowSub}>{item.address}, {item.city} {item.pincode}</Text></View>{!!item.is_default && <Text style={s.seeAll}>Default</Text>}</View>)}<View style={s.formCard}><Text style={s.fieldLabel}>Add a delivery address</Text><TextInput value={addressText} onChangeText={setAddressText} placeholder="House, street, area, city, PIN code" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton('Save address', () => void saveAddress())}</View></>;
    if (page === 'Personal details') return <View style={s.formCard}><TextInput value={customerName} onChangeText={setCustomerName} placeholder="Full name" placeholderTextColor={C.muted} style={s.input} /><TextInput value={authEmail || profile?.email || ''} onChangeText={setAuthEmail} placeholder="Email address" placeholderTextColor={C.muted} keyboardType="email-address" style={s.input} /><Text style={s.rowSub}>Phone number · {profile?.phone ?? customerPhone}</Text>{primaryButton('Save changes', () => void saveProfile())}</View>;
    if (page === 'Notifications') return notifications.length ? notifications.map((item, index) => <View key={item.id ?? index} style={s.accountRow}><Text style={s.rowIcon}>♧</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>{item.title}</Text><Text style={s.rowSub}>{item.message ?? item.body}</Text></View></View>) : empty('♧', 'No notifications yet', 'Order updates and account notifications will appear here.');
    if (page === 'Saved products') return wishlist.length ? wishlist.map((item) => <View key={item.id} style={s.accountRow}><Text style={s.rowIcon}>♡</Text><Text style={[s.rowTitle, { flex: 1 }]}>{item.name ?? item.product_name}</Text><Text style={s.productPrice}>{money(item.discount_price ?? item.price)}</Text></View>) : empty('♡', 'No saved products yet', 'Save favourite medicines from the product list.');
    if (page === 'Refunds') return orders.length ? orders.map((item) => <View key={item.id} style={s.accountRow}><Text style={s.rowIcon}>↶</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>Order #{item.order_id}</Text><Text style={s.rowSub}>{item.status}</Text></View></View>) : empty('↶', 'No refunds yet', 'Refund requests and their status will appear here.');
    if (page === 'Wallet') return <><View style={s.walletCard}><Text style={s.rowSub}>Available balance</Text><Text style={s.walletAmount}>{money(config?.wallet?.balance)}</Text></View>{config?.wallet?.ledger?.length ? config.wallet.ledger.map((entry: any, index: number) => <View key={String(entry.id ?? index)} style={s.accountRow}><Text style={s.rowIcon}>◉</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>{entry.description || entry.type || 'Wallet transaction'}</Text><Text style={s.rowSub}>{entry.created_at || entry.date || ''}</Text></View><Text style={s.productPrice}>{money(entry.amount)}</Text></View>) : empty('◉', 'No wallet activity yet', 'Wallet transactions will appear here.')}{config?.wallet?.withdrawals?.map((item: any, index: number) => <View key={'withdrawal-' + String(item.id ?? index)} style={s.accountRow}><Text style={s.rowIcon}>↗</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>Withdrawal · {String(item.status || 'pending').replaceAll('_', ' ')}</Text><Text style={s.rowSub}>{item.created_at || ''}</Text></View><Text style={s.productPrice}>{money(item.amount)}</Text></View>)}</>;
    if (page === 'Prescription Centre') return <>
      <View style={s.featureBanner}><Text style={s.featureEyebrow}>DOCTOR PRESCRIPTIONS</Text><Text style={s.featureTitle}>Get prescribed medicines ready for pickup</Text><Text style={s.featureCopy}>Choose an approved pharmacy in your service area. The pharmacist will check stock and notify you when everything is ready.</Text></View>
      {doctorConsultations.filter((visit) => Array.isArray(visit.prescription_items) && visit.prescription_items.length > 0).map((visit) => {
        const request = prescriptions.find((item) => Number(item.consultation_id) === Number(visit.id) && item.prescription_source === 'doctor');
        const locationOrigin = selectedLocation ?? (visit.doctor_latitude != null && visit.doctor_longitude != null
          ? { latitude: Number(visit.doctor_latitude), longitude: Number(visit.doctor_longitude) }
          : null);
        const distanceLabel = selectedLocation ? 'from your location' : 'from clinic';
        const nearbyPharmacies = [...pickupPharmacies].map((pharmacy) => ({
          ...pharmacy, distance_km: locationOrigin
            ? distanceKm(Number(locationOrigin.latitude), Number(locationOrigin.longitude), Number(pharmacy.latitude), Number(pharmacy.longitude))
            : null
        })).sort((a, b) => (a.distance_km ?? Number.MAX_VALUE) - (b.distance_km ?? Number.MAX_VALUE));
        return <View key={`doctor-prescription-${visit.id}`} style={s.formCard}>
          <Text style={s.sectionTitle}>Dr. {visit.doctor_name || 'Your doctor'} · Consultation #{visit.id}</Text>
          {visit.prescription_items.map((medicine: any, index: number) => <Text key={`${visit.id}-medicine-${index}`} style={s.rowSub}>{medicine.name}{medicine.strength ? ` · ${medicine.strength}` : ''}{medicine.dosage ? ` · ${medicine.dosage}` : ''}{medicine.frequency ? ` · ${medicine.frequency}` : ''}{medicine.duration ? ` · ${medicine.duration}` : ''}{medicine.instructions ? ` · ${medicine.instructions}` : ''}</Text>)}
          {visit.prescription_note ? <Text style={s.rowSub}>{visit.prescription_note}</Text> : null}
          {request ? <><Text style={s.productPrice}>{String(request.status || 'assigned').replaceAll('_', ' ')}</Text><Text style={s.rowSub}>{request.pharmacy_name || 'Selected pharmacy'} · {request.pharmacy_address_line || request.pharmacy_address || ''} {request.pharmacy_city || ''}</Text>{request.pickup_code ? <Text style={s.rowTitle}>Pickup code · {request.pickup_code}</Text> : null}{request.status === 'ready_for_pickup' ? primaryButton('I collected these medicines', () => void confirmPrescriptionPickup(request)) : null}</> : <>{section('Choose a pharmacy for pickup')}{nearbyPharmacies.length ? nearbyPharmacies.map((pharmacy) => <Pressable key={pharmacy.id} onPress={() => void sendDoctorPrescriptionToPharmacy(visit, pharmacy)} style={s.accountRow}><View style={{ flex: 1 }}><Text style={s.rowTitle}>{pharmacy.business_name || pharmacy.name}{pharmacy.distance_km !== null ? ` · ${pharmacy.distance_km.toFixed(1)} km ${distanceLabel}` : ''}</Text><Text style={s.rowSub}>{pharmacy.address_line || pharmacy.address || ''} {pharmacy.city || ''} {pharmacy.pincode || ''}</Text><Text style={s.rowSub}>{pharmacy.opening_hours || ''}</Text></View><Text style={s.seeAll}>Send Rx ›</Text></Pressable>) : empty('⌖', 'No approved pharmacies in this area', 'Choose another service area or contact support.')}</>}
        </View>;
      })}
      {prescriptions.filter((item) => item.quote).map((item) => <View key={`quote-request-${item.id}`} style={s.formCard}><Text style={s.sectionTitle}>Pharmacy quote - Request #{item.id}</Text><Text style={s.rowSub}>{item.pharmacy_name || 'Assigned pharmacy'} - {String(item.status).replaceAll('_', ' ')}</Text>{item.quote.items?.map((line: any, index: number) => <Text key={`quote-line-${item.id}-${index}`} style={s.rowSub}>{line.medicine_name} x {line.quantity} - {money(Number(line.line_total))}</Text>)}<Text style={s.productPrice}>Total: {money(Number(item.quote.total))}</Text>{item.status === 'quoted' && item.quote.status === 'offered' ? primaryButton(busy ? 'Working...' : 'Accept quote', () => void acceptPrescriptionQuote(item)) : null}{item.status === 'payment_pending' && item.quote.status === 'accepted' ? <>{addresses.length ? <Text style={s.rowSub}>Delivery address - {(addresses.find((address) => Number(address.is_default) === 1) ?? addresses[0]).address}</Text> : <TextInput value={addressText} onChangeText={setAddressText} placeholder="Delivery address, city, PIN code" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />}{prescriptionPaymentMethods.map((method: any) => <Pressable key={method.id} onPress={() => setPrescriptionPaymentMethod(method.id)} style={s.choice}><Text style={s.rowIcon}>{prescriptionPaymentMethod === method.id ? 'X' : 'O'}</Text><Text style={s.rowTitle}>{method.name ?? method.label ?? method.id}</Text></Pressable>)}{prescriptionPaymentMethod !== 'cash_on_delivery' ? <TextInput value={prescriptionPaymentReference} onChangeText={setPrescriptionPaymentReference} placeholder="Payment / transaction reference" placeholderTextColor={C.muted} style={s.input} /> : null}{primaryButton(busy ? 'Placing order...' : 'Place medicine order', () => void checkoutPrescriptionQuote(item))}</> : null}{item.order ? <Text style={s.rowTitle}>Order {item.order.order_number} - {String(item.order.order_status || 'pending').replaceAll('_', ' ')}</Text> : null}</View>)}
      <View style={s.formCard}><Text style={s.fieldLabel}>Upload a prescription image or PDF (up to 5 MB)</Text><Pressable onPress={() => void pickPrescription()} style={s.filePicker}><Text style={s.rowIcon}>▧</Text><Text style={s.filePickerText}>{prescriptionAsset?.name ?? 'Choose from camera or files'}</Text><Text style={s.seeAll}>Browse</Text></Pressable><Text style={s.fieldLabel}>Note for the pharmacist (optional)</Text><TextInput value={prescriptionNote} onChangeText={setPrescriptionNote} placeholder="Add a note for the pharmacist" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton(busy ? 'Uploading…' : 'Upload prescription for a quote', () => void submitPrescription())}</View>
      {prescriptions.filter((item) => item.prescription_source !== 'doctor').length ? <>{section('My uploaded prescription requests')}{prescriptions.filter((item) => item.prescription_source !== 'doctor').map((item, index) => <View key={item.id ?? index} style={s.orderCard}><View style={{ flex: 1 }}><Text style={s.orderTitle}>Request #{item.id ?? index + 1}</Text><Text style={s.rowSub}>{String(item.status ?? 'pending').replaceAll('_', ' ')} · {item.created_at ?? ''}</Text>{item.total ? <Text style={s.productPrice}>{money(item.total)}</Text> : null}</View><Text style={s.arrow}>›</Text></View>)}</> : null}
    </>;
    if (page === 'Health log') return healthRecords.length ? healthRecords.map((record, index) => <View key={String(record.record_type) + '-' + String(record.id ?? index)} style={s.accountRow}><Text style={s.rowIcon}>{record.record_type === 'Lab test' ? '⚗' : '⚕'}</Text><View style={{ flex: 1 }}><Text style={s.rowTitle}>{record.record_name}</Text><Text style={s.rowSub}>{record.record_type} · {String(record.status || 'requested').replaceAll('_', ' ')} · {record.scheduled_at || record.created_at || ''}</Text>{record.report_url ? <Pressable onPress={() => void downloadLabReport(record)}><Text style={s.seeAll}>Open lab report</Text></Pressable> : null}{Array.isArray(record.prescription_items) ? record.prescription_items.map((item: any, itemIndex: number) => <Text key={String(record.id) + '-rx-' + itemIndex} style={s.rowSub}>{item.name}{item.strength ? ' · ' + item.strength : ''}{item.dosage ? ' · ' + item.dosage : ''}</Text>) : null}</View></View>) : empty('▤', 'No health records yet', 'Your lab bookings and doctor consultations will appear here after your providers add them.');

    if (page === 'Help and support') return <View style={s.formCard}><Text style={s.formTitle}>How can we help?</Text><TextInput value={supportSubject} onChangeText={setSupportSubject} placeholder="Subject" placeholderTextColor={C.muted} style={s.input} /><TextInput value={supportMessage} onChangeText={setSupportMessage} placeholder="Describe your issue" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton('Send support request', async () => { try { await apiCall('/support', { method: 'POST', body: { subject: supportSubject, message: supportMessage } }); setSupportSubject(''); setSupportMessage(''); setNotice('Your request was sent to support.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Support request failed.'); } })}</View>;
    return empty('✚', 'Coming soon', 'This section will be available shortly.');
  };

  const title = page === 'Category products'
    ? (selectedSubcategoryId
      ? (categories.find((c) => c.id === categoryId)?.subcategories?.find((s) => s.id === selectedSubcategoryId)?.name
        ?? categories.find((c) => c.id === categoryId)?.name
        ?? 'Products')
      : (categories.find((category) => category.id === categoryId)?.name ?? 'All products'))
    : page === 'Subcategories'
      ? `${categories.find((c) => c.id === categoryId)?.name ?? 'Category'} Subcategories`
      : page === 'My Account'
        ? 'My Account'
        : page === 'Medical Orders'
          ? 'My Orders'
          : page === 'Booking'
            ? 'Booking'
            : page === 'Product details'
              ? 'Product details'
              : page;
  // Keep the primary navigation limited to the four customer areas. Cart remains
  // available from the bag button so shopping and checkout are still reachable.
  const navItems: [string, Page, string][] = [['⌂', 'Home', 'Home'], ['▦', 'Categories', 'Categories'], ['▱', 'Medical Orders', 'Orders'], ['◉', 'My Account', 'My Account']];

  return <SafeAreaView onLayout={() => { if (Platform.OS !== 'web') void SplashScreen.hideAsync(); }} style={s.safe} edges={['top', 'left', 'right']}><StatusBar barStyle={isLightTheme ? 'dark-content' : 'light-content'} backgroundColor={page === 'Home' ? C.homeTop : C.bg} />
    {page === 'Home' ? <View style={s.homeHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="Choose delivery location" onPress={openAreaPicker} style={s.homeHeaderLocation}>
        <Text style={s.homeHeaderPin}>●</Text>
        <View style={{ flex: 1 }}><Text style={s.locationLabel}>Deliver to</Text><Text numberOfLines={1} style={s.locationValue}>{selectedLocation?.address ?? zones.find((zone) => zone.id === zoneId)?.name ?? 'Choose your service area'}</Text></View>
        <Text style={s.homeHeaderChevron}>⌄</Text>
      </Pressable>
      <View style={s.homeHeaderActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => void openPage('Notifications')} style={s.homeHeaderAction}><Text style={s.homeHeaderIcon}>♧</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Orders" onPress={() => void openPage('Medical Orders')} style={s.homeHeaderAction}><Text style={s.homeHeaderIcon}>▤</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="My Account" onPress={() => { setPage('My Account'); setHistory([]); }} style={s.homeHeaderAction}><Text style={s.homeHeaderIcon}>◎</Text></Pressable>
      </View>
    </View> : <View style={s.header}><Pressable onPress={back} style={s.back}><Text style={s.backText}>‹</Text></Pressable><Text style={s.headerTitle}>{title}</Text><Pressable accessibilityLabel="Open cart" onPress={() => { setHistory((items) => [...items, page]); setPage('Cart'); void loadCart(); }} style={s.headerAction}><Text style={s.headerGlyph}>▣</Text>{summary.items_count > 0 && <View style={s.cartBadge}><Text style={s.cartBadgeText}>{summary.items_count}</Text></View>}</Pressable></View>}
    {notice && page !== 'Home' ? <Pressable onPress={() => setNotice('')} style={s.notice}><Text style={s.noticeText}>{notice}</Text><Text style={s.dismiss}>×</Text></Pressable> : null}
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, page === 'Home' && s.homeContent]}>{pageBody()}</ScrollView>
    <View style={[s.tabs, { height: 59 + safeAreaInsets.bottom, paddingBottom: safeAreaInsets.bottom }]}>{navItems.map(([glyph, label, caption]) => <Pressable key={label} onPress={() => { setMenuOpen(false); setNotice(''); setHistory([]); if (label === 'Medical Orders') void openPage(label); else setPage(label); if (label === 'My Account' && !profile) setAuthMode('login'); }} style={s.tab}><Text style={[s.tabIcon, page === label && s.tabOn]}>{glyph}</Text><Text style={[s.tabLabel, page === label && s.tabOn]}>{caption}</Text></Pressable>)}</View>
    {menuOpen && <View style={s.menuOverlay}><Pressable onPress={() => setMenuOpen(false)} style={s.menuScrim} /><View style={s.menuPanel}><View style={s.menuTop}><Text style={s.menuBrand}>AIMEDIX</Text><Pressable onPress={() => setMenuOpen(false)}><Text style={s.closeMenu}>×</Text></Pressable></View>
      <Text style={s.menuSection}>YOUR AMEDIX</Text>{(['Home', 'Categories', 'Medical Orders', 'My Account'] as Page[]).map((item) => <Pressable key={item} onPress={() => { setMenuOpen(false); if (item === 'Medical Orders') void openPage(item); else { setPage(item); setHistory([]); } }} style={s.menuItem}><Text style={s.rowIcon}>{item === 'Categories' ? '▦' : item === 'Medical Orders' ? '▱' : '›'}</Text><Text style={s.menuItemText}>{item === 'Medical Orders' ? 'Orders' : item}</Text><Text style={s.arrow}>›</Text></Pressable>)}
      {profile ? <Pressable onPress={() => { void clearLoginToken(); setProfile(null); setMenuOpen(false); setNotice('Signed out.'); }} style={s.menuSignout}><Text style={s.menuSignoutText}>Sign out</Text></Pressable> : <Pressable onPress={() => { go('Sign in'); setMenuOpen(false); }} style={s.menuSignout}><Text style={s.menuSignoutText}>Sign in / Create account</Text></Pressable>}
      <Text style={s.menuFooter}>{config?.app_name ?? 'Amedix Meds'}{backendUrl() ? '\nConnected API: ' + new URL(backendUrl()).host : ''}</Text></View></View>}
    <Modal visible={areaPickerOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setAreaPickerOpen(false)}>
      <View style={s.areaPickerModalRoot}>
        <Pressable accessibilityLabel="Close area picker" onPress={() => setAreaPickerOpen(false)} style={s.areaPickerScrim} />
        <View style={s.areaPickerSheet}>
          <View style={s.areaPickerHeader}>
            <View><Text style={s.areaPickerTitle}>Choose your location</Text><Text style={s.areaPickerCopy}>Type an address or tap the Google map to place a pin.</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setAreaPickerOpen(false)}><Text style={s.closeMenu}>X</Text></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.areaPickerContent}>
            <TextInput value={locationQuery} onChangeText={(value) => { setLocationQuery(value); setLocationChoices([]); }} onSubmitEditing={() => void searchLocations()} placeholder="Address, area, landmark, or PIN code" placeholderTextColor={C.muted} style={s.input} returnKeyType="search" />
            {primaryButton(locationBusy ? 'Searching...' : 'Search address', () => void searchLocations())}
            {locationChoices.map((choice, index) => <Pressable key={index} onPress={() => { setSelectedLocation(choice); setLocationQuery(choice.address); setLocationNotice('Address selected. Confirm it below.'); }} style={s.areaPickerItem}><Text style={s.locationPin}>Location</Text><Text style={[s.menuItemText, { flex: 1 }]}>{choice.address}</Text><Text style={s.arrow}>{selectedLocation?.latitude === choice.latitude && selectedLocation?.longitude === choice.longitude ? 'Selected' : '>'}</Text></Pressable>)}
            <LocationMap center={selectedLocation ?? (() => { const z = zones.find((item) => item.id === zoneId); return z?.latitude && z.longitude ? { latitude: Number(z.latitude), longitude: Number(z.longitude) } : { latitude: 28.6139, longitude: 77.2090 }; })()} selected={selectedLocation} onSelect={selectMapPin} />
            {locationNotice ? <Text style={s.locationNotice}>{locationNotice}</Text> : null}
            {zones.length === 0 ? <Text style={s.locationCoverageNote}>No delivery areas are configured yet. You can choose a location, but the website admin must enable its area before orders can be placed.</Text> : null}
            {primaryButton(locationBusy ? 'Checking coverage...' : 'Use this location', () => void applySelectedLocation())}
          </ScrollView>
        </View>
      </View>
    </Modal>
    <Modal visible={datePickerOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setDatePickerOpen(false)}>
      <View style={s.areaPickerModalRoot}>
        <Pressable accessibilityLabel="Close date picker" onPress={() => setDatePickerOpen(false)} style={s.areaPickerScrim} />
        <View style={s.areaPickerSheet}>
          <View style={s.areaPickerHeader}><View><Text style={s.areaPickerTitle}>Choose appointment date</Text><Text style={s.areaPickerCopy}>Pick a date and available time.</Text></View><Pressable onPress={() => setDatePickerOpen(false)}><Text style={s.closeMenu}>×</Text></Pressable></View>
          <View style={s.calendarMonthRow}>
            <Pressable accessibilityLabel="Previous month" onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} disabled={calendarMonth.getFullYear() === new Date().getFullYear() && calendarMonth.getMonth() <= new Date().getMonth()} style={s.calendarNav}><Text style={s.calendarNavText}>‹</Text></Pressable>
            <Text style={s.calendarMonthTitle}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            <Pressable accessibilityLabel="Next month" onPress={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={s.calendarNav}><Text style={s.calendarNavText}>›</Text></Pressable>
          </View>
          <View style={s.calendarGrid}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Text key={day} style={s.calendarWeekday}>{day}</Text>)}</View>
          <View style={s.calendarGrid}>{calendarDays(calendarMonth).map((date, index) => {
            if (!date) return <View key={`blank-${index}`} style={s.calendarDay} />;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const disabled = date < today;
            const selected = bookingDate ? localDateKey(date) === localDateKey(bookingDate) : false;
            return <Pressable key={localDateKey(date)} disabled={disabled} onPress={() => { setBookingDate(date); setBookingTime(''); const now = new Date(); const slots = bookingSlots.filter((slot) => { if (localDateKey(date) !== localDateKey(now)) return true; const [hour, minute] = slot.split(':').map(Number); return hour * 60 + minute > now.getHours() * 60 + now.getMinutes(); }); setBookingSlot(slots[0] ?? ''); }} style={[s.calendarDay, selected && s.calendarDaySelected, disabled && s.calendarDayDisabled]}><Text style={[s.calendarDayText, selected && s.calendarDayTextSelected, disabled && s.calendarDayTextDisabled]}>{date.getDate()}</Text></Pressable>;
          })}</View>
          <Text style={s.fieldLabel}>Available time</Text>
          <View style={s.calendarSlots}>{availableBookingSlots.map((slot) => <Pressable key={slot} onPress={() => setBookingSlot(slot)} style={[s.calendarSlot, bookingSlot === slot && s.calendarSlotSelected]}><Text style={[s.calendarSlotText, bookingSlot === slot && s.calendarSlotTextSelected]}>{slot}</Text></Pressable>)}</View>
          {!availableBookingSlots.length ? <Text style={s.serviceSub}>No available times remain today. Choose another date.</Text> : null}
          <Pressable disabled={!bookingDate || !bookingSlot || !availableBookingSlots.includes(bookingSlot)} onPress={() => { if (!bookingDate || !bookingSlot) return; setBookingTime(`${localDateKey(bookingDate)} ${bookingSlot}`); setDatePickerOpen(false); }} style={[s.button, s.calendarConfirm, (!bookingDate || !bookingSlot || !availableBookingSlots.includes(bookingSlot)) && s.calendarConfirmDisabled]}><Text style={s.buttonText}>Use selected date and time</Text></Pressable>
        </View>
      </View>
    </Modal>
    <Modal visible={chatOpen} transparent animationType="slide" onRequestClose={() => setChatOpen(false)}>
      <View style={s.areaPickerModalRoot}><Pressable onPress={() => setChatOpen(false)} style={s.areaPickerScrim} /><View style={s.areaPickerSheet}>
        <View style={s.areaPickerHeader}><Text style={s.areaPickerTitle}>Doctor chat</Text><Pressable onPress={() => setChatOpen(false)}><Text style={s.closeMenu}>×</Text></Pressable></View>
        <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>{chatMessages.map((message) => <View key={message.id} style={[s.chatBubble, message.sender_type === 'customer' && s.chatBubbleMine]}><Text style={s.chatMessage}>{message.body}</Text><Text style={s.chatTime}>{message.created_at}</Text></View>)}{!chatMessages.length ? <Text style={s.serviceSub}>Send a message to your doctor.</Text> : null}</ScrollView>
        <TextInput value={chatDraft} onChangeText={setChatDraft} placeholder="Write a message" placeholderTextColor={C.muted} style={s.input} multiline />
        {primaryButton('Send message', () => void sendDoctorChat())}
      </View></View>
    </Modal>
  </SafeAreaView>;
}

type AppStyles = ReturnType<typeof makeStyles>;

function SummaryLine({ label, value, green = false, strong = false, styles }: { label: string; value: string; green?: boolean; strong?: boolean; styles: AppStyles }) {
  return <View style={styles.summaryLine}><Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text><Text style={[styles.summaryValue, green && styles.green, strong && styles.summaryStrong]}>{value}</Text></View>;
}

const makeStyles = (C: Palette) => StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: C.bg
  },
  homeHeader: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12, backgroundColor: C.homeTop },
  homeHeaderLocation: { flex: 1, minWidth: 0, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeHeaderPin: { color: C.teal, fontSize: 24, width: 34, textAlign: 'center' },
  homeHeaderChevron: { color: C.white, fontSize: 22, paddingHorizontal: 4 },
  homeHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  homeHeaderAction: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  homeHeaderIcon: { color: C.white, fontSize: 25, fontWeight: '700' },
  header: {
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.headerLine,
    gap: 12

  },
  hamburger: {
    height: 44,
    width: 44,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center'

  },
  hamburgerText: {
    fontSize: 19,
    color: C.white

  },
  brand: {
    color: C.mint,
    fontWeight: '900',
    fontSize: 17,
    letterSpacing: 1, flex: 1, flexShrink: 1, minWidth: 0
  },
  brandSub: {
    color: C.teal,
    fontSize: 12,
    letterSpacing: 2
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerGlyph: {
    color: C.teal,
    fontSize: 21
  },
  back: {
    width: 28
  },
  backText: {
    color: C.white,
    fontSize: 31,
    lineHeight: 34
  },
  headerTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
    flex: 1
  },
  homeContent: { paddingTop: 0 },
  content: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 24
  },
  location: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    backgroundColor: C.card,
    padding: 11,
    borderRadius: 12,
    marginBottom: 10
  },
  locationPin: {
    color: C.teal,
    fontSize: 20

  },
  locationLabel: {
    color: C.muted,
    fontSize: 12

  },
  locationValue: {
    color: C.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2

  },
  arrow: {
    color: C.arrow,
    fontSize: 21
  },
  homeTopPanel: { marginHorizontal: -14, paddingHorizontal: 18, paddingTop: 0, paddingBottom: 22, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, backgroundColor: C.homeTop, marginBottom: 18 },
  deliveryPromise: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, marginBottom: 12 },
  deliveryDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.teal },
  deliveryPromiseText: { color: C.white, fontSize: 14, fontWeight: '800', lineHeight: 19 },
  deliveryPromiseIcon: { color: C.teal, fontSize: 24, fontWeight: '700' },
  searchBox: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 25,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.searchLine,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 22,
    color: C.muted
  },
  searchInput: {
    flex: 1,
    color: C.white,
    marginLeft: 8,
    fontSize: 14,
    paddingVertical: 4
  },
  searchMic: {
    color: C.teal,
    fontSize: 18
  },

  homeIntro: { minHeight: 150, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, marginBottom: 13 },
  homeIntroTitle: { color: C.white, fontSize: 23, lineHeight: 29, fontWeight: '900', maxWidth: 220 },
  homeIntroCopy: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 260 },
  homeIntroArt: { color: C.teal, fontSize: 35, fontWeight: '800' },
  prescriptionHomeCard: { minHeight: 140, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 17, borderRadius: 17, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, marginBottom: 17 },
  prescriptionHomeEyebrow: { color: C.teal, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  prescriptionHomeTitle: { color: C.white, fontSize: 18, lineHeight: 23, fontWeight: '900' },
  prescriptionHomeCopy: { color: C.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  prescriptionHomeIcon: { color: C.teal, backgroundColor: C.slotOnBg, fontSize: 21, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 22, borderRadius: 20 },
  serviceGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  serviceCard: { width: '24%', minHeight: 104, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, gap: 7 },
  serviceIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, justifyContent: 'center', alignItems: 'center' },
  serviceGlyph: { color: C.teal, fontSize: 23, fontWeight: '800' },
  serviceTitle: { color: C.softText, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  serviceSub: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4
  },
  demoOnlyBadge: {
    color: C.demoBadge,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    marginBottom: 6
  },

  promo: {
    width: 452,
    height: 163,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#067f77',
    overflow: 'hidden'
    , justifyContent: 'center'
  },
  bannerScroller: {
    marginHorizontal: -14
  },
  promoImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%'
  },
  promoShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,25,24,0.42)'
  },
  promoBrand: {
    color: '#c4fff6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4
  },
  promoTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 7,
    maxWidth: 280
  },
  promoCopy: {
    color: '#dcfffa',
    fontSize: 12,
    marginTop: 5
  },
  promoCta: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 13,
    letterSpacing: 0.7
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: -7,
    marginBottom: 13
  },
  dot: {
    height: 5,
    width: 5, backgroundColor: C.dot,
    borderRadius: 4
  },
  dotOn: {
    width: 15,
    backgroundColor: C.teal
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    marginBottom: 9
  },
  sectionTitle: {
    color: C.white,
    fontWeight: '800',
    fontSize: 14
  },
  seeAll: {
    color: C.teal, fontSize: 12,
    fontWeight: '700'
  },
  reportActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 8
  },
  reportButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: C.reportLine,
    backgroundColor: C.reportBg,
    paddingHorizontal: 12,
    paddingVertical: 8

  }, reportButtonOn: {
    backgroundColor: C.tealDark
  },
  reportButtonText: {
    color: C.mint,
    fontSize: 11,
    fontWeight: '800'
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 13
  },
  categoryTile: {
    width: 77,
    minHeight: 78,
    borderRadius: 13,
    backgroundColor: C.card,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  categoryImage: { width: 40, height: 40, borderRadius: 9 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 18 },
  categoryCard: { width: '48.5%', minHeight: 128, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  allProductsCard: { width: '100%', minHeight: 70, flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12, borderColor: C.allProductsLine },
  categoryCardImage: { width: 58, height: 58, borderRadius: 12 },
  datePickerButton: { minHeight: 44, borderRadius: 9, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputLine, paddingHorizontal: 11, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePickerValue: { color: C.white, fontSize: 13, fontWeight: '700' }, datePickerPlaceholder: { color: C.muted, fontSize: 13 },
  calendarMonthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 }, calendarMonthTitle: { color: C.white, fontSize: 14, fontWeight: '800' },
  calendarNav: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.raised, alignItems: 'center', justifyContent: 'center' }, calendarNavText: { color: C.mint, fontSize: 24, lineHeight: 27 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, calendarWeekday: { width: '14.28%', textAlign: 'center', color: C.muted, fontSize: 11, fontWeight: '700', paddingVertical: 7 },
  calendarDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, calendarDaySelected: { backgroundColor: C.tealDark }, calendarDayDisabled: { opacity: 0.35 }, calendarDayText: { color: C.white, fontSize: 13 }, calendarDayTextSelected: { color: 'white', fontWeight: '900' }, calendarDayTextDisabled: { color: C.muted },
  calendarSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginVertical: 8 }, calendarSlot: { width: '23%', alignItems: 'center', paddingVertical: 10, borderRadius: 9, backgroundColor: C.raised, borderWidth: 1, borderColor: C.line }, calendarSlotSelected: { backgroundColor: C.slotOnBg, borderColor: C.teal }, calendarSlotText: { color: C.softText, fontSize: 12 }, calendarSlotTextSelected: { color: C.mint, fontWeight: '800' }, calendarConfirm: { marginTop: 5 }, calendarConfirmDisabled: { opacity: 0.45 },

  categoryEmoji: {
    color: C.teal,
    fontSize: 23
  },
  categoryText: {
    color: C.softText,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center', lineHeight: 11
  },
  chatBubble: { maxWidth: '85%', alignSelf: 'flex-start', backgroundColor: C.tileBg, padding: 10, borderRadius: 11 },
  chatBubbleMine: { alignSelf: 'flex-end', backgroundColor: C.chatMineBg },
  chatMessage: { color: C.white, fontSize: 12, lineHeight: 15 },
  chatTime: { color: C.muted, fontSize: 9, marginTop: 5 },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipOn: {
    backgroundColor: C.chipOnBg,
    borderColor: C.teal
  },
  filterText: {
    color: C.textSofter,
    fontSize: 12
  },
  filterTextOn: {
    color: C.mint
  },
  zoneRow: {
    gap: 8,
    paddingBottom: 13
  },
  zoneChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line
  },
  zoneSelected: {
    borderColor: C.teal,
    backgroundColor: C.zoneOnBg
  },
  zoneText: {
    color: C.zoneText,
    fontSize: 12
  },
  zoneTextSelected: {
    color: C.mint
  },
  productGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18
  },
  productCard: {
    width: '48.5%',
    backgroundColor: C.card, borderRadius: 14, padding: 9,
    borderWidth: 1,
    borderColor: C.productLine
  },
  productImage: {
    height: 102, borderRadius: 10, backgroundColor: C.tileBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, position: 'relative'
  },
  productPhoto: {
    width: '78%',
    height: '78%'
  },
  productFallback: {
    color: C.teal, fontSize: 30,
    fontWeight: '900'
  },
  detailPhoto: {
    width: '100%',
    height: 250,
    backgroundColor: C.tileBg,
    borderRadius: 12,
    marginBottom: 16

  },

  detailPhotoFallback: {
    width: '100%',
    height: 190,
    backgroundColor: C.tileBg,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  detailTitle: {
    color: C.white,
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 8

  },
  detailPrice: {
    color: C.mint,
    fontSize: 22,
    fontWeight: '900',
    marginVertical: 12

  },
  detailDescription: {
    color: C.textSofter,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16

  },
  heart: {
    position: 'absolute',
    top: 5,
    right: 6,
    height: 27, width: 27,
    borderRadius: 14,
    backgroundColor: C.heartBg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heartText: {
    color: C.mint,
    fontSize: 19,
    lineHeight: 22
  },
  discountBadge: {
    position: 'absolute',
    left: 5,
    top: 6,
    color: '#052a26',
    backgroundColor: '#9af5e2',
    fontSize: 9,
    fontWeight: '900',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3
  },
  productCategory: {
    color: C.teal, fontSize: 10, fontWeight: '700',
    marginBottom: 3
  },
  productName: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    minHeight: 28
  },
  productDesc: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4
  },
  rxNote: {
    color: C.rxNote,
    fontSize: 9,
    marginTop: 5
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  productPrice: {
    color: C.white,
    fontWeight: '900',
    fontSize: 14
  },
  mrp: {
    color: C.muted,
    fontSize: 10,
    marginTop: 3
  },
  strike: {
    textDecorationLine: 'line-through'
  },
  addButton: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: 8,
    backgroundColor: C.tealDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  addButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800'
  },
  disabled: {
    backgroundColor: C.disabledBg
  },
  tabs: {
    height: 59,
    borderTopWidth: 1,
    borderColor: C.tabsBorder,
    flexDirection: 'row',
    backgroundColor: C.tabsBg,
    justifyContent: 'space-around',
    paddingTop: 7
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2
  },
  tabIcon: {
    color: C.tabIcon, fontSize: 23, lineHeight: 25, fontWeight: '900'
  }, tabOn: {
    color: C.teal

  },
  tabLabel: {
    color: C.tabLabel,
    fontSize: 10
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: 18,
    backgroundColor: C.tealDark,
    borderRadius: 9,
    minWidth: 15,
    height: 15,
    alignItems: 'center', justifyContent: 'center'
  }, cartBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
  configBanner: { backgroundColor: C.configBg, padding: 12, borderRadius: 12, marginBottom: 10 }, configTitle: { color: C.mint, fontSize: 13, fontWeight: '800' }, configText: { color: C.configText, fontSize: 11, lineHeight: 14, marginTop: 4 }, notice: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 11, backgroundColor: C.noticeBg, marginBottom: 10, gap: 8 }, noticeText: { color: C.noticeText, fontSize: 12, flex: 1 }, dismiss: { color: C.noticeText, fontSize: 19 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 }, emptyGlyph: { color: C.teal, fontSize: 28, marginBottom: 9 }, emptyTitle: { color: C.emptyTitle, fontSize: 14, fontWeight: '700', textAlign: 'center' }, emptyCopy: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 5, lineHeight: 14, maxWidth: 245 },
  cartNudge: { backgroundColor: C.nudgeBg, borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, nudgeGlyph: { color: C.nudgeGlyph, fontSize: 17 }, nudgeText: { color: C.nudgeText, fontSize: 12, fontWeight: '700', flex: 1, lineHeight: 15 }, cartRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, padding: 9, borderRadius: 12, marginBottom: 8 }, cartImage: { width: 53, height: 53, borderRadius: 9 }, cartFallback: { backgroundColor: C.tileBg, alignItems: 'center', justifyContent: 'center' }, cartName: { color: C.white, fontSize: 12, fontWeight: '800' }, cartSub: { color: C.muted, fontSize: 10, marginTop: 3 }, qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 }, qtyButton: { width: 40, height: 40, borderRadius: 6, backgroundColor: C.qtyBg, alignItems: 'center', justifyContent: 'center' }, qtyText: { color: C.mint, fontSize: 14 }, qtyValue: { color: C.white, fontSize: 12 }, remove: { marginLeft: 3 }, removeText: { color: C.red, fontSize: 10 }, summaryCard: { backgroundColor: C.card, padding: 13, borderRadius: 14, marginTop: 6 }, summaryTitle: { color: C.white, fontSize: 14, fontWeight: '900', marginBottom: 8 }, summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }, summaryLabel: { color: C.summaryLabel, fontSize: 12 }, summaryValue: { color: C.summaryValue, fontSize: 12, fontWeight: '600' }, summaryStrong: { color: C.white, fontSize: 14, fontWeight: '900' }, green: { color: C.green }, summaryDivider: { height: 1, backgroundColor: C.line, marginTop: 4 }, loginPrompt: { padding: 10, marginTop: 7, borderRadius: 9, backgroundColor: C.loginPromptBg }, loginPromptText: { color: C.mint, fontSize: 11 }, checkoutAddressTitle: { color: C.white, fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 6 }, addressInput: { height: 70, textAlignVertical: 'top' }, input: { minHeight: 46, borderRadius: 9, backgroundColor: C.inputBg, color: C.white, fontSize: 12, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 7, borderWidth: 1, borderColor: C.inputLine },
  button: { minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: C.tealDark, paddingHorizontal: 12, marginTop: 7 }, buttonText: { color: 'white', fontSize: 12, fontWeight: '900' }, buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.outlineLine }, buttonTextOutline: { color: C.mint }, profileBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, padding: 12, backgroundColor: '#078f86', gap: 10, marginBottom: 13 }, avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#e7fbf8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: C.tealDark, fontWeight: '900', fontSize: 18 }, profileName: { color: 'white', fontSize: 13, fontWeight: '800' }, profileSub: { color: '#dbfff9', fontSize: 11, marginTop: 3 }, signout: { color: 'white', fontSize: 11, fontWeight: '800' }, appearanceCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: C.line }, appearanceOptions: { flexDirection: 'row', gap: 10, marginTop: 12 }, appearanceOption: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.raised }, appearanceOptionSelected: { borderColor: C.teal, backgroundColor: C.slotOnBg }, appearanceOptionText: { color: C.softText, fontSize: 13, fontWeight: '700' }, appearanceOptionTextSelected: { color: C.mint }, accountRows: { gap: 7, marginTop: 4 }, accountRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 11, backgroundColor: C.card, gap: 11 }, rowIcon: { color: C.teal, fontSize: 17, width: 24, textAlign: 'center' }, rowTitle: { color: C.summaryValue, fontSize: 12, fontWeight: '700', flex: 1 }, rowSub: { color: C.muted, fontSize: 10, marginTop: 4 }, orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 13, borderRadius: 13, marginBottom: 8 }, orderTitle: { color: C.white, fontSize: 13, fontWeight: '800' }, serviceListing: { backgroundColor: C.card, padding: 13, borderRadius: 14, marginBottom: 9 }, serviceListingTag: { color: C.teal, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }, serviceListingName: { color: C.white, fontSize: 14, fontWeight: '900', marginTop: 6 }, featureBanner: { backgroundColor: '#078f86', padding: 16, borderRadius: 15, marginBottom: 13 }, featureEyebrow: { color: '#b8fff3', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 7 }, featureTitle: { color: 'white', fontWeight: '900', fontSize: 18 }, featureCopy: { color: '#d5fffa', fontSize: 11, lineHeight: 14, marginTop: 6 }, filePicker: { minHeight: 42, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 9, backgroundColor: C.inputBg, gap: 8, marginBottom: 7 }, filePickerText: { color: C.fieldLabel, fontSize: 11, flex: 1 }, formCard: { backgroundColor: C.card, padding: 14, borderRadius: 14 }, formTitle: { color: C.white, fontSize: 18, fontWeight: '900', marginBottom: 5 }, formCopy: { color: C.muted, fontSize: 11, lineHeight: 14, marginBottom: 13 }, modeSwap: { alignItems: 'center', paddingVertical: 14 }, modeSwapText: { color: C.teal, fontSize: 12, fontWeight: '700' }, fieldLabel: { color: C.fieldLabel, fontSize: 11, fontWeight: '700', marginVertical: 6 }, walletCard: { padding: 18, borderRadius: 15, backgroundColor: '#078f86', marginBottom: 14 }, walletAmount: { color: 'white', fontSize: 26, fontWeight: '900', marginTop: 5 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 }, modalCard: { backgroundColor: C.raised, padding: 14, borderRadius: 13, marginTop: 12 },
  menuOverlay: { ...StyleSheet.absoluteFill, zIndex: 20, flexDirection: 'row' }, menuScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.6)' }, menuPanel: { width: '83%', maxWidth: 350, backgroundColor: C.menuBg, height: '100%', paddingHorizontal: 16, paddingTop: 13, borderRightWidth: 1, borderColor: C.menuBorder }, menuTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, marginBottom: 10 }, menuBrand: { color: C.mint, fontSize: 16, fontWeight: '900', letterSpacing: 1 }, closeMenu: { color: C.white, fontSize: 25 }, menuSection: { color: C.menuSection, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginTop: 10, marginBottom: 5 }, menuItem: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.menuItemLine }, menuItemText: { color: C.menuItemText, fontSize: 12, flex: 1 }, menuSignout: { borderRadius: 9, padding: 11, borderWidth: 1, borderColor: C.menuSignoutLine, alignItems: 'center', marginTop: 14 }, menuSignoutText: { color: C.mint, fontSize: 12, fontWeight: '800' }, menuFooter: { color: C.menuFooter, fontSize: 10, lineHeight: 13, marginTop: 'auto', paddingVertical: 14 },
  areaPickerModalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' }, areaPickerScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.62)' }, areaPickerSheet: { maxHeight: '82%', backgroundColor: C.sheetBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, borderWidth: 1, borderColor: C.line }, areaPickerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }, areaPickerTitle: { color: C.white, fontSize: 17, fontWeight: '900' }, areaPickerCopy: { color: C.muted, fontSize: 12, lineHeight: 15, marginTop: 5, maxWidth: 280 }, areaPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line }, areaPickerContent: { paddingBottom: 6 }, locationNotice: { color: C.noticeText, fontSize: 12, lineHeight: 15, marginTop: 8, marginBottom: 4 }, locationCoverageNote: { color: C.zoneText, backgroundColor: C.inputBg, borderRadius: 9, padding: 10, fontSize: 11, lineHeight: 14, marginTop: 8 },
});

