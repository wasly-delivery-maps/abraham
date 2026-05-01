import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, Check, Maximize2 } from 'lucide-react';
import L from 'leaflet';
import { cn } from '@/lib/utils';

// استيراد CSS الخاص بـ Leaflet
import 'leaflet/dist/leaflet.css';

// إعداد أيقونة الدبوس لتكون مثل جوجل ماب (أحمر وأنيق)
const customIcon = L.divIcon({
  className: "custom-google-pin",
  iconAnchor: [15, 45],
  popupAnchor: [1, -34],
  html: `
    <div style="position: relative;">
      <svg width="30" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <path d="M12 0C7.58 0 4 3.58 4 8C4 13.54 12 24 12 24C12 24 20 13.54 20 8C20 3.58 16.42 0 12 0Z" fill="#EA4335"/>
        <circle cx="12" cy="8" r="3" fill="white"/>
      </svg>
    </div>
  `
});

// إحداثيات بلوك ج بمدينة العبور كمركز افتراضي بناءً على طلب المستخدم
const OBUR_BLOCK_G: [number, number] = [30.2444882, 31.4698325];
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibWFudXMtZGV2IiwiYSI6ImNtN2x4eHh4eDAwNHkyanB4eHh4eHh4eHgifQ.x-x-x-x-x-x-x-x-x-x-x';

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
  name?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom() < 13 ? 16 : map.getZoom());
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation, title, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : OBUR_BLOCK_G
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
      // استخدام Nominatim للتحويل العكسي لضمان الاستقرار التام
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
      reverseGeocode(OBUR_BLOCK_G[0], OBUR_BLOCK_G[1]);
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
        // تحسين البحث ليعطي الأولوية لمدينة العبور بالقليوبية (Viewbox)
        // العبور تقع تقريباً بين خطي طول 31.4 و 31.6 وخطي عرض 30.1 و 30.3
        const viewbox = '31.4,30.3,31.6,30.1';
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&accept-language=ar&countrycodes=eg&addressdetails=1&viewbox=${viewbox}&bounded=0`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (Array.isArray(data)) {
          // ترتيب النتائج برمجياً للتأكد من أن نتائج "العبور" تظهر أولاً
          const results = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            name: item.address?.name || item.address?.amenity || item.address?.shop || item.address?.building || item.display_name.split(',')[0]
          })).sort((a, b) => {
            const aInObur = a.display_name.includes('العبور') || a.display_name.includes('Obour');
            const bInObur = b.display_name.includes('العبور') || b.display_name.includes('Obour');
            if (aInObur && !bInObur) return -1;
            if (!aInObur && bInObur) return 1;
            return 0;
          });
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
      {/* زر اختيار الموقع الحالي في مكان خانة البحث */}
      <div className={cn(
        "p-4 z-[1000] absolute top-0 left-0 right-0 flex items-center justify-center gap-2",
        isFullScreen && "pt-12"
      )}>
        <div className="flex items-center gap-2 w-full max-w-md">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGetCurrentLocation();
            }}
            disabled={isLocating}
            className="flex-1 h-14 bg-white hover:bg-slate-50 text-orange-600 font-bold rounded-2xl shadow-xl border-2 border-orange-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLocating ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Navigation className="h-6 w-6" />
            )}
            <span className="text-lg">اختار موقعك الحالي</span>
          </button>
          
          {isFullScreen && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }} 
              className="h-14 w-14 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center transition-all active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>
      </div>

      {/* الخريطة */}
      <div 
        className="flex-1 relative z-10 cursor-pointer h-full w-full"
        onClick={() => !isFullScreen && setIsFullScreen(true)}
      >
        <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%', position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} zoomControl={false}>
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

        {/* عرض العنوان وزر التأكيد */}
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
