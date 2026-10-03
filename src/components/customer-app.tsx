import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LocationMap, type MapPin } from '@/components/location-map';
import { api, backendUrl, clearLoginToken, fetchDocument, hasBackendUrl, hasLoginToken, saveLoginToken } from '@/services/medical-api';

type Page = 'Home' | 'Categories' | 'Category products' | 'Product details' | 'Medical Orders' | 'Cart' | 'My Account' | 'Lab Tests' | 'Consult a Doctor' | 'Booking' | 'Prescription Centre' | 'Notifications' | 'Personal details' | 'Health log' | 'Appearance' | 'Refunds' | 'Saved products' | 'Delivery addresses' | 'Wallet' | 'Help and support' | 'Sign in';
type Category = {
  id: number;
  name: string;
  image_full_url?: string
};
type Product = { id: number; name: string; description?: string; unit?: string; price: number; discount_price?: number | null; stock: number; medicine_type?: string; category_name?: string; thumbnail_full_url?: string; is_demo?: boolean };
type Banner = { id: number; title?: string; subtitle?: string; image_full_url?: string; action_text?: string };
type CartItem = { id: number; product_id: number; name: string; quantity: number; price: number; unit?: string; thumbnail_full_url?: string; stock?: number };
type Zone = { id: number; name: string; city?: string; state?: string; pincode?: string; latitude?: number | string; longitude?: number | string };
type LocationChoice = MapPin & { address: string; pincode?: string; city?: string };
type Summary = { subtotal: number; medicine_discount: number; coupon_discount: number; total_discount: number; tax_total: number; delivery_charge: number; platform_fee: number; extra_discount_threshold: number; total: number; items_count: number };
type Profile = { id: number; name: string; phone: string; email?: string };

