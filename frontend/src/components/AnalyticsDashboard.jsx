import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8080/analytics/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch analytics", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-secondary p-5 text-center">Loading Analytics...</div>;
    if (!stats) return <div className="text-danger p-5 text-center">Failed to load data.</div>;

    // Transform Data for Recharts
    const severityData = Object.entries(stats.severityCounts || {}).map(([name, value]) => ({ name, value }));
    const activityData = Object.entries(stats.activity || {})
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, count]) => ({ date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }), count }));

    const COLORS = { HIGH: '#dc3545', MEDIUM: '#ffc107', LOW: '#0dcaf0' };

    return (
        <div className="p-4 h-100 overflow-y-auto">
            <h4 className="fw-bold text-white mb-4">Analytics Dashboard</h4>

            {/* KPI Cards */}
            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <div className="p-3 rounded-4 bg-dark border border-secondary d-flex justify-content-between align-items-center h-100">
                        <div>
                            <span className="text-secondary small d-block">Total Users</span>
                            <h2 className="fw-bold text-white m-0">{stats.totalUsers || 0}</h2>
                        </div>
                        <i className="bi bi-people text-info fs-1 opacity-50"></i>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="p-3 rounded-4 bg-dark border border-secondary d-flex justify-content-between align-items-center h-100">
                        <div>
                            <span className="text-secondary small d-block">Total Reports</span>
                            <h2 className="fw-bold text-white m-0">{stats.totalReports || 0}</h2>
                        </div>
                        <i className="bi bi-file-earmark-text text-primary fs-1 opacity-50"></i>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="p-3 rounded-4 bg-dark border border-secondary d-flex justify-content-between align-items-center h-100">
                        <div>
                            <span className="text-secondary small d-block">Urgent Action</span>
                            <h2 className="fw-bold text-white m-0">{stats.urgentCases || 0}</h2>
                        </div>
                        <i className="bi bi-lightning-charge text-danger fs-1 opacity-50"></i>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="p-3 rounded-4 bg-dark border border-secondary d-flex justify-content-between align-items-center h-100">
                        <div>
                            <span className="text-secondary small d-block">Resolved</span>
                            <h2 className="fw-bold text-white m-0">{stats.statusCounts?.RESOLVED || 0}</h2>
                        </div>
                        <i className="bi bi-check-circle text-success fs-1 opacity-50"></i>
                    </div>
                </div>
            </div>

            <div className="row g-3 h-50">
                {/* Severity Pie Chart */}
                <div className="col-lg-5">
                    <div className="p-3 rounded-4 bg-dark border border-secondary h-100">
                        <h6 className="fw-bold text-secondary mb-3">Severity Distribution</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6c757d'} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Bar Chart */}
                <div className="col-lg-7">
                    <div className="p-3 rounded-4 bg-dark border border-secondary h-100">
                        <h6 className="fw-bold text-secondary mb-3">Weekly Activity</h6>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={activityData}>
                                <XAxis dataKey="date" stroke="#6c757d" tick={{ fill: '#6c757d' }} />
                                <YAxis stroke="#6c757d" tick={{ fill: '#6c757d' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="count" fill="#facc15" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
