import { useEffect, useState, useMemo } from "react";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons matching DriverDashboard
const iconA = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#f97316; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'>A</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const iconB = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#3b82f6; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);'>B</div>",
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const iconDriver = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#10b981; color:white; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 0 10px rgba(16,185,129,0.5);'><div style='width:8px; height:8px; background:white; border-radius:50%;'></div></div>",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to auto-fit map bounds
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

// Component to draw routing path using OSRM
function RoutingPolyline({ start, end }: { start: [number, number]; end: [number, number] }) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [
            coord[1],
            coord[0],
          ] as [number, number]);
          setRouteCoordinates(coordinates);
        }
      } catch (error) {
        console.error('Error fetching route:', error);
        setRouteCoordinates([start, end]);
      }
    };

    fetchRoute();
  }, [start, end]);

  if (routeCoordinates.length === 0) return null;

  return (
    <Polyline
      positions={routeCoordinates}
      color="#f97316"
      weight={4}
      opacity={0.8}
    />
  );
}

interface LiveTrackingMapProps {
  orderId: number;
  driverId: number;
  pickupLocation: { latitude: number; longitude: number; address: string };
  deliveryLocation: { latitude: number; longitude: number; address: string };
  initialDriverLocation?: { latitude: number; longitude: number };
}

export function LiveTrackingMap({
  orderId,
  driverId,
  pickupLocation,
  deliveryLocation,
  initialDriverLocation,
}: LiveTrackingMapProps) {
  const { isConnected, driverLocations, trackDriver, stopTracking } = useLocationTracking();

  useEffect(() => {
    if (isConnected) {
      trackDriver(orderId, driverId);
    }
    return () => {
      stopTracking(orderId);
    };
  }, [isConnected, orderId, driverId, trackDriver, stopTracking]);

  const liveDriverLocation = driverLocations.get(driverId);
  
  // Fetch driver location from database as a fallback if live location is not available
  const driverQuery = trpc.users.getUser.useQuery(
    { id: driverId },
    { 
      enabled: !!driverId && !liveDriverLocation,
      refetchInterval: 10000 // Poll every 10 seconds if socket fails
    }
  );

  const dbDriverLocation = driverQuery.data?.latitude && driverQuery.data?.longitude 
    ? { latitude: driverQuery.data.latitude, longitude: driverQuery.data.longitude }
    : null;

  const driverLocation = liveDriverLocation || dbDriverLocation || initialDriverLocation;

  const bounds = useMemo(() => {
    const points: [number, number][] = [
      [pickupLocation.latitude, pickupLocation.longitude],
      [deliveryLocation.latitude, deliveryLocation.longitude]
    ];
    if (driverLocation && typeof driverLocation.latitude === 'number' && typeof driverLocation.longitude === 'number') {
      points.push([driverLocation.latitude, driverLocation.longitude]);
    }
    return L.latLngBounds(points);
  }, [pickupLocation, deliveryLocation, driverLocation]);

  return (
    <div className="space-y-4">
      <Card className="p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900">تتبع الكابتن مباشر</h3>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <Badge variant="outline" className="flex items-center gap-1 text-orange-500 border-orange-200 bg-orange-50">
                <Loader2 className="w-3 h-3 animate-spin" />
                جاري الاتصال...
              </Badge>
            )}
            {isConnected && (
              <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 font-black">
                متصل مباشر
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] overflow-hidden h-96 border border-slate-100 relative z-10">
          <MapContainer 
            bounds={bounds} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <ChangeView bounds={bounds} />
            
            {/* Pickup Marker */}
            <Marker position={[pickupLocation.latitude, pickupLocation.longitude]} icon={iconA}>
              <Popup>نقطة الاستلام</Popup>
            </Marker>

            {/* Delivery Marker */}
            <Marker position={[deliveryLocation.latitude, deliveryLocation.longitude]} icon={iconB}>
              <Popup>نقطة التسليم</Popup>
            </Marker>

            {/* Driver Marker - Enhanced Visibility Logic */}
            {driverLocation && typeof driverLocation.latitude === 'number' && (
              <>
                <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={iconDriver}>
                  <Popup>موقع الكابتن الحالي</Popup>
                </Marker>
                <RoutingPolyline 
                  start={[driverLocation.latitude, driverLocation.longitude]} 
                  end={[deliveryLocation.latitude, deliveryLocation.longitude]} 
                />
              </>
            )}
            
            {/* Always show route between Pickup and Delivery if driver is not yet tracked */}
            {!driverLocation && (
              <RoutingPolyline 
                start={[pickupLocation.latitude, pickupLocation.longitude]} 
                end={[deliveryLocation.latitude, deliveryLocation.longitude]} 
              />
            )}
          </MapContainer>
        </div>
      </Card>

      {driverLocation && (
        <Card className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
          <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            حالة الكابتن الآن
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">آخر تحديث</p>
              <p className="text-sm font-black text-slate-700">
                {new Date(driverLocation.updatedAt).toLocaleTimeString("ar-EG")}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">سرعة التحديث</p>
              <p className="text-sm font-black text-emerald-600">تلقائي 📡</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
