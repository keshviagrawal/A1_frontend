import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error("Failed to fetch event");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
        // If event has fee, confirm payment
        if (event.registrationFee && event.registrationFee > 0) {
        const confirmPayment = window.confirm(
            `Confirm Payment of ₹${event.registrationFee}?`
        );

        if (!confirmPayment) return;
        }

        // Call backend
        await api.post(`/events/${event._id}/register`);

        alert("Registration successful! Ticket sent to your email.");

    } catch (err) {
        alert(err.response?.data?.message || "Registration failed");
    }
 };

  if (loading) return <p>Loading...</p>;
  if (!event) return <p>Event not found</p>;

  /* ---------------- Blocking Logic ---------------- */

  const isDeadlinePassed =
    event.registrationDeadline &&
    new Date(event.registrationDeadline) < new Date();

  const isFull =
    event.eventType === "NORMAL" &&
    event.currentParticipants >= event.maxParticipants;

  const isStockOver =
    event.eventType === "MERCHANDISE" &&
    event.merchandiseDetails?.totalStock <= 0;

  const isDisabled = isDeadlinePassed || isFull || isStockOver;

  return (
    <Layout>
      <h2>{event.eventName}</h2>

      <p>{event.description}</p>

      <p><strong>Type:</strong> {event.eventType}</p>
      <p><strong>Organizer:</strong> {event.organizerName}</p>
      <p><strong>Date:</strong> {event.eventDate}</p>
      <p><strong>Eligibility:</strong> {event.eligibility}</p>

      {event.eventType === "NORMAL" && (
        <>
          <p><strong>Fee:</strong> ₹{event.registrationFee}</p>
          <p>
            Seats Left: {event.maxParticipants - event.currentParticipants}
          </p>
        </>
      )}

      {event.eventType === "MERCHANDISE" && (
        <>
          <p>
            <strong>Item:</strong>{" "}
            {event.merchandiseDetails?.itemName}
          </p>
          <p>
            <strong>Price:</strong> ₹
            {event.merchandiseDetails?.price}
          </p>
          <p>
            <strong>Stock Left:</strong>{" "}
            {event.merchandiseDetails?.totalStock}
          </p>
        </>
      )}

      {/* -------- Button -------- */}

      <button
        onClick={handleRegister}
        disabled={isDisabled}
        style={{
          padding: "10px 20px",
          background: isDisabled ? "#ccc" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: isDisabled ? "not-allowed" : "pointer",
          marginTop: 20,
        }}
      >
        {event.eventType === "MERCHANDISE"
          ? "Purchase"
          : event.registrationFee > 0
          ? "Proceed to Payment"
          : "Register"}
      </button>

      {/* -------- Blocking Messages -------- */}

      {isDeadlinePassed && (
        <p style={{ color: "red" }}>
          Registration deadline has passed.
        </p>
      )}

      {isFull && (
        <p style={{ color: "red" }}>
          Registration limit reached.
        </p>
      )}

      {isStockOver && (
        <p style={{ color: "red" }}>
          Merchandise out of stock.
        </p>
      )}
    </Layout>
  );
}