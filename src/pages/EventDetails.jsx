import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import DiscussionForum from "../components/DiscussionForum";
import AddToCalendar from "../components/AddToCalendar";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Merchandise purchase state
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [purchaseMsg, setPurchaseMsg] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error("Failed to fetch event");
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      if (event.registrationFee && event.registrationFee > 0) {
        const confirmPayment = window.confirm(
          `Confirm Payment of ₹${event.registrationFee}?`
        );
        if (!confirmPayment) return;
      }

      await api.post(`/events/${event._id}/register`);
      alert("Registration successful! Ticket sent to your email.");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const handlePurchase = async () => {
    setPurchaseMsg(null);

    if (!selectedSize || !selectedColor) {
      setPurchaseMsg({ type: "error", text: "Please select size and color" });
      return;
    }
    if (!paymentProof) {
      setPurchaseMsg({ type: "error", text: "Please upload payment proof image" });
      return;
    }

    setPurchasing(true);
    try {
      const formData = new FormData();
      formData.append("size", selectedSize);
      formData.append("color", selectedColor);
      formData.append("quantity", quantity);
      formData.append("paymentProof", paymentProof);

      await api.post(`/events/${event._id}/purchase`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPurchaseMsg({
        type: "success",
        text: "Order placed! Your payment is pending organizer approval. You'll receive an email once approved.",
      });
      setPaymentProof(null);
    } catch (err) {
      setPurchaseMsg({ type: "error", text: err.response?.data?.message || "Purchase failed" });
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return <Layout><p style={{ padding: 20 }}>Loading...</p></Layout>;
  if (error) return <Layout><p style={{ padding: 20, color: "red" }}>Error: {error}</p></Layout>;
  if (!event) return <Layout><p style={{ padding: 20 }}>Event not found</p></Layout>;

  /* ---------------- Blocking Logic ---------------- */

  const isDeadlinePassed =
    event.registrationDeadline &&
    new Date(event.registrationDeadline) < new Date();

  const isFull =
    event.eventType === "NORMAL" &&
    event.registrationLimit > 0 &&
    event.currentRegistrations >= event.registrationLimit;

  const isStockOver =
    event.eventType === "MERCHANDISE" &&
    event.merchandiseDetails?.totalStock <= 0;

  const isDisabled = isDeadlinePassed || isFull || isStockOver;

  // Get unique sizes and colors from variants
  const availableSizes = [...new Set(event.merchandiseDetails?.variants?.map(v => v.size) || [])];
  const availableColors = [...new Set(event.merchandiseDetails?.variants?.map(v => v.color) || [])];
  const selectedVariant = event.merchandiseDetails?.variants?.find(
    v => v.size === selectedSize && v.color === selectedColor
  );

  return (
    <Layout>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <h2>{event.eventName}</h2>

        {/* Badges */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={badgeStyle(event.eventType === "MERCHANDISE" ? "#e67e22" : "#3498db")}>
            {event.eventType}
          </span>
          <span style={badgeStyle("#27ae60")}>{event.eligibility}</span>
          {event.eventType === "NORMAL" && event.registrationFee > 0 && (
            <span style={badgeStyle("#8e44ad")}>₹{event.registrationFee}</span>
          )}
          {event.eventType === "NORMAL" && event.registrationFee === 0 && (
            <span style={badgeStyle("#2ecc71")}>FREE</span>
          )}
        </div>

        <p style={{ lineHeight: 1.6, color: "#444" }}>{event.description}</p>

        {/* Event Details Table */}
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelStyle}>Organizer</td>
              <td>{event.organizerId?.organizerName || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Start Date</td>
              <td>{formatDate(event.eventStartDate)}</td>
            </tr>
            <tr>
              <td style={labelStyle}>End Date</td>
              <td>{formatDate(event.eventEndDate)}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Registration Deadline</td>
              <td style={{ color: isDeadlinePassed ? "red" : "inherit" }}>
                {formatDate(event.registrationDeadline)}
                {isDeadlinePassed && " (Passed)"}
              </td>
            </tr>
            <tr>
              <td style={labelStyle}>Eligibility</td>
              <td>{event.eligibility}</td>
            </tr>
            {event.eventType === "NORMAL" && (
              <>
                <tr>
                  <td style={labelStyle}>Registration Fee</td>
                  <td>{event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"}</td>
                </tr>
                <tr>
                  <td style={labelStyle}>Registration Limit</td>
                  <td>{event.registrationLimit}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* -------- Add to Calendar -------- */}
        <AddToCalendar event={event} />

        {/* -------- Merchandise Purchase Form -------- */}
        {event.eventType === "MERCHANDISE" && (
          <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 8, margin: "16px 0" }}>
            <h4 style={{ margin: "0 0 10px 0" }}>Merchandise Details</h4>
            <p><strong>Item:</strong> {event.merchandiseDetails?.itemName}</p>
            <p><strong>Price:</strong> ₹{event.merchandiseDetails?.price}</p>
            <p><strong>Stock Left:</strong> {event.merchandiseDetails?.totalStock}</p>

            {!isDisabled && (
              <div style={{ marginTop: 16, borderTop: "1px solid #ddd", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 12px 0" }}>Place Order</h4>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Size</label>
                    <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} style={inputStyle}>
                      <option value="">Select Size</option>
                      {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Color</label>
                    <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)} style={inputStyle}>
                      <option value="">Select Color</option>
                      {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>Qty</label>
                    <input
                      type="number" min={1} max={event.merchandiseDetails?.purchaseLimitPerParticipant || 5}
                      value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                      style={{ ...inputStyle, width: 60 }}
                    />
                  </div>
                </div>

                {selectedVariant && (
                  <p style={{ fontSize: "0.9rem", color: "#555" }}>
                    Stock for {selectedSize}/{selectedColor}: <strong>{selectedVariant.stock}</strong> •
                    Total: <strong>₹{event.merchandiseDetails.price * quantity}</strong>
                  </p>
                )}

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontWeight: "bold", display: "block", marginBottom: 4 }}>
                    Payment Proof (screenshot/photo) *
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={e => setPaymentProof(e.target.files[0])}
                  />
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  style={{
                    padding: "10px 20px",
                    background: purchasing ? "#ccc" : "#e67e22",
                    color: "#fff", border: "none", borderRadius: 6,
                    cursor: purchasing ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {purchasing ? "Submitting..." : "Submit Order"}
                </button>

                {purchaseMsg && (
                  <p style={{
                    marginTop: 10,
                    color: purchaseMsg.type === "success" ? "green" : "red",
                    background: purchaseMsg.type === "success" ? "#eafaf1" : "#fdecea",
                    padding: 10, borderRadius: 6,
                  }}>
                    {purchaseMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* -------- Normal Event Register Button -------- */}
        {event.eventType === "NORMAL" && (
          <button
            onClick={handleRegister}
            disabled={isDisabled}
            style={{
              padding: "12px 24px",
              background: isDisabled ? "#ccc" : "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: isDisabled ? "not-allowed" : "pointer",
              marginTop: 20,
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            {event.registrationFee > 0
              ? `Proceed to Payment (₹${event.registrationFee})`
              : "Register"}
          </button>
        )}

        {/* -------- Blocking Messages -------- */}
        {isDeadlinePassed && (
          <p style={{ color: "red", marginTop: 8 }}>Registration deadline has passed.</p>
        )}
        {isFull && (
          <p style={{ color: "red", marginTop: 8 }}>Registration limit reached.</p>
        )}
        {isStockOver && (
          <p style={{ color: "red", marginTop: 8 }}>Merchandise out of stock.</p>
        )}
      </div>

      {/* -------- Discussion Forum -------- */}
      <hr style={{ margin: "30px 0" }} />
      <DiscussionForum eventId={id} isOrganizer={false} />

    </Layout>
  );
}

/* ================= Helpers ================= */

const badgeStyle = (color) => ({
  background: color,
  color: "#fff",
  padding: "3px 10px",
  borderRadius: 4,
  fontSize: "0.8rem",
  fontWeight: "bold",
});

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  margin: "16px 0",
};

const labelStyle = {
  fontWeight: "bold",
  padding: "8px 12px 8px 0",
  borderBottom: "1px solid #eee",
  color: "#555",
  width: 180,
};

const inputStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: "0.9rem",
};