import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function BrowseEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchEvents();
  }, [search, type, eligibility, startDate, endDate]);

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.get("/events", {
        params: {
          search,
          type,
          eligibility,
          startDate,
          endDate,
        },
      });
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch events");
      setEvents([]); // Safety fallback
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await api.get("/events/trending");
      setTrending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch trending events");
      setTrending([]);
    }
  };

  return (
    <Layout>
      <h2>Browse Events</h2>

      {/* ================= SEARCH ================= */}
      <input
        type="text"
        placeholder="Search event or organizer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputStyle}
      />

      {/* ================= FILTERS ================= */}
      <div style={{ marginTop: 15 }}>
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
          <option value="OPEN">Open</option>
          <option value="STUDENTS_ONLY">Students Only</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={inputStyle}
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* ================= TRENDING ================= */}
      <h3 style={{ marginTop: 30 }}>Trending (Top 5 in 24h)</h3>

      {trending.map((event) => (
        <div
          key={event._id}
          style={{ ...trendingCard, cursor: "pointer" }}
          onClick={() => navigate(`/events/${event._id}`)}
        >
          <h4>{event.eventName}</h4>
          <p>Organizer: {event.organizerName}</p>
        </div>
      ))}

      <hr />

      {/* ================= EVENTS LIST ================= */}
      <h3>All Events</h3>

      {events.length === 0 ? (
        <p>No events found</p>
      ) : (
        events.map((event) => (
          <div
            key={event._id}
            style={{ ...cardStyle, cursor: "pointer" }}
            onClick={() => navigate(`/events/${event._id}`)}
          >
            <h4>{event.eventName}</h4>
            <p>{event.description}</p>
            <p>Type: {event.eventType}</p>
            <p>Organizer: {event.organizerName}</p>
            <p>Date: {event.eventDate}</p>
            <p>Eligibility: {event.eligibility}</p>
          </div>
        ))
      )}
    </Layout>
  );
}

/* ================= Styles ================= */

const cardStyle = {
  border: "1px solid #ccc",
  padding: 15,
  marginBottom: 12,
  borderRadius: 8,
};

const trendingCard = {
  border: "1px solid orange",
  padding: 12,
  marginBottom: 10,
  borderRadius: 6,
};

const inputStyle = {
  padding: 8,
  marginRight: 10,
};

const selectStyle = {
  padding: 8,
  marginRight: 10,
};
