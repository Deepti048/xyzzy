import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { intelligenceAPI } from '../services/api';
import { fetchAllDisasters } from '../services/realTimeDisasters';
import { createMarkerIcon, createUserLocationIcon } from './mapHelpers';
import RealTimeControls from './RealTimeControls';
import CategoryFilter from './CategoryFilter';
import MapLegend from './MapLegend';
import '../styles/MapDashboard.css';

/**
 * RoutingDisplay - Sub-component for drawing navigation routes
 * Fetches route from OSRM and displays polyline on map
 */
function RoutingDisplay({ from, to, onClear }) {
    const map = useMap();
    const routeLayerRef = useRef(null);

    useEffect(() => {
        if (!from || !to) return;

        // Fetch route from OpenStreetMap Routing Service
        const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.routes && data.routes.length > 0) {
                    if (routeLayerRef.current) {
                        map.removeLayer(routeLayerRef.current);
                    }

                    const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    const routeLine = L.polyline(coords, {
                        color: '#3498db',
                        weight: 5,
                        opacity: 0.8
                    });
                    routeLine.addTo(map);
                    routeLayerRef.current = routeLine;

                    const distance = (data.routes[0].distance / 1000).toFixed(1);
                    const duration = Math.round(data.routes[0].duration / 60);

                    routeLine.bindPopup(
                        `<b>Route</b><br/>Distance: ${distance} km<br/>ETA: ${duration} min`
                    ).openPopup();

                    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
                }
            })
            .catch(err => console.error('Routing error:', err));

        return () => {
            if (routeLayerRef.current) {
                map.removeLayer(routeLayerRef.current);
            }
        };
    }, [from, to, map]);

    return null;
}

/**
 * MapDashboard - Main map component for viewing disasters globally
 * Shows only real-time global disaster feeds
 */
