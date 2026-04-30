import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Navigation, X, Loader2, MapPin, Clock, Star, Map as MapIcon, ChevronLeft } from 'lucide-react';
import L from 'leaflet';

// مركز العبور كنقطة بداية افتراضية
const OBUR_CENTER: [number, number] = [30.2350, 31.4650];

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
  placeId?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

export default function MapPickerImproved({ onLocationSelect, initialLocation, title, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : OBUR_CENTER
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // تحميل عمليات البحث الأخيرة من LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // تهيئة Google Maps Services
  useEffect(() => {
    const initGoogleServices = async () => {
      if (window.google && window.google.maps) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        geocoderRef.current = new window.google.maps.Geocoder();
      }
    };
    initGoogleServices();
  }, []);

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  const reverseGeocode = useCallback(async (lat: number, lon: number) => {
    try {
      if (geocoderRef.current) {
        // استخدام Google Geocoder
        geocoderRef.current.geocode(
          { location: { lat, lng: lon } },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              const addr = results[0].formatted_address || 'موقع غير معروف';
              setAddress(addr);
              onLocationSelect({ address: addr, latitude: lat, longitude: lon });
            } else {
              // fallback إلى Nominatim
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&zoom=18&addressdetails=1`
              )
                .then(r => r.json())
                .then(data => {
                  const addr = data.display_name || 'موقع غير معروف';
                  setAddress(addr);
                  onLocationSelect({ address: addr, latitude: lat, longitude: lon });
                });
            }
          }
        );
      } else {
        // fallback إلى Nominatim إذا لم تكن Google Maps متاحة
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const addr = data.display_name || 'موقع غير معروف';
        setAddress(addr);
        onLocationSelect({ address: addr, latitude: lat, longitude: lon });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress('موقع غير معروف');
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation.latitude, initialLocation.longitude);
    } else {
      reverseGeocode(OBUR_CENTER[0], OBUR_CENTER[1]);
    }
  }, []);

  const calculateDistance = (lat: number, lon: number) => {
    const R = 6371;
    const dLat = (lat - position[0]) * Math.PI / 180;
    const dLon = (lon - position[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(position[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)} متر` : `${d.toFixed(1)} كم`;
  };

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
    setShowResults(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (autocompleteServiceRef.current) {
          // استخدام Google Places Autocomplete
          const predictions = await autocompleteServiceRef.current.getPlacePredictions({
            input: query,
            componentRestrictions: { country: 'eg' },
            language: 'ar',
            radius: 50000,
            location: new window.google.maps.LatLng(position[0], position[1]),
          });

          if (predictions.predictions && predictions.predictions.length > 0) {
            const results: SearchResult[] = [];
            
            for (const prediction of predictions.predictions.slice(0, 10)) {
              try {
                if (geocoderRef.current) {
                  geocoderRef.current.geocode(
                    { placeId: prediction.place_id },
                    (geocodeResults, status) => {
                      if (status === 'OK' && geocodeResults && geocodeResults[0]) {
                        const result = geocodeResults[0];
                        results.push({
                          lat: result.geometry.location.lat(),
                          lon: result.geometry.location.lng(),
                          display_name: result.formatted_address,
                          type: result.types[0] || 'place',
                          importance: 1,
                          distance: calculateDistance(result.geometry.location.lat(), result.geometry.location.lng()),
                          placeId: prediction.place_id,
                        });
                      }
                    }
                  );
                }
              } catch (error) {
                console.error('Geocoding prediction error:', error);
              }
            }

            // انتظر قليلاً لتجميع النتائج
            setTimeout(() => {
              setSearchResults(results.slice(0, 10));
            }, 100);
          } else {
            // fallback إلى Nominatim
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ar&countrycodes=eg&addressdetails=1&extratags=1`;
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
              setSearchResults(results);
            }
          }
        } else {
          // fallback إلى Nominatim إذا لم تكن Google Places متاحة
          const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&accept-language=ar&countrycodes=eg&addressdetails=1&extratags=1`;
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
            setSearchResults(results);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectResult = (result: SearchResult) => {
    const newPos: [number, number] = [result.lat, result.lon];
    setPosition(newPos);
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
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          reverseGeocode(latitude, longitude);
          setIsLocating(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
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

  const getShortName = (fullName: string) => {
    const parts = fullName.split(',');
    return parts[0].trim();
  };

  const getPlaceIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'restaurant': '🍽️', 'cafe': '☕', 'fast_food': '🍔', 'shop': '🛍️',
      'pharmacy': '💊', 'hospital': '🏥', 'bank': '🏦', 'mosque': '🕌',
      'school': '🏫', 'park': '🌳', 'hotel': '🏨', 'gas_station': '⛽',
      'point_of_interest': '📍', 'establishment': '🏢', 'locality': '🏘️'
    };
    return iconMap[type] || '📍';
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-hidden rounded-3xl shadow-2xl border border-slate-200">
      {/* شريط البحث العلوي - محاكاة جوجل ماب */}
      <div className="p-4 bg-white shadow-sm z-50">
        <div className="relative group">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" /> : <Search className="h-5 w-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />}
          </div>
          <Input
            placeholder={placeholder || "البحث هنا... (مطاعم، كافيهات، مناطق)"}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="h-14 pr-12 pl-12 rounded-2xl border-none bg-slate-100 focus:bg-white shadow-inner focus:ring-2 focus:ring-orange-500/20 font-bold text-lg transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          )}
        </div>

        {/* أزرار الوصول السريع */}
        {!showResults && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap">
              🏠 المنزل
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap">
              💼 العمل
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap">
              🍽️ مطاعم
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-slate-200 font-bold text-xs gap-1 whitespace-nowrap">
              ☕ كافيهات
            </Button>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-[500px]">
        {/* قائمة النتائج المنسدلة */}
        {showResults && (
          <div className="absolute inset-0 z-[1001] bg-white overflow-y-auto animate-in slide-in-from-top duration-200">
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-50 transition-colors text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                    {getPlaceIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-black text-slate-900 truncate">{getShortName(result.display_name)}</p>
                      <span className="text-[10px] font-bold text-slate-400 mr-2">{result.distance}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{result.display_name}</p>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-slate-300" />
                </button>
              ))
            ) : !isSearching && searchQuery ? (
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapIcon className="h-10 w-10 text-slate-300" />
                </div>
                <p className="font-bold text-slate-500">لم نجد نتائج لـ "{searchQuery}"</p>
                <p className="text-xs text-slate-400 mt-1">جرب كتابة اسم المنطقة أو نوع المكان</p>
              </div>
            ) : !isSearching && recentSearches.length > 0 ? (
              <div>
                <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">عمليات البحث الأخيرة</p>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearchChange(s)}
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors text-right"
                  >
                    <Clock className="h-4 w-4 text-slate-300" />
                    <span className="font-bold text-slate-700">{s}</span>
                  </button>
                ))}
              </div>
            ) : isSearching && (
              <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
                <p className="font-bold text-slate-500">جاري البحث عن أفضل النتائج...</p>
              </div>
            )}
          </div>
        )}

        {/* الخريطة */}
        <div className="absolute inset-0 z-10">
          <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            <MapUpdater center={position} />
          </MapContainer>

          {/* أزرار التحكم على الخريطة */}
          <div className="absolute bottom-32 left-4 z-[1000] flex flex-col gap-2">
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="w-12 h-12 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 shadow-xl border border-slate-100 p-0"
            >
              {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
            </Button>
          </div>

          {/* بطاقة المعلومات السفلية (Bottom Sheet) */}
          <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 animate-in slide-in-from-bottom duration-300">
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-4" />
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-orange-200 flex-shrink-0">
                  📍
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-900 text-lg truncate">{getShortName(address)}</h4>
                    <div className="flex items-center gap-0.5 bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                      <Star className="h-3 w-3 fill-current" /> 4.8
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed mb-4">{address}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onLocationSelect({ address, latitude: position[0], longitude: position[1] })}
                      className="flex-1 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-100"
                    >
                      تأكيد هذا الموقع
                    </Button>
                    <Button variant="outline" className="h-12 w-12 rounded-xl border-slate-200 p-0">
                      ⭐
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
