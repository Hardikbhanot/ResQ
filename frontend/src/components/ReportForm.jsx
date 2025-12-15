import React, { useState, useEffect } from 'react';

const ReportForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        severity: 'HIGH',
        description: '',
        latitude: '',
        longitude: ''
    });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toFixed(6),
                        longitude: position.coords.longitude.toFixed(6)
                    }));
                },
                (error) => {
                    console.error("Error getting location: ", error);
                }
            );
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            latitude: parseFloat(formData.latitude) || 0.0, // Default if empty
            longitude: parseFloat(formData.longitude) || 0.0
        };

        fetch('http://localhost:8080/accidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
            .then(response => {
                if (response.ok) {
                    alert('Report Submitted!');
                    setFormData({ title: '', severity: 'HIGH', description: '', latitude: '', longitude: '' });
                } else {
                    alert('Failed to submit report');
                }
            })
            .catch(err => console.error('Error submitting report:', err));
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
                    <label className="form-label">Incident Title</label>
                    <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="e.g. Suspicious Vehicle"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Severity Level</label>
                    <select
                        name="severity"
                        className="form-control"
                        value={formData.severity}
                        onChange={handleChange}
                    >
                        <option value="HIGH">HIGH - Critical</option>
                        <option value="MEDIUM">MEDIUM - Warning</option>
                        <option value="LOW">LOW - Info</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                        name="description"
                        className="form-control"
                        rows="4"
                        placeholder="Describe the incident details..."
                        value={formData.description}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <div className="row">
                    <div className="col-6">
                        <div className="form-group">
                            <label className="form-label">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                className="form-control"
                                placeholder="34.0522"
                                value={formData.latitude}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="form-group">
                            <label className="form-label">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                className="form-control"
                                placeholder="-118.2437"
                                value={formData.longitude}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="text-secondary small mt-1 mb-3">
                    <i className="bi bi-geo-alt-fill me-1"></i>
                    {formData.latitude ? 'Location detected automatically' : 'Detecting location...'}
                </div>

                {/* Fake Evidence Upload UI */}
                <div className="mt-3 mb-4 p-4 text-center" style={{ background: '#2C2C28', borderRadius: '16px', border: '2px dashed #3F3F46', color: '#A1A1AA' }}>
                    <i className="bi bi-camera me-2"></i>
                    <span className="small">Attach Evidence</span>
                </div>

                <button type="submit" className="btn-submit">
                    Submit Report
                </button>
            </form>
        </div>
    );
};

export default ReportForm;
