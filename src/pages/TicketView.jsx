import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function TicketView() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, []);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (err) {
      console.error("Failed to fetch ticket");
    }
  };

  if (!ticket) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div style={{ padding: 30 }}>
        <h2>{ticket.eventId?.eventName}</h2>

        <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
        <p><strong>Status:</strong> {ticket.status}</p>
        <p><strong>Event Date:</strong> {ticket.eventId?.eventStartDate}</p>

        <img
          src={ticket.qrCode}
          alt="QR Code"
          style={{ marginTop: 20, width: 200 }}
        />
      </div>
    </Layout>
  );
}