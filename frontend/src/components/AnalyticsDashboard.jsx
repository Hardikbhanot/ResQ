import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8080/api/analytics/summary')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-secondary">Loading statistics...</div>;
    if (!stats) return <div className="text-danger">Failed to load stats.</div>;

    // Transform Data for Recharts
    const severityData = Object.entries(stats.severityCounts || {}).map(([key, value]) => ({ name: key, count: value }));
    const statusData = Object.entries(stats.statusCounts || {}).map(([key, value]) => ({ name: key, value }));
    const activityData = Object.entries(stats.activity || {})
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const PIE_COLORS = ['#22c55e', '#ef4444']; // Green/Red

    return (
        <div className="analytics-dashboard">
            <h4 className="fw-bold text-white mb-4">Platform Insights</h4>

            <div className="row g-4">
                {/* Severity Bar Chart */}
                <div className="col-md-6">
                    <div className="card bg-dark border-secondary p-3 h-100">
                        <h6 className="text-secondary mb-3 text-uppercase fw-bold small">Incident Severity Distribution</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={severityData}>
                                    <XAxis dataKey="name" stroke="#71717a" />
                                    <YAxis stroke="#71717a" />
                                    <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
                                    <Bar dataKey="count" fill="#facc15" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="col-md-6">
                    <div className="card bg-dark border-secondary p-3 h-100">
                        <h6 className="text-secondary mb-3 text-uppercase fw-bold small">Resolution Status</h6>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.name === 'RESOLVED' ? '#22c55e' : '#f97316'} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Activity Line Chart */}
                <div className="col-12">
                    <div className="card bg-dark border-secondary p-3">
                        <h6 className="text-secondary mb-3 text-uppercase fw-bold small">Activity (Last 7 Days)</h6>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <LineChart data={activityData}>
                                    <XAxis dataKey="date" stroke="#71717a" />
                                    <YAxis stroke="#71717a" />
                                    <Tooltip contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#fff' }} />
                                    <Line type="monotone" dataKey="count" stroke="#facc15" strokeWidth={3} dot={{ fill: '#facc15' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
