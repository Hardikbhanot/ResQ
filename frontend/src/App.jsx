import React, { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AlertColumn from './components/AlertColumn';
import ReportForm from './components/ReportForm';
import AlertDetailsModal from './components/AlertDetailsModal';
import MapDashboard from './components/MapDashboard';
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

  // Navigation State: 'home', 'login', 'dashboard'
  const [currentView, setCurrentView] = useState(token ? 'dashboard' : 'home');

  // Sort State
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, RESOLVED
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Map Toggle State
  const [showMap, setShowMap] = useState(false);
  const [mobileTab, setMobileTab] = useState('map'); // 'map' or 'feed' (Only for mobile map-view)

  // Mobile Navigation State (Dashboard vs Report Form)
  const [activeMobileTab, setActiveMobileTab] = useState('dashboard'); // 'dashboard', 'report', 'admin'

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

  // Use a ref to keep track of the client slightly better in strict mode double-invocations
  const clientRef = useRef(null);
  const alertsRef = useRef([]);

  // Sync ref with state for WS callback access
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  // Sound Alert Utility (Simple Beep)
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
      osc.frequency.value = 440; // A4
      gain.gain.value = 0.1;

      osc.start();

      // Pulses
      setTimeout(() => { gain.gain.value = 0; }, 200);
      setTimeout(() => { gain.gain.value = 0.1; }, 300);
      setTimeout(() => { osc.stop(); }, 600);

    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    // Request Notification Permission
    if ("Notification" in window) {
      Notification.requestPermission();
    }

    // WebSocket endpoint from backend
    const socketUrl = 'http://localhost:8080/ws/alerts';

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      debug: (str) => {
        console.log(str);
      },
      onConnect: () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);

        client.subscribe('/topic/alerts', (message) => {
          if (message.body) {
            const alert = JSON.parse(message.body);

            // Check if this is a NEW alert or an update
            const isNew = !alertsRef.current.find(a => a.id === alert.id);

            handleNewAlert(alert);

            // Trigger Notifications for HIGH severity - ONLY if isNew
            if (isNew && alert.severity === 'HIGH') {
              // Browser Notification
              if (Notification.permission === "granted") {
                new Notification("CRITICAL ALERT: " + alert.title, {
                  body: alert.description,
                  icon: '/vite.svg' // Fallback icon
                });
              }
              // Audio Alert
              playAlertSound();
            }
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    // Fetch existing reports on load
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
  }, []); // ID 1533 showed dependency array is []

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

  // View Routing
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
        <div className="flex-grow-1 w-100">
          <Login onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  if (!token) {
    return null; // Should be handled above
  }

  // Admin View
  if (showAdminPanel && role === 'ADMIN') {
    return (
      <div className="dashboard-container">
        <div className="d-flex flex-column bg-dark border-end border-secondary p-3" style={{ width: '280px' }}>
          <h4 className="fw-bold text-white mb-4">ResQ Admin</h4>
          <button className="btn btn-outline-light w-100 mb-2 text-start" onClick={() => setShowAdminPanel(false)}>
            <i className="bi bi-speedometer2 me-2"></i> Live Dashboard
          </button>
          <button className="btn btn-warning w-100 mb-2 text-start">
            <i className="bi bi-people-fill me-2"></i> User Management
          </button>
          <div className="mt-auto">
            <button onClick={handleLogout} className="btn btn-outline-danger w-100">Logout</button>
          </div>
        </div>
        <AdminPanel />
      </div>
    );
  }

  // Sorting & Filtering Logic
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
      {/* Modal Overlay */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          currentUser={{ role, email: userEmail }}
        />
      )}

      {/* Sidebar - Only for ADMIN or REPORTER */}
      {/* Mobile: Show only if 'report' tab active. Desktop: Always show. */}
      {(role === 'ADMIN' || role === 'REPORTER') && (
        <div className={`${activeMobileTab === 'report' ? 'd-block w-100' : 'd-none d-md-block'}`}>
          <ReportForm />
        </div>
      )}

      {/* Main Board - Mobile: Show only if 'dashboard' tab active. Desktop: Always show. */}
      <main className={`main-board ${activeMobileTab === 'dashboard' ? 'd-flex' : 'd-none d-md-flex'}`}>
        <header className="board-header d-none d-md-flex">
          <div>
            <h3 className="fw-bold m-0 text-white">Live Incident Board</h3>
            <div className="status-badge">
              <div className="status-dot"></div>
              SYSTEM ONLINE
            </div>
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

        {/* Filters & View Toggle */}
        <div className="d-flex align-items-center gap-3 mb-4 ps-4">
          {/* Desktop View Toggle */}
          <div className="bg-dark rounded-pill p-1 border border-secondary d-none d-md-flex">
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${!showMap ? 'btn-light text-dark' : 'text-secondary'}`}
              onClick={() => setShowMap(false)}
            >
              <i className="bi bi-kanban me-2"></i>Board
            </button>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${showMap ? 'btn-light text-dark' : 'text-secondary'}`}
              onClick={() => setShowMap(true)}
            >
              <i className="bi bi-map-fill me-2"></i>Map
            </button>
          </div>

          {/* Mobile View Toggles (Visible only on small screens) */}
          <div className="d-flex d-md-none w-100 bg-dark rounded p-1 border border-secondary justify-content-between">
            <button
              className={`btn btn-sm flex-grow-1 ${!showMap ? 'btn-light fw-bold text-dark' : 'text-secondary'}`}
              onClick={() => { setShowMap(false); }}
            >
              <i className="bi bi-kanban me-1"></i> Board
            </button>
            <button
              className={`btn btn-sm flex-grow-1 ${showMap ? 'btn-light fw-bold text-dark' : 'text-secondary'}`}
              onClick={() => { setShowMap(true); }}
            >
              <i className="bi bi-map-fill me-1"></i> Map View
            </button>
          </div>

          <div className="vr bg-secondary mx-2 d-none d-md-block"></div>

          {/* Status Filter */}
          <div className="position-relative">
            <button
              className={`btn btn-sm rounded-pill px-3 border-secondary ${filterStatus !== 'ALL' ? 'btn-info text-dark' : 'btn-dark text-secondary'}`}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <i className="bi bi-check-circle me-2"></i>
              {filterStatus === 'ALL' ? 'Status' : filterStatus}
            </button>

            {showStatusMenu && (
              <div className="position-absolute mt-2 bg-dark border border-secondary rounded-3 shadow-lg p-1 start-0" style={{ zIndex: 2000, minWidth: '150px' }}>
                {['ALL', 'ACTIVE', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    className={`btn btn-sm w-100 text-start border-0 ${filterStatus === st ? 'bg-secondary text-white' : 'text-secondary hover-bg-dark'}`}
                    onClick={() => { setFilterStatus(st); setShowStatusMenu(false); }}
                  >
                    {st === 'ALL' ? 'Show All' : st}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="position-relative">
            <button
              className={`btn btn-sm rounded-pill px-3 border-secondary ${filterSeverity !== 'ALL' ? 'btn-warning text-dark' : 'btn-dark text-secondary'}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <i className="bi bi-filter-left me-2"></i>
              {filterSeverity === 'ALL' ? 'Filter' : filterSeverity}
            </button>

            {showFilterMenu && (
              <div className="position-absolute mt-2 bg-dark border border-secondary rounded-3 shadow-lg p-1 start-0" style={{ zIndex: 2000, minWidth: '150px' }}>
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                  <button
                    key={sev}
                    className={`btn btn-sm w-100 text-start border-0 ${filterSeverity === sev ? 'bg-secondary text-white' : 'text-secondary hover-bg-dark'}`}
                    onClick={() => { setFilterSeverity(sev); setShowFilterMenu(false); }}
                  >
                    {sev === 'ALL' ? 'Show All' : sev}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
          >
            <i className={`bi bi-sort-${sortOrder === 'newest' ? 'down' : 'up'} me-2`}></i>
            Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>

        {/* Conditional View: Map or Grid */}
        {showMap ? (
          <div className="map-view-container d-flex overflow-hidden h-100" style={{ minHeight: 0 }}>
            {/* Unified Split View (Feed + Map) for Everyone */}
            {/* Desktop: Sidebar visible. Mobile: Sidebar HIDDEN (User uses Board view for list) */}
            <aside className="feed-sidebar p-0 d-none d-md-flex flex-column" style={{ backgroundColor: '#0c0c0e' }}>
              <div className="p-3 border-bottom border-dark">
                <h6 className="text-secondary text-uppercase fw-bold small m-0">Live Feed</h6>
              </div>

              <div className="feed-list overflow-y-auto flex-grow-1 p-4 d-flex flex-column gap-4">
                {/* Critical Alerts First */}
                {alerts.filter(a => a.severity === 'HIGH').map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="viewer-card p-3 rounded-3 cursor-pointer position-relative overflow-hidden border border-danger bg-danger bg-opacity-10 hover-scale"
                  >
                    <div className="d-flex justify-content-between mb-2">
                      <span className="badge bg-danger text-white">CRITICAL</span>
                      <span className="text-danger small fw-bold">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h5 className="fw-bold mb-2 text-white">{alert.title}</h5>

                    <div className="d-flex justify-content-between align-items-center mt-2 border-top border-danger border-opacity-25 pt-2">
                      <span className="small text-danger opacity-75">{alert.reporterName || 'Unknown'}</span>
                      <button className="btn btn-sm btn-outline-danger py-0 px-2" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-chat-left-text-fill me-1"></i> Discuss
                      </button>
                    </div>
                    <div className="glow-effect"></div>
                  </div>
                ))}

                {/* Other Alerts */}
                {alerts.filter(a => a.severity !== 'HIGH').map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="viewer-card p-3 rounded-3 cursor-pointer position-relative border border-secondary bg-dark hover-scale"
                  >
                    <div className="d-flex justify-content-between mb-1">
                      <span className={`badge ${alert.severity === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>{alert.severity}</span>
                      <span className="text-secondary small">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h6 className="fw-bold mb-2 text-light">{alert.title}</h6>

                    <div className="d-flex justify-content-end mt-2">
                      <span className="badge bg-black border border-secondary text-secondary btn-sm d-flex align-items-center gap-1">
                        <i className="bi bi-chat-dots"></i> {alert.comments ? alert.comments.length : 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex-grow-1 position-relative h-100">
              <MapDashboard alerts={alerts} />
              {/* Floating Overlay Info */}
              <div className="position-absolute bottom-0 start-0 m-4 p-3 rounded bg-black bg-opacity-75 border border-secondary text-white" style={{ zIndex: 9999, maxWidth: '300px' }}>
                <h6 className="fw-bold text-accent mb-1">Live Map Active</h6>
                <p className="small m-0 text-secondary">Real-time incident tracking.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="board-grid">
            <AlertColumn
              title="CRITICAL"
              alerts={highAlerts}
              type="HIGH"
              currentUser={{ role, email: userEmail }}
              onAlertClick={setSelectedAlert}
            />
            <AlertColumn
              title="WARNING"
              alerts={mediumAlerts}
              type="MEDIUM"
              currentUser={{ role, email: userEmail }}
              onAlertClick={setSelectedAlert}
            />
            <AlertColumn
              title="INFO"
              alerts={lowAlerts}
              type="LOW"
              currentUser={{ role, email: userEmail }}
              onAlertClick={setSelectedAlert}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="d-md-none fixed-bottom bg-black border-top border-secondary d-flex justify-content-around p-2 pb-3" style={{ zIndex: 1050 }}>
        <button
          className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${activeMobileTab === 'dashboard' ? 'text-warning' : 'text-secondary'}`}
          onClick={() => setActiveMobileTab('dashboard')}
        >
          <i className="bi bi-grid-fill fs-4"></i>
          <span style={{ fontSize: '0.7rem' }}>Dashboard</span>
        </button>

        {(role === 'ADMIN' || role === 'REPORTER') && (
          <button
            className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${activeMobileTab === 'report' ? 'text-warning' : 'text-secondary'}`}
            onClick={() => setActiveMobileTab('report')}
          >
            <i className="bi bi-plus-circle-fill fs-4"></i>
            <span style={{ fontSize: '0.7rem' }}>Report</span>
          </button>
        )}

        {role === 'ADMIN' && (
          <button
            className={`btn btn-link text-decoration-none d-flex flex-column align-items-center ${showAdminPanel ? 'text-warning' : 'text-secondary'}`}
            onClick={() => { setShowAdminPanel(true); }}
          >
            <i className="bi bi-shield-lock-fill fs-4"></i>
            <span style={{ fontSize: '0.7rem' }}>Admin</span>
          </button>
        )}
      </nav>
    </div>
  )
}

export default App
