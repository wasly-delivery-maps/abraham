import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Check, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import { cn } from '@/lib/utils';

// استيراد CSS الخاص بـ Leaflet
import 'leaflet/dist/leaflet.css';

// إعداد أيقونة الدبوس
const markerHtmlStyles = `
  background-color: #f97316;
  width: 2rem;
  height: 2rem;
  display: block;
  left: -1rem;
  top: -1rem;
  position: relative;
  border-radius: 2rem 2rem 0;
  transform: rotate(45deg);
  border: 2px solid #ffffff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
`;

const customIcon = L.divIcon({
  className: "custom-pin-icon",
  iconAnchor: [0, 16],
  popupAnchor: [0, -24],
  html: `<span style="${markerHtmlStyles}" />`
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
  const [isFullScreen, setIsFullScreen] = useState(false);
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
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalQuery)}&limit=20&accept-language=ar&countrycodes=eg`;
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

  const handleGetCurrentLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    return position ? <Marker position={position} icon={customIcon} /> : null;
  }

  return (
    <div 
      className={cn(
        "flex flex-col bg-white overflow-hidden transition-all duration-300 ease-in-out relative",
        isFullScreen 
          ? "fixed inset-0 z-[9999] h-screen w-screen rounded-0" 
          : "h-full w-full rounded-3xl shadow-2xl border border-slate-200 min-h-[500px]"
      )}
    >
      {/* شريط البحث */}
      <div className={cn(
        "p-4 bg-white/90 backdrop-blur-md shadow-sm z-[1000] absolute top-0 left-0 right-0",
        isFullScreen && "pt-10" // مساحة إضافية في وضع ملء الشاشة للموبايل
      )}>
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
          {isFullScreen && (
            <button 
              onClick={() => setIsFullScreen(false)} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          )}
        </div>

        {!showResults && !isFullScreen && (
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
      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto pt-32">
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

      {/* الخريطة */}
      <div 
        className="flex-1 relative z-10 cursor-pointer"
        onClick={() => !isFullScreen && setIsFullScreen(true)}
      >
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
          />
          <MapEvents />
          <MapUpdater center={position} />
        </MapContainer>
        
        {!isFullScreen && (
          <div className="absolute inset-0 bg-transparent z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-orange-500/10 backdrop-blur-[1px] p-3 rounded-full border border-orange-500/20 animate-pulse">
              <Maximize2 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        )}

        {/* زر الموقع الحالي */}
        <div className="absolute bottom-6 left-4 z-[1000]">
          <Button onClick={handleGetCurrentLocation} disabled={isLocating} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xl border p-0">
            {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Navigation className="h-6 w-6" />}
          </Button>
        </div>

        {/* عرض العنوان وزر التأكيد في وضع ملء الشاشة */}
        <div className={cn(
          "absolute bottom-6 right-4 left-20 z-[1000] flex flex-col gap-3",
          isFullScreen && "left-4 right-4 bottom-10"
        )}>
          <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl border text-right">
            <p className="text-[10px] font-black text-orange-500 uppercase mb-1">الموقع المحدد</p>
            <p className="text-sm font-bold text-slate-700 truncate">{address || "جاري تحديد العنوان..."}</p>
          </div>
          
          {isFullScreen && (
            <Button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
              className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl flex items-center justify-center gap-2"
            >
              <Check className="h-6 w-6" />
              تأكيد هذا الموقع
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
