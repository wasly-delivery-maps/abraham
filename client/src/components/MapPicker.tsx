import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';
import L from 'leaflet';

// استيراد CSS الخاص بـ Leaflet بشكل مباشر لضمان ظهوره
import 'leaflet/dist/leaflet.css';

// إعداد أيقونات الخريطة بشكل يدوي لتجنب مشاكل المسارات في Vite/Railway
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() < 13 ? 16 : map.getZoom());
    }
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
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(EGYPT_CENTER[0], EGYPT_CENTER[1]);
    }
  }, []);

  const handleSearchChange = async (query: string) => {
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
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ar&countrycodes=eg`;
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
    <div className="flex flex-col h-full w-full bg-white overflow-hidden rounded-2xl shadow-lg border border-slate-200 relative min-h-[400px]">
      {/* شريط البحث */}
      <div className="p-3 bg-white/95 backdrop-blur-sm z-[1000] absolute top-0 left-0 right-0 border-b">
        <div className="relative">
          <Input
            placeholder={placeholder || "ابحث عن موقعك..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-12 pr-10 pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white text-right font-medium"
            dir="rtl"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> : <Search className="h-4 w-4 text-slate-400" />}
          </div>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setShowResults(false); }} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* قائمة النتائج */}
      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto pt-20">
          {searchResults.map((result, index) => (
            <button key={index} onClick={() => handleSelectResult(result)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 border-b text-right flex-row-reverse">
              <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{result.display_name.split(',')[0]}</p>
                <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* الخريطة */}
      <div className="flex-1 relative z-10">
        <MapContainer 
          center={position} 
          zoom={13} 
          style={{ height: '100%', width: '100%', minHeight: '400px' }} 
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents />
          <MapUpdater center={position} />
        </MapContainer>
        
        {/* زر الموقع الحالي */}
        <div className="absolute bottom-4 left-4 z-[1000]">
          <Button onClick={handleGetCurrentLocation} disabled={isLocating} className="w-12 h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-700 shadow-lg border p-0">
            {isLocating ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Navigation className="h-5 w-5" />}
          </Button>
        </div>

        {/* عرض العنوان */}
        <div className="absolute bottom-4 right-4 left-20 z-[1000] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border text-right">
            <p className="text-[10px] font-bold text-orange-500 uppercase mb-0.5">الموقع المحدد</p>
            <p className="text-xs font-medium text-slate-700 truncate">{address || "جاري تحديد العنوان..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
