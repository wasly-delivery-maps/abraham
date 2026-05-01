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
      // استخدام Mapbox Reverse Geocoding API لأفضل دقة
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar&types=address,poi,neighborhood`
      );
      const data = await response.json();
      
      let addr = 'موقع غير معروف';
      if (data.features && data.features.length > 0) {
        addr = data.features[0].place_name;
      } else {
        // Fallback to Nominatim if Mapbox fails or has no results
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&zoom=18`
        );
        const fallbackData = await fallbackRes.json();
        addr = fallbackData.display_name || 'موقع غير معروف';
      }
      
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
        // استخدام Mapbox Forward Geocoding API لنتائج احترافية
        // تم تحديد الموقع حول العبور (proximity) لضمان أفضل نتائج محلية
        const proximity = `${OBUR_BLOCK_G[1]},${OBUR_BLOCK_G[0]}`;
        const searchUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=ar&country=eg&proximity=${proximity}&limit=10`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.features) {
          const results = data.features.map((item: any) => ({
            lat: item.center[1],
            lon: item.center[0],
            display_name: item.place_name,
            name: item.text
          }));
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
      {/* شريط البحث */}
      <div className={cn(
        "p-4 bg-white/90 backdrop-blur-md shadow-sm z-[1000] absolute top-0 left-0 right-0",
        isFullScreen && "pt-12"
      )}>
        <div className="relative group w-full max-w-4xl mx-auto">
          <Input
            placeholder={placeholder || "ابحث عن أي مكان باحترافية..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-16 pr-14 pl-14 rounded-2xl border-none bg-slate-100 focus:bg-white shadow-lg font-bold text-xl text-right w-full transition-all duration-300"
            dir="rtl"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Search className="h-5 w-5 text-slate-400" />}
          </div>
          {isFullScreen && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); setShowResults(false); }} 
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md z-[1002]"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* قائمة النتائج */}
      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto pt-32">
          <div className="p-2 flex justify-between items-center border-b bg-slate-50">
             <Button variant="ghost" size="sm" onClick={() => setShowResults(false)} className="text-slate-500">إغلاق</Button>
             <span className="text-xs font-bold text-slate-400 px-4">نتائج بحث Mapbox الاحترافية</span>
          </div>
          {searchResults.map((result, index) => (
            <button key={index} onClick={() => handleSelectResult(result)} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b text-right flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 truncate">{result.name}</p>
                <p className="text-xs text-slate-500 truncate">{result.display_name}</p>
              </div>
            </button>
          ))}
          {searchResults.length === 0 && !isSearching && (
            <div className="p-10 text-center text-slate-400 font-bold">لا توجد نتائج، حاول كتابة اسم المكان بشكل أوضح</div>
          )}
        </div>
      )}

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
