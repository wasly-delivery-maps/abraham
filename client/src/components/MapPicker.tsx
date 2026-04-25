import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const OBUR_CENTER: [number, number] = [30.2350, 31.4650]; // مدينة العبور

// قاعدة بيانات محلية لأشهر معالم وأحياء العبور لضمان سرعة ودقة البحث
const OBUR_LANDMARKS = [
  { name: "الحي الأول - العبور", lat: 30.2350, lon: 31.4650 },
  { name: "الحي الثاني - العبور", lat: 30.2380, lon: 31.4750 },
  { name: "الحي الثالث - العبور", lat: 30.2450, lon: 31.4850 },
  { name: "الحي الرابع - العبور", lat: 30.2550, lon: 31.4750 },
  { name: "الحي الخامس - العبور", lat: 30.2650, lon: 31.4650 },
  { name: "الحي السادس - العبور", lat: 30.2750, lon: 31.4550 },
  { name: "الحي السابع - العبور", lat: 30.2850, lon: 31.4450 },
  { name: "الحي الثامن - العبور", lat: 30.2950, lon: 31.4350 },
  { name: "الحي التاسع - العبور", lat: 30.2550, lon: 31.4450 },
  { name: "سنتر الحجاز - العبور", lat: 30.2385, lon: 31.4680 },
  { name: "سنتر الياسمين - العبور", lat: 30.2420, lon: 31.4720 },
  { name: "سنتر الوجدي - العبور", lat: 30.2360, lon: 31.4620 },
  { name: "إسكان الشباب - العبور", lat: 30.2520, lon: 31.4880 },
  { name: "العبور الجديدة - حي المجد", lat: 30.2767, lon: 31.5299 },
  { name: "مول ريتاج - العبور الجديدة", lat: 30.2765, lon: 31.5305 },
  { name: "كارفور العبور", lat: 30.2150, lon: 31.4450 },
  { name: "جولف سيتي - العبور", lat: 30.2120, lon: 31.4420 },
  { name: "جامعة بنها - فرع العبور", lat: 30.2680, lon: 31.4520 },
  { name: "مستشفى عين شمس التخصصي - العبور", lat: 30.2450, lon: 31.4550 },
  { name: "سوق العبور", lat: 30.1850, lon: 31.4650 },
];

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
    map.setView(center, 14);
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
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`);
      const data = await response.json();
      const addr = data.display_name || 'موقع غير معروف';
      setAddress(addr);
      onLocationSelect({ address: addr, latitude: lat, longitude: lon });
    } catch (error) {
      console.error('Geocoding error:', error);
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
        // 1. البحث أولاً في قاعدة البيانات المحلية (العبور)
        const localMatches = OBUR_LANDMARKS.filter(landmark => 
          landmark.name.includes(query) || query.includes(landmark.name.split(' ')[0])
        ).map(m => ({
          lat: m.lat,
          lon: m.lon,
          display_name: m.name,
          type: 'local'
        }));

        let cleanQuery = query;
        if (!cleanQuery.includes('العبور')) {
          cleanQuery = `${cleanQuery} العبور القليوبية مصر`;
        }

        // 2. البحث في الخريطة العالمية
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=10&accept-language=ar&viewbox=31.35,30.35,31.60,30.15&bounded=1`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        let globalResults: SearchResult[] = [];
        if (data && Array.isArray(data)) {
          globalResults = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            type: item.type || item.class,
          }));
        }

        // دمج النتائج مع إعطاء الأولوية للمحلية
        const combinedResults = [...localMatches, ...globalResults];
        setSearchResults(combinedResults);
        setShowResults(combinedResults.length > 0);
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
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    reverseGeocode(result.lat, result.lon);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
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

  return (
    <div className="space-y-4 w-full">
      {title && <h3 className="text-lg font-black text-slate-800 mr-2">{title}</h3>}
      
      <div className="relative flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
          <Input
            placeholder={placeholder || "ابحث عن الحي، الشارع، أو المعلم في العبور..."}
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
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || searchResults.length === 0}
          className="h-14 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "بحث"}
        </Button>
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-20 right-0 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-96 overflow-y-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelectResult(result)}
              className="w-full text-right p-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-sm">{result.display_name.split(',')[0]}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{result.display_name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* تكبير حجم الخريطة لتشغل مساحة أكبر (600px بدلاً من 400px) */}
      <div className="h-[600px] w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-10">
        <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
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
