import { useState, useEffect, useRef } from 'react'
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

  // Map Toggle State
  const [showMap, setShowMap] = useState(false);

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
            handleNewAlert(alert);

            // Trigger Notifications for HIGH severity
            if (alert.severity === 'HIGH') {
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

  import ViewerDashboard from './components/ViewerDashboard';
  // ... imports

  // ... inside App component
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

  // Specialized Viewer Dashboard (Premium Public View)
  if (role === 'VIEWER') {
    return (
      <ViewerDashboard
        alerts={alerts}
        handleLogout={handleLogout}
        currentUser={{ role, email: userEmail }}
      />
    );
  }

  // Sorting Logic
  const sortedAlerts = [...alerts].sort((a, b) => {
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
      {(role === 'ADMIN' || role === 'REPORTER') && <ReportForm />}

      <main className="main-board">
        <header className="board-header">
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
          {/* View Toggle */}
          <div className="bg-dark rounded-pill p-1 border border-secondary d-flex">
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

          <div className="vr bg-secondary mx-2"></div>

          <button className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary">
            <i className="bi bi-filter-left me-2"></i>Filter
          </button>
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
          <div className="map-view-container">
            <MapDashboard alerts={alerts} />
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
    </div>
  )
}

export default App
