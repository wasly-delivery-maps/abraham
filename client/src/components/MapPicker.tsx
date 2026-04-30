import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';
import L from 'leaflet';

// نقطة بداية افتراضية (القاهرة)
const EGYPT_CENTER: [number, number] = [30.0444, 31.2357];

interface MapPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number };
  title?: string;
  placeholder?: string;
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  type: string;
  importance?: number;
  distance?: string;
}

// مكون لتحديث عرض الخريطة
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() < 13 ? 16 : map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation, title, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : EGYPT_CENTER
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // تحميل عمليات البحث الأخيرة
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  // تحويل الإحداثيات إلى عنوان (Reverse Geocoding)
  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const addr = data.display_name || 'موقع غير معروف';
      setAddress(addr);
      onLocationSelect({ address: addr, latitude: lat, longitude: lon });
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress('موقع غير معروف');
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(EGYPT_CENTER[0], EGYPT_CENTER[1]);
    }
  }, []);

  // حساب المسافة التقريبية
  const calculateDistance = (lat: number, lon: number) => {
    const R = 6371;
    const dLat = (lat - position[0]) * Math.PI / 180;
    const dLon = (lon - position[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(position[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)} متر` : `${d.toFixed(1)} كم`;
  };

  // معالجة البحث
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // البحث في مصر بالكامل مع تحسين النتائج
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ar&countrycodes=eg&addressdetails=1`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data && Array.isArray(data)) {
          const results = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            type: item.type || item.class || 'place',
            importance: item.importance || 0,
            distance: calculateDistance(parseFloat(item.lat), parseFloat(item.lon))
          }));
          
          results.sort((a, b) => (b.importance || 0) - (a.importance || 0));
          setSearchResults(results);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newPos: [number, number] = [result.lat, result.lon];
    setPosition(newPos);
    setAddress(result.display_name);
    saveRecentSearch(getShortName(result.display_name));
    setSearchQuery('');
    setShowResults(false);
    onLocationSelect({
      address: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    });
  };

  // تحديد الموقع الحالي بدقة عالية
  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
          alert("يرجى تفعيل خدمة الموقع في متصفحك لتحديد موقعك الحالي.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      alert("متصفحك لا يدعم خاصية تحديد الموقع.");
    }
  };

  // مكون للتعامل مع أحداث الخريطة (النقر والتحريك)
  function MapEvents() {
    const map = useMapEvents({
      click(e) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        setShowResults(false);
        reverseGeocode(newPos[0], newPos[1]);
      },
      moveend() {
        // تحديث الموقع عند انتهاء تحريك الخريطة (اختياري، لكن النقر أدق)
        // إذا أردت تفعيل الاختيار بالتحريك، يمكنك استخدام map.getCenter() هنا
      }
    });
    return position ? <Marker position={position} /> : null;
  }

  const getShortName = (fullName: string) => {
    const parts = fullName.split(',');
    return parts[0].trim();
  };

  const getPlaceIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'restaurant': '🍽️', 'cafe': '☕', 'fast_food': '🍔', 'shop': '🛍️',
      'pharmacy': '💊', 'hospital': '🏥', 'bank': '🏦', 'mosque': '🕌',
      'school': '🏫', 'park': '🌳', 'hotel': '🏨', 'gas_station': '⛽'
    };
    return iconMap[type] || '📍';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-3xl shadow-2xl border border-slate-200">
      {/* شريط البحث */}
      <div className="p-4 bg-white shadow-sm z-50">
        <div className="relative group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />}
          </div>
          <Input
            placeholder={placeholder || "ابحث عن أي مكان في مصر..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-14 pr-12 pl-12 rounded-2xl border-none bg-slate-100 focus:bg-white shadow-inner focus:ring-2 focus:ring-orange-500/20 font-bold text-lg transition-all text-right"
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          )}
        </div>

        {/* أزرار سريعة */}
        {!showResults && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar flex-row-reverse">
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap" onClick={() => handleSearchChange("مطعم")}>
              🍽️ مطاعم
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap" onClick={() => handleSearchChange("كافيه")}>
              ☕ كافيهات
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap" onClick={() => handleSearchChange("صيدلية")}>
              💊 صيدليات
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap" onClick={() => handleSearchChange("سوبر ماركت")}>
              🛒 تسوق
            </Button>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-[500px]">
        {/* قائمة النتائج */}
        {showResults && (
          <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto animate-in slide-in-from-top duration-200">
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors text-right flex-row-reverse"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                    {getPlaceIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center flex-row-reverse">
                      <p className="font-black text-slate-900 truncate">{getShortName(result.display_name)}</p>
                      <span className="text-[10px] font-bold text-slate-400 ml-2">{result.distance}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{result.display_name}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </button>
              ))
            ) : !isSearching && searchQuery ? (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapIcon className="h-10 w-10 text-slate-300" />
                </div>
                <p className="font-bold text-slate-500">لم نجد نتائج لـ "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">جرب كتابة اسم المنطقة أو الشارع</p>
              </div>
            ) : !isSearching && recentSearches.length > 0 ? (
              <div>
                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">عمليات البحث الأخيرة</p>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchChange(s)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-right flex-row-reverse"
                  >
                    <Clock className="h-4 w-4 text-slate-300" />
                    <span className="font-bold text-slate-700 mr-2">{s}</span>
                  </button>
                ))}
              </div>
            ) : isSearching && (
              <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                <p className="font-bold text-slate-500">جاري البحث عن أفضل النتائج...</p>
              </div>
            )}
          </div>
        )}

        {/* الخريطة */}
        <div className="absolute inset-0 z-10">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents />
            <MapUpdater center={position} />
          </MapContainer>

          {/* زر الموقع الحالي */}
          <div className="absolute bottom-6 left-4 z-[1000]">
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xl border border-slate-100 p-0"
              title="تحديد موقعي الحالي"
            >
              {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Navigation className="h-6 w-6" />}
            </Button>
          </div>

          {/* تلميح للمستخدم */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
              انقر على الخريطة لتحديد الموقع بدقة 📍
            </div>
          </div>
          
          {/* عرض العنوان الحالي بشكل بسيط */}
          <div className="absolute bottom-6 right-4 left-20 z-[1000] pointer-events-none">
            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border border-slate-100 text-right">
              <p className="text-[10px] font-black text-orange-500 uppercase mb-1">الموقع المحدد</p>
              <p className="text-xs font-bold text-slate-700 truncate">{address || "جاري تحديد العنوان..."}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
