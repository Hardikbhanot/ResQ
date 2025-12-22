import React, { useState, useEffect } from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

const AdminPanel = () => {
    const [view, setView] = useState('analytics'); // 'users' or 'analytics'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:8080/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`http://localhost:8080/admin/users/${id}/approve`, {
                method: 'PATCH'
            });
            if (res.ok) fetchUsers();
        } catch (err) {
            alert("Failed to approve");
        }
    };

    const handleRoleChange = async (id, newRole) => {
        try {
            const res = await fetch(`http://localhost:8080/admin/users/${id}/role`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) fetchUsers();
        } catch (err) {
            alert("Failed to update role");
        }
    };

    return (
        <div className="d-flex w-100 h-100">
            {/* Inner Sidebar for Admin Tabs */}
            <div className="d-flex flex-column border-end border-secondary p-3 bg-black bg-opacity-25" style={{ width: '220px' }}>
                <small className="text-secondary text-uppercase fw-bold mb-3">Menu</small>
                <button
                    onClick={() => setView('analytics')}
                    className={`btn text-start mb-2 ${view === 'analytics' ? 'btn-light fw-bold' : 'btn-outline-secondary border-0'}`}
                >
                    <i className="bi bi-graph-up-arrow me-2"></i> Analytics
                </button>
                <button
                    onClick={() => setView('users')}
                    className={`btn text-start mb-2 ${view === 'users' ? 'btn-light fw-bold' : 'btn-outline-secondary border-0'}`}
                >
                    <i className="bi bi-people-fill me-2"></i> Users
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-grow-1 p-4 overflow-y-auto" style={{ background: '#18181b' }}>
                {view === 'analytics' ? (
                    <AnalyticsDashboard />
                ) : (
                    <div className="user-management">
                        <h4 className="fw-bold text-white mb-4">User Management</h4>
                        <div className="card border-secondary" style={{ background: '#27272a' }}>
                            <div className="card-body p-0 table-responsive">
                                <table className="table table-dark table-hover m-0">
                                    <thead>
                                        <tr>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Role</th>
                                            <th className="p-3 text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}>
                                                <td className="p-3 align-middle">
                                                    {user.email}
                                                    {user.role === 'ADMIN' && <span className="badge bg-danger ms-2">ADMIN</span>}
                                                </td>
                                                <td className="p-3 align-middle">
                                                    {user.approved ? (
                                                        <span className="badge bg-success">Active</span>
                                                    ) : (
                                                        <span className="badge bg-warning text-dark">Pending Approval</span>
                                                    )}
                                                </td>
                                                <td className="p-3 align-middle">
                                                    <select
                                                        className="form-select form-select-sm bg-dark text-white border-secondary"
                                                        style={{ width: '120px' }}
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                        disabled={user.role === 'ADMIN' && user.email === 'admin@resq.com'}
                                                    >
                                                        <option value="VIEWER">Viewer</option>
                                                        <option value="REPORTER">Reporter</option>
                                                        <option value="ADMIN">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 align-middle text-end">
                                                    {!user.approved && (
                                                        <button
                                                            className="btn btn-sm btn-success fw-bold"
                                                            onClick={() => handleApprove(user.id)}
                                                        >
                                                            Approve Access
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;
