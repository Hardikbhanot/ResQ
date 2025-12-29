import React, { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AlertColumn from './components/AlertColumn';
import ReportForm from './components/ReportForm';
import AlertDetailsModal from './components/AlertDetailsModal';
import MapDashboard from './components/MapDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard'; // New Import
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Login from './components/Login';
import Home from './components/Home';
import AdminPanel from './components/AdminPanel';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail'));
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Navigation State
  const [currentView, setCurrentView] = useState(token ? 'dashboard' : 'home');

  // Dashboard View State: 'BOARD', 'MAP', 'ANALYTICS'
  const [viewMode, setViewMode] = useState('BOARD');

  // Sort State
  const [sortOrder, setSortOrder] = useState('newest');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Mobile Navigation State
  const [activeMobileTab, setActiveMobileTab] = useState('dashboard');

  const handleLogin = (newToken, newRole, newEmail) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('userEmail', newEmail);
    setToken(newToken);
    setRole(newRole);
    setUserEmail(newEmail);
    setShowAdminPanel(false);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userEmail');
    setToken(null);
    setRole(null);
    setUserEmail(null);
    setShowAdminPanel(false);
    setCurrentView('home');
  }

  const clientRef = useRef(null);
  const alertsRef = useRef([]);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  const playAlertSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = 440;
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => { gain.gain.value = 0; }, 200);
      setTimeout(() => { gain.gain.value = 0.1; }, 300);
      setTimeout(() => { osc.stop(); }, 600);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    const socketUrl = 'http://localhost:8080/ws/alerts';
    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      onConnect: () => {
        setIsConnected(true);
        client.subscribe('/topic/alerts', (message) => {
          if (message.body) {
            const alert = JSON.parse(message.body);
            const isNew = !alertsRef.current.find(a => a.id === alert.id);
            handleNewAlert(alert);
            if (isNew && alert.severity === 'HIGH') {
              if (Notification.permission === "granted") {
                new Notification("CRITICAL ALERT: " + alert.title, {
                  body: alert.description,
                  icon: '/vite.svg'
                });
              }
              playAlertSound();
            }
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    fetch('http://localhost:8080/accidents')
      .then(res => res.json())
      .then(data => {
        data.forEach(alert => handleNewAlert(alert));
      })
      .catch(err => console.error("Failed to load initial data", err));

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  const handleNewAlert = (alert) => {
    setAlerts((prev) => {
      const exists = prev.find(a => a.id === alert.id);
      if (exists) {
        return prev.map(a => a.id === alert.id ? alert : a);
      }
      return [alert, ...prev];
    });

    if (selectedAlert && selectedAlert.id === alert.id) {
      setSelectedAlert(alert);
    }
  };

  if (currentView === 'home') {
    return <Home onStart={() => setCurrentView(token ? 'dashboard' : 'login')} />;
  }

  if (currentView === 'login' || (!token && currentView !== 'home')) {
    return (
      <div className="d-flex flex-column min-vh-100 w-100 position-relative bg-main">
        <div className="position-absolute top-0 start-0 p-4" style={{ zIndex: 1000 }}>
          <button onClick={() => setCurrentView('home')} className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            <i className="bi bi-arrow-left me-2"></i>Back to Home
          </button>
        </div>
        <div className="flex-grow-1 w-100 d-flex align-items-center justify-content-center">
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (!token) return null;

  if (showAdminPanel && role === 'ADMIN') {
    return (
      <div className="dashboard-container">
        <div className="d-flex flex-column bg-dark border-end border-secondary p-3" style={{ width: '280px' }}>
          <h4 className="fw-bold text-white mb-4">ResQ Admin</h4>
          <button className="btn btn-outline-light w-100 mb-2 text-start" onClick={() => setShowAdminPanel(false)}>
            <i className="bi bi-speedometer2 me-2"></i> Live Dashboard
          </button>
          <div className="mt-auto">
            <button onClick={handleLogout} className="btn btn-outline-danger w-100">Logout</button>
          </div>
        </div>
        <AdminPanel />
      </div>
    );
  }

  const sortedAlerts = [...alerts]
    .filter(a => filterSeverity === 'ALL' || a.severity === filterSeverity)
    .filter(a => {
      if (filterStatus === 'ALL') return true;
      if (filterStatus === 'RESOLVED') return a.status === 'RESOLVED';
      if (filterStatus === 'ACTIVE') return a.status !== 'RESOLVED';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const highAlerts = sortedAlerts.filter(a => a.severity === 'HIGH');
  const mediumAlerts = sortedAlerts.filter(a => a.severity === 'MEDIUM');
  const lowAlerts = sortedAlerts.filter(a => a.severity === 'LOW');

  return (
    <div className="dashboard-container">
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          currentUser={{ role, email: userEmail }}
        />
      )}

      {(role === 'ADMIN' || role === 'REPORTER') && (
        <div className={`${activeMobileTab === 'report' ? 'd-block w-100' : 'd-none d-md-block'}`}>
          <ReportForm />
        </div>
      )}

      <main className={`main-board ${activeMobileTab === 'dashboard' ? 'd-flex' : 'd-none d-md-flex'}`}>
        <header className="board-header d-none d-md-flex">
          <div>
            <h3 className="fw-bold m-0 text-white">Live Incident Board</h3>
            <div className="status-badge"><div className="status-dot"></div>SYSTEM ONLINE</div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {role === 'ADMIN' && (
              <button onClick={() => setShowAdminPanel(true)} className="btn btn-sm btn-outline-warning">
                <i className="bi bi-gear-fill me-1"></i> Admin Panel
              </button>
            )}
            <span className="badge bg-secondary text-light">{role} MODE</span>
            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Logout</button>
          </div>
        </header>

        {/* Top Controls */}
        <div className="d-flex align-items-center gap-3 mb-4 ps-4">
          <div className="bg-dark rounded-pill p-1 border border-secondary d-none d-md-flex">
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'BOARD' ? 'btn-light text-dark' : 'text-secondary'}`}
              onClick={() => setViewMode('BOARD')}
            >
              <i className="bi bi-kanban me-2"></i>Board
            </button>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'MAP' ? 'btn-light text-dark' : 'text-secondary'}`}
              onClick={() => setViewMode('MAP')}
            >
              <i className="bi bi-map-fill me-2"></i>Map
            </button>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${viewMode === 'ANALYTICS' ? 'btn-light text-dark' : 'text-secondary'}`}
              onClick={() => setViewMode('ANALYTICS')}
            >
              <i className="bi bi-bar-chart-fill me-2"></i>Analytics
            </button>
          </div>

          <div className="d-flex d-md-none w-100 bg-dark rounded p-1 border border-secondary justify-content-between">
            <button className={`btn btn-sm flex-grow-1 ${viewMode === 'BOARD' ? 'btn-light fw-bold text-dark' : 'text-secondary'}`} onClick={() => setViewMode('BOARD')}>Board</button>
            <button className={`btn btn-sm flex-grow-1 ${viewMode === 'MAP' ? 'btn-light fw-bold text-dark' : 'text-secondary'}`} onClick={() => setViewMode('MAP')}>Map</button>
            <button className={`btn btn-sm flex-grow-1 ${viewMode === 'ANALYTICS' ? 'btn-light fw-bold text-dark' : 'text-secondary'}`} onClick={() => setViewMode('ANALYTICS')}>Analytics</button>
          </div>

          <div className="vr bg-secondary mx-2 d-none d-md-block"></div>

          <div className="position-relative">
            <button
              className={`btn btn-sm rounded-pill px-3 border-secondary ${filterStatus !== 'ALL' ? 'btn-info text-dark' : 'btn-dark text-secondary'}`}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <i className="bi bi-check-circle me-2"></i> {filterStatus === 'ALL' ? 'Status' : filterStatus}
            </button>
            {showStatusMenu && (
              <div className="position-absolute mt-2 bg-dark border border-secondary rounded-3 shadow-lg p-1 start-0" style={{ zIndex: 2000, minWidth: '150px' }}>
                {['ALL', 'ACTIVE', 'RESOLVED'].map(st => (
                  <button key={st} className={`btn btn-sm w-100 text-start border-0 ${filterStatus === st ? 'bg-secondary text-white' : 'text-secondary hover-bg-dark'}`} onClick={() => { setFilterStatus(st); setShowStatusMenu(false); }}>{st === 'ALL' ? 'Show All' : st}</button>
                ))}
              </div>
            )}
          </div>

          <div className="position-relative">
            <button
              className={`btn btn-sm rounded-pill px-3 border-secondary ${filterSeverity !== 'ALL' ? 'btn-warning text-dark' : 'btn-dark text-secondary'}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <i className="bi bi-filter-left me-2"></i> {filterSeverity === 'ALL' ? 'Filter' : filterSeverity}
            </button>
            {showFilterMenu && (
              <div className="position-absolute mt-2 bg-dark border border-secondary rounded-3 shadow-lg p-1 start-0" style={{ zIndex: 2000, minWidth: '150px' }}>
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                  <button key={sev} className={`btn btn-sm w-100 text-start border-0 ${filterSeverity === sev ? 'bg-secondary text-white' : 'text-secondary hover-bg-dark'}`} onClick={() => { setFilterSeverity(sev); setShowFilterMenu(false); }}>{sev === 'ALL' ? 'Show All' : sev}</button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary" onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}>
            <i className={`bi bi-sort-${sortOrder === 'newest' ? 'down' : 'up'} me-2`}></i> {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* View Content */}
        {viewMode === 'MAP' ? (
          <div className="map-view-container overflow-hidden flex-grow-1 position-relative animate-fade-in">
            {/* Sidebar List in Map View */}
            <aside className="feed-sidebar p-0 d-none d-md-flex flex-column" style={{ backgroundColor: '#0c0c0e' }}>
              <div className="p-3 border-bottom border-dark">
                <h6 className="text-secondary text-uppercase fw-bold small m-0">Live Feed</h6>
              </div>
              <div className="feed-list overflow-y-auto flex-grow-1 p-4 d-flex flex-column gap-4">
                {sortedAlerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`viewer-card p-3 rounded-3 cursor-pointer position-relative border-start border-4 animate-slide-in ${alert.severity === 'HIGH' ? 'border-danger' : alert.severity === 'MEDIUM' ? 'border-warning' : 'border-info'}`}
                    style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderLeftWidth: '4px', borderLeftColor: alert.severity === 'HIGH' ? '#dc3545' : alert.severity === 'MEDIUM' ? '#ffc107' : '#0dcaf0' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className={`badge ${alert.severity === 'HIGH' ? 'bg-danger' : alert.severity === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info text-dark'}`} style={{ fontSize: '0.7rem' }}>{alert.severity}</span>
                      <small className="text-secondary" style={{ fontSize: '0.75rem' }}>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    <h6 className="fw-bold text-white mb-1 text-truncate">{alert.title}</h6>
                    <p className="text-secondary small mb-2 text-truncate opacity-75">{alert.description}</p>
                    <div className="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-25 pt-2 mt-2">
                      <span className="small text-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}><i className="bi bi-person text-secondary"></i> {alert.reporterName || 'Anonymous'}</span>
                      {alert.comments && alert.comments.length > 0 && <span className="badge bg-dark border border-secondary text-secondary"><i className="bi bi-chat-dots me-1"></i> {alert.comments.length}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <div className="flex-grow-1 position-relative w-100">
              <div className="position-absolute top-0 start-0 w-100 h-100">
                <MapDashboard alerts={alerts} />
              </div>
            </div>
          </div>
        ) : viewMode === 'ANALYTICS' ? (
          <AnalyticsDashboard />
        ) : (
          <div className="board-grid">
            <AlertColumn title="High Priority (Major)" alerts={highAlerts} type="HIGH" currentUser={{ role, email: userEmail }} onAlertClick={setSelectedAlert} />
            <AlertColumn title="Medium Priority (Warning)" alerts={mediumAlerts} type="MEDIUM" currentUser={{ role, email: userEmail }} onAlertClick={setSelectedAlert} />
            <AlertColumn title="Low Priority (Info)" alerts={lowAlerts} type="LOW" currentUser={{ role, email: userEmail }} onAlertClick={setSelectedAlert} />
          </div>
        )}
      </main>

      <nav className="d-md-none fixed-bottom bg-black border-top border-secondary d-flex justify-content-around p-2 pb-3" style={{ zIndex: 1050 }}>
        <button className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${activeMobileTab === 'dashboard' ? 'text-warning' : 'text-secondary'}`} onClick={() => setActiveMobileTab('dashboard')}><i className="bi bi-grid-fill fs-4"></i><span style={{ fontSize: '0.7rem' }}>Dashboard</span></button>
        {(role === 'ADMIN' || role === 'REPORTER') && <button className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${activeMobileTab === 'report' ? 'text-warning' : 'text-secondary'}`} onClick={() => setActiveMobileTab('report')}><i className="bi bi-plus-circle-fill fs-4"></i><span style={{ fontSize: '0.7rem' }}>Report</span></button>}
        {role === 'ADMIN' && <button className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${showAdminPanel ? 'text-warning' : 'text-secondary'}`} onClick={() => { setShowAdminPanel(true); }}><i className="bi bi-shield-lock-fill fs-4"></i><span style={{ fontSize: '0.7rem' }}>Admin</span></button>}
      </nav>
    </div>
  )
}

export default App
