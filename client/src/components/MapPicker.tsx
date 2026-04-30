import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';

// مركز العبور كنقطة بداية افتراضية
const OBUR_CENTER: [number, number] = [30.2350, 31.4650];

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
  icon?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation, title, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : OBUR_CENTER
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

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

  const handleAddressChange = (newAddr: string) => {
    setAddress(newAddr);
    onLocationSelect({ address: newAddr, latitude: position[0], longitude: position[1] });
  };

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(OBUR_CENTER[0], OBUR_CENTER[1]);
    }
  }, []);

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
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // البحث الشامل عن كل شيء (مثل Google Maps)
        // استخدام Nominatim مع معاملات متقدمة للحصول على نتائج أفضل
        let searchQuery = query;
        
        // إضافة "مصر" للبحث إذا لم تكن موجودة
        if (!searchQuery.toLowerCase().includes('مصر') && !searchQuery.toLowerCase().includes('egypt')) {
          searchQuery = `${searchQuery} مصر`;
        }

        // البحث مع تركيز على منطقة القاهرة والعبور
        // viewbox: [min_lon, min_lat, max_lon, max_lat]
        // هذا يغطي القاهرة والجيزة والقليوبية
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=20&accept-language=ar&viewbox=30.5,29.8,31.8,30.5&bounded=0&featuretype=settlement,amenity,shop,restaurant,cafe,building`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        let results: SearchResult[] = [];
        if (data && Array.isArray(data)) {
          results = data
            .filter((item: any) => {
              // تصفية النتائج لإظهار فقط المواقع في مصر أو القريبة من العبور
              const displayName = item.display_name.toLowerCase();
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              
              // قبول النتائج في مصر أو القريبة من العبور (ضمن 50 كم تقريباً)
              const isInEgypt = displayName.includes('مصر') || 
                               displayName.includes('cairo') || 
                               displayName.includes('egypt') ||
                               displayName.includes('القاهرة') ||
                               displayName.includes('الجيزة') ||
                               displayName.includes('القليوبية');
              
              const distanceFromObur = Math.sqrt(
                Math.pow(lat - OBUR_CENTER[0], 2) + Math.pow(lon - OBUR_CENTER[1], 2)
              );
              
              return isInEgypt || distanceFromObur < 1; // ~1 درجة ≈ 111 كم
            })
            .map((item: any) => ({
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              display_name: item.display_name,
              type: item.type || item.class || 'place',
              icon: item.icon,
            }));
        }

        // إذا لم نجد نتائج، حاول بحثاً بديلاً بدون تصفية صارمة
        if (results.length === 0) {
          const alternativeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&accept-language=ar`;
          const alternativeResponse = await fetch(alternativeUrl);
          const alternativeData = await alternativeResponse.json();
          
          if (alternativeData && Array.isArray(alternativeData)) {
            results = alternativeData.map((item: any) => ({
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              display_name: item.display_name,
              type: item.type || item.class || 'place',
              icon: item.icon,
            }));
          }
        }

        setSearchResults(results);
        setShowResults(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newPos: [number, number] = [result.lat, result.lon];
    setPosition(newPos);
    setAddress(result.display_name);
    setSearchQuery('');
    setShowResults(false);
    onLocationSelect({
      address: result.display_name,
      latitude: result.lat,
      longitude: result.lon,
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  };

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
        }
      );
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        setShowResults(false);
        reverseGeocode(newPos[0], newPos[1]);
      },
    });
    return position ? <Marker position={position} /> : null;
  }

  // دالة لاستخراج اسم أقصر من العنوان الكامل
  const getShortName = (fullName: string) => {
    const parts = fullName.split(',');
    return parts[0].trim();
  };

  // دالة لاستخراج نوع المكان من العنوان
  const getPlaceType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'restaurant': '🍽️ مطعم',
      'cafe': '☕ كافيه',
      'fast_food': '🍔 وجبات سريعة',
      'bar': '🍺 حانة',
      'pub': '🍻 بار',
      'shop': '🛍️ متجر',
      'supermarket': '🏪 سوبر ماركت',
      'pharmacy': '💊 صيدلية',
      'hospital': '🏥 مستشفى',
      'bank': '🏦 بنك',
      'atm': '💰 صراف آلي',
      'hotel': '🏨 فندق',
      'parking': '🅿️ موقف سيارات',
      'gas_station': '⛽ محطة وقود',
      'school': '🏫 مدرسة',
      'university': '🎓 جامعة',
      'mosque': '🕌 مسجد',
      'church': '⛪ كنيسة',
      'park': '🌳 حديقة',
      'cinema': '🎬 سينما',
      'theatre': '🎭 مسرح',
      'museum': '🏛️ متحف',
      'library': '📚 مكتبة',
      'office': '🏢 مكتب',
      'building': '🏗️ مبنى',
      'place': '📍 موقع',
      'settlement': '🏘️ منطقة',
      'village': '🏘️ قرية',
      'town': '🏙️ مدينة',
      'city': '🌆 مدينة',
    };
    return typeMap[type] || `📍 ${type}`;
  };

  return (
    <div className="space-y-4 w-full">
      {title && <h3 className="text-lg font-black text-slate-800 mr-2">{title}</h3>}

      <div className="relative flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
          <Input
            placeholder={placeholder || "ابحث عن أي شيء... (مطاعم، كافيهات، محلات، مناطق، إلخ)"}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => searchQuery && setShowResults(true)}
            className="h-16 pr-12 pl-12 rounded-2xl border-2 border-orange-100 bg-white shadow-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 font-black text-lg transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="flex-1 h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "بحث"}
          </Button>
          <Button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="h-14 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black transition-all shadow-lg shadow-orange-200"
            title="تحديد موقعي الحالي"
          >
            {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-20 right-0 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full text-right p-4 hover:bg-orange-50 border-b border-slate-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{getShortName(result.display_name)}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.display_name}</p>
                  <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-semibold">
                    {getPlaceType(result.type)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* تكبير حجم الخريطة لتشغل مساحة أكبر */}
      <div className="h-[600px] w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          <MapUpdater center={position} />
        </MapContainer>

        <div className="absolute bottom-6 left-6 right-6 z-[1000]">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الموقع المختار (يمكنك التعديل)</p>
              <textarea
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 resize-none leading-relaxed"
                rows={2}
                placeholder="جاري تحديد الموقع..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
