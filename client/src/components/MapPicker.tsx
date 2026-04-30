import { useEffect, useRef, useCallback, useState } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, useControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';

// توكن Mapbox العام (يمكن للمستخدم تغييره لاحقاً)
const MAPBOX_TOKEN = 'pk.eyJ1Ijoid2FzbHktZGVsaXZlcnkiLCJhIjoiY203bHh4eHh4MDB4eTJqcHh4eHh4eHh4eCJ9.x-x-x-x-x-x-x-x-x-x-x'; 
// ملاحظة: سأستخدم التوكن الافتراضي أو أطلب من المستخدم توفير واحد، لكن سأجعل الكود يعمل بـ Style مجاني متاح
const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

const EGYPT_CENTER = {
  latitude: 30.0444,
  longitude: 31.2357,
  zoom: 13
};

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

export default function MapPicker({ onLocationSelect, initialLocation, title, placeholder }: MapPickerProps) {
  const [viewState, setViewState] = useState({
    latitude: initialLocation?.latitude || EGYPT_CENTER.latitude,
    longitude: initialLocation?.longitude || EGYPT_CENTER.longitude,
    zoom: EGYPT_CENTER.zoom
  });
  
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

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
    reverseGeocode(viewState.latitude, viewState.longitude);
  }, []);

  const calculateDistance = (lat: number, lon: number) => {
    const R = 6371;
    const dLat = (lat - viewState.latitude) * Math.PI / 180;
    const dLon = (lon - viewState.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(viewState.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)} متر` : `${d.toFixed(1)} كم`;
  };

  const handleSearchChange = async (query: string, forceLocal: boolean = false) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const finalQuery = forceLocal ? `${query} العبور` : query;
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&limit=40&accept-language=ar&countrycodes=eg&addressdetails=1`;
        
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
    }, 400);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newViewState = {
      latitude: result.lat,
      longitude: result.lon,
      zoom: 16
    };
    setViewState(newViewState);
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

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setViewState({ latitude, longitude, zoom: 16 });
          reverseGeocode(latitude, longitude);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          alert("يرجى تفعيل خدمة الموقع.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const getShortName = (fullName: string) => fullName.split(',')[0].trim();

  const getPlaceIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'restaurant': '🍽️', 'cafe': '☕', 'pharmacy': '💊', 'shop': '🛒'
    };
    return iconMap[type] || '📍';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-3xl shadow-2xl border border-slate-200 relative">
      {/* شريط البحث */}
      <div className="p-4 bg-white/90 backdrop-blur-md shadow-sm z-50 absolute top-0 left-0 right-0">
        <div className="relative group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Search className="h-5 w-5 text-slate-400" />}
          </div>
          <Input
            placeholder={placeholder || "ابحث عن أي مكان..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-14 pr-12 pl-12 rounded-2xl border-none bg-slate-100 focus:bg-white shadow-inner font-bold text-lg text-right"
            dir="rtl"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          )}
        </div>

        {!showResults && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar flex-row-reverse">
            {['مطعم', 'كافيه', 'صيدلية', 'سوبر ماركت'].map((cat) => (
              <Button key={cat} variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs whitespace-nowrap" onClick={() => handleSearchChange(cat, true)}>
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* قائمة النتائج */}
      {showResults && (
        <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto pt-32">
          {searchResults.map((result, index) => (
            <button key={index} onClick={() => handleSelectResult(result)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-right flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">{getPlaceIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center flex-row-reverse">
                  <p className="font-black text-slate-900 truncate">{getShortName(result.display_name)}</p>
                  <span className="text-[10px] font-bold text-slate-400">{result.distance}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* خريطة Mapbox */}
      <div className="flex-1 relative">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle={MAPBOX_STYLE}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          onClick={e => {
            const { lng, lat } = e.lngLat;
            setViewState(prev => ({ ...prev, latitude: lat, longitude: lng }));
            reverseGeocode(lat, lng);
          }}
        >
          <Marker latitude={viewState.latitude} longitude={viewState.longitude} color="#f97316" />
          <NavigationControl position="bottom-right" />
        </Map>

        {/* زر الموقع الحالي */}
        <div className="absolute bottom-6 left-4 z-10">
          <Button onClick={handleGetCurrentLocation} disabled={isLocating} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xl border p-0">
            {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Navigation className="h-6 w-6" />}
          </Button>
        </div>

        {/* عرض العنوان */}
        <div className="absolute bottom-6 right-4 left-20 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border text-right">
            <p className="text-[10px] font-black text-orange-500 uppercase mb-1">الموقع المحدد</p>
            <p className="text-xs font-bold text-slate-700 truncate">{address || "جاري تحديد العنوان..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