const C = { bg: '#050a0b', card: '#141a1d', raised: '#1c2428', line: '#273136', teal: '#00b7a7', tealDark: '#087f78', mint: '#c7fff3', muted: '#879398', white: '#f5f8f8', red: '#ff8888' };
const money = (value = 0) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ subtotal: 0, medicine_discount: 0, coupon_discount: 0, total_discount: 0, tax_total: 0, delivery_charge: 0, platform_fee: 0, extra_discount_threshold: 0, total: 0, items_count: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
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
  const [orderRows, setOrderRows] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [appearance, setAppearance] = useState('Use device setting');
  const [refreshKey, setRefreshKey] = useState(0);

  const go = (next: Page) => { setMenuOpen(false); setHistory((items) => [...items, page]); setPage(next); setNotice(''); };
  const back = () => { setPage(history.at(-1) ?? 'Home'); setHistory((items) => items.slice(0, -1)); setNotice(''); };
  const apiCall = async <T,>(path: string, options?: { method?: string; body?: unknown }) => api<T>(path, options);

  const openAreaPicker = () => {
    const currentZone = zones.find((zone) => zone.id === zoneId);
    if (!selectedLocation && currentZone?.latitude && currentZone?.longitude) {
      setSelectedLocation({ latitude: Number(currentZone.latitude), longitude: Number(currentZone.longitude), address: currentZone.name, city: currentZone.city, pincode: currentZone.pincode });
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
    setPrescriptions(data.data ?? []); setDoctorConsultations(consultations.data ?? []); setPickupPharmacies(pharmacies.data ?? []);
    setAddresses(savedAddresses.data ?? []); setPrescriptionPaymentMethods(data.payment_methods ?? []);
    if (!(data.payment_methods ?? []).some((method: any) => method.id === prescriptionPaymentMethod)) setPrescriptionPaymentMethod((data.payment_methods ?? [])[0]?.id ?? '');
  };

  const acceptPrescriptionQuote = async (request: any) => {
    const quoteId = Number(request.quote?.id ?? request.quote_id ?? 0);
    if (!quoteId) { setNotice('The pharmacy quote is no longer available. Refresh and try again.'); return; }
    setBusy(true);
    try {
      await apiCall(`/prescription-requests/${request.id}/accept-quote`, { method: 'POST', body: { quote_id: quoteId } });
      await loadPrescriptionCentre(); setNotice('Quote accepted. Review the delivery address and place your medicine order.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not accept this quote.'); }
    finally { setBusy(false); }
  };

  const checkoutPrescriptionQuote = async (request: any) => {
    const savedAddress = addresses.find((item) => Number(item.is_default) === 1) ?? addresses[0];
    if (!savedAddress && !addressText.trim()) { setNotice('Add a delivery address before placing this medicine order.'); go('Delivery addresses'); return; }
    if (!prescriptionPaymentMethod) { setNotice('No payment method is currently enabled. Contact the website administrator.'); return; }
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
      setCart(response.data ?? []);
      if (response.summary) setSummary(response.summary);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load your cart.');
    }
    // apiCall is intentionally stable for this component lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCatalog = useCallback(async (selectedZone: number | null, category = categoryId, search = query) => {
    if (!hasBackendUrl()) return;
    const params = new URLSearchParams({ limit: '54' });
    if (selectedZone) params.set('zone_id', String(selectedZone));
    if (category) params.set('category_id', String(category));
    if (search.trim()) params.set('query', search.trim());
    const suffix = `?${params.toString()}`;
    const showHome = Boolean(selectedZone && !category && !search.trim());
    const requests: Promise<any>[] = [apiCall<{ data?: Category[] }>('/categories')];
    if (showHome) requests.push(apiCall<any>(`/home?zone_id=${selectedZone}`));
    else requests.push(apiCall<{ data?: Product[] }>(`${search.trim() ? '/products/search' : '/products'}${suffix}`));
    try {
      const results = await Promise.all(requests);
      const categoryPayload = results[0];
      setCategories((categoryPayload.data ?? []).map((item: Category) => ({ ...item, id: Number(item.id) })));
      if (showHome) {
        const home = results[1];
        setBanners(home.banners ?? []);
        setProducts(home.featured_products?.length ? home.featured_products : (home.latest_products ?? []));
      } else {
        if (!category && !search.trim()) setBanners([]);
        setProducts(results[1].data ?? []);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load the Amedix catalogue.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, query]);

  useEffect(() => {
    let active = true;
    const start = async () => {
      if (!hasBackendUrl()) {
        setConfigMessage('Add the live website URL later as EXPO_PUBLIC_API_BASE_URL to connect the catalogue and account.');
        return;
      }
      setBusy(true);
      try {
        const [settings, cats, zoneResponse] = await Promise.all([
          apiCall<any>('/config'),
          apiCall<{ data?: Category[] }>('/categories'),
          apiCall<{ data?: Zone[] }>('/api/v1/zones'),
        ]);
        if (!active) return;
        setConfig(settings);
        const activeZones = (zoneResponse.data?.length ? zoneResponse.data : settings.zones ?? []).map((zone: Zone) => ({ ...zone, id: Number(zone.id) }));
        setZones(activeZones);
        setCategories((cats.data ?? []).map((category) => ({ ...category, id: Number(category.id) })));
        const initialZone = activeZones.length === 1 ? activeZones[0].id : null;
        setZoneId(initialZone);
        if (initialZone) await loadCatalog(initialZone, null, '');
        const signedIn = await hasLoginToken();
        if (signedIn) {
          try {
            const me = await apiCall<{ data: Profile }>('/customers/profile');
            if (active) { setProfile(me.data); setCustomerName(me.data.name ?? ''); setCustomerPhone(me.data.phone ?? ''); }
          } catch { if (active) setProfile(null); }
        }
        await loadCart();
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : 'Could not connect to the backend.');
      } finally {
        if (active) setBusy(false);
      }
    };
    void start();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!zoneId || !hasBackendUrl()) return;
    const timer = setTimeout(() => { void loadCatalog(zoneId, categoryId, query); }, 320);
    return () => clearTimeout(timer);
  }, [zoneId, categoryId, query, refreshKey, loadCatalog]);

  const openPage = async (next: Page) => {
    go(next);
    if (!hasBackendUrl()) return;
    try {
      if (next === 'Medical Orders') {
        const [o, l, d] = await Promise.all([apiCall<any>('/orders'), apiCall<any>('/lab-bookings'), apiCall<any>('/consultations')]);
        setOrders([...(o.data ?? []), ...(l.data ?? []).map((x: any) => ({ ...x, order_number: x.test_name, order_status: x.status, order_amount: x.amount, type: 'Lab test' })), ...(d.data ?? []).map((x: any) => ({ ...x, order_number: x.doctor_name, order_status: x.status, order_amount: x.amount, type: 'Consultation' }))]);
      } else if (next === 'Delivery addresses') {
        const data = await apiCall<any>('/customers/addresses'); setAddresses(data.data ?? []);
      } else if (next === 'Notifications') {
        const data = await apiCall<any>('/notifications'); setNotifications(data.data ?? []);
      } else if (next === 'Saved products') {
        const data = await apiCall<any>('/wishlist'); setWishlist(data.data ?? []);
      } else if (next === 'Lab Tests' || next === 'Consult a Doctor') {
        const data = await apiCall<any>(`/services${zoneId ? `?zone_id=${zoneId}` : ''}`);
        setLabs(data.lab_tests ?? []); setDoctors((data.doctors ?? []).filter((doctor: any) => !doctor.is_demo && !String(doctor.business_name ?? '').startsWith('DEMO ONLY')));
      } else if (next === 'Refunds') {
        const data = await apiCall<any>('/refunds'); setOrders(data.data ?? []);
      } else if (next === 'Wallet') {
        const data = await apiCall<any>('/customers/wallet'); setConfig((old: any) => ({ ...old, wallet: data.data ?? data }));
      } else if (next === 'Prescription Centre') {
        await loadPrescriptionCentre();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Unable to load ${next.toLowerCase()}.`);
    }
  };

  const searchLocations = async () => {
    if (locationQuery.trim().length < 3) { setLocationNotice('Type at least 3 characters of an address, area, or PIN code.'); return; }
    setLocationBusy(true); setLocationNotice('');
    try {
      const result = await apiCall<{ data?: LocationChoice[] }>('/api/v1/zones/search', { method: 'POST', body: { query: locationQuery.trim() } });
      setLocationChoices(result.data ?? []);
      if (!result.data?.length) setLocationNotice('No matching addresses found. Try a nearby landmark or PIN code.');
    } catch (error) { setLocationNotice(error instanceof Error ? error.message : 'Could not search for that address.'); }
    finally { setLocationBusy(false); }
  };

  const selectMapPin = (pin: MapPin) => {
    const choice = { ...pin, address: `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}` };
    setSelectedLocation(choice); setLocationQuery(choice.address); setLocationNotice('Pin selected. Add or search an address, then use this location.');
  };

  const applySelectedLocation = async () => {
    if (!selectedLocation) { setLocationNotice('Search for an address or tap the map to place a pin first.'); return; }
    setLocationBusy(true); setLocationNotice('Checking delivery coverage…');
    try {
      let details: LocationChoice = selectedLocation;
      try {
        const reverse = await apiCall<{ data?: { address?: string; pincode?: string; city?: string } }>('/api/v1/zones/reverse-geocode', { method: 'POST', body: { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude } });
        details = { ...selectedLocation, ...reverse.data, address: reverse.data?.address || selectedLocation.address };
      } catch { /* Keep the manually entered or map-pin address if reverse lookup is unavailable. */ }
      const resolution = await apiCall<{ data?: { zone?: Zone | null; serviceable?: boolean } }>('/api/v1/zones/resolve', { method: 'POST', body: { latitude: details.latitude, longitude: details.longitude, pincode: details.pincode, city: details.city } });
      setSelectedLocation(details); setLocationQuery(details.address); setLocationChoices([]); setNotice('');
      if (resolution.data?.zone) {
        const zone = { ...resolution.data.zone, id: Number(resolution.data.zone.id) };
        setZones((current) => current.some((item) => item.id === zone.id) ? current : [...current, zone]);
        setZoneId(zone.id); setRefreshKey((value) => value + 1); setAreaPickerOpen(false); setLocationNotice('');
      } else {
        setZoneId(null);
        setLocationNotice('This location is outside current delivery coverage. The admin must enable this area before orders can be placed.');
      }
    } catch (error) { setLocationNotice(error instanceof Error ? error.message : 'Could not check delivery coverage.'); }
    finally { setLocationBusy(false); }
  };

  useEffect(() => {
    if (!profile || page !== 'Prescription Centre') return;
    const timer = setInterval(() => { void loadPrescriptionCentre().catch(() => undefined); }, 15000);
    return () => clearInterval(timer);
  }, [profile?.id, page, zoneId]);

  const addToCart = async (product: Product) => {
    if (!zoneId) { setNotice('Choose your delivery area before adding medicines.'); return; }
    try {
      await apiCall('/cart/add', { method: 'POST', body: { product_id: product.id, quantity: 1, zone_id: zoneId } });
      setNotice(`${product.name} added to cart.`); await loadCart();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not add this medicine.'); }
  };

  const openProduct = async (product: Product) => {
    setSelectedProduct(product);
    go('Product details');
    if (product.is_demo || product.id < 0 || !hasBackendUrl()) return;
    try {
      const result = await apiCall<{ data?: Product }>(`/products/${product.id}${zoneId ? `?zone_id=${zoneId}` : ''}`);
      if (result.data) setSelectedProduct(result.data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not load product details.');
    }
  };

  const updateQuantity = async (item: CartItem, quantity: number) => {
    try {
      if (quantity < 1) await apiCall(`/cart/remove?cart_id=${item.id}`, { method: 'DELETE' });
      else await apiCall('/cart/update', { method: 'PUT', body: { cart_id: item.id, quantity } });
      await loadCart();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update the cart.'); }
  };

  const submitAuth = async () => {
    if (!authPhone.trim() || !authPassword) { setNotice('Enter your phone number and password.'); return; }
    if (authMode === 'register' && !authName.trim()) { setNotice('Enter your name to create an account.'); return; }
    setBusy(true);
    try {
      const payload = await apiCall<any>(`/customers/${authMode}`, { method: 'POST', body: { name: authName, phone: authPhone, email: authEmail, password: authPassword } });
      await saveLoginToken(payload.token);
      setProfile(payload.data); setCustomerName(payload.data?.name ?? authName); setCustomerPhone(payload.data?.phone ?? authPhone);
      setAuthPassword(''); setNotice(payload.message ?? 'Signed in successfully.'); setPage('My Account'); setHistory([]); await loadCart();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  };

  const saveAddress = async () => {
    if (!addressText.trim()) { setNotice('Enter your full delivery address.'); return; }
    try {
      const payload = await apiCall<any>('/customers/addresses', { method: 'POST', body: { label: 'Home', address: addressText, contact_name: profile?.name ?? customerName, contact_phone: profile?.phone ?? customerPhone, is_default: true } });
      setAddresses(payload.data ?? []); setAddressText(''); setNotice('Delivery address saved.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Address could not be saved.'); }
  };

  const placeOrder = async () => {
    if (!zoneId) { setNotice('Choose your service area before checkout.'); return; }
    if (!addressText.trim() && !addresses.length) { setNotice('Add a delivery address before checkout.'); go('Delivery addresses'); return; }
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
        }
      });
      setNotice(payload.message ?? 'Your order has been placed.'); setPage('Medical Orders'); setHistory([]); await loadCart();
      const data = await apiCall<any>('/orders'); setOrders(data.data ?? []);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Checkout could not be completed.'); }
    finally { setBusy(false); }
  };

  const saveProfile = async () => {
    try {
      const result = await apiCall<any>('/customers/profile', { method: 'POST', body: { name: customerName, email: authEmail || profile?.email || '' } });
      setProfile(result.data); setNotice(result.message ?? 'Profile updated.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Profile update failed.'); }
  };

  const toggleWishlist = async (product: Product) => {
    try { await apiCall('/wishlist/toggle', { method: 'POST', body: { product_id: product.id } }); const result = await apiCall<any>('/wishlist'); setWishlist(result.data ?? []); setNotice('Wishlist updated.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Wishlist could not be updated.'); }
  };

  const submitBooking = async () => {
    if (!appointment || !profile) { setNotice('Sign in to book this service.'); go('Sign in'); return; }
    if (!bookingTime.trim()) { setNotice('Add an appointment date and time.'); return; }
    const lab = appointment.kind === 'lab';
    try {
      await apiCall(lab ? '/lab-bookings' : '/consultations', {
        method: 'POST', body: {
          zone_id: zoneId, customer_name: profile.name, customer_phone: profile.phone, scheduled_at: bookingTime,
          ...(lab ? { test_id: appointment.id, collection_mode: 'home' } : { doctor_id: appointment.id, consultation_mode: consultationMode, reason: consultationReason.trim() }),
          payment_method: 'cash_on_delivery',
        }
      });
      setAppointment(null); setBookingTime(''); setConsultationMode('online'); setConsultationReason(''); setNotice('Your booking request has been sent.'); setPage('Medical Orders'); setHistory([]); await openPage('Medical Orders');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Booking request could not be sent.'); }
  };

  const openDoctorChat = async (consultation: any) => {
    try {
      const result = await apiCall<any>('/chat', { method: 'POST', body: { entity_type: 'consultation', entity_id: Number(consultation.id) } });
      const id = Number(result.data?.id ?? result.conversation?.id);
      if (!id) throw new Error('Chat is not available for this appointment yet.');
      const thread = await apiCall<any>(`/chat/${id}/show`);
      setChatId(id); setChatMessages(thread.messages ?? []); setChatOpen(true);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not open the doctor chat.'); }
  };

  const sendDoctorChat = async () => {
    if (!chatId || !chatDraft.trim()) return;
    try {
      const result = await apiCall<any>(`/chat/${chatId}/send`, { method: 'POST', body: { text: chatDraft.trim() } });
      setChatMessages(result.messages ?? []); setChatDraft('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Message could not be sent.'); }
  };

  useEffect(() => {
    if (!chatOpen || !chatId) return;
    void api(`/chat/${chatId}/read`, { method: 'POST' }).catch(() => undefined);
    const timer = setInterval(() => {
      const lastId = chatMessages.at(-1)?.id ?? 0;
      void api<any>(`/chat/${chatId}/show?after_id=${lastId}`).then((result) => {
        if (result.messages?.length) setChatMessages((messages) => [...messages, ...result.messages]);
      }).catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [chatOpen, chatId, chatMessages]);

  const consultationReportHtml = (visit: any) => {
    const escape = (value: unknown) => String(value ?? '').replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character]!));
    const medicines = Array.isArray(visit.prescription_items) ? visit.prescription_items : [];
    return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:14px Arial,sans-serif;color:#172324;margin:36px}h1{color:#087f78;font-size:22px}h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #d7e1df;padding-bottom:6px}.meta{line-height:1.8;color:#405252}.note{white-space:pre-wrap;line-height:1.6}.medicine{padding:8px 0;border-bottom:1px solid #e5ecea}.footer{margin-top:28px;color:#637170;font-size:11px}</style></head><body><h1>Amedix · Consultation report</h1><div class="meta"><b>Patient:</b> ${escape(visit.customer_name || profile?.name)}<br><b>Doctor:</b> Dr. ${escape(visit.doctor_name)}<br><b>Appointment:</b> ${escape(visit.scheduled_at)}<br><b>Mode:</b> ${visit.consultation_mode === 'clinic' ? 'Clinic visit' : 'Online'}<br><b>Status:</b> ${escape(String(visit.status || '').replaceAll('_', ' '))}<br><b>Consultation ID:</b> ${escape(visit.id)}</div><h2>Doctor's notes</h2><div class="note">${escape(visit.clinical_note || 'No consultation note was added.')}</div><h2>Prescription</h2>${medicines.length ? medicines.map((item: any) => `<div class="medicine"><b>${escape(item.name)}</b>${item.strength ? ` · ${escape(item.strength)}` : ''}<br>${[item.dosage, item.frequency, item.duration, item.instructions].filter(Boolean).map(escape).join(' · ')}</div>`).join('') : '<div class="note">No medicines prescribed.</div>'}<div class="note">${escape(visit.prescription_note || '')}</div><p class="footer">This report contains information saved by your doctor. Follow your doctor's advice for care.</p></body></html>`;
  };

  const shareConsultationFile = async (visit: any, format: 'csv' | 'pdf') => {
    try {
      const fileBase = `amedix-consultation-${Number(visit.id)}`;
      let uri: string;
      if (format === 'pdf') {
        if ((Platform.OS as string) === 'web') {
          const printWindow = window.open('', '_blank');
          if (!printWindow) { setNotice('Allow pop-ups to print or save this report as a PDF.'); return; }
          printWindow.document.open(); printWindow.document.write(consultationReportHtml(visit)); printWindow.document.close();
          printWindow.focus(); printWindow.print(); setNotice('Choose “Save as PDF” in the browser print dialog.'); return;
        }
        ({ uri } = await Print.printToFileAsync({ html: consultationReportHtml(visit) }));
      } else {
        const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const medicines = (Array.isArray(visit.prescription_items) ? visit.prescription_items : []).map((item: any) => [item.name, item.strength, item.dosage, item.frequency, item.duration, item.instructions].filter(Boolean).join(' | ')).join('; ');
        const rows = [['Amedix consultation report'], ['Patient', visit.customer_name || profile?.name], ['Doctor', `Dr. ${visit.doctor_name || ''}`], ['Appointment', visit.scheduled_at], ['Mode', visit.consultation_mode === 'clinic' ? 'Clinic visit' : 'Online'], ['Status', visit.status], ['Consultation ID', visit.id], ['Doctor notes', visit.clinical_note], ['Prescription', medicines || 'No medicines prescribed'], ['Prescription note', visit.prescription_note]];
        const csv = `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
        if ((Platform.OS as string) === 'web') {
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${fileBase}.csv`; link.click(); URL.revokeObjectURL(link.href); setNotice('Excel-compatible report downloaded.'); return;
        }
        uri = `${FileSystem.cacheDirectory}${fileBase}.csv`;
        await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      }
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv', dialogTitle: `Save consultation ${format.toUpperCase()} report` });
      else setNotice('File created, but sharing is unavailable on this device.');
    } catch (error) { setNotice(error instanceof Error ? error.message : `Could not create the ${format.toUpperCase()} report.`); }
  };

  const downloadLabReport = async (booking: any) => {
    const reportUrl = String(booking.report_url ?? '').trim();
    if (reportUrl === '') return;
    if (/^https?:\/\//i.test(reportUrl)) { await Linking.openURL(reportUrl); return; }
    try {
      const { data, fileName, mimeType } = await fetchDocument(`/documents/lab-report/${Number(booking.id)}`);
      if ((Platform.OS as string) === 'web') {
        const blob = new Blob([data]);
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = fileName; link.click(); URL.revokeObjectURL(link.href);
        setNotice('Lab report downloaded.');
        return;
      }
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const uri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(uri, btoa(binary), { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType, dialogTitle: 'Save lab report' });
      else setNotice('Report downloaded, but sharing is unavailable on this device.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not download the lab report.'); }
  };

  const pickPrescription = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) { setNotice('Choose a JPG, PNG, WebP or PDF file up to 5 MB.'); return; }
      setPrescriptionAsset(file); setNotice('');
    } catch { setNotice('Could not open your files. Please try again.'); }
  };

  const submitPrescription = async () => {
    if (!profile) { setNotice('Sign in to upload a prescription.'); go('Sign in'); return; }
    if (!zoneId) { setNotice('Choose your service area before sending the prescription.'); return; }
    if (!prescriptionAsset) { setNotice('Choose a prescription image or PDF first.'); return; }
    setBusy(true);
    try {
      let base64 = prescriptionAsset.base64 ?? '';
      if (!base64) base64 = await FileSystem.readAsStringAsync(prescriptionAsset.uri, { encoding: 'base64' });
      const mime = prescriptionAsset.mimeType || (prescriptionAsset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      const payload = await apiCall<any>('/prescription-requests', {
        method: 'POST', body: {
          customer_name: profile.name, customer_phone: profile.phone, zone_id: zoneId,
          prescription_base64: `data:${mime};base64,${base64}`, file_name: prescriptionAsset.name, note: prescriptionNote,
        }
      });
      setPrescriptionAsset(null); setPrescriptionNote(''); setPrescriptions((current) => [payload.data ?? payload, ...current]);
      setNotice('Prescription uploaded. A pharmacist will review it and send a quote.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Prescription upload failed.'); }
    finally { setBusy(false); }
  };

  const sendDoctorPrescriptionToPharmacy = async (consultation: any, pharmacy: any) => {
    if (!profile) { setNotice('Sign in to request prescription pickup.'); go('Sign in'); return; }
    try {
      const result = await apiCall<any>('/prescription-requests', { method: 'POST', body: { consultation_id: Number(consultation.id), pharmacy_id: Number(pharmacy.id) } });
      const request = result.data ?? result;
      setPrescriptions((current) => [request, ...current.filter((item) => Number(item.id) !== Number(request.id))]);
      setNotice('Prescription sent to the selected pharmacy. We will notify you when it is ready for pickup.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not send this prescription to the pharmacy.'); }
  };

  const confirmPrescriptionPickup = async (request: any) => {
    try {
      await apiCall(`/prescription-requests/${request.id}/collected`, { method: 'POST', body: {} });
      setPrescriptions((current) => current.map((item) => Number(item.id) === Number(request.id) ? { ...item, status: 'collected' } : item));
      setNotice('Pickup confirmed. Thank you.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not confirm pickup.'); }
  };

  const section = (label: string, action?: () => void) => <View style={s.sectionHead}><Text style={s.sectionTitle}>{label}</Text>{action && <Pressable onPress={action}><Text style={s.seeAll}>See all  ›</Text></Pressable>}</View>;
  const primaryButton = (label: string, action: () => void, secondary = false) => <Pressable onPress={action} style={[s.button, secondary && s.buttonOutline]}><Text style={[s.buttonText, secondary && s.buttonTextOutline]}>{label}</Text></Pressable>;
  const empty = (glyph: string, heading: string, copy: string) => <View style={s.empty}><Text style={s.emptyGlyph}>{glyph}</Text><Text style={s.emptyTitle}>{heading}</Text><Text style={s.emptyCopy}>{copy}</Text></View>;

  const serviceCard = (glyph: string, title: string, detail: string, target: Page, accent: string) => <Pressable key={title} onPress={() => void openPage(target)} style={s.serviceCard}><View style={[s.serviceIcon, { backgroundColor: accent }]}><Text style={s.serviceGlyph}>{glyph}</Text></View><View style={{ flex: 1 }}><Text style={s.serviceTitle}>{title}</Text><Text style={s.serviceSub}>{detail}</Text></View><Text style={s.arrow}>›</Text></Pressable>;

  const productCards = (items = products) => {
    const visibleItems = items;
    return visibleItems.length ? <View style={s.productGrid}>{visibleItems.map((product) => {
      const currentPrice = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
      const hasDiscount = currentPrice < product.price;
      return <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={`View ${product.name} details`} onPress={() => void openProduct(product)} style={s.productCard}>
        <View style={s.productImage}>{product.thumbnail_full_url ? <Image source={{ uri: product.thumbnail_full_url }} contentFit="contain" style={s.productPhoto} /> : <Text style={s.productFallback}>💊</Text>}
          {!product.is_demo && !product.name.startsWith('DEMO ONLY') && <Pressable onPress={(event) => { event.stopPropagation(); void toggleWishlist(product); }} style={s.heart}><Text style={s.heartText}>♡</Text></Pressable>}
          {hasDiscount && <Text style={s.discountBadge}>{Math.round((1 - currentPrice / product.price) * 100)}% OFF</Text>}
        </View>
        {product.is_demo || product.name.startsWith('DEMO ONLY') ? <Text style={s.demoOnlyBadge}>DEMO ONLY · Not for sale</Text> : null}<Text style={s.productCategory}>{product.category_name ?? 'Healthcare'}</Text><Text style={s.productName} numberOfLines={2}>{product.name}</Text><Text style={s.productDesc} numberOfLines={1}>{product.unit || product.description || 'Verified pharmacy product'}</Text>
        {product.medicine_type && product.medicine_type !== 'otc' && <Text style={s.rxNote}>Prescription may be required</Text>}
        <View style={s.productFooter}><View><Text style={s.productPrice}>{money(currentPrice)}</Text>{hasDiscount && <Text style={s.mrp}>MRP <Text style={s.strike}>{money(product.price)}</Text></Text>}</View><Pressable disabled={product.stock < 1} onPress={(event) => { event.stopPropagation(); void addToCart(product); }} style={[s.addButton, product.stock < 1 && s.disabled]}><Text style={s.addButtonText}>{product.stock < 1 ? 'Out' : '+'}</Text></Pressable></View>
      </Pressable>;
    })}</View> : empty('⌕', busy ? 'Loading products…' : 'No products found', 'Try another category or search term.');
  };

  const homeScreen = () => <>
    {configMessage ? <View style={s.configBanner}><Text style={s.configTitle}>Backend connection ready to configure</Text><Text style={s.configText}>{configMessage}</Text></View> : null}
    {notice ? <Pressable onPress={() => setNotice('')} style={s.notice}><Text style={s.noticeText}>{notice}</Text><Text style={s.dismiss}>×</Text></Pressable> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Choose your delivery service area" onPress={openAreaPicker} style={s.location}><Text style={s.locationPin}>⌖</Text><View style={{ flex: 1 }}><Text style={s.locationLabel}>Deliver to</Text><Text numberOfLines={1} style={s.locationValue}>{selectedLocation?.address ?? zones.find((zone) => zone.id === zoneId)?.name ?? 'Choose your service area'}</Text></View><Text style={s.arrow}>⌄</Text></Pressable>
    <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search medicines, brands..." placeholderTextColor={C.muted} style={s.searchInput} returnKeyType="search" /><Text style={s.searchMic}>⌁</Text></View>
    <View style={s.serviceGrid}>{serviceCard('✚', 'Medicines', 'Order health essentials', 'Categories', '#0a4542')}{serviceCard('⚕', 'Consult a doctor', 'Talk to a specialist', 'Consult a Doctor', '#123c50')}{serviceCard('⚗', 'Lab tests', 'Book tests at home', 'Lab Tests', '#362d5b')}{serviceCard('⌂', 'Diagnostics', 'Browse diagnostic providers', 'Lab Tests', '#1c4a38')}</View>
    {banners.length > 0 ? <><View style={s.bannerScroller}><ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setBannerIndex(Math.round(event.nativeEvent.contentOffset.x / bannerWidth))}>{banners.map((banner) => <Pressable key={banner.id} onPress={() => go('Categories')} style={[s.promo, { width: bannerWidth }]}>
      {banner.image_full_url ? <Image source={{ uri: banner.image_full_url }} contentFit="cover" style={s.promoImage} /> : null}
      <View style={s.promoShade} /><Text style={s.promoBrand}>AIMEDIX  ·  HEALTH & WELLNESS</Text><Text style={s.promoTitle}>{banner.title || 'Good health, great savings.'}</Text><Text style={s.promoCopy}>{banner.subtitle || 'Everyday care, delivered to your door.'}</Text><Text style={s.promoCta}>{banner.action_text || 'SHOP NOW  →'}</Text>
    </Pressable>)}</ScrollView></View><View style={s.dots}>{banners.map((banner, i) => <View key={banner.id} style={[s.dot, i === bannerIndex && s.dotOn]} />)}</View></> : null}
    {zones.length > 1 && <><Pressable accessibilityRole="button" accessibilityLabel="Choose your service area on map" onPress={openAreaPicker} style={s.sectionHead}><Text style={s.sectionTitle}>Choose your service area</Text><Text style={s.seeAll}>Choose on map &gt;</Text></Pressable><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.zoneRow}>{zones.map((zone) => <Pressable key={zone.id} onPress={() => { setZoneId(zone.id); setRefreshKey((value) => value + 1); }} style={[s.zoneChip, zone.id === zoneId && s.zoneSelected]}><Text style={[s.zoneText, zone.id === zoneId && s.zoneTextSelected]}>{zone.name}</Text></Pressable>)}</ScrollView></>}
    {section('Shop by category', () => { setCategoryId(null); go('Categories'); })}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryRow}>{categories.slice(0, 8).map((category) => <Pressable key={category.id} onPress={() => { setCategoryId(category.id); go('Category products'); }} style={s.categoryTile}>{category.image_full_url ? <Image source={{ uri: category.image_full_url }} contentFit="cover" style={s.categoryImage} /> : <Text style={s.categoryEmoji}>{category.name.toLowerCase().includes('medicine') ? '💊' : category.name.toLowerCase().includes('baby') ? '🍼' : '✚'}</Text>}<Text style={s.categoryText} numberOfLines={2}>{category.name}</Text></Pressable>)}</ScrollView>
    {section('Featured medicines', () => go('Categories'))}{productCards()}
  </>;

  const categoryScreen = () => <>
    {section('Shop by category')}
    {categories.length ? <View style={s.categoryGrid}>{categories.map((category) => <Pressable key={category.id} onPress={() => { setCategoryId(category.id); go('Category products'); }} style={s.categoryCard}>{category.image_full_url ? <Image source={{ uri: category.image_full_url }} contentFit="cover" style={s.categoryCardImage} /> : <Text style={s.categoryEmoji}>{category.name.toLowerCase().includes('medicine') ? '💊' : '✚'}</Text>}<Text style={s.categoryText}>{category.name}</Text><Text style={s.serviceSub}>Browse products ›</Text></Pressable>)}</View> : empty('▦', 'No categories available', 'Categories added by the pharmacy will appear here.')}
  </>;

  const categoryProductsScreen = () => <>
    <View style={s.searchBox}><Text style={s.searchIcon}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search medicines, brands..." placeholderTextColor={C.muted} style={s.searchInput} /></View>
    {section(categories.find((c) => c.id === categoryId)?.name ?? 'Products')}
    {productCards()}
  </>;

  const productDetailScreen = () => {
    if (!selectedProduct) return empty('Rx', 'Product unavailable', 'Go back and choose another product.');
    const currentPrice = selectedProduct.discount_price && selectedProduct.discount_price > 0 ? selectedProduct.discount_price : selectedProduct.price;
    const demo = selectedProduct.is_demo || selectedProduct.id < 0 || selectedProduct.name.startsWith('DEMO ONLY');
    return <View style={s.formCard}>
      {selectedProduct.thumbnail_full_url ? <Image source={{ uri: selectedProduct.thumbnail_full_url }} contentFit="contain" style={s.detailPhoto} /> : <View style={[s.detailPhoto, s.detailPhotoFallback]}><Text style={s.productFallback}>💊</Text></View>}
      {demo ? <Text style={s.demoOnlyBadge}>DEMO ONLY · Not for sale</Text> : null}
      <Text style={s.productCategory}>{selectedProduct.category_name ?? 'Healthcare'}</Text>
      <Text style={s.detailTitle}>{selectedProduct.name}</Text>
      {selectedProduct.unit ? <Text style={s.formCopy}>Pack: {selectedProduct.unit}</Text> : null}
      <Text style={s.detailPrice}>{money(currentPrice)}{currentPrice < selectedProduct.price ? `  ·  MRP ${money(selectedProduct.price)}` : ''}</Text>
      {selectedProduct.medicine_type && selectedProduct.medicine_type !== 'otc' ? <Text style={s.rxNote}>Prescription may be required</Text> : null}
      <Text style={s.fieldLabel}>Product information</Text>
      <Text style={s.detailDescription}>{selectedProduct.description || 'Product information will be provided by the pharmacy.'}</Text>
      {demo ? <Text style={s.formCopy}>This is a sample product and cannot be added to your cart.</Text> : primaryButton(selectedProduct.stock < 1 ? 'Out of stock' : 'Add to cart', () => void addToCart(selectedProduct))}
    </View>;
  };

  const cartScreen = () => <>
    {summary.extra_discount_threshold > 0 && <View style={s.cartNudge}><Text style={s.nudgeGlyph}>✦</Text><Text style={s.nudgeText}>Add {money(summary.extra_discount_threshold)} more to unlock FLAT 20% OFF on your entire order!</Text></View>}
    {cart.length ? cart.map((item) => <View key={item.id} style={s.cartRow}>{item.thumbnail_full_url ? <Image source={{ uri: item.thumbnail_full_url }} contentFit="contain" style={s.cartImage} /> : <Image source={{ uri: `${backendUrl()}/uploads/demo-assets/medical_medicine_box.png` }} contentFit="contain" style={s.cartImage} />}<View style={{ flex: 1 }}><Text style={s.cartName}>{item.name}</Text><Text style={s.cartSub}>{money(item.price)}{item.unit ? ` · ${item.unit}` : ''}</Text><View style={s.qtyRow}><Pressable onPress={() => void updateQuantity(item, item.quantity - 1)} style={s.qtyButton}><Text style={s.qtyText}>−</Text></Pressable><Text style={s.qtyValue}>{item.quantity}</Text><Pressable onPress={() => void updateQuantity(item, item.quantity + 1)} style={s.qtyButton}><Text style={s.qtyText}>+</Text></Pressable><Pressable onPress={() => void updateQuantity(item, 0)} style={s.remove}><Text style={s.removeText}>Remove</Text></Pressable></View></View><Text style={s.productPrice}>{money(item.price * item.quantity)}</Text></View>) : empty('▱', 'Your cart is empty', 'Add medicines to get started.')}
    {!!cart.length && <View style={s.summaryCard}><Text style={s.summaryTitle}>Bill summary</Text><SummaryLine label="Item total" value={money(summary.subtotal)} /><SummaryLine label="Medicine discount" value={`− ${money(summary.medicine_discount)}`} green /><SummaryLine label="Coupon discount" value={`− ${money(summary.coupon_discount)}`} green /><SummaryLine label="Taxes" value={money(summary.tax_total)} /><SummaryLine label="Delivery" value="FREE" green /><SummaryLine label="Platform & safety packaging" value={money(summary.platform_fee)} /><View style={s.summaryDivider} /><SummaryLine label="To pay" value={money(summary.total)} strong />
      {!profile && <Pressable onPress={() => go('Sign in')} style={s.loginPrompt}><Text style={s.loginPromptText}>Sign in to complete checkout and save your orders  ›</Text></Pressable>}
      <Text style={s.checkoutAddressTitle}>Delivery address</Text><TextInput value={addressText} onChangeText={setAddressText} placeholder="House, street, area, city, PIN code" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton(busy ? 'Placing order…' : `Place order · ${money(summary.total)}`, () => void placeOrder())}</View>}
  </>;

  const accountScreen = () => <>
    {profile ? <View style={s.profileBanner}><View style={s.avatar}><Text style={s.avatarText}>{(profile.name || 'A').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={s.profileName}>{profile.name}</Text><Text style={s.profileSub}>{profile.phone}</Text></View><Pressable onPress={() => { void clearLoginToken(); setProfile(null); setNotice('You signed out.'); }}><Text style={s.signout}>Sign out</Text></Pressable></View> : <Pressable onPress={() => go('Sign in')} style={s.profileBanner}><View style={s.avatar}><Text style={s.avatarText}>S</Text></View><View style={{ flex: 1 }}><Text style={s.profileName}>Sign in to Amedix</Text><Text style={s.profileSub}>Manage your healthcare in one place</Text></View><Text style={s.arrow}>›</Text></Pressable>}
    <View style={s.accountRows}>{([
      ['Personal details', '▣'], ['Medical Orders', '▱'], ['Delivery addresses', '⌖'], ['Saved products', '♡'], ['Refunds', '↶'], ['Wallet', '◉'], ['Notifications', '♧'], ['Prescription Centre', 'Rx'], ['Lab Tests', '⚗'], ['Consult a Doctor', '⚕'], ['Health log', '▤'], ['Help and support', '?'],
    ] as [Page, string][]).map(([target, icon]) => <Pressable key={target} onPress={() => void openPage(target)} style={s.accountRow}><Text style={s.rowIcon}>{icon}</Text><Text style={s.rowTitle}>{target}</Text><Text style={s.arrow}>›</Text></Pressable>)}</View>
  </>;

  const ordersScreen = () => orders.length ? orders.map((order) => <View key={`${order.type || 'order'}-${order.id}`} style={s.orderCard}><View style={{ flex: 1 }}><Text style={s.orderTitle}>{order.order_number || `Order #${order.id}`}</Text><Text style={s.rowSub}>{order.type ? `${order.type} · ` : ''}{String(order.order_status || order.status || 'Pending').replaceAll('_', ' ')} · {order.created_at ?? order.scheduled_at ?? ''}</Text>{order.type === 'Consultation' ? <><Text style={s.rowSub}>{order.consultation_mode === 'clinic' ? 'Offline · Clinic visit' : 'Online consultation'}{order.reason ? ` · ${order.reason}` : ''}</Text>{order.meeting_url ? <Pressable onPress={() => void Linking.openURL(order.meeting_url)}><Text style={s.seeAll}>Join online consultation ↗</Text></Pressable> : null}<Pressable onPress={() => void openDoctorChat(order)}><Text style={s.seeAll}>Chat with doctor ›</Text></Pressable>{String(order.status) === 'completed' ? <View style={s.reportActions}><Pressable onPress={() => void shareConsultationFile(order, 'pdf')} style={s.reportButton}><Text style={s.reportButtonText}>Download PDF</Text></Pressable><Pressable onPress={() => void shareConsultationFile(order, 'csv')} style={s.reportButton}><Text style={s.reportButtonText}>Excel / CSV</Text></Pressable></View> : null}</> : <><Text style={s.productPrice}>{money(order.order_amount ?? order.amount)}</Text>{String(order.report_url ?? '') !== '' ? <Pressable onPress={() => void downloadLabReport(order)}><Text style={s.seeAll}>Download lab report ↓</Text></Pressable> : null}</>}</View></View>) : empty('▱', 'No bookings yet', 'Your medicine orders, lab tests, and appointments will appear here.');

  const servicesScreen = (isLab: boolean) => {
    const items = isLab ? labs : doctors;
    return <>{!zoneId && empty('⌖', 'Choose your delivery area first', 'We use your area to show available local providers.')}{items.length ? items.map((item) => <View key={item.id} style={s.serviceListing}><Text style={s.serviceListingTag}>{isLab ? (item.provider_name || 'Diagnostic lab') : (item.speciality || 'Doctor')}</Text><Text style={s.serviceListingName}>{isLab ? item.name : `Dr. ${item.name}`}</Text><Text style={s.serviceSub}>{isLab ? (item.description || item.preparation || 'Diagnostic test') : `${item.qualification || ''} · ${item.business_name || ''}`}</Text>{!isLab && [item.address_line, item.landmark, item.city, item.state, item.pincode].filter(Boolean).length > 0 ? <Text style={s.serviceSub}>{[item.address_line, item.landmark, item.city, item.state, item.pincode].filter(Boolean).join(', ')}</Text> : null}{!isLab && item.availability_text ? <Text style={s.serviceSub}>Availability · {item.availability_text}</Text> : null}{!isLab && item.latitude && item.longitude ? <Pressable onPress={() => void Linking.openURL(`https://maps.google.com/?q=${item.latitude},${item.longitude}`)}><Text style={s.seeAll}>View clinic location ↗</Text></Pressable> : null}{isLab && !!item.provider_opening_hours ? <Text style={s.serviceSub}>Lab hours · {item.provider_opening_hours}</Text> : null}{isLab && Number(item.report_hours) > 0 ? <Text style={s.serviceSub}>Report in {item.report_hours} hrs</Text> : null}<View style={s.productFooter}><Text style={s.productPrice}>{money(isLab ? item.price : item.consultation_fee)}</Text>{primaryButton('Book', () => { setAppointment({ kind: isLab ? 'lab' : 'doctor', id: Number(item.id) }); go('Booking'); })}</View></View>) : !!zoneId && empty(isLab ? '⚗' : '⚕', isLab ? 'No tests in this area' : 'No doctors in this area', 'Approved providers added by the administrator will appear here.')}</>;
  };

  const loginScreen = () => <View style={s.formCard}><Text style={s.formTitle}>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</Text><Text style={s.formCopy}>Use your phone number to continue securely.</Text>{authMode === 'register' && <TextInput value={authName} onChangeText={setAuthName} placeholder="Full name" placeholderTextColor={C.muted} style={s.input} />}
    <TextInput value={authPhone} onChangeText={setAuthPhone} placeholder="Phone number" keyboardType="phone-pad" placeholderTextColor={C.muted} style={s.input} />{authMode === 'register' && <TextInput value={authEmail} onChangeText={setAuthEmail} placeholder="Email (optional)" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.muted} style={s.input} />}
    <TextInput value={authPassword} onChangeText={setAuthPassword} placeholder="Password (at least 6 characters)" secureTextEntry placeholderTextColor={C.muted} style={s.input} />{primaryButton(busy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account', () => void submitAuth())}
    <Pressable onPress={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setNotice(''); }} style={s.modeSwap}><Text style={s.modeSwapText}>{authMode === 'login' ? 'New to Amedix? Create an account' : 'Already have an account? Sign in'}</Text></Pressable>
  </View>;

  const bookingScreen = () => <View style={s.formCard}><Text style={s.formTitle}>{appointment?.kind === 'lab' ? 'Book a lab test' : 'Request a consultation'}</Text><Text style={s.formCopy}>Choose online or visit the clinic. The provider will confirm your appointment.</Text>{appointment?.kind === 'doctor' ? <><Text style={s.fieldLabel}>Consultation type</Text><View style={s.reportActions}><Pressable onPress={() => setConsultationMode('online')} style={[s.reportButton, consultationMode === 'online' && s.reportButtonOn]}><Text style={s.reportButtonText}>Online</Text></Pressable><Pressable onPress={() => setConsultationMode('clinic')} style={[s.reportButton, consultationMode === 'clinic' && s.reportButtonOn]}><Text style={s.reportButtonText}>Offline · Clinic</Text></Pressable></View><TextInput value={consultationReason} onChangeText={setConsultationReason} placeholder="What would you like to discuss? (optional)" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} /></> : null}<Text style={s.fieldLabel}>Preferred date and time</Text><TextInput value={bookingTime} onChangeText={setBookingTime} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={C.muted} style={s.input} />{primaryButton('Send booking request', () => void submitBooking())}{primaryButton('Cancel', () => { setAppointment(null); back(); }, true)}</View>;

  const pageBody = () => {
    if (page === 'Home') return homeScreen();
    if (page === 'Categories') return categoryScreen();
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
    if (page === 'Wallet') return <><View style={s.walletCard}><Text style={s.rowSub}>Available balance</Text><Text style={s.walletAmount}>{money(config?.wallet?.balance)}</Text></View>{empty('◉', 'Wallet activity', 'Wallet transactions will appear here.')}</>;
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
    if (page === 'Health log') return empty('▤', 'Health records', 'Health records are not available in the connected customer API yet.');
    if (page === 'Appearance') return <View style={s.formCard}>{['Use device setting', 'Light', 'Dark'].map((item) => <Pressable key={item} onPress={() => setAppearance(item)} style={s.choice}><Text style={s.rowIcon}>{appearance === item ? '●' : '○'}</Text><Text style={s.rowTitle}>{item}</Text></Pressable>)}</View>;
    if (page === 'Help and support') return <View style={s.formCard}><Text style={s.formTitle}>How can we help?</Text><TextInput value={supportSubject} onChangeText={setSupportSubject} placeholder="Subject" placeholderTextColor={C.muted} style={s.input} /><TextInput value={supportMessage} onChangeText={setSupportMessage} placeholder="Describe your issue" placeholderTextColor={C.muted} multiline style={[s.input, s.addressInput]} />{primaryButton('Send support request', async () => { try { await apiCall('/support', { method: 'POST', body: { subject: supportSubject, message: supportMessage } }); setSupportSubject(''); setSupportMessage(''); setNotice('Your request was sent to support.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Support request failed.'); } })}</View>;
    return empty('✚', 'Coming soon', 'This section will be available shortly.');
  };

  const title = page === 'Category products' ? (categories.find((category) => category.id === categoryId)?.name ?? 'Products') : page === 'My Account' ? 'My Account' : page === 'Medical Orders' ? 'My Orders' : page === 'Booking' ? 'Booking' : page === 'Product details' ? 'Product details' : page;
  // Keep the primary navigation limited to the four customer areas. Cart remains
  // available from the bag button so shopping and checkout are still reachable.
  const navItems: [string, Page, string][] = [['⌂', 'Home', 'Home'], ['▦', 'Categories', 'Categories'], ['▱', 'Medical Orders', 'Orders'], ['◉', 'My Account', 'My Account']];

  return <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}><StatusBar barStyle="light-content" backgroundColor={C.bg} />
    <View style={s.header}>{page === 'Home' ? <><Pressable onPress={() => setMenuOpen(true)} style={s.hamburger}><Text style={s.hamburgerText}>☰</Text></Pressable><Text style={s.brand}>AIMEDIX<Text style={s.brandSub}>  MEDS</Text></Text><Pressable accessibilityLabel="Open cart" onPress={() => { setPage('Cart'); setHistory((items) => [...items, page]); void loadCart(); }} style={s.headerAction}><Text style={s.headerGlyph}>▣</Text>{summary.items_count > 0 && <View style={s.cartBadge}><Text style={s.cartBadgeText}>{summary.items_count}</Text></View>}</Pressable><Pressable accessibilityLabel="Notifications" onPress={() => void openPage('Notifications')} style={s.headerAction}><Text style={s.headerGlyph}>♧</Text></Pressable></> : <><Pressable onPress={back} style={s.back}><Text style={s.backText}>‹</Text></Pressable><Text style={s.headerTitle}>{title}</Text><Pressable accessibilityLabel="Open cart" onPress={() => { setHistory((items) => [...items, page]); setPage('Cart'); void loadCart(); }} style={s.headerAction}><Text style={s.headerGlyph}>▣</Text>{summary.items_count > 0 && <View style={s.cartBadge}><Text style={s.cartBadgeText}>{summary.items_count}</Text></View>}</Pressable></>}</View>
    {notice && page !== 'Home' ? <Pressable onPress={() => setNotice('')} style={s.notice}><Text style={s.noticeText}>{notice}</Text><Text style={s.dismiss}>×</Text></Pressable> : null}
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>{pageBody()}</ScrollView>
    <View style={[s.tabs, { height: 59 + safeAreaInsets.bottom, paddingBottom: safeAreaInsets.bottom }]}>{navItems.map(([glyph, label, caption]) => <Pressable key={label} onPress={() => { setMenuOpen(false); setNotice(''); setHistory([]); if (label === 'Medical Orders') void openPage(label); else setPage(label); if (label === 'My Account' && !profile) setAuthMode('login'); }} style={s.tab}><Text style={[s.tabIcon, page === label && s.tabOn]}>{glyph}</Text><Text style={[s.tabLabel, page === label && s.tabOn]}>{caption}</Text></Pressable>)}</View>
    {menuOpen && <View style={s.menuOverlay}><Pressable onPress={() => setMenuOpen(false)} style={s.menuScrim} /><View style={s.menuPanel}><View style={s.menuTop}><Text style={s.menuBrand}>AIMEDIX</Text><Pressable onPress={() => setMenuOpen(false)}><Text style={s.closeMenu}>×</Text></Pressable></View>{zones.length > 0 && <><Text style={s.menuSection}>DELIVERING TO</Text>{zones.map((zone) => <Pressable key={zone.id} onPress={() => { setZoneId(zone.id); setMenuOpen(false); setRefreshKey((value) => value + 1); }} style={s.menuItem}><Text style={s.rowIcon}>⌖</Text><Text style={[s.menuItemText, zoneId === zone.id && s.seeAll]}>{zone.name}</Text><Text style={s.arrow}>{zone.id === zoneId ? '✓' : '›'}</Text></Pressable>)}</>}
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

function SummaryLine({ label, value, green = false, strong = false }: { label: string; value: string; green?: boolean; strong?: boolean }) {
  return <View style={s.summaryLine}><Text style={[s.summaryLabel, strong && s.summaryStrong]}>{label}</Text><Text style={[s.summaryValue, green && s.green, strong && s.summaryStrong]}>{value}</Text></View>;
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: C.bg
  },
  header: {
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#152022',
    gap: 12

  },
  hamburger: {
    height: 38,
    width: 38,
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
    fontSize: 10,
    letterSpacing: 2
  },
  headerAction: {
    width: 36,
    height: 36,
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
    fontSize: 10

  },
  locationValue: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2

  },
  arrow: {
    color: '#89969b',
    fontSize: 21
  },
  searchBox: {
    height: 43,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#20292c',
    marginBottom: 12

  },
  searchIcon: {
    fontSize: 22,
    color: C.muted
  },
  searchInput: {
    flex: 1,
    color: C.white,
    marginLeft: 8,
    fontSize: 12,
    paddingVertical: 4
  },
  searchMic: {
    color: C.teal,
    fontSize: 18
  },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 9,
    marginBottom: 15
  },
  serviceCard: {
    width: '49%',
    minHeight: 72,
    padding: 10,
    borderRadius: 14,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  serviceGlyph: {
    color: C.mint,
    fontSize: 18
  },
  serviceTitle: {
    color: C.white,
    fontSize: 10,
    fontWeight: '800'
  },
  serviceSub: {
    color: C.muted,
    fontSize: 8,
    marginTop: 4
  },
  demoOnlyBadge: {
    color: '#ffca72',
    fontSize: 8,
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
    fontSize: 8,
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
    fontSize: 10,
    marginTop: 5
  },
  promoCta: {
    color: 'white',
    fontSize: 9,
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
    width: 5, backgroundColor: '#415151',
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
    color: C.teal, fontSize: 10,
    fontWeight: '700'
  },
  reportActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 8
  },
  reportButton: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#27655f',
    backgroundColor: '#172423',
    paddingHorizontal: 12,
    paddingVertical: 8

  }, reportButtonOn: {
    backgroundColor: '#087f78'
  },
  reportButtonText: {
    color: C.mint,
    fontSize: 9,
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
  categoryCardImage: { width: 58, height: 58, borderRadius: 12 },

  categoryEmoji: {
    color: C.teal,
    fontSize: 23
  },
  categoryText: {
    color: '#d2dadd',
    fontSize: 8,
     fontWeight: '700',
    textAlign: 'center', lineHeight: 11
  },
  chatBubble: { maxWidth: '85%', alignSelf: 'flex-start', backgroundColor: '#20282c', padding: 10, borderRadius: 11 },
  chatBubbleMine: { alignSelf: 'flex-end', backgroundColor: '#075d55' },
  chatMessage: { color: C.white, fontSize: 10, lineHeight: 15 },
  chatTime: { color: C.muted, fontSize: 7, marginTop: 5 },
  filterChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  filterChipOn: {
    backgroundColor: '#064d48',
    borderColor: C.teal
  },
  filterText: {
    color: '#c3cccf',
    fontSize: 10
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
    backgroundColor: '#063d3a'
  },
  zoneText: {
    color: '#bdc7ca',
    fontSize: 10
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
    borderColor: '#1d272a'
  },
  productImage: {
    height: 102, borderRadius: 10, backgroundColor: '#20282c',
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
    backgroundColor: '#20282c',
    borderRadius: 12,
    marginBottom: 16

  },

  detailPhotoFallback: {
    width: '100%',
    height: 190,
    backgroundColor: '#20282c',
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
    color: '#c3cccf',
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
    backgroundColor: '#0c1416',
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
    fontSize: 7,
    fontWeight: '900',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3
  },
  productCategory: {
    color: C.teal, fontSize: 8, fontWeight: '700',
    marginBottom: 3
  },
  productName: {
    color: C.white,
    fontSize: 11,
    fontWeight: '800',
    minHeight: 28
  },
  productDesc: {
    color: C.muted,
    fontSize: 8,
    marginTop: 4
  },
  rxNote: {
    color: '#e5bd80',
    fontSize: 7,
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
    fontSize: 12
  },
  mrp: {
    color: C.muted,
    fontSize: 8,
    marginTop: 3
  },
  strike: {
    textDecorationLine: 'line-through'
  },
  addButton: {
    minWidth: 30,
    height: 29,
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
    backgroundColor: '#454c4e'
  },
  tabs: {
    height: 59,
    borderTopWidth: 1,
    borderColor: '#20282b',
    flexDirection: 'row',
    backgroundColor: '#090e10',
    justifyContent: 'space-around',
    paddingTop: 7
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2
  },
  tabIcon: {
    color: '#728085', fontSize: 23, lineHeight: 25, fontWeight: '900'
  }, tabOn: {
    color: C.teal

  },
  tabLabel: {
    color: '#879297',
    fontSize: 8
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
  }, cartBadgeText: { color: 'white', fontSize: 8, fontWeight: '800' },
  configBanner: { backgroundColor: '#15322e', padding: 12, borderRadius: 12, marginBottom: 10 }, configTitle: { color: C.mint, fontSize: 11, fontWeight: '800' }, configText: { color: '#b3c5c5', fontSize: 9, lineHeight: 14, marginTop: 4 }, notice: { flexDirection: 'row', alignItems: 'center', padding: 11, borderRadius: 11, backgroundColor: '#3d2c16', marginBottom: 10, gap: 8 }, noticeText: { color: '#f6dcaa', fontSize: 10, flex: 1 }, dismiss: { color: '#f6dcaa', fontSize: 19 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 }, emptyGlyph: { color: C.teal, fontSize: 28, marginBottom: 9 }, emptyTitle: { color: '#e5eeee', fontSize: 12, fontWeight: '700', textAlign: 'center' }, emptyCopy: { color: C.muted, fontSize: 9, textAlign: 'center', marginTop: 5, lineHeight: 14, maxWidth: 245 },
  cartNudge: { backgroundColor: '#0b4239', borderRadius: 12, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, nudgeGlyph: { color: '#8ef6cc', fontSize: 17 }, nudgeText: { color: '#d4ffec', fontSize: 10, fontWeight: '700', flex: 1, lineHeight: 15 }, cartRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: C.card, padding: 9, borderRadius: 12, marginBottom: 8 }, cartImage: { width: 53, height: 53, borderRadius: 9 }, cartFallback: { backgroundColor: '#20282c', alignItems: 'center', justifyContent: 'center' }, cartName: { color: C.white, fontSize: 10, fontWeight: '800' }, cartSub: { color: C.muted, fontSize: 8, marginTop: 3 }, qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 7 }, qtyButton: { width: 23, height: 22, borderRadius: 6, backgroundColor: '#253033', alignItems: 'center', justifyContent: 'center' }, qtyText: { color: C.mint, fontSize: 14 }, qtyValue: { color: C.white, fontSize: 10 }, remove: { marginLeft: 3 }, removeText: { color: C.red, fontSize: 8 }, summaryCard: { backgroundColor: C.card, padding: 13, borderRadius: 14, marginTop: 6 }, summaryTitle: { color: C.white, fontSize: 14, fontWeight: '900', marginBottom: 8 }, summaryLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }, summaryLabel: { color: '#b1bcbe', fontSize: 10 }, summaryValue: { color: '#e8eeee', fontSize: 10, fontWeight: '600' }, summaryStrong: { color: C.white, fontSize: 12, fontWeight: '900' }, green: { color: '#78e4aa' }, summaryDivider: { height: 1, backgroundColor: C.line, marginTop: 4 }, loginPrompt: { padding: 10, marginTop: 7, borderRadius: 9, backgroundColor: '#123433' }, loginPromptText: { color: C.mint, fontSize: 9 }, checkoutAddressTitle: { color: C.white, fontSize: 10, fontWeight: '800', marginTop: 12, marginBottom: 6 }, addressInput: { height: 70, textAlignVertical: 'top' }, input: { minHeight: 40, borderRadius: 9, backgroundColor: '#20272b', color: C.white, fontSize: 10, paddingHorizontal: 10, paddingVertical: 9, marginBottom: 7, borderWidth: 1, borderColor: '#293135' },
  button: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: C.tealDark, paddingHorizontal: 12, marginTop: 7 }, buttonText: { color: 'white', fontSize: 10, fontWeight: '900' }, buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#185350' }, buttonTextOutline: { color: C.mint }, profileBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, padding: 12, backgroundColor: '#078f86', gap: 10, marginBottom: 13 }, avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#e7fbf8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: C.tealDark, fontWeight: '900', fontSize: 18 }, profileName: { color: 'white', fontSize: 13, fontWeight: '800' }, profileSub: { color: '#dbfff9', fontSize: 9, marginTop: 3 }, signout: { color: 'white', fontSize: 9, fontWeight: '800' }, accountRows: { gap: 7, marginTop: 4 }, accountRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 11, backgroundColor: C.card, gap: 11 }, rowIcon: { color: C.teal, fontSize: 17, width: 24, textAlign: 'center' }, rowTitle: { color: '#e8eeee', fontSize: 10, fontWeight: '700', flex: 1 }, rowSub: { color: C.muted, fontSize: 8, marginTop: 4 }, orderCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 13, borderRadius: 13, marginBottom: 8 }, orderTitle: { color: C.white, fontSize: 11, fontWeight: '800' }, serviceListing: { backgroundColor: C.card, padding: 13, borderRadius: 14, marginBottom: 9 }, serviceListingTag: { color: C.teal, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }, serviceListingName: { color: C.white, fontSize: 14, fontWeight: '900', marginTop: 6 }, featureBanner: { backgroundColor: '#078f86', padding: 16, borderRadius: 15, marginBottom: 13 }, featureEyebrow: { color: '#b8fff3', fontSize: 8, letterSpacing: 1.5, fontWeight: '800', marginBottom: 7 }, featureTitle: { color: 'white', fontWeight: '900', fontSize: 18 }, featureCopy: { color: '#d5fffa', fontSize: 9, lineHeight: 14, marginTop: 6 }, filePicker: { minHeight: 42, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 9, backgroundColor: '#20272b', gap: 8, marginBottom: 7 }, filePickerText: { color: '#dbe3e4', fontSize: 9, flex: 1 }, formCard: { backgroundColor: C.card, padding: 14, borderRadius: 14 }, formTitle: { color: C.white, fontSize: 18, fontWeight: '900', marginBottom: 5 }, formCopy: { color: C.muted, fontSize: 9, lineHeight: 14, marginBottom: 13 }, modeSwap: { alignItems: 'center', paddingVertical: 14 }, modeSwapText: { color: C.teal, fontSize: 10, fontWeight: '700' }, fieldLabel: { color: '#dbe3e4', fontSize: 9, fontWeight: '700', marginVertical: 6 }, walletCard: { padding: 18, borderRadius: 15, backgroundColor: '#078f86', marginBottom: 14 }, walletAmount: { color: 'white', fontSize: 26, fontWeight: '900', marginTop: 5 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 }, modalCard: { backgroundColor: C.raised, padding: 14, borderRadius: 13, marginTop: 12 },
  menuOverlay: { ...StyleSheet.absoluteFill, zIndex: 20, flexDirection: 'row' }, menuScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.6)' }, menuPanel: { width: '83%', maxWidth: 350, backgroundColor: '#0b1113', height: '100%', paddingHorizontal: 16, paddingTop: 13, borderRightWidth: 1, borderColor: '#263135' }, menuTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, marginBottom: 10 }, menuBrand: { color: C.mint, fontSize: 16, fontWeight: '900', letterSpacing: 1 }, closeMenu: { color: C.white, fontSize: 25 }, menuSection: { color: '#78878c', fontSize: 8, fontWeight: '900', letterSpacing: 1.4, marginTop: 10, marginBottom: 5 }, menuItem: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#1b2629' }, menuItemText: { color: '#e0e8e9', fontSize: 10, flex: 1 }, menuSignout: { borderRadius: 9, padding: 11, borderWidth: 1, borderColor: '#20413e', alignItems: 'center', marginTop: 14 }, menuSignoutText: { color: C.mint, fontSize: 10, fontWeight: '800' }, menuFooter: { color: '#657277', fontSize: 8, lineHeight: 13, marginTop: 'auto', paddingVertical: 14 },
  areaPickerModalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' }, areaPickerScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.62)' }, areaPickerSheet: { maxHeight: '82%', backgroundColor: '#101719', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24, borderWidth: 1, borderColor: C.line }, areaPickerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }, areaPickerTitle: { color: C.white, fontSize: 17, fontWeight: '900' }, areaPickerCopy: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 280 }, areaPickerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.line }, areaPickerContent: { paddingBottom: 6 }, locationNotice: { color: '#f6dcaa', fontSize: 10, lineHeight: 15, marginTop: 8, marginBottom: 4 }, locationCoverageNote: { color: '#bdc7ca', backgroundColor: '#20272b', borderRadius: 9, padding: 10, fontSize: 9, lineHeight: 14, marginTop: 8 },
});

