import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const MapDashboard = ({ alerts }) => {
    // Default to a central location or the first alert
    const defaultCenter = [34.0522, -118.2437]; // Los Angeles

    // Filter alerts with valid coordinates
    const mapAlerts = alerts.filter(a => a.latitude && a.longitude && a.latitude !== 0 && a.longitude !== 0);
    const center = mapAlerts.length > 0 ? [mapAlerts[0].latitude, mapAlerts[0].longitude] : defaultCenter;

    return (
        <div className="map-dashboard h-100 w-100 rounded-4 overflow-hidden border border-secondary">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                {/* Dark Theme Map Tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {mapAlerts.map(alert => (
                    <Marker key={alert.id} position={[alert.latitude, alert.longitude]}>
                        <Popup>
                            <div className="p-1">
                                <b className="text-dark">{alert.title}</b><br />
                                <span className={`badge ${alert.severity === 'HIGH' ? 'bg-danger' : 'bg-warning'}`}>{alert.severity}</span>
                                <p className="m-0 small text-secondary">{alert.description}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapDashboard;
