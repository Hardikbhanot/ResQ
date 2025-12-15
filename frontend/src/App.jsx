import { useState, useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import AlertColumn from './components/AlertColumn';
import ReportForm from './components/ReportForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [highAlerts, setHighAlerts] = useState([]);
  const [mediumAlerts, setMediumAlerts] = useState([]);
  const [lowAlerts, setLowAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Use a ref to keep track of the client slightly better in strict mode double-invocations
  const clientRef = useRef(null);

  useEffect(() => {
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
    // Add new alert to the top of the list
    switch (alert.severity) {
      case 'HIGH':
        setHighAlerts(prev => [alert, ...prev]);
        break;
      case 'MEDIUM':
        setMediumAlerts(prev => [alert, ...prev]);
        break;
      case 'LOW':
        setLowAlerts(prev => [alert, ...prev]);
        break;
      default:
        console.warn('Unknown severity:', alert.severity);
    }
  };

  return (
    <div className="app-container">
      <ReportForm />

      <main className="main-board">
        <header className="board-header mb-2">
          <h3 className="fw-bold m-0 text-white">Live Incident Board</h3>
          <div className="status-badge">
            <div className="status-dot"></div>
            SYSTEM ONLINE
          </div>
        </header>

        {/* Filters */}
        <div className="d-flex gap-3 mb-4">
          <button className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary">
            <i className="bi bi-filter-left me-2"></i>Filter: All Types
          </button>
          <button className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary">
            <i className="bi bi-sort-down me-2"></i>Sort By: Date (Newest)
          </button>
          <button className="btn btn-warning btn-sm rounded-pill px-3 text-dark fw-bold">
            My Assignments
          </button>
          <button className="btn btn-dark btn-sm rounded-pill px-3 border-secondary text-secondary">
            Overdue
          </button>
        </div>

        <div className="board-grid">
          <AlertColumn title="CRITICAL" alerts={highAlerts} type="HIGH" />
          <AlertColumn title="WARNING" alerts={mediumAlerts} type="MEDIUM" />
          <AlertColumn title="INFO" alerts={lowAlerts} type="LOW" />
        </div>
      </main>
    </div>
  )
}

export default App
