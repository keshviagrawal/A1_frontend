import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getOrganizerDashboard } from "../services/organizerService";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getOrganizerDashboard();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
        setStats(data.summary || { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
      } else if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PUBLISHED': return '#007bff';
      case 'ONGOING': return '#28a745';
      case 'COMPLETED': return 'purple';
      case 'CLOSED': return 'red';
      default: return 'black';
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Organizer Dashboard</h2>
        <button onClick={() => navigate("/organizer/create")} style={btnStyle}>
          + Create New Event
        </button>
      </div>

      {/* Stats Section */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={statCardStyle}>
          <h3>Total Events</h3>
          <p style={statNumberStyle}>{stats.totalEvents}</p>
        </div>
        <div style={statCardStyle}>
          <h3>Registrations</h3>
          <p style={statNumberStyle}>{stats.totalRegistrations}</p>
        </div>
        <div style={statCardStyle}>
          <h3>Total Revenue</h3>
          <p style={statNumberStyle}>₹{stats.totalRevenue}</p>
        </div>
      </div>

      <h3>My Events</h3>

      <div style={{ display: 'flex', overflowX: 'auto', gap: '20px', padding: '10px 5px' }}>
        {events.length === 0 ? (
          <p>No events created yet.</p>
        ) : (
          events.map((event) => (
            <div style={cardStyle} key={event.eventId}>
              <h4 style={{ marginTop: 0 }}>{event.eventName}</h4>
              <p>Type: {event.eventType}</p>
              <p>Status: <span style={{ fontWeight: 'bold', color: getStatusColor(event.status) }}>{event.status}</span></p>
              <p>Registrations: {event.registrationCount}</p>
              <p>Revenue: ₹{event.revenue}</p>

              <div style={{ marginTop: '15px' }}>
                <button onClick={() => navigate(`/organizer/event/${event.eventId}`)} style={smallBtnStyle}>
                  Manage Event
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

const statCardStyle = {
  background: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  flex: 1,
  textAlign: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const statNumberStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#333',
  margin: '10px 0 0 0'
};

const cardStyle = {
  border: "1px solid #eee",
  padding: '20px',
  minWidth: '280px',
  maxWidth: '280px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

const btnStyle = {
  padding: "10px 20px",
  background: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontWeight: 'bold'
};

const smallBtnStyle = {
  padding: "8px 16px",
  width: "100%",
  fontSize: "0.9rem",
  background: "#007bff",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};