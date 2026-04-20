import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, MapPin, Loader2, X, Map as MapIcon, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  buttonText?: string;
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

export default function MapPicker({ onLocationSelect, initialLocation, title, placeholder, buttonText }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : OBUR_CENTER
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
        let cleanQuery = query;
        if (query.includes('،') || query.includes(',')) {
          const parts = query.split(/[،,]/);
          cleanQuery = parts.slice(0, 2).join(' ');
        }

        const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=10&accept-language=ar`;
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

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`, '_blank');
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
    <div className="w-full">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full h-16 rounded-2xl border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-orange-100 transition-colors">
                <MapPin className="h-5 w-5 text-slate-500 group-hover:text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title || "الموقع"}</p>
                <p className="text-sm font-bold text-slate-700 line-clamp-1">{address || buttonText || "اضغط لتحديد الموقع على الخريطة"}</p>
              </div>
            </div>
            <MapIcon className="h-5 w-5 text-slate-400 group-hover:text-orange-500" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl bg-white" dir="rtl">
          <DialogHeader className="p-6 pb-2 flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="bg-orange-100 p-2 rounded-xl">🎯</span>
              {title || "تحديد الموقع"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-slate-100">
              <X className="h-6 w-6 text-slate-500" />
            </Button>
          </DialogHeader>

          <div className="px-6 pb-4">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder={placeholder || "ابحث عن موقع..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 pr-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white focus:ring-orange-500 font-bold transition-all"
                />
              </div>
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute left-6 right-6 z-[1001] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-right p-4 hover:bg-orange-50 border-b border-slate-50 last:border-b-0 transition-colors flex items-start gap-3"
                  >
                    <MapPin className="h-4 w-4 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{result.display_name.split(',')[0]}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{result.display_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-[400px] w-full relative">
            <MapContainer center={position} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
              <MapUpdater center={position} />
            </MapContainer>
            
            <div className="absolute bottom-4 left-4 right-4 z-[1000]">
              <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg border border-white/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">العنوان المختار</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed line-clamp-2">{address || "جاري التحديد..."}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50/50">
            <Button 
              onClick={openInGoogleMaps}
              className="h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-5 w-5" />
              فتح في خرائط جوجل
            </Button>
            <Button 
              onClick={() => setIsOpen(false)}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black shadow-lg shadow-slate-200"
            >
              إغلاق الخريطة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
