import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function TicketView() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, []);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/events/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (err) {
      console.error("Failed to fetch ticket");
      setError(err.response?.data?.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return <Layout><p style={{ padding: 20 }}>Loading ticket...</p></Layout>;
  if (error) return <Layout><p style={{ padding: 20, color: "red" }}>Error: {error}</p></Layout>;
  if (!ticket) return <Layout><p style={{ padding: 20 }}>Ticket not found</p></Layout>;

  return (
    <Layout>
      <div style={{ padding: 30, maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
        <h2>{ticket.eventId?.eventName}</h2>

        <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        <p><strong>Event Date:</strong> {formatDate(ticket.eventId?.eventStartDate)}</p>

        {ticket.qrCode && (
          <img
            src={ticket.qrCode}
            alt="QR Code"
            style={{ marginTop: 20, width: 200 }}
          />
        )}
      </div>
    </Layout>
  );
}