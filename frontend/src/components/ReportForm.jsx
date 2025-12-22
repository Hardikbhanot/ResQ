import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Incident Location</Popup>
        </Marker>
    );
};

const ReportForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        severity: 'HIGH',
        description: '',
        reporterName: ''
    });

    const [position, setPosition] = useState(null); // { lat, lng }
    const [attachment, setAttachment] = useState(null);

    // Initial Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => console.error(err)
            );
        }
    }, []);

    // ... (keep file upload logic) ...
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAttachment(file);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('http://localhost:8080/api/uploads', {
                method: 'POST',
                body: uploadData
            });

            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, attachmentUrl: data.url }));
            } else {
                alert("File upload failed");
            }
        } catch (err) {
            console.error("Upload error", err);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            latitude: position ? position.lat : 0.0,
            longitude: position ? position.lng : 0.0,
            reporterName: formData.reporterName || 'Anonymous',
        };

        fetch('http://localhost:8080/accidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => {
                if (response.ok) {
                    alert('Report Submitted!');
                    setFormData({ title: '', severity: 'HIGH', description: '', reporterName: '', attachmentUrl: null });
                    setAttachment(null);
                    // Keep position as is or reset?
                } else {
                    alert('Failed to submit report');
                }
            })
            .catch(err => console.error('Error:', err));
    };

    return (
        <div className="sidebar">
            <div className="brand">
                <div className="brand-icon">
                    <i className="bi bi-shield-fill-check"></i>
                </div>
                <div>
                    <h5 className="m-0 fw-bold">ResQ</h5>
                    <small className="text-secondary" style={{ fontSize: '0.7em' }}>Real-time Priority Dispatch</small>
                </div>
            </div>

            <h4 className="fw-bold mb-1">Report Incident</h4>
            <p className="text-secondary small mb-4">Submit a new report to the central dashboard.</p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Reporter Name</label>
                    <input type="text" name="reporterName" className="form-control" placeholder="John Doe" value={formData.reporterName} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Incident Title</label>
                    <input type="text" name="title" className="form-control" placeholder="e.g. Suspicious Vehicle" value={formData.title} onChange={handleChange} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select name="severity" className="form-control" value={formData.severity} onChange={handleChange}>
                        <option value="HIGH">HIGH - Critical</option>
                        <option value="MEDIUM">MEDIUM - Warning</option>
                        <option value="LOW">LOW - Info</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" rows="3" placeholder="Describe the incident details..." value={formData.description} onChange={handleChange} required></textarea>
                </div>

                {/* Map Section */}
                <div className="form-group">
                    <label className="form-label">Location (Click to Pin)</label>
                    <div className="rounded-3 overflow-hidden border border-secondary" style={{ height: '200px' }}>
                        {position ? (
                            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                <LocationMarker position={position} setPosition={setPosition} />
                            </MapContainer>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 bg-dark text-secondary">
                                <span className="spinner-border spinner-border-sm me-2"></span> Locating...
                            </div>
                        )}
                    </div>
                </div>

                {/* File Attachment UI */}
                <div className="mt-3 mb-4 p-3 text-center cursor-pointer" style={{ background: '#2C2C28', borderRadius: '12px', border: '1px dashed #3F3F46', color: '#A1A1AA' }} onClick={() => document.getElementById('fileInput').click()}>
                    <input type="file" id="fileInput" hidden onChange={handleFileChange} />
                    {attachment ? (
                        <div className="text-warning small"><i className="bi bi-file-earmark-check-fill me-2"></i>{attachment.name}</div>
                    ) : (
                        <div className="small"><i className="bi bi-camera me-2"></i>Attach Evidence</div>
                    )}
                </div>

                <button type="submit" className="btn-submit">Submit Report</button>
            </form>
        </div>
    );
};

export default ReportForm;
