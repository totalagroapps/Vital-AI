import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { KeepSize } from '../components/DoctorLocationMap';
import { ArrowLeft, LocateFixed, Loader2, Star, MapPin, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { translateSpecialtyName, translateLanguageName } from '../i18n/catalogTranslations';

// In-person search: Leaflet map centered on the patient's live location
// (browser geolocation, not persisted). Hover a pin for a preview card,
// click to open the doctor's profile.
const RADIUS_OPTIONS = [5, 10, 25, 50];
const PIN_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

// Nearby hospitals/clinics (not affiliated doctors) — routed through our own
// backend (`GET /api/health-places`), which caches in the DB and only hits
// Overpass (OpenStreetMap) to fill in gaps. Used to call Overpass directly
// from the patient's browser; see CLAUDE.md, "Cache de hospitales/clínicas
// externos" (2026-09-15).
const AMENITY_LABEL_KEYS = {
  hospital: 'presencial_amenity_hospital',
  clinic: 'presencial_amenity_clinic',
  doctors: 'presencial_amenity_doctors',
  pharmacy: 'presencial_amenity_pharmacy',
};
const amenityLabel = (t, amenity) => t(AMENITY_LABEL_KEYS[amenity] || 'presencial_amenity_other');

const HONORIFIC_RE = /^(dr|dra|mr|mrs|ms)\.?$/i;
function initialsOf(fullName) {
  const words = (fullName || '').trim().split(/\s+/).filter((w) => w && !HONORIFIC_RE.test(w));
  const initials = words.slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('');
  return initials || '??';
}

// L.divIcon renders raw HTML — avatarUrl/initials come from other users'
// data, so escape them to avoid XSS.
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const iconCache = new Map();
function pinIcon(color, initials, avatarUrl) {
  const key = `${color}|${initials}|${avatarUrl || ''}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const inner = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" style="position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid #fff;" />`
    : `<span style="position:absolute;top:8px;left:0;width:34px;text-align:center;color:#fff;font-weight:800;font-size:11px;font-family:system-ui,sans-serif;letter-spacing:.02em;">${escapeHtml(initials)}</span>`;
  const html = `
    <div style="position:relative;width:34px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))">
      <svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61 0 0 7.61 0 17c0 12.75 17 25 17 25s17-12.25 17-25C34 7.61 26.39 0 17 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      </svg>
      ${inner}
    </div>
  `;
  const icon = L.divIcon({ html, className: '', iconSize: [34, 42], iconAnchor: [17, 42], tooltipAnchor: [14, -28] });
  iconCache.set(key, icon);
  return icon;
}

const externalIconCache = new Map();
function externalPinIcon() {
  if (externalIconCache.has('x')) return externalIconCache.get('x');
  const html = `
    <div style="position:relative;width:26px;height:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">
      <svg width="26" height="32" viewBox="0 0 26 32" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C5.82 0 0 5.82 0 13c0 9.75 13 19 13 19s13-9.25 13-19C26 5.82 20.18 0 13 0z" fill="#64748b" stroke="#fff" stroke-width="1.5"/>
      </svg>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" style="position:absolute;top:6px;left:7.5px;">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </div>
  `;
  const icon = L.divIcon({ html, className: '', iconSize: [26, 32], iconAnchor: [13, 32], tooltipAnchor: [11, -20] });
  externalIconCache.set('x', icon);
  return icon;
}

const Badge = ({ children, tone = 'gray' }) => (
  <span
    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
      tone === 'blue' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-100 text-gray-600'
    }`}
  >
    {children}
  </span>
);

const DoctorMiniAvatar = ({ avatarUrl, initials, color, size = 32 }) => {
  const [broken, setBroken] = useState(false);
  if (avatarUrl && !broken) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setBroken(true)}
        className="rounded-full object-cover shrink-0 border border-white shadow-sm"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-extrabold shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}
    >
      {initials}
    </span>
  );
};

const DoctorPreviewCard = ({ d, language, t }) => (
  <div className="w-52">
    <p className="font-bold text-brand-dark text-sm">{d.full_name || t('presencial_unnamed')}</p>
    {(d.specialties || []).length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {d.specialties.map((s) => <Badge key={s.id}>{translateSpecialtyName(s.name, language)}</Badge>)}
      </div>
    )}
    {(d.insurance_companies || []).length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {d.insurance_companies.map((i) => <Badge key={i.id}>{i.name}</Badge>)}
      </div>
    )}
    {(d.languages || []).length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {d.languages.map((l) => <Badge key={l.id} tone="blue">{translateLanguageName(l.code, l.name, language)}</Badge>)}
      </div>
    )}
    <div className="flex items-center gap-2 mt-2">
      {d.rating != null && (
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
          <Star size={11} className="fill-amber-400 text-amber-400" /> {d.rating.toFixed(1)}
        </span>
      )}
      {d.distance_km != null && <span className="text-[11px] text-gray-400">{d.distance_km} km</span>}
    </div>
  </div>
);

const EspecialistasPresencialSearch = ({ apiUrl, initialFilters, onBack, onSelectDoctor }) => {
  const { t, language } = useLanguage();

  const [patientPos, setPatientPos] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locateError, setLocateError] = useState('');

  const [radiusKm, setRadiusKm] = useState(10);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [showNearby, setShowNearby] = useState(true);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError(t('presencial_no_geo'));
      setLocating(false);
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPatientPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocateError(t('presencial_locate_denied'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!patientPos) return;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      modality: 'in_person',
      lat: String(patientPos.lat),
      lng: String(patientPos.lng),
      radius_km: String(radiusKm),
      sort: 'distance',
      limit: '50',
    });
    (initialFilters?.specialty_ids || []).forEach((id) => params.append('specialty_ids', id));
    if (initialFilters?.language_id) params.set('language_id', initialFilters.language_id);
    if (initialFilters?.insurance_company_id) params.set('insurance_company_id', initialFilters.insurance_company_id);
    if (initialFilters?.name) params.set('name', initialFilters.name);

    fetch(`${apiUrl}/api/doctors?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setDoctors((data.items || []).filter((d) => d.lat != null && d.lng != null)))
      .catch(() => setError(t('presencial_error')))
      .finally(() => setLoading(false));
  }, [apiUrl, patientPos, radiusKm, initialFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!patientPos) return;
    let cancelled = false;
    setNearbyError(false);
    const params = new URLSearchParams({
      lat: String(patientPos.lat),
      lng: String(patientPos.lng),
      radius_km: String(radiusKm),
    });
    const toPlaces = (data) => (data || []).map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, name: p.name, amenity: p.kind }));

    // Phase 1: whatever's already cached in our DB — instant, paints the map
    // right away. Phase 2, in parallel: refreshes against Overpass (slower;
    // this search also helps fill the cache) and adds new results without
    // blocking or showing another big loading state.
    fetch(`${apiUrl}/api/health-places?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setNearbyPlaces(toPlaces(data));
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('Could not load cached nearby health places:', e);
      });

    setNearbyLoading(true);
    fetch(`${apiUrl}/api/health-places/refresh?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setNearbyPlaces(toPlaces(data));
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn('Could not refresh nearby health places:', e);
        setNearbyError(true);
      })
      .finally(() => {
        if (!cancelled) setNearbyLoading(false);
      });

    return () => { cancelled = true; };
  }, [apiUrl, patientPos, radiusKm]);

  const colorOf = useMemo(() => {
    const map = new Map();
    doctors.forEach((d, i) => map.set(d.id, PIN_COLORS[i % PIN_COLORS.length]));
    return map;
  }, [doctors]);

  return (
    <div className="min-h-screen bg-base pb-24 font-sans px-5 pt-4">
      <style>{`
        .leaflet-tooltip.doctor-tooltip {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          box-shadow: 0 12px 24px rgba(15,23,42,.12);
          opacity: 1 !important;
          white-space: normal;
        }
        .leaflet-tooltip-right.doctor-tooltip::before { border-right-color: #fff; }
        .leaflet-tooltip-left.doctor-tooltip::before { border-left-color: #fff; }
        .leaflet-tooltip-top.doctor-tooltip::before { border-top-color: #fff; }
        .leaflet-tooltip-bottom.doctor-tooltip::before { border-bottom-color: #fff; }
      `}</style>

      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-brand-dark transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('land_back')}
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-1.5 hover:border-brand-blue/40 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> {t('presencial_change_search')}
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <MapPin className="text-brand-purple" size={22} />
          <h2 className="text-xl font-extrabold text-brand-dark">{t('presencial_modality_label')}</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">{t('presencial_subtitle_hover')}</p>

        {locating && !patientPos && (
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-soft text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-brand-purple animate-spin" />
            <p className="text-sm text-gray-500">{t('presencial_locating')}</p>
          </div>
        )}

        {!locating && locateError && !patientPos && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-brand-dark mb-1">{t('presencial_locate_blocked_title')}</p>
              <p className="text-sm text-gray-500 mb-5">{locateError}</p>
              <div className="flex gap-2">
                <button
                  onClick={onBack}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600"
                >
                  {t('land_back')}
                </button>
                <button
                  onClick={locate}
                  className="flex-1 py-2.5 rounded-xl bg-brand-purple text-white text-sm font-bold hover:opacity-90 transition-all"
                >
                  {t('presencial_retry')}
                </button>
              </div>
            </div>
          </div>
        )}

        {patientPos && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                {t('presencial_radius_label')}
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-sm text-brand-dark focus:outline-none focus:border-brand-blue"
              >
                {RADIUS_OPTIONS.map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />}

              <label className="ml-2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNearby}
                  onChange={(e) => setShowNearby(e.target.checked)}
                  className="accent-brand-blue w-3.5 h-3.5"
                />
                {t('presencial_show_nearby')}
              </label>
              {showNearby && nearbyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
              {showNearby && nearbyError && (
                <span className="text-[11px] text-amber-600">{t('presencial_nearby_error')}</span>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl p-4 text-center mb-3">
                {error}
              </div>
            )}

            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-soft mb-3 relative isolate" style={{ height: 460 }}>
              <MapContainer center={[patientPos.lat, patientPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <CircleMarker
                  center={[patientPos.lat, patientPos.lng]}
                  radius={9}
                  pathOptions={{ color: '#fff', weight: 3, fillColor: '#3b82f6', fillOpacity: 1 }}
                />

                {showNearby && nearbyPlaces.map((p) => (
                  <Marker
                    key={p.id}
                    position={[p.lat, p.lng]}
                    icon={externalPinIcon()}
                    eventHandlers={{
                      click: () => window.open(
                        `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`,
                        '_blank',
                        'noopener,noreferrer'
                      ),
                    }}
                  >
                    <Tooltip direction="auto" className="doctor-tooltip" opacity={1}>
                      <div className="w-44">
                        <p className="font-bold text-brand-dark text-sm">{p.name || amenityLabel(t, p.amenity)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{amenityLabel(t, p.amenity)}</p>
                        <p className="text-[10px] text-gray-400 mt-1.5">{t('presencial_external_hint')}</p>
                      </div>
                    </Tooltip>
                  </Marker>
                ))}

                {doctors.map((d) => (
                  <Marker
                    key={d.id}
                    position={[d.lat, d.lng]}
                    icon={pinIcon(colorOf.get(d.id), initialsOf(d.full_name), d.avatar_url)}
                    eventHandlers={{ click: () => onSelectDoctor(d.id) }}
                  >
                    <Tooltip direction="auto" className="doctor-tooltip" opacity={1}>
                      <DoctorPreviewCard d={d} language={language} t={t} />
                    </Tooltip>
                  </Marker>
                ))}
                <KeepSize />
              </MapContainer>

              <div
                className="absolute left-3 bottom-3 z-[1000] rounded-xl px-3 py-2 text-[11px] text-gray-600 flex items-center gap-3 bg-white/95 border border-gray-200 shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> {t('presencial_you')}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-gray-500" /> {t('presencial_legend_doctor')}
                </span>
                {showNearby && nearbyPlaces.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> {t('presencial_legend_other')}
                  </span>
                )}
              </div>
            </div>

            {!loading && doctors.length === 0 && !error && (
              <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500 mb-3">
                {t('presencial_empty')}
              </div>
            )}

            {doctors.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
                {doctors.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onSelectDoctor(d.id)}
                    className="text-left shrink-0 w-60 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-blue/30 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <DoctorMiniAvatar avatarUrl={d.avatar_url} initials={initialsOf(d.full_name)} color={colorOf.get(d.id)} />
                      <div className="min-w-0">
                        <p className="font-bold text-brand-dark text-sm truncate">{d.full_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {(d.specialties || []).map((s) => translateSpecialtyName(s.name, language)).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(d.insurance_companies || []).slice(0, 2).map((i) => <Badge key={i.id}>{i.name}</Badge>)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(d.languages || []).map((l) => <Badge key={l.id} tone="blue">{translateLanguageName(l.code, l.name, language)}</Badge>)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EspecialistasPresencialSearch;
