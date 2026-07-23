import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';

interface Props {
  normalRoute: any;
  safeRoute: any;
  src: { lat: number; lon: number };
  dst: { lat: number; lon: number };
  hospitals: any[];
}

/**
 * Auto zoom to route (IMPORTANT FIX)
 */
function FitBounds({ route }: { route: any }) {
  const map = useMap();

  useEffect(() => {
    if (!route?.route_geometry?.length) return;

    const bounds = L.latLngBounds(
      route.route_geometry.map((p: any) => [p[0], p[1]])
    );

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [route, map]);

  return null;
}

export default function MapView({
  normalRoute,
  safeRoute,
  src,
  dst,
  hospitals,
}: Props) {

  if (!src || !dst) return null;

  const center: [number, number] = [src.lat, src.lon];

  return (
    <div style={{ height: 500, marginTop: 20, borderRadius: 12, overflow: 'hidden' }}>

      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* AUTO FIT MAP TO ROUTE */}
        <FitBounds route={safeRoute || normalRoute} />

        {/* 🔵 NORMAL ROUTE */}
        {normalRoute?.route_geometry?.length > 0 && (
          <Polyline
            positions={normalRoute.route_geometry.map((p: any) => [p[0], p[1]])}
            color="blue"
            weight={4}
            opacity={0.7}
          />
        )}

        {/* 🟢 SAFE ROUTE */}
        {safeRoute?.route_geometry?.length > 0 && (
          <Polyline
            positions={safeRoute.route_geometry.map((p: any) => [p[0], p[1]])}
            color="green"
            weight={5}
            opacity={0.9}
          />
        )}

        {/* 📍 START */}
        <Marker position={[src.lat, src.lon]} />

        {/* 📍 END */}
        <Marker position={[dst.lat, dst.lon]} />

        {/* 🏥 HOSPITAL MARKERS (REAL NAVIGATION FEATURE) */}
        {hospitals?.map((h, i) => (
          <Marker
            key={i}
            position={[h.lat, h.lon]}
            icon={L.divIcon({
              className: 'hospital-marker',
              html: '🏥',
              iconSize: [20, 20],
            })}
          />
        ))}

      </MapContainer>
    </div>
  );
}