function MapDashboard() {
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // User location and routing
    const [userLocation, setUserLocation] = useState(null);
    const [routeTo, setRouteTo] = useState(null);

    // Real-time API data
    const [realTimeDisasters, setRealTimeDisasters] = useState([]);
    const [realTimeLoading, setRealTimeLoading] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);
    const [apiErrors, setApiErrors] = useState({ usgs: false, eonet: false });

    // Other data
    const [weatherData, setWeatherData] = useState(null);
    const [showProximityRadius, setShowProximityRadius] = useState(true);
    const autoRefreshRef = useRef(null);

    // ===== DATA FETCHING =====

    const fetchRealTimeDisasters = async () => {
        setRealTimeLoading(true);
        try {
            const data = await fetchAllDisasters();
            setRealTimeDisasters(data);
            setLastUpdateTime(new Date());
            setApiErrors({ usgs: false, eonet: false });
        } catch (error) {
            console.error('Error fetching real-time disasters:', error);
            setApiErrors({ usgs: true, eonet: true });
        } finally {
            setRealTimeLoading(false);
            setLoading(false);
        }
    };

    // ===== INITIALIZATION & CLEANUP =====

    useEffect(() => {
        // Fetch initial real-time data
        fetchRealTimeDisasters();

        // Auto-refresh real-time data every 45 seconds
        autoRefreshRef.current = setInterval(fetchRealTimeDisasters, 45000);

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = [pos.coords.latitude, pos.coords.longitude];
                    setUserLocation(loc);
                    // Fetch weather for this location
                    intelligenceAPI.getWeather(loc[0], loc[1])
                        .then(res => setWeatherData(res.data))
                        .catch(() => {});
                },
                () => {
                    // Fallback to India center if location unavailable
                    setUserLocation([20.5937, 78.9629]);
                }
            );
        }

        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
        };
    }, []);

    // ===== EVENT HANDLERS =====

    const handleNavigate = (lat, lng) => {
        if (!userLocation) {
            alert('Please enable location services');
            return;
        }
        setRouteTo([parseFloat(lat), parseFloat(lng)]);
    };

    // ===== FILTERING =====

    const dedupeDisasters = (items) => {
        const seen = new Set();
        return items.filter((item) => {
            const lat = Number(item.latitude);
            const lng = Number(item.longitude);
            const roundedLat = Number.isFinite(lat) ? lat.toFixed(3) : 'na';
            const roundedLng = Number.isFinite(lng) ? lng.toFixed(3) : 'na';
            const title = (item.title || '').toLowerCase().trim();
            const location = (item.location_name || '').toLowerCase().trim();
            const key = `${roundedLat}|${roundedLng}|${title}|${location}`;

            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const combined = dedupeDisasters(realTimeDisasters);
    const filtered = combined.filter(d => {
        const categoryOk = selectedCategory === 'all' || d.category === selectedCategory;
        return categoryOk;
    });

    const stats = {
        total: combined.length,
        critical: combined.filter(d => d.severity === 'critical').length,
        responding: combined.filter(d => d.status === 'active' || d.status === 'responding').length
    };

    if (loading) return <div className="loading">📍 Loading map...</div>;

    const center = userLocation || [20.5937, 78.9629];

    return (
        <div className="map-dashboard">
            {/* ===== HEADER ===== */}
            <div className="content-header">
                <h2>🗺️ Real-Time Command Map</h2>
                <div className="map-stats">
                    <span className="map-stat critical">{stats.critical} Critical</span>
                    <span className="map-stat responding">{stats.responding} Responding</span>
                    <span className="map-stat total">{stats.total} Active</span>
                </div>
            </div>

            {/* ===== REAL-TIME CONTROLS ===== */}
            <RealTimeControls
                showRealTime={true}
                realTimeLoading={realTimeLoading}
                lastUpdateTime={lastUpdateTime}
                onRefresh={fetchRealTimeDisasters}
                realTimeDisastersCount={realTimeDisasters.length}
                apiErrors={apiErrors}
            />

            {/* ===== WEATHER BAR ===== */}
            {weatherData && (
                <div className="map-weather-bar">
                    <span>🌡️ {Math.round(weatherData.main?.temp || 0)}°C</span>
                    <span>💧 {weatherData.main?.humidity || 0}%</span>
                    <span>💨 {(weatherData.wind?.speed || 0).toFixed(1)} m/s</span>
                    <span>☁️ {weatherData.weather?.[0]?.description || 'N/A'}</span>
                    <label className="proximity-toggle">
                        <input
                            type="checkbox"
                            checked={showProximityRadius}
                            onChange={e => setShowProximityRadius(e.target.checked)}
                        />
                        50 km Radius
                    </label>
                </div>
            )}

            {/* ===== CATEGORY FILTER ===== */}
            <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showRealTime={true}
            />

            {/* ===== ROUTE ACTIVE BANNER ===== */}
            {routeTo && (
                <div className="route-banner">
                    <span>🧭 Navigation active — route displayed below</span>
                    <button
                        onClick={() => setRouteTo(null)}
                        className="btn btn-sm btn-secondary"
                    >
                        ✕ Clear Route
                    </button>
                </div>
            )}

            {/* ===== MAP CONTAINER ===== */}
            <div className="map-container">
                <MapContainer center={center} zoom={5} className="leaflet-map">
                    {/* Base map tiles */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User location marker */}
                    {userLocation && (
                        <>
                            <Marker
                                position={userLocation}
                                icon={createUserLocationIcon()}
                            >
                                <Popup>📍 Your Location</Popup>
                            </Marker>

                            {/* Proximity circle */}
                            {showProximityRadius && (
                                <Circle
                                    center={userLocation}
                                    radius={50000}
                                    pathOptions={{
                                        color: '#3498db',
                                        fillColor: '#3498db',
                                        fillOpacity: 0.06,
                                        weight: 2,
                                        dashArray: '8 4'
                                    }}
                                />
                            )}
                        </>
                    )}

                    {/* Disaster markers */}
                    {filtered.map(disaster => (
                        <Marker
                            key={disaster.id}
                            position={[parseFloat(disaster.latitude), parseFloat(disaster.longitude)]}
                            icon={createMarkerIcon(disaster.category, disaster.severity)}
                        >
                            <Popup>
                                <div className="map-popup">
                                    <h4>{disaster.title}</h4>
                                    <p>{disaster.description.substring(0, 100)}...</p>
                                    <div className="popup-meta">
                                        <span className={`popup-badge ${disaster.severity}`}>
                                            {disaster.severity.toUpperCase()}
                                        </span>
                                        <span className={`popup-status ${disaster.status}`}>
                                            {disaster.status}
                                        </span>
                                    </div>
                                    <p className="popup-location">📍 {disaster.location_name}</p>
                                    <button
                                        className="popup-nav-btn"
                                        onClick={() => handleNavigate(disaster.latitude, disaster.longitude)}
                                    >
                                        🧭 Navigate Here
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Route display */}
                    {routeTo && userLocation && (
                        <RoutingDisplay from={userLocation} to={routeTo} onClear={() => setRouteTo(null)} />
                    )}
                </MapContainer>
            </div>

            {/* ===== LEGEND ===== */}
            <MapLegend showRealTime={true} />
        </div>
    );
}

export default MapDashboard;
