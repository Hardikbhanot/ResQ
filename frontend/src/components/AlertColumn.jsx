import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

const AlertColumn = ({ title, alerts, type }) => {
    const dotClass = type === 'HIGH' ? 'dot-high' : type === 'MEDIUM' ? 'dot-medium' : 'dot-low';
    const borderClass = type === 'HIGH' ? 'card-high' : type === 'MEDIUM' ? 'card-medium' : 'card-low';
    const icon = type === 'HIGH' ? 'bi-fire' : type === 'MEDIUM' ? 'bi-cone-striped' : 'bi-info-circle';

    // Mock data helpers for UI demo
    const getMockStatus = (type, index) => {
        if (type === 'HIGH') return index % 2 === 0 ? 'In Progress' : 'Transporting';
        if (type === 'MEDIUM') return 'New';
        return 'Resolved';
    }

    const getMockDue = (type) => type === 'HIGH' ? 'ASAP' : 'Today, 2pm';
    const getMockAssignee = (index) => index % 2 === 0 ? 'JL' : 'PW';

    return (
        <div className="board-column">
            <div className="col-header">
                <div className={`dot-indicator ${dotClass}`}></div>
                {title} ({alerts.length})
                <div className="ms-auto"><i className="bi bi-three-dots"></i></div>
            </div>

            <div className="column-content">
                {alerts.map((alert, index) => {
                    const status = alert.status === 'OPEN' ? getMockStatus(type, index) : alert.status;

                    return (
                        <div key={alert.id} className={`alert-card ${borderClass}`}>
                            <div className="card-meta">
                                <span className={type === 'HIGH' ? 'text-danger' : type === 'MEDIUM' ? 'text-warning' : 'text-info'}>
                                    <i className={`bi ${icon} me-2`}></i>{type} HAZARD
                                </span>
                                <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            <div className="card-title text-white">{alert.title}</div>
                            <div className="card-desc text-secondary mb-3">
                                {alert.description}
                            </div>

                            {/* Progress Line (Visual Only for now) */}
                            <div className="progress mb-3" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                <div className="progress-bar" style={{
                                    width: '45%',
                                    background: type === 'HIGH' ? '#EF4444' : type === 'MEDIUM' ? '#F59E0B' : '#22C55E'
                                }}></div>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <StatusBadge status={status} />
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Due: {getMockDue(type)}</span>
                            </div>

                            <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="avatar-circle" style={{ background: '#3B82F6', width: '24px', height: '24px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {getMockAssignee(index)}
                                    </div>
                                    {index % 2 !== 0 && (
                                        <div className="avatar-circle" style={{ background: '#64748B', width: '24px', height: '24px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            +2
                                        </div>
                                    )}
                                </div>

                                <div className="d-flex gap-3 text-secondary" style={{ fontSize: '0.8rem' }}>
                                    <span><i className="bi bi-chat-fill me-1"></i> {alert.comments ? alert.comments.length : Math.floor(Math.random() * 5)}</span>
                                    <span><i className="bi bi-paperclip"></i></span>
                                </div>
                            </div>

                            {/* Footer Dispatch Note (Mock) */}
                            {type === 'HIGH' && (
                                <div className="mt-3 p-2 rounded" style={{ background: 'rgba(0,0,0,0.3)', fontSize: '0.75rem', color: '#94a3b8' }}>
                                    <span className="fw-bold text-white">Dispatch:</span> Unit 42 is 2 mins out.
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default AlertColumn;
