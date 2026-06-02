import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { connectSocket } from '../socket';
import { ridersService } from '../features/riders/ridersService';
import type { Rider } from '../features/riders/types';
import { analyticsService } from '../features/analytics/analyticsService';
import type { AnalyticsSummary } from '../features/analytics/types';

// Fix default Leaflet marker icons (use CDN assets)
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Inline styles for Leaflet overrides ── */
const leafletOverrides = `
  .grayscale-map .leaflet-tile-pane {
    filter: grayscale(1) brightness(0.85) contrast(1.1);
  }
  .grayscale-map .leaflet-control-zoom {
    display: none !important;
  }
  .grayscale-map .leaflet-control-scale {
    display: none !important;
  }
  .grayscale-map .leaflet-container {
    z-index: 0 !important;
  }
`;

/**
 * Auto-fit the map view to include all rider points.
 */
function FitBounds({ points }: { points: L.LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [points, map]);
  return null;
}

/**
 * Custom marker icon – green filled location pin using SVG
 */
function createMarkerIcon(status: string) {
  const fill = status === 'available' ? '#006c49' : status === 'busy' ? '#e67e22' : '#9ca3af';
  return new L.DivIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 24 24" fill="${fill}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

/**
 * LiveRiderMap – displays real-time rider locations with a professional
 * dashboard layout matching the RiderStream design spec.
 */
interface LiveAlert {
  id: string;
  type: 'critical' | 'success' | 'info' | 'warning';
  message: string;
  time: Date;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
}

const ALERT_STYLE: Record<LiveAlert['type'], { border: string; color: string; icon: string; label: string }> = {
  critical: { border: '#ba1a1a', color: '#ba1a1a', icon: '⚠', label: 'Critical' },
  warning:  { border: '#e67e22', color: '#e67e22', icon: '⚠', label: 'Warning' },
  success:  { border: '#006c49', color: '#006c49', icon: '✓', label: 'Success' },
  info:     { border: '#191c1e', color: '#191c1e', icon: 'ℹ', label: 'Update' },
};

export default function LiveRiderMap() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [includeOffline, setIncludeOffline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const loadRiders = async (offline: boolean) => {
    setIsLoading(true);
    try {
      const data = await ridersService.fetchRiderLocations(offline);
      setRiders(data);
    } catch (err) {
      console.error('Failed to fetch rider locations', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await analyticsService.fetchSummary();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  // Helper: push a new alert (keep max 50, newest first)
  const pushAlert = (type: LiveAlert['type'], message: string) => {
    setAlerts(prev => [
      { id: `${Date.now()}-${Math.random()}`, type, message, time: new Date() },
      ...prev,
    ].slice(0, 50));
  };

  // Socket: real-time location updates + alert events
  useEffect(() => {
    const s = connectSocket();

    // Location updates
    const handleLocationUpdate = (payload: { riderId: string; lat: number; lng: number }) => {
      setRiders(prev => {
        const idx = prev.findIndex(r => r.id === payload.riderId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const rider = { ...updated[idx] } as Rider;
        rider.location = { lat: payload.lat, lng: payload.lng };
        updated[idx] = rider;
        return updated;
      });
    };

    // Order assigned
    const handleOrderAssigned = (data: { orderId: string; riderName: string }) => {
      pushAlert('info', `Order #${data.orderId.slice(-6)} assigned to ${data.riderName}`);
    };

    // Order status changed
    const handleStatusChanged = (data: { orderId: string; status: string }) => {
      const status = data.status.replace(/_/g, ' ');
      if (status === 'delivered') {
        pushAlert('success', `Order #${data.orderId.slice(-6)} delivered successfully`);
      } else {
        pushAlert('info', `Order #${data.orderId.slice(-6)} status → ${status}`);
      }
    };

    // Rider went offline
    const handleRiderOffline = (data: { riderId: string; reassignedOrdersCount: number }) => {
      if (data.reassignedOrdersCount > 0) {
        pushAlert('warning', `Rider went offline — ${data.reassignedOrdersCount} order(s) auto-reassigned`);
      } else {
        pushAlert('critical', `Rider ${data.riderId.slice(-6)} went offline`);
      }
    };

    s.on('location_update', handleLocationUpdate);
    s.on('order_assigned', handleOrderAssigned);
    s.on('order_status_changed', handleStatusChanged);
    s.on('rider_offline', handleRiderOffline);

    return () => {
      s.off('location_update', handleLocationUpdate);
      s.off('order_assigned', handleOrderAssigned);
      s.off('order_status_changed', handleStatusChanged);
      s.off('rider_offline', handleRiderOffline);
    };
  }, []);

  // Load riders on mount / when offline toggle changes
  useEffect(() => { loadRiders(includeOffline); }, [includeOffline]);
  useEffect(() => { loadAnalytics(); }, []);

  const onlineCount = riders.filter(r => r.status !== 'offline').length;
  const offlineCount = riders.filter(r => r.status === 'offline').length;

  const points = riders
    .filter(r => {
      const ok = r.location && typeof r.location.lat === 'number' && typeof r.location.lng === 'number';
      return ok && (includeOffline || r.status === 'available');
    })
    .map(r => [r.location!.lat, r.location!.lng] as L.LatLngExpression);

  /* ─────────────── RENDER ─────────────── */
  const CALM = ['#2d6a4f', '#457b9d', '#6c757d', '#8d6e63', '#7b6d8d', '#5a8a98', '#6b8e6b', '#8e7c68'];

  return (
    <div className="lrm-root">
      {/* ── Responsive CSS ── */}
      <style>{leafletOverrides}</style>
      <style>{`
        .lrm-root {
          font-family: 'Hanken Grotesk', 'Inter', sans-serif;
          padding: 20px;
        }
        .lrm-map-section {
          width: 100%; height: 320px; border-radius: 12px; overflow: hidden;
          position: relative; z-index: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
          border: 1px solid #e0e3e5; background: #eceef0;
        }
        .lrm-grid-row {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; margin-top: 24px;
        }
        .lrm-perf-zone-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 20px; margin-top: 24px;
        }
        .lrm-card {
          background: #fff; border-radius: 12px; border: 1px solid #e0e3e5;
          padding: 20px; display: flex; flex-direction: column; gap: 14;
        }
        .lrm-card-title {
          font-size: 11px; font-weight: 600; color: #76777d;
          letter-spacing: 0.08em; text-transform: uppercase;
          border-bottom: 1px solid #e0e3e5; padding-bottom: 10px; margin: 0;
        }
        .lrm-summary-chips {
          display: flex; gap: 12px; flex-wrap: wrap;
        }
        .lrm-chip {
          flex: 1 1 0; min-width: 100px; background: #f8f9fa;
          border-radius: 8px; padding: 12px 16px; text-align: center;
        }
        .lrm-overlay-card {
          position: absolute; z-index: 1000;
          background: rgba(255,255,255,.92); backdrop-filter: blur(8px);
          border: 1px solid #e0e3e5; box-shadow: 0 4px 12px rgba(0,0,0,.08);
        }
        /* Tablet */
        @media (max-width: 1024px) {
          .lrm-grid-row { grid-template-columns: 1fr 1fr; }
          .lrm-perf-zone-row { grid-template-columns: 1fr; }
        }
        /* Mobile */
        @media (max-width: 640px) {
          .lrm-root { padding: 12px; }
          .lrm-map-section { height: 220px; border-radius: 8px; }
          .lrm-grid-row { grid-template-columns: 1fr; gap: 16px; margin-top: 16px; }
          .lrm-perf-zone-row { grid-template-columns: 1fr; gap: 16px; margin-top: 16px; }
          .lrm-card { padding: 16px; border-radius: 8px; }
          .lrm-summary-chips { flex-direction: column; }
          .lrm-chip { min-width: unset; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* ═══ MAP SECTION ═══ */}
      <section className="lrm-map-section grayscale-map">
        {/* Title overlay */}
        <div className="lrm-overlay-card" style={{ top: 16, left: 16, padding: '12px 16px', borderRadius: 10, maxWidth: 220 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#191c1e', margin: 0 }}>Live Fleet Tracking</h1>
          <p style={{ fontSize: 12, color: '#76777d', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d6a4f', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {onlineCount} active units
          </p>
        </div>

        {/* Offline toggle */}
        <div className="lrm-overlay-card" style={{ top: 16, right: 60, padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#45464d' }}>
          <input type="checkbox" id="includeOffline" checked={includeOffline} onChange={e => setIncludeOffline(e.target.checked)} style={{ accentColor: '#2d6a4f' }} />
          <label htmlFor="includeOffline">Offline</label>
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e3e5', boxShadow: '0 2px 6px rgba(0,0,0,.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => document.querySelector<any>('.leaflet-container')?.__leaflet_map?.zoomIn()} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#191c1e', borderBottom: '1px solid #e0e3e5' }}>＋</button>
            <button onClick={() => document.querySelector<any>('.leaflet-container')?.__leaflet_map?.zoomOut()} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#191c1e' }}>−</button>
          </div>
        </div>

        {/* Map */}
        {!isLoading && (
          <MapContainer center={[12.9716, 77.5946] as L.LatLngExpression} zoom={12} scrollWheelZoom={true} zoomControl={false} attributionControl={false} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <FitBounds points={points} />
            {riders.filter(r => includeOffline || r.status === 'available').map(r => {
              const pos = r.location?.lat && r.location?.lng ? ([r.location.lat, r.location.lng] as L.LatLngExpression) : null;
              return pos && (
                <Marker key={r.id} position={pos} icon={createMarkerIcon(r.status) as any}>
                  <Tooltip direction={"top" as any} offset={[0, -30] as any}>{r.name} · {r.status}</Tooltip>
                  <Popup>
                    <div style={{ fontFamily: "'Hanken Grotesk', sans-serif" }}>
                      <strong>{r.name}</strong>
                      <div style={{ fontSize: 12, color: '#76777d' }}>Status: {r.status}</div>
                      <div style={{ fontSize: 12, color: '#76777d' }}>GPS: {r.location?.lat?.toFixed(4)}, {r.location?.lng?.toFixed(4)}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#76777d' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}><path fill="currentColor" d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/></svg>
          </div>
        )}
      </section>

      {/* ═══ ROW 2: STATS · FLEET · ALERTS ═══ */}
      <div className="lrm-grid-row">

        {/* Rider Stats */}
        <div className="lrm-card">
          <h2 className="lrm-card-title">Rider Stats</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#191c1e', fontWeight: 500 }}>Total Riders</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, background: '#f0f0f0', padding: '2px 10px', borderRadius: 4 }}>{riders.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#191c1e' }}>Online</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, background: '#e8f5ee', color: '#2d6a4f', padding: '2px 10px', borderRadius: 4 }}>{onlineCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#76777d' }}>Offline</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, background: '#e6e8ea', padding: '2px 10px', borderRadius: 4 }}>{offlineCount}</span>
            </div>
          </div>
          <div style={{ background: '#1a2332', borderRadius: 8, padding: '10px 14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5 }}>Network</div>
              <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2 }}>99.8%</div>
            </div>
            <span style={{ fontSize: 20, opacity: 0.15 }}>⬡</span>
          </div>
        </div>

        {/* Fleet Overview */}
        <div className="lrm-card">
          <h2 className="lrm-card-title">Fleet Overview</h2>
          {riders.length === 0 ? (
            <div style={{ color: '#76777d', fontSize: 13, textAlign: 'center', padding: 20 }}>No riders</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e3e5' }}>
                    <th style={{ textAlign: 'left', padding: '8px 6px', fontSize: 10, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rider</th>
                    <th style={{ textAlign: 'center', padding: '8px 6px', fontSize: 10, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < riders.length - 1 ? '1px solid #f0f0f0' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: r.status === 'available' ? '#e8f5ee' : '#e6e8ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: r.status === 'available' ? '#2d6a4f' : '#76777d' }}>
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: '#191c1e', fontSize: 13 }}>{r.name}</span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 6px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: r.status === 'available' ? '#e8f5ee' : '#fde8e8', color: r.status === 'available' ? '#2d6a4f' : '#ba1a1a', textTransform: 'capitalize' }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Alerts */}
        <div className="lrm-card" style={{ maxHeight: 350 }}>
          <h2 className="lrm-card-title">Live Alerts</h2>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: '#76777d', fontSize: 13 }}>
                No alerts yet — events appear in real time.
              </div>
            )}
            {alerts.map(a => {
              const st = ALERT_STYLE[a.type];
              return (
                <div key={a.id} style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: 8, borderLeft: `3px solid ${st.border}` }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: st.color, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>{st.icon} {st.label}</p>
                  <p style={{ fontSize: 12, color: '#191c1e', margin: '3px 0 0' }}>{a.message}</p>
                  <p style={{ fontSize: 10, color: '#76777d', margin: '3px 0 0' }}>{timeAgo(a.time)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ ROW 3: DELIVERY PERFORMANCE + ZONE DISTRIBUTION ═══ */}
      <div className="lrm-perf-zone-row">

        {/* Delivery Performance */}
        <div className="lrm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 className="lrm-card-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>Delivery Performance</h2>
              <p style={{ fontSize: 12, color: '#191c1e', margin: '4px 0 0' }}>
                {analytics ? `${analytics.successRate}% success rate` : '—'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#2d6a4f', display: 'inline-block' }} />Delivered</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#ba1a1a', display: 'inline-block' }} />Failed</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#c4c7c9', display: 'inline-block' }} />Pending</span>
            </div>
          </div>

          {analytics ? (() => {
            const total = Math.max(analytics.totalOrders, 1);
            const bars = [
              { label: 'Delivered', value: analytics.delivered, color: '#2d6a4f' },
              { label: 'Failed', value: analytics.failed, color: '#ba1a1a' },
              { label: 'Pending', value: analytics.pending, color: '#c4c7c9' },
            ];
            const rp = analytics.riderPerformance || [];
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
                {bars.map(b => (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: '#191c1e' }}>{b.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: b.color }}>{b.value}</span>
                    </div>
                    <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(b.value / total) * 100}%`, background: b.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}

                {rp.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 10, fontWeight: 600, color: '#76777d', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Rider Performance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rp.map(r => {
                        const rTotal = Math.max(r.delivered + r.failed, 1);
                        const pct = Math.round((r.delivered / rTotal) * 100);
                        return (
                          <div key={r.riderName} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#2d6a4f', flexShrink: 0 }}>
                              {r.riderName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.riderName}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d6a4f', flexShrink: 0 }}>{pct}%</span>
                              </div>
                              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: '#2d6a4f', borderRadius: 2, transition: 'width 0.6s ease' }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 10, color: '#76777d', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{r.delivered}D/{r.failed}F</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="lrm-summary-chips">
                  <div className="lrm-chip">
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#191c1e', fontFamily: "'JetBrains Mono', monospace" }}>{analytics.totalOrders}</div>
                  </div>
                  <div className="lrm-chip">
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Time</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#191c1e', fontFamily: "'JetBrains Mono', monospace" }}>{analytics.avgDeliveryTime}<span style={{ fontSize: 11, color: '#76777d' }}>m</span></div>
                  </div>
                  <div className="lrm-chip" style={{ background: '#e8f5ee' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Success</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#2d6a4f', fontFamily: "'JetBrains Mono', monospace" }}>{analytics.successRate}%</div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ textAlign: 'center', padding: 30, color: '#76777d', fontSize: 13 }}>Loading...</div>
          )}
        </div>

        {/* Zone Volume Distribution */}
        <div className="lrm-card">
          <h2 className="lrm-card-title">Zone Volume Distribution</h2>

          {analytics && analytics.zoneWiseSummary && analytics.zoneWiseSummary.length > 0 ? (() => {
            const zones = analytics.zoneWiseSummary;
            const maxOrders = Math.max(...zones.map(z => z.totalOrders), 1);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                {/* Horizontal bar chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {zones.map((z, i) => {
                    const pct = (z.totalOrders / maxOrders) * 100;
                    const color = CALM[i % CALM.length];
                    return (
                      <div key={z.zone}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#191c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{z.zone}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: '#191c1e' }}>{z.totalOrders}</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: z.successRate >= 80 ? '#2d6a4f' : z.successRate >= 50 ? '#8d6e63' : '#ba1a1a', background: z.successRate >= 80 ? '#e8f5ee' : z.successRate >= 50 ? '#fef3e2' : '#fde8e8', padding: '1px 6px', borderRadius: 3 }}>
                              {z.successRate}%
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease', opacity: 0.85 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Zones</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#191c1e', fontFamily: "'JetBrains Mono', monospace" }}>{zones.length}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#76777d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Orders</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#191c1e', fontFamily: "'JetBrains Mono', monospace" }}>{zones.reduce((s, z) => s + z.totalOrders, 0)}</div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ textAlign: 'center', padding: 30, color: '#76777d', fontSize: 13 }}>No zone data</div>
          )}
        </div>
      </div>
    </div>
  );
}
