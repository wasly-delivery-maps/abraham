import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation, Loader2, X, Check, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

// أيقونة مخصصة للماركر
const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface MapPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: { latitude: number; longitude: number };
  placeholder?: string;
}

// مركز مدينة العبور (بلوك ج)
const OBUR_BLOCK_G: [number, number] = [30.2285, 31.4725];

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation, placeholder }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : OBUR_BLOCK_G
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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
      reverseGeocode(OBUR_BLOCK_G[0], OBUR_BLOCK_G[1]);
    }
  }, []);

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setPosition(newPos);
          reverseGeocode(newPos[0], newPos[1]);
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert("تعذر تحديد موقعك الحالي. يرجى التأكد من تفعيل خدمة الموقع.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      alert("متصفحك لا يدعم خدمة تحديد الموقع.");
    }
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPosition(newPos);
        reverseGeocode(newPos[0], newPos[1]);
      },
      dragend(e) {
        const map = e.target;
        const center = map.getCenter();
        const newPos: [number, number] = [center.lat, center.lng];
        setPosition(newPos);
        reverseGeocode(newPos[0], newPos[1]);
      }
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
      {/* زر اختيار الموقع الحالي في الأعلى (الوحيد والأساسي) */}
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

        {/* عرض العنوان وزر التأكيد */}
        <div className={cn(
          "absolute bottom-6 right-4 left-4 z-[1000] flex flex-col gap-3",
          isFullScreen && "bottom-10"
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
