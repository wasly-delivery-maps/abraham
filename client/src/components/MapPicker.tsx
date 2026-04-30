import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// أيقونة الدبوس الافتراضية لـ Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
    
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(EGYPT_CENTER[0], EGYPT_CENTER[1]);
    }
  }, []);

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
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&limit=40&accept-language=ar&countrycodes=eg`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (Array.isArray(data)) {
          setSearchResults(data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            type: item.type || 'place'
          })));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newPos: [number, number] = [result.lat, result.lon];
    setPosition(newPos);
    setAddress(result.display_name);
    setSearchQuery('');
    setShowResults(false);
    onLocationSelect({ address: result.display_name, latitude: result.lat, longitude: result.lon });
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  function MapEvents() {
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

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-3xl shadow-2xl border border-slate-200 relative">
      <div className="p-4 bg-white/90 backdrop-blur-md shadow-sm z-[1000] absolute top-0 left-0 right-0">
        <div className="relative group">
          <Input
            placeholder={placeholder || "ابحث عن أي مكان..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-14 pr-12 pl-12 rounded-2xl border-none bg-slate-100 focus:bg-white shadow-inner font-bold text-lg text-right"
            dir="rtl"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Search className="h-5 w-5 text-slate-400" />}
          </div>
        </div>
      </div>

      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto pt-24">
          {searchResults.map((result, index) => (
            <button key={index} onClick={() => handleSelectResult(result)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-right flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">📍</div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate">{result.display_name.split(',')[0]}</p>
                <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 relative z-10">
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          {/* استخدام تصميم CartoDB Voyager الاحترافي والنظيف */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapEvents />
          <MapUpdater center={position} />
        </MapContainer>
        
        <div className="absolute bottom-6 left-4 z-[1000]">
          <Button onClick={handleGetCurrentLocation} disabled={isLocating} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xl border p-0">
            {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Navigation className="h-6 w-6" />}
          </Button>
        </div>

        <div className="absolute bottom-6 right-4 left-20 z-[1000] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-xl border text-right">
            <p className="text-[10px] font-black text-orange-500 uppercase mb-1">الموقع المحدد</p>
            <p className="text-xs font-bold text-slate-700 truncate">{address || "جاري تحديد العنوان..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
