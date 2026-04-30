import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';

// توكن Mapbox العام
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFudXMtZGV2IiwiYSI6ImNtN2x4eHh4eDAwNHkyanB4eHh4eHh4eHgifQ.x-x-x-x-x-x-x-x-x-x-x'; 
const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

const EGYPT_CENTER: [number, number] = [31.2357, 30.0444]; // [lng, lat] لـ Mapbox

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.longitude, initialLocation.latitude] : EGYPT_CENTER
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAPBOX_STYLE,
      center: position,
      zoom: 13,
      attributionControl: false
    });

    const marker = new mapboxgl.Marker({ color: '#f97316' })
      .setLngLat(position)
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updatePosition(lng, lat);
    });

    return () => map.remove();
  }, []);

  const updatePosition = (lng: number, lat: number, zoom?: number) => {
    setPosition([lng, lat]);
    if (markerRef.current) markerRef.current.setLngLat([lng, lat]);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: zoom || mapRef.current.getZoom() });
    }
    reverseGeocode(lat, lng);
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
    updatePosition(result.lon, result.lat, 16);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updatePosition(pos.coords.longitude, pos.coords.latitude, 16);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-3xl shadow-2xl border border-slate-200 relative">
      <div className="p-4 bg-white/90 backdrop-blur-md shadow-sm z-50 absolute top-0 left-0 right-0">
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

      {showResults && (
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

      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" />
        
        <div className="absolute bottom-6 left-4 z-10">
          <Button onClick={handleGetCurrentLocation} disabled={isLocating} className="w-14 h-14 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-2xl border p-0">
            {isLocating ? <Loader2 className="h-6 w-6 animate-spin text-orange-500" /> : <Navigation className="h-6 w-6" />}
          </Button>
        </div>

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
