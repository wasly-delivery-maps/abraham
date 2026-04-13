import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Loader2, Navigation } from "lucide-react";

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number };
  placeholder?: string;
}

// Component to handle map clicks
function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// Component to update map view
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : [30.1200, 31.4500]
  );
  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Reverse geocoding using Nominatim (OpenStreetMap)
  const getAddress = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`);
      const data = await response.json();
      const addr = data.display_name || "موقع غير معروف";
      setAddress(addr);
      onLocationSelect({ address: addr, latitude: lat, longitude: lon });
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    getAddress(position[0], position[1]);
  }, [position, getAddress]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=ar`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        setAddress(display_name);
        onLocationSelect({ address: display_name, latitude: newPos[0], longitude: newPos[1] });
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="relative group">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={placeholder || "ابحث عن موقع..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-12 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 font-bold"
            />
          </div>
          <Button type="submit" disabled={isSearching} className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "بحث"}
          </Button>
        </form>
      </div>

      <div className="relative h-[300px] w-full rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner">
        <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
          <ChangeView center={position} />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>

        <Button
          onClick={handleCurrentLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-slate-50 text-slate-900 h-10 w-10 p-0 rounded-full shadow-lg border border-slate-200"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
        </Button>
      </div>

      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <MapPin className="h-4 w-4 text-orange-600" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">الموقع المختار</p>
          <p className="text-sm font-bold text-slate-700 leading-relaxed">{address || "جاري تحديد العنوان..."}</p>
        </div>
      </div>
    </div>
  );
}
