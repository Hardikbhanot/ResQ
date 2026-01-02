import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

// Fix Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal Heatmap Component
const HeatmapLayer = ({ data }) => {
    const map = useMap();

    useEffect(() => {
        const points = data.map(a => [
            a.latitude,
            a.longitude,
            a.severity === 'HIGH' ? 1.0 : a.severity === 'MEDIUM' ? 0.6 : 0.3
        ]);

        if (points.length === 0) return;

        const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 10 }).addTo(map);

        return () => {
            map.removeLayer(heat);
        };
    }, [data, map]);

    return null;
};

const MapDashboard = ({ alerts }) => {
    const defaultCenter = [34.0522, -118.2437];
    const mapAlerts = alerts.filter(a => a.latitude && a.longitude && a.latitude !== 0 && a.longitude !== 0);
    const center = mapAlerts.length > 0 ? [mapAlerts[0].latitude, mapAlerts[0].longitude] : defaultCenter;

    const [showHeatmap, setShowHeatmap] = useState(false);

    return (
        <div className="map-dashboard h-100 w-100 position-relative">
            <div className="position-absolute top-0 end-0 m-3" style={{ zIndex: 9999 }}>
                <button
                    className={`btn btn-sm ${showHeatmap ? 'btn-danger' : 'btn-dark border-secondary'}`}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                >
                    <i className="bi bi-fire me-1"></i> {showHeatmap ? 'Heatmap ON' : 'Heatmap OFF'}
                </button>
            </div>

            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} attributionControl={false}>
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />

                {showHeatmap ? (
                    <HeatmapLayer data={mapAlerts} />
                ) : (
                    mapAlerts.map(alert => {
                        const isHigh = alert.severity === 'HIGH';
                        const customIcon = isHigh ? L.divIcon({
                            className: 'bg-transparent border-0',
                            html: '<div class="map-marker-pulse"></div>',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        }) : new L.Icon.Default();

                        return (
                            <Marker key={alert.id} position={[alert.latitude, alert.longitude]} icon={customIcon}>
                                <Popup>
                                    <div className="p-1">
                                        <b className="text-dark">{alert.title}</b><br />
                                        <span className={`badge ${alert.severity === 'HIGH' ? 'bg-danger' : 'bg-warning'}`}>{alert.severity}</span>
                                        {alert.address && (
                                            <p className="m-0 small text-secondary mt-1 border-top pt-1">
                                                <i className="bi bi-geo-alt-fill me-1"></i>{alert.address}
                                            </p>
                                        )}
                                        <p className="m-0 small text-secondary mt-1">{alert.description}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })
                )}
            </MapContainer>
        </div>
    );
};

export default MapDashboard;
