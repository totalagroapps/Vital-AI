import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// fix Leaflet's default marker icons, broken by bundler asset paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const DEFAULT_CENTER = [40.4168, -3.7038]; // Madrid
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const GEOCODE_DEBOUNCE_MS = 900;

function ClickHandler({ onPick, readOnly }) {
  useMapEvents({
    click(e) {
      if (readOnly) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// MapContainer only reads `center` on first render; re-center manually on change
function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14));
    }
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Leaflet calcula su tamaño al montarse; si el contenedor cambia después (móvil, rotación,
// animaciones de entrada) quedan zonas sin cargar. Se recalcula al cambiar el tamaño.
export function KeepSize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => map.invalidateSize();
    const t = setTimeout(refresh, 250);
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(refresh);
      ro.observe(container);
    }
    window.addEventListener('resize', refresh);
    return () => {
      clearTimeout(t);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', refresh);
    };
  }, [map]);
  return null;
}

// Map picker: geocodes `address` via Nominatim, lets the pin be adjusted by
// click/drag/GPS, and reverse-geocodes pin moves back into `address`.
// `readOnly` disables all interaction.
const DoctorLocationMap = ({ address, lat, lng, latitude, longitude, city, country, height = 260, title, onChange, readOnly = false }) => {
  const { t } = useLanguage();
  const actualLat = lat != null ? lat : (latitude != null ? latitude : null);
  const actualLng = lng != null ? lng : (longitude != null ? longitude : null);

  const [geocoding, setGeocoding] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);
  // seed with the current address when lat/lng already exist, so mounting
  // with a saved profile doesn't immediately re-geocode and clobber it
  const lastGeocodedAddress = useRef(actualLat != null && actualLng != null ? (address || '').trim() : null);

  useEffect(() => {
    if (readOnly) return;
    const trimmed = (address || '').trim();
    if (trimmed.length < 5 || trimmed === lastGeocodedAddress.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(`${NOMINATIM_SEARCH_URL}?format=json&limit=1&q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data?.[0]) {
          lastGeocodedAddress.current = trimmed;
          const parsedLat = parseFloat(data[0].lat);
          const parsedLng = parseFloat(data[0].lon);
          onChange?.({ lat: parsedLat, lng: parsedLng, latitude: parsedLat, longitude: parsedLng, address: trimmed });
        }
      } catch (e) {
        // ignore — user can still place the pin manually
      }
      setGeocoding(false);
    }, GEOCODE_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [address, readOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  // manual pin move -> reverse-geocode into `address`; update the ref here
  // (not just on success) so the forward-geocode effect above doesn't treat
  // this as a user-typed address change and geocode it right back
  const handlePick = useCallback(
    (newLat, newLng) => {
      const rLat = Math.round(newLat * 1e6) / 1e6;
      const rLng = Math.round(newLng * 1e6) / 1e6;
      onChange?.({ lat: rLat, lng: rLng, latitude: rLat, longitude: rLng, address: address || '' });
      setReverseGeocoding(true);
      fetch(`${NOMINATIM_REVERSE_URL}?format=json&lat=${rLat}&lon=${rLng}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.display_name) {
            lastGeocodedAddress.current = data.display_name;
            onChange?.({ lat: rLat, lng: rLng, latitude: rLat, longitude: rLng, address: data.display_name });
          }
        })
        .catch(() => {})
        .finally(() => setReverseGeocoding(false));
    },
    [onChange, address]
  );

  const useGps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handlePick(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasPoint = actualLat != null && actualLng != null;
  const center = hasPoint ? [actualLat, actualLng] : DEFAULT_CENTER;

  return (
    <div>
      {title && <div className="text-xs font-bold text-gray-500 mb-2">{title}</div>}
      <div className="rounded-xl overflow-hidden border border-gray-200 relative isolate" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <MapContainer
          center={center}
          zoom={hasPoint ? 15 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!readOnly}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasPoint && (
            <Marker
              position={[actualLat, actualLng]}
              draggable={!readOnly}
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  handlePick(p.lat, p.lng);
                },
              }}
            />
          )}
          <ClickHandler onPick={handlePick} readOnly={readOnly} />
          <Recenter lat={actualLat} lng={actualLng} />
          <KeepSize />
        </MapContainer>
        {(geocoding || reverseGeocoding) && (
          <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 shadow z-[1000]">
            <Loader2 className="w-3 h-3 animate-spin" /> {t(geocoding ? 'locmap_geocoding' : 'locmap_reverse_geocoding')}
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:text-blue-600 disabled:opacity-50"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          {t('locmap_use_gps')}
        </button>
      )}
    </div>
  );
};

export default DoctorLocationMap;
