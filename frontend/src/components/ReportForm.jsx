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

const LocationMarker = ({ position, setPosition, setAddress }) => {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Reverse Geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.display_name) setAddress(data.display_name);
                })
                .catch(err => console.error("Reverse Geocoding failed", err));
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
        reporterName: '',
        address: ''
    });

    const [position, setPosition] = useState(null); // { lat, lng }
    const [attachment, setAttachment] = useState(null);

    // Initial Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    // Optionally fetch address for initial location? Maybe not to avoid spam.
                },
                (err) => console.error(err)
            );
        }
    }, []);

    const handleUseLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition({ lat: latitude, lng: longitude });
                // Reverse Geocode
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.display_name) setFormData(prev => ({ ...prev, address: data.display_name }));
                    })
                    .catch(e => console.error("Reverse Geocoding failed", e));
            },
            () => alert("Unable to retrieve your location")
        );
    };

    const handleAddressSearch = async () => {
        if (!formData.address) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setPosition({ lat: parseFloat(lat), lng: parseFloat(lon) });
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    };

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
            reporterEmail: localStorage.getItem('userEmail') || '',
        };

        fetch('http://localhost:8080/accidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => {
                if (response.ok) {
                    alert('Report Submitted!');
                    setFormData({ title: '', severity: 'HIGH', description: '', reporterName: '', attachmentUrl: null, address: '' });
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
                        <option value="HIGH">CRITICAL - High Priority</option>
                        <option value="MEDIUM">WARNING - Medium Priority</option>
                        <option value="LOW">INFO - Low Priority</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Address / Location</label>
                    <div className="input-group">
                        <input
                            type="text"
                            name="address"
                            className="form-control"
                            placeholder="Enter address or click on map"
                            value={formData.address}
                            onChange={handleChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddressSearch(); } }}
                        />
                        <button className="btn btn-secondary" type="button" onClick={handleAddressSearch} title="Search Address">
                            <i className="bi bi-search"></i>
                        </button>
                        <button className="btn btn-dark border-secondary" type="button" onClick={handleUseLocation} title="Use Current Location">
                            <i className="bi bi-geo-alt-fill text-danger"></i>
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <div className="rounded-3 overflow-hidden border border-secondary" style={{ height: '200px' }}>
                        {position ? (
                            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution='Tiles &copy; Esri'
                                />
                                <LocationMarker
                                    position={position}
                                    setPosition={setPosition}
                                    setAddress={(addr) => setFormData(prev => ({ ...prev, address: addr }))}
                                />
                            </MapContainer>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center h-100 bg-dark text-secondary">
                                <span className="spinner-border spinner-border-sm me-2"></span> Locating...
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" rows="3" placeholder="Describe the incident details..." value={formData.description} onChange={handleChange} required></textarea>
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
