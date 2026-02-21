import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getMyRegistrations, cancelRegistration } from "../services/eventService";

export default function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("NORMAL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch registrations");
      setError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      await cancelRegistration(eventId);
      alert("Registration cancelled!");
      fetchRegistrations();
    } catch (err) {
      alert("Failed to cancel registration");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  /* ---------------- Upcoming Events ---------------- */
  const upcomingEvents = registrations.filter(
    (reg) =>
      (reg.status === "REGISTERED" || reg.status === "PURCHASED") &&
      new Date(reg.eventId?.eventStartDate) > new Date()
  );

  /* ---------------- Tab Filtering ---------------- */
  const filteredRegistrations = registrations.filter((reg) => {
    if (activeTab === "NORMAL")
      return reg.eventId?.eventType === "NORMAL";
    if (activeTab === "MERCHANDISE")
      return reg.eventId?.eventType === "MERCHANDISE";
    if (activeTab === "COMPLETED")
      return reg.status === "COMPLETED" || reg.status === "ATTENDED";
    if (activeTab === "CANCELLED")
      return reg.status === "CANCELLED";
    return true;
  });

  if (loading) return <Layout><p style={{ padding: 20 }}>Loading...</p></Layout>;
  if (error) return <Layout><p style={{ padding: 20, color: "red" }}>{error}</p></Layout>;

  return (
    <Layout>
      <h2>Participant Dashboard</h2>

      {/* ================= Upcoming Events ================= */}
      <h3>Upcoming Events</h3>

      {upcomingEvents.length === 0 ? (
        <p style={{ color: "#888" }}>No upcoming events. <Link to="/browse">Browse events</Link> to register!</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {upcomingEvents.map((reg) => (
            <div style={upcomingCardStyle} key={reg._id}>
              <h4 style={{ margin: "0 0 8px 0" }}>{reg.eventId?.eventName}</h4>
              <p><strong>Organizer:</strong> {reg.eventId?.organizerId?.organizerName || "N/A"}</p>
              <p><strong>Date:</strong> {formatDate(reg.eventId?.eventStartDate)}</p>
              <p><strong>Type:</strong> <span style={badgeStyle(reg.eventId?.eventType === "MERCHANDISE" ? "#e67e22" : "#3498db")}>{reg.eventId?.eventType}</span></p>
              <p><strong>Status:</strong> {reg.status}</p>
              <p>
                <strong>Ticket:</strong>{" "}
                <Link to={`/ticket/${reg.ticketId}`} style={{ color: "#007bff" }}>
                  {reg.ticketId}
                </Link>
              </p>
            </div>
          ))}
        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      {/* ================= Participation History ================= */}
      <h3>Participation History</h3>

      {/* Tabs */}
      <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["NORMAL", "MERCHANDISE", "COMPLETED", "CANCELLED"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? activeBtn : tabBtn}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filteredRegistrations.length === 0 ? (
        <p style={{ color: "#888" }}>No records found</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filteredRegistrations.map((reg) => (
            <div style={registeredStyle} key={reg._id}>
              <h4 style={{ margin: "0 0 8px 0" }}>{reg.eventId?.eventName}</h4>

              <p><strong>Type:</strong> <span style={badgeStyle(reg.eventId?.eventType === "MERCHANDISE" ? "#e67e22" : "#3498db")}>{reg.eventId?.eventType}</span></p>
              <p><strong>Organizer:</strong> {reg.eventId?.organizerId?.organizerName || "N/A"}</p>
              <p><strong>Date:</strong> {formatDate(reg.eventId?.eventStartDate)}</p>
              <p><strong>Status:</strong> {reg.status}</p>

              {reg.merchandisePurchase && reg.merchandisePurchase.size && (
                <div style={{ background: "#f8f9fa", padding: 8, borderRadius: 4, marginTop: 4 }}>
                  <p style={{ margin: 2 }}>Size: {reg.merchandisePurchase.size} | Color: {reg.merchandisePurchase.color}</p>
                  <p style={{ margin: 2 }}>Qty: {reg.merchandisePurchase.quantity} | Total: ₹{reg.merchandisePurchase.totalAmount}</p>
                </div>
              )}

              <p>
                <strong>Ticket:</strong>{" "}
                <Link to={`/ticket/${reg.ticketId}`} style={{ color: "#007bff" }}>
                  {reg.ticketId}
                </Link>
              </p>

              {reg.status !== "CANCELLED" &&
                reg.status !== "COMPLETED" &&
                reg.status !== "ATTENDED" &&
                reg.eventId?.eventType !== "MERCHANDISE" && (
                  <button
                    onClick={() => handleCancel(reg.eventId?._id)}
                    style={cancelBtn}
                  >
                    Cancel Registration
                  </button>
                )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

/* ================= Helpers ================= */

const badgeStyle = (color) => ({
  background: color,
  color: "#fff",
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: "0.8rem",
  fontWeight: "bold",
});

/* ================= Styles ================= */

const upcomingCardStyle = {
  border: "1px solid #007bff",
  padding: 16,
  borderRadius: 10,
  background: "#f0f7ff",
};

const registeredStyle = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 10,
  background: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const tabBtn = {
  padding: "8px 16px",
  background: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: 5,
  cursor: "pointer",
};

const activeBtn = {
  ...tabBtn,
  background: "#007bff",
  color: "#fff",
  borderColor: "#007bff",
};

const cancelBtn = {
  padding: "8px 16px",
  background: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  marginTop: 10,
};