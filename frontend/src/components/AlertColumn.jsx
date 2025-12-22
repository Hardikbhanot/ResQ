import React from 'react';
import AlertCard from './AlertCard';

const AlertColumn = ({ title, alerts, type, currentUser }) => {
    const dotClass = type === 'HIGH' ? 'dot-high' : type === 'MEDIUM' ? 'dot-medium' : 'dot-low';

    return (
        <div className="board-column">
            <div className="col-header">
                <div className={`dot-indicator ${dotClass}`}></div>
                {title} ({alerts.length})
                <div className="ms-auto"><i className="bi bi-three-dots"></i></div>
            </div>

            <div className="column-content">
                {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} type={type} currentUser={currentUser} />
                ))}
            </div>
        </div>
    );
};

export default AlertColumn;
