import React, { useState } from 'react';

const AlertDetailsModal = ({ alert, onClose, currentUser }) => {
    const [comment, setComment] = useState('');
    const [localComments, setLocalComments] = useState(alert.comments || []);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: "Issue Resolved!", subtitle: "Great work. The reporter has been notified via email." });

    // Check if user is Admin, Assignee, or Reporter
    const canEdit = currentUser.role === 'ADMIN' || (currentUser.email && (alert.assignedTo === currentUser.email || alert.reporterEmail === currentUser.email));

    const handleStatusChange = async (newStatus) => {
        updateReport({ status: newStatus });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await fetch('http://localhost:8080/api/uploads', {
                method: 'POST',
                body: uploadData
            });

            if (res.ok) {
                const data = await res.json();
                updateReport({ attachmentUrl: data.url });
            } else {
                alert("File upload failed");
            }
        } catch (err) {
            console.error("Upload error", err);
            alert("Upload failed error");
        }
    };

    const updateReport = async (payload) => {
        try {
            const res = await fetch(`http://localhost:8080/accidents/${alert.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                console.log("Report updated");
                if (payload.status === 'RESOLVED') {
                    setSuccessMessage({ title: "Issue Resolved!", subtitle: "Great work. The reporter has been notified via email." });
                    setShowSuccessModal(true);
                }
                // Refresh or let parent update? For now we assume optimistic or parent props update.
                // But since we are editing names, we might want local feedback.
                // Ideally we call onSave or reload.
                if (payload.reporterName) {
                    alert.reporterName = payload.reporterName; // Dirty local update
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteReport = async () => {
        if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
        try {
            const res = await fetch(`http://localhost:8080/accidents/${alert.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Assuming token storage
                }
            });
            if (res.ok) {
                setSuccessMessage({ title: "Report Deleted", subtitle: "The report has been permanently removed." });
                setShowSuccessModal(true);
                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                window.alert("Failed to delete. You might not be authorized.");
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            const res = await fetch(`http://localhost:8080/accidents/${alert.id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (res.ok) {
                setLocalComments(localComments.filter(c => c.id !== commentId));
                setSuccessMessage({ title: "Comment Deleted", subtitle: "The comment has been removed." });
                setShowSuccessModal(true);
                setTimeout(() => setShowSuccessModal(false), 1500);
            }
        } catch (e) { console.error(e); }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            const res = await fetch(`http://localhost:8080/accidents/${alert.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: comment, author: currentUser.email || 'You' })
            });

            if (res.ok) {
                const updatedReport = await res.json();
                setLocalComments(updatedReport.comments);
                setComment('');
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-custom position-relative" onClick={e => e.stopPropagation()}>

                {/* Success Overlay */}
                {showSuccessModal && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-black bg-opacity-75" style={{ zIndex: 2000 }}>
                        <div className="bg-dark border border-success p-4 rounded-3 text-center shadow-lg" style={{ maxWidth: '300px' }}>
                            <div className="mb-3">
                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                            </div>
                            <h5 className="text-white fw-bold mb-2">{successMessage.title}</h5>
                            <p className="text-secondary small mb-3">{successMessage.subtitle}</p>
                            <button className="btn btn-success btn-sm w-100" onClick={() => { setShowSuccessModal(false); onClose(); }}>Close</button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center p-4 border-bottom border-secondary bg-black bg-opacity-25">
                    <div>
                        <h4 className="fw-bold text-white mb-1">{alert.title}</h4>
                        <span className="text-secondary small">ID: #{alert.id}</span>
                    </div>
                    <div className="d-flex gap-2">
                        {/* Delete Report Button */}
                        {(currentUser.role === 'ADMIN' || currentUser.email === alert.reporterEmail) && (
                            <button onClick={handleDeleteReport} className="btn btn-danger btn-sm p-2" title="Delete Report">
                                <i className="bi bi-trash-fill"></i>
                            </button>
                        )}
                        <button onClick={onClose} className="btn btn-dark btn-sm rounded-circle p-2">
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="modal-body-scroll">
                    {/* ... (Existing Content) ... */}
                    {/* Top Meta */}
                    <div className="d-flex align-items-center mb-3">
                        <span className={`badge ${alert.severity === 'HIGH' ? 'bg-danger' : alert.severity === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info text-dark'} me-2`}>
                            {alert.severity} Hazard
                        </span>
                        <span className="text-secondary small me-auto">
                            <i className="bi bi-clock me-1"></i>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>

                        {/* Google Maps Link */}
                        {(alert.latitude && alert.longitude && alert.latitude !== 0) && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${alert.latitude},${alert.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-info"
                            >
                                <i className="bi bi-geo-alt-fill me-1"></i> View Map
                            </a>
                        )}
                    </div>

                    {/* Image */}
                    {alert.attachmentUrl ? (
                        <div className="mb-4 rounded-3 overflow-hidden border border-secondary bg-black position-relative group-hover-container" style={{ maxHeight: '400px' }}>
                            <img src={alert.attachmentUrl} alt="Evidence" className="w-100 h-100 object-fit-contain" />
                            {canEdit && (
                                <div className="position-absolute top-0 end-0 p-2">
                                    <button
                                        className="btn btn-dark btn-sm rounded-circle p-2 border border-secondary shadow-sm"
                                        onClick={() => document.getElementById('editImageInput').click()}
                                        title="Change Image"
                                    >
                                        <i className="bi bi-pencil-fill text-warning"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        canEdit && (
                            <div className="mb-4 p-4 text-center border border-secondary border-dashed rounded-3 bg-dark cursor-pointer" onClick={() => document.getElementById('editImageInput').click()}>
                                <i className="bi bi-camera text-secondary fs-2 mb-2"></i>
                                <p className="text-secondary small m-0">Click to add an image</p>
                            </div>
                        )
                    )}
                    <input type="file" id="editImageInput" hidden onChange={handleImageUpload} />

                    {/* Description */}
                    <div className="mb-4">
                        <h6 className="text-secondary text-uppercase fw-bold small mb-2">Description</h6>
                        <p className="text-light lead fs-6">{alert.description}</p>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <h6 className="text-secondary text-uppercase fw-bold small mb-2">Reporter</h6>
                            <div className="d-flex align-items-center gap-2 p-2 rounded bg-dark border border-secondary">
                                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 32, height: 32 }}>
                                    {alert.reporterName ? alert.reporterName.charAt(0).toUpperCase() : '?'}
                                </div>
                                {/* EDIT REPORTER NAME could go here if implemented, but simplistic approach for now */}
                                {/* Admin can edit Reporter Name */}
                                <div className="d-flex align-items-center gap-2 flex-grow-1">
                                    {currentUser.role === 'ADMIN' ? (
                                        <input
                                            className="form-control form-control-sm bg-dark text-white border-secondary"
                                            defaultValue={alert.reporterName || 'Anonymous'}
                                            onBlur={(e) => {
                                                if (e.target.value !== alert.reporterName) {
                                                    updateReport({ reporterName: e.target.value });
                                                }
                                            }}
                                        />
                                    ) : (
                                        <span>{alert.reporterName || 'Anonymous'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <h6 className="text-secondary text-uppercase fw-bold small mb-2">Status</h6>
                            {canEdit ? (
                                <select
                                    className="form-select bg-dark text-white border-secondary"
                                    value={alert.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    <option value="OPEN">OPEN</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                </select>
                            ) : (
                                <div className="p-2 rounded bg-dark border border-secondary text-white">
                                    {alert.status}
                                </div>
                            )}

                            {canEdit && alert.status !== 'RESOLVED' && (
                                <button className="btn btn-danger w-100 mt-2 btn-sm" onClick={() => handleStatusChange('RESOLVED')}>
                                    <i className="bi bi-check-circle-fill me-2"></i> Mark as Resolved
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-4 pt-4 border-top border-secondary">
                        <h6 className="text-secondary text-uppercase fw-bold small mb-3">Activity Log</h6>

                        <div className="d-flex flex-column gap-3 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {localComments.map((c, i) => (
                                <div key={i} className="d-flex gap-2">
                                    <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 24, height: 24, fontSize: '0.7em' }}>
                                        {c.author ? c.author.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="bg-dark p-2 rounded-end rounded-bottom border border-secondary w-100">
                                        <div className="d-flex justify-content-between align-items-center mb-1 gap-3">
                                            <span className="fw-bold small">{c.author}</span>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="text-secondary" style={{ fontSize: '0.7em' }}>{new Date(c.timestamp).toLocaleTimeString()}</span>
                                                {/* Delete Comment Button */}
                                                {(currentUser.role === 'ADMIN' || currentUser.email === c.authorEmail) && (
                                                    <button
                                                        onClick={() => handleDeleteComment(c.id)}
                                                        className="btn btn-link text-danger p-0"
                                                        style={{ fontSize: '0.8em', textDecoration: 'none' }}>
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="m-0 small text-light">{c.content || c.text}</p>
                                    </div>
                                </div>
                            ))}
                            {localComments.length === 0 && <span className="text-secondary small fst-italic">No comments yet.</span>}
                        </div>

                        <form onSubmit={handleCommentSubmit} className="d-flex gap-2">
                            <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white border-secondary"
                                placeholder="Add a comment..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <button type="submit" className="btn btn-sm btn-outline-warning">Post</button>
                        </form>
                    </div>

                </div>
            </div>
        </div >
    );
};

export default AlertDetailsModal;
