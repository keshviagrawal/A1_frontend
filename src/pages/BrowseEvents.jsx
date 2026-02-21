import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function BrowseEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchTrending();
  }, [search, type, eligibility, startDate, endDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events", {
        params: { search, type, eligibility, startDate, endDate },
      });
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const params = {};
      if (type) params.type = type;
      const res = await api.get("/events/trending", { params });
      setTrending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch trending events");
      setTrending([]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  return (
    <Layout>
      <h2>Browse Events</h2>

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search events..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInputStyle}
      />

      {/* ================= FILTERS ================= */}
      <div style={filterBarStyle}>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Types</option>
          <option value="NORMAL">Normal</option>
          <option value="MERCHANDISE">Merchandise</option>
        </select>

        <select
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
          style={selectStyle}
        >
          <option value="">All Eligibility</option>
          <option value="ALL">Open to All</option>
          <option value="IIIT">IIIT Only</option>
          <option value="NON-IIIT">Non-IIIT Only</option>
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: "0.85rem", color: "#666" }}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={dateInputStyle}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: "0.85rem", color: "#666" }}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={dateInputStyle}
          />
        </div>
      </div>

      {/* ================= TRENDING ================= */}
      {trending.length > 0 && (
        <>
          <h3 style={{ marginTop: 30 }}>🔥 Trending (Top 5 in 24h)</h3>
          <div style={trendingRowStyle}>
            {trending.map((event) => (
              <div
                key={event._id}
                style={trendingCard}
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <span style={badgeStyle("#e67e22")}>TRENDING</span>
                <h4 style={{ margin: "8px 0 4px 0" }}>{event.eventName}</h4>
                <p style={{ margin: 2, color: "#555" }}>
                  {event.organizerId?.organizerName || "Unknown Organizer"}
                </p>
                <p style={{ margin: 2, fontSize: "0.85rem", color: "#888" }}>
                  {formatDate(event.eventStartDate)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <hr style={{ margin: "25px 0" }} />

      {/* ================= EVENTS GRID ================= */}
      <h3>All Events</h3>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ color: "#888" }}>No events found matching your filters.</p>
      ) : (
        <div style={eventsGridStyle}>
          {events.map((event) => (
            <div
              key={event._id}
              style={cardStyle}
              onClick={() => navigate(`/events/${event._id}`)}
            >
              {/* Badges */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={badgeStyle(event.eventType === "MERCHANDISE" ? "#e67e22" : "#3498db")}>
                  {event.eventType}
                </span>
                <span style={badgeStyle("#27ae60")}>
                  {event.eligibility}
                </span>
                {event.registrationFee > 0 && (
                  <span style={badgeStyle("#8e44ad")}>
                    ₹{event.registrationFee}
                  </span>
                )}
                {event.registrationFee === 0 && event.eventType === "NORMAL" && (
                  <span style={badgeStyle("#2ecc71")}>FREE</span>
                )}
              </div>

              <h4 style={{ margin: "0 0 6px 0" }}>{event.eventName}</h4>
              <p style={{ color: "#555", fontSize: "0.9rem", margin: "0 0 8px 0", lineHeight: 1.4 }}>
                {event.description?.length > 100
                  ? event.description.slice(0, 100) + "..."
                  : event.description}
              </p>

              <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid #eee" }}>
                <p style={{ margin: "2px 0", fontSize: "0.85rem" }}>
                  <strong>Organizer:</strong> {event.organizerId?.organizerName || "Unknown"}
                </p>
                <p style={{ margin: "2px 0", fontSize: "0.85rem" }}>
                  <strong>Date:</strong> {formatDate(event.eventStartDate)}
                </p>
                <p style={{ margin: "2px 0", fontSize: "0.85rem" }}>
                  <strong>Deadline:</strong> {formatDate(event.registrationDeadline)}
                </p>
              </div>
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
  fontSize: "0.75rem",
  fontWeight: "bold",
  display: "inline-block",
});

/* ================= Styles ================= */

const searchInputStyle = {
  padding: "10px 14px",
  width: "100%",
  maxWidth: 500,
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: "1rem",
  boxSizing: "border-box",
};

const filterBarStyle = {
  marginTop: 15,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const selectStyle = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: "0.9rem",
};

const dateInputStyle = {
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: "0.9rem",
};

const trendingRowStyle = {
  display: "flex",
  gap: 14,
  overflowX: "auto",
  padding: "5px 0",
};

const trendingCard = {
  border: "2px solid #f39c12",
  padding: 14,
  minWidth: 220,
  borderRadius: 10,
  cursor: "pointer",
  background: "#fffbf0",
  transition: "transform 0.1s",
};

const eventsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 16,
};

const cardStyle = {
  border: "1px solid #e0e0e0",
  padding: 16,
  borderRadius: 10,
  cursor: "pointer",
  background: "#fff",
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  transition: "box-shadow 0.15s, transform 0.1s",
};
