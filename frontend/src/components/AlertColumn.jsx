import React, { useState } from 'react';
import AlertCard from './AlertCard';

const AlertColumn = ({ title, alerts, type, currentUser, onAlertClick }) => {
    const dotClass = type === 'HIGH' ? 'dot-high' : type === 'MEDIUM' ? 'dot-medium' : 'dot-low';
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="alert-column" style={{ transition: 'all 0.3s ease' }}>
            <div className="column-header">
                <div className={`status-dot ${dotClass}`}></div>
                {title} ({alerts.length})
                <div className="ms-auto position-relative">
                    <button
                        className="btn btn-sm btn-link text-secondary p-0"
                        onClick={() => setShowMenu(!showMenu)}
                        style={{ textDecoration: 'none' }}
                    >
                        <i className="bi bi-three-dots"></i>
                    </button>

                    {showMenu && (
                        <div className="position-absolute end-0 mt-1 bg-dark border border-secondary rounded shadow-sm p-1" style={{ zIndex: 1000, minWidth: '120px' }}>
                            <button className="btn btn-sm text-secondary w-100 text-start hover-bg-dark" onClick={() => { setIsCollapsed(!isCollapsed); setShowMenu(false); }}>
                                <i className={`bi bi-arrows-${isCollapsed ? 'expand' : 'collapse'} me-2`}></i>
                                {isCollapsed ? 'Expand' : 'Collapse'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {!isCollapsed && (
                <div className="column-content d-flex flex-column gap-3">
                    {alerts.map((alert) => (
                        <AlertCard key={alert.id} alert={alert} type={type} currentUser={currentUser} onClick={() => onAlertClick && onAlertClick(alert)} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertColumn;
