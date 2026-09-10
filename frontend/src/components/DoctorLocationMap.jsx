import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import { MapPin, Navigation, Search, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

// Configuración de iconos de Leaflet para evitar problemas de assets en Vite
const customMarkerIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente interno para manejar clics en el mapa
function MapClickHandler({ onLocationSelect, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled && onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Componente interno para centrar el mapa suavemente y recalcular tamaño
function MapViewUpdater({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size para asegurar que Leaflet dibuje correctamente las tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.0 });
    }
  }, [center, zoom, map]);

  return null;
}

export default function DoctorLocationMap({
  latitude,
  longitude,
  address = '',
  city = '',
  country = 'Colombia',
  onChange,
  readOnly = false,
  height = '300px',
  title = 'Confirmación de ubicación en el mapa'
}) {
  const [searching, setSearching] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [geoSuccess, setGeoSuccess] = useState(null);
  const markerRef = useRef(null);
  const lastSearchQueryRef = useRef('');

  // Parsear valores
  const currentLat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null;
  const currentLng = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null;
  const hasCoordinates = currentLat !== null && currentLng !== null && !isNaN(currentLat) && !isNaN(currentLng);

  // Centro por defecto según país
  const defaultCenter = useMemo(() => {
    if (country?.toLowerCase().includes('españa') || country?.toLowerCase().includes('spain')) {
      return [40.4168, -3.7038]; // Madrid
    }
    if (country?.toLowerCase().includes('méxico') || country?.toLowerCase().includes('mexico')) {
      return [19.4326, -99.1332]; // CDMX
    }
    return [4.7110, -74.0721]; // Bogotá
  }, [country]);

  const mapCenter = hasCoordinates ? [currentLat, currentLng] : defaultCenter;
  const mapZoom = hasCoordinates ? 15 : 6;

  // Auto-geocodificación automática cuando el usuario escribe o cambia la Ciudad / Dirección
  useEffect(() => {
    if (readOnly) return;
    const queryParts = [address?.trim(), city?.trim(), country?.trim()].filter(Boolean);
    const query = queryParts.join(', ');

    if (queryParts.length === 0 || query === lastSearchQueryRef.current) {
      return;
    }

    // Debounce de 800ms para evitar demasiadas llamadas mientras escribe
    const timeoutId = setTimeout(async () => {
      lastSearchQueryRef.current = query;
      setSearching(true);
      setGeoError(null);

      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
          headers: { 'Accept-Language': 'es' }
        });
        const data = await res.json();

        if (data && data.length > 0) {
          const found = data[0];
          const lat = parseFloat(found.lat);
          const lon = parseFloat(found.lon);
          if (onChange) {
            onChange({
              latitude: parseFloat(lat.toFixed(6)),
              longitude: parseFloat(lon.toFixed(6))
            });
          }
          setGeoSuccess(`Ubicación aproximada: ${city || address}`);
          setTimeout(() => setGeoSuccess(null), 3500);
        } else if (city?.trim()) {
          // Fallback buscando solo por ciudad
          const cityQuery = encodeURIComponent(`${city.trim()}, ${country.trim()}`);
          const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityQuery}&limit=1`, {
            headers: { 'Accept-Language': 'es' }
          });
          const cityData = await cityRes.json();
          if (cityData && cityData.length > 0) {
            const found = cityData[0];
            const lat = parseFloat(found.lat);
            const lon = parseFloat(found.lon);
            if (onChange) {
              onChange({
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lon.toFixed(6))
              });
            }
            setGeoSuccess(`Ubicado en ciudad: ${city}`);
            setTimeout(() => setGeoSuccess(null), 3500);
          }
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [address, city, country, readOnly]);

  const handleMarkerDragEnd = () => {
    if (readOnly || !onChange) return;
    const marker = markerRef.current;
    if (marker != null) {
      const latlng = marker.getLatLng();
      onChange({
        latitude: parseFloat(latlng.lat.toFixed(6)),
        longitude: parseFloat(latlng.lng.toFixed(6))
      });
      setGeoSuccess('Punto exacto confirmado');
      setTimeout(() => setGeoSuccess(null), 2500);
    }
  };

  const handleMapClick = (lat, lng) => {
    if (readOnly || !onChange) return;
    onChange({
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    });
    setGeoSuccess('Punto fijado en el mapa');
    setTimeout(() => setGeoSuccess(null), 2500);
  };

  // Obtener ubicación GPS del navegador
  const handleUseCurrentLocation = () => {
    if (readOnly) return;
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }

    setSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSearching(false);
        const { latitude: lat, longitude: lng } = position.coords;
        if (onChange) {
          onChange({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lng.toFixed(6))
          });
        }
        setGeoSuccess('Ubicación GPS actual detectada');
        setTimeout(() => setGeoSuccess(null), 3000);
      },
      (error) => {
        setSearching(false);
        console.warn('Geolocation error:', error);
        setGeoError('No se pudo obtener el GPS actual. Puedes hacer clic en el mapa para colocar el pin.');
        setTimeout(() => setGeoError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Búsqueda manual forzada
  const handleManualSearch = async () => {
    if (readOnly) return;
    const queryParts = [address?.trim(), city?.trim(), country?.trim()].filter(Boolean);
    if (queryParts.length === 0) {
      setGeoError('Por favor escribe una ciudad o dirección primero.');
      setTimeout(() => setGeoError(null), 3000);
      return;
    }

    setSearching(true);
    setGeoError(null);
    try {
      const query = encodeURIComponent(queryParts.join(', '));
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
        headers: { 'Accept-Language': 'es' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const found = data[0];
        const lat = parseFloat(found.lat);
        const lon = parseFloat(found.lon);
        if (onChange) {
          onChange({
            latitude: parseFloat(lat.toFixed(6)),
            longitude: parseFloat(lon.toFixed(6))
          });
        }
        setGeoSuccess(`Ubicado en: ${city || address}`);
        setTimeout(() => setGeoSuccess(null), 3500);
      } else {
        setGeoError('No se encontró la dirección exacta. Haz clic en el mapa para situar el punto.');
        setTimeout(() => setGeoError(null), 4000);
      }
    } catch (err) {
      setGeoError('Error consultando el servicio de mapa.');
      setTimeout(() => setGeoError(null), 3000);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col my-2">
      {/* Barra superior de controles */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin size={16} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 leading-tight">{title}</h4>
            <p className="text-[11px] text-slate-500">
              {readOnly 
                ? (hasCoordinates ? 'Punto de atención médica confirmado' : 'Sin coordenadas registradas')
                : (searching ? 'Buscando ubicación en el mapa...' : 'El mapa se centra automáticamente según la ciudad y dirección. Puedes arrastrar o hacer clic en el pin para ajustar.')}
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 ml-auto">
            {(city || address) && (
              <button
                type="button"
                onClick={handleManualSearch}
                disabled={searching}
                title="Centrar mapa en la dirección escrita"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {searching ? <Loader2 size={13} className="animate-spin text-blue-600" /> : <Search size={13} className="text-blue-600" />}
                <span>Centrar en ciudad/dirección</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={searching}
              title="Detectar automáticamente mi ubicación actual con GPS"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Navigation size={13} className="text-blue-600" />
              <span>Usar mi GPS</span>
            </button>
          </div>
        )}
      </div>

      {/* Alertas informativas */}
      {geoError && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-[11px] font-medium flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      {geoSuccess && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 text-emerald-800 text-[11px] font-medium flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>{geoSuccess}</span>
        </div>
      )}

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative w-full" style={{ height, minHeight: '260px' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={!readOnly}
          style={{ height: '100%', width: '100%', zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewUpdater center={mapCenter} zoom={hasCoordinates ? 15 : 12} />

          <MapClickHandler onLocationSelect={handleMapClick} disabled={readOnly} />

          {hasCoordinates && (
            <Marker
              ref={markerRef}
              position={[currentLat, currentLng]}
              icon={customMarkerIcon}
              draggable={!readOnly}
              eventHandlers={{
                dragend: handleMarkerDragEnd
              }}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-800">
                    {address || city ? `${address} ${city ? `(${city})` : ''}` : 'Ubicación del Consultorio'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Lat: {currentLat.toFixed(5)}, Lng: {currentLng.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Loading overlay cuando se busca */}
        {searching && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl px-4 py-2 text-xs font-semibold text-blue-700 shadow-md border border-blue-100 flex items-center gap-2">
              <Loader2 size={15} className="animate-spin text-blue-600" />
              <span>Buscando ubicación geográfica...</span>
            </div>
          </div>
        )}

        {/* Overlay si no tiene coordenadas en modo solo lectura */}
        {readOnly && !hasCoordinates && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
            <div className="bg-white/90 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-600 shadow-md border border-slate-200">
              Coordenadas de ubicación no registradas aún.
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior: Indicador de Coordenadas */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latitud:</span>
            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {hasCoordinates ? currentLat.toFixed(6) : 'Pendiente'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Longitud:</span>
            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
              {hasCoordinates ? currentLng.toFixed(6) : 'Pendiente'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasCoordinates ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} /> Ubicación fijada en el mapa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle size={13} /> Escribe tu dirección/ciudad o haz clic en el mapa
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
