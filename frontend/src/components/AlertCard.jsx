import React, { useState } from 'react';
import StatusBadge from './StatusBadge';

const AlertCard = ({ alert, type, currentUser, onClick }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: alert.title,
        description: alert.description
    });

    const borderClass = type === 'HIGH' ? 'card-high' : type === 'MEDIUM' ? 'card-medium' : 'card-low';
    const icon = type === 'HIGH' ? 'bi-fire' : type === 'MEDIUM' ? 'bi-cone-striped' : 'bi-info-circle';

    // Permission check: Admin or Assignee
    const canEdit = currentUser && (currentUser.role === 'ADMIN' || (alert.assignedTo && alert.assignedTo === currentUser.email));

    const handleSave = async (e) => {
        e.stopPropagation();
        try {
            const res = await fetch(`http://localhost:8080/accidents/${alert.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                setIsEditing(false);
                // In a real app, we'd trigger a reload or update parent state. 
                // Since using WebSockets, the update might come back via WS if broadcasted, 
                // but let's assume we need to wait for the WS or manual refresh.
                // ideally onSave callback.
                alert.title = editData.title; // Optimistic local update for demo
                alert.description = editData.description;
            } else {
                alert('Failed to update report');
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div
            className={`alert-card ${borderClass}`}
            onClick={() => !isEditing && onClick && onClick(alert)}
        >
            <div className="card-meta">
                <span className={type === 'HIGH' ? 'text-danger' : type === 'MEDIUM' ? 'text-warning' : 'text-info'}>
                    <i className={`bi ${icon} me-2`}></i>{type} HAZARD
                </span>
                <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                {/* Edit Button */}
                {canEdit && !isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                        className="btn btn-link p-0 text-secondary ms-2"
                        style={{ fontSize: '0.8em' }}
                    >
                        <i className="bi bi-pencil-fill"></i> Edit
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="mb-3" onClick={e => e.stopPropagation()}>
                    <input
                        className="form-control form-control-sm mb-2"
                        value={editData.title}
                        onChange={e => setEditData({ ...editData, title: e.target.value })}
                    />
                </div>
            ) : (
                <div className="card-title text-white">{alert.title}</div>
            )}

            {/* Attachment Preview */}
            {alert.attachmentUrl && (
                <div className="mb-3 rounded overflow-hidden position-relative">
                    <img src={alert.attachmentUrl} alt="Evidence" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                    <div className="position-absolute bottom-0 start-0 bg-dark bg-opacity-75 text-white px-2 py-1 small" style={{ fontSize: '0.7em' }}>
                        <i className="bi bi-paperclip me-1"></i> Attachment
                    </div>
                </div>
            )}

            {isEditing ? (
                <div className="mb-3" onClick={e => e.stopPropagation()}>
                    <textarea
                        className="form-control form-control-sm"
                        rows="3"
                        value={editData.description}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                    ></textarea>
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="btn btn-sm btn-dark">Cancel</button>
                        <button onClick={handleSave} className="btn btn-sm btn-success">Save</button>
                    </div>
                </div>
            ) : (
                <div className="card-desc text-secondary mb-3">
                    {alert.description}
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
                <StatusBadge status={alert.status} />
                {alert.assignedTo && <span className="badge bg-dark border border-secondary text-secondary">{alert.assignedTo}</span>}
            </div>

            <div className="d-flex justify-content-between align-items-center pt-3 border-top border-secondary border-opacity-25">
                <div className="d-flex align-items-center gap-2">
                    <div className="avatar-circle text-uppercase" style={{ background: '#3B82F6', width: '24px', height: '24px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={alert.reporterName}>
                        {alert.reporterName ? alert.reporterName.substring(0, 2) : 'AN'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{alert.reporterName || 'Anonymous'}</span>
                </div>

                <div className="d-flex gap-3 text-secondary" style={{ fontSize: '0.8rem' }}>
                    <span><i className="bi bi-chat-fill me-1"></i> {alert.comments ? alert.comments.length : 0}</span>
                </div>
            </div>
        </div>
    );
};

export default AlertCard;
