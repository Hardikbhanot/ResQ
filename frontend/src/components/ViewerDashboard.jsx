import React, { useState } from 'react';
import MapDashboard from './MapDashboard';
import AlertDetailsModal from './AlertDetailsModal';

const ViewerDashboard = ({ alerts, handleLogout, currentUser, onAlertClick }) => {
    const [selectedAlert, setSelectedAlert] = useState(null);

    // Filter for high priority or recent
    const criticalAlerts = alerts.filter(a => a.severity === 'HIGH');
    const recentAlerts = alerts.filter(a => a.severity !== 'HIGH').slice(0, 10); // Last 10 others

    const handleCardClick = (alert) => {
        setSelectedAlert(alert);
    };

    return (
        <div className="viewer-container d-flex flex-column vh-100 bg-black text-white overflow-hidden">
            {/* Modal */}
            {selectedAlert && (
                <AlertDetailsModal
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    currentUser={currentUser}
                />
            )}

            {/* Header */}
            <header className="viewer-header p-3 px-4 d-flex justify-content-between align-items-center border-bottom border-dark bg-opacity-50 bg-black backdrop-blur">
                <div className="d-flex align-items-center gap-3">
                    <div className="pulsating-dot bg-danger rounded-circle"></div>
                    <h4 className="m-0 fw-bold tracking-wider text-uppercase">Public Safety Feed</h4>
                    <span className="badge bg-dark border border-secondary text-secondary">LIVE</span>
                </div>
                <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm rounded-pill px-4">Exit View</button>
            </header>

            {/* Main Split Layout */}
            <div className="d-flex flex-grow-1 overflow-hidden">

                {/* Left Panel: Live Feed */}
                <aside className="viewer-feed p-0 border-end border-dark d-flex flex-column" style={{ width: '400px', minWidth: '350px', backgroundColor: '#0c0c0e' }}>
                    <div className="p-3 border-bottom border-dark">
                        <h6 className="text-secondary text-uppercase fw-bold small m-0">Critical Incidents</h6>
                    </div>

                    <div className="feed-list overflow-y-auto flex-grow-1 p-3">
                        {criticalAlerts.length === 0 && (
                            <div className="text-center text-secondary py-5">
                                <i className="bi bi-shield-check fs-1 mb-2 d-block"></i>
                                No critical threats active.
                            </div>
                        )}

                        {criticalAlerts.map(alert => (
                            <div
                                key={alert.id}
                                onClick={() => handleCardClick(alert)}
                                className="viewer-card p-3 mb-3 rounded-3 cursor-pointer position-relative overflow-hidden border border-danger bg-danger bg-opacity-10 hover-scale"
                            >
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="badge bg-danger text-white">CRITICAL</span>
                                    <span className="text-danger small fw-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <h5 className="fw-bold mb-1 text-white">{alert.title}</h5>
                                <p className="small text-secondary mb-0 text-truncate">{alert.description}</p>
                                <div className="glow-effect"></div>
                            </div>
                        ))}

                        <div className="py-2 border-top border-dark mt-2 mb-2">
                            <h6 className="text-secondary text-uppercase fw-bold small">Recent Activity</h6>
                        </div>

                        {recentAlerts.map(alert => (
                            <div
                                key={alert.id}
                                onClick={() => handleCardClick(alert)}
                                className="viewer-card p-3 mb-3 rounded-3 cursor-pointer position-relative border border-secondary bg-dark hover-scale"
                            >
                                <div className="d-flex justify-content-between mb-1">
                                    <span className={`badge ${alert.severity === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>{alert.severity}</span>
                                    <span className="text-secondary small">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <h6 className="fw-bold mb-1 text-light">{alert.title}</h6>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Right Panel: Map */}
                <main className="viewer-map flex-grow-1 position-relative">
                    <MapDashboard alerts={alerts} />

                    {/* Floating Overlay Info */}
                    <div className="position-absolute bottom-0 start-0 m-4 p-3 rounded bg-black bg-opacity-75 border border-secondary text-white" style={{ zIndex: 1000, maxWidth: '300px' }}>
                        <h6 className="fw-bold text-accent mb-1">Live Map Active</h6>
                        <p className="small m-0 text-secondary">Real-time incident tracking across the region. Click any pin for details.</p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ViewerDashboard;
