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

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(OBUR_CENTER[0], OBUR_CENTER[1]);
    }
  }, []);

  // البحث المتقدم مع البحث الفوري (Live Search)
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
        // البحث الأساسي عن العنوان
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' العبور مصر')}&limit=10&accept-language=ar`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          const results = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            type: item.type || item.class,
          }));
          setSearchResults(results);
          setShowResults(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // تأخير 300ms قبل البحث لتقليل الطلبات
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
      
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder={placeholder || "ابحث عن شارع، محل، مركز، أو أي مكان..."}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onFocus={() => searchQuery && setShowResults(true)}
            className="h-14 pr-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-orange-500 font-bold"
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

      {/* نتائج البحث */}
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
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{result.type}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative z-10" style={{ filter: 'grayscale(60%) brightness(1.1) contrast(0.95)' }}>
        <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الموقع المختار</p>
              <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2">{address || 'جاري تحديد الموقع...'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
