// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Layout from "../components/Layout";
// import { logout } from "../utils/auth";
// import {
//   getPublishedEvents,
//   registerForEvent,
//   purchaseMerchandise,
//   getMyRegistrations,
//   cancelRegistration,
// } from "../services/eventService";

// export default function ParticipantDashboard() {
//   const [events, setEvents] = useState([]);
//   const [registrations, setRegistrations] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Merchandise purchase modal state
//   const [showPurchaseModal, setShowPurchaseModal] = useState(false);
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [selectedSize, setSelectedSize] = useState("");
//   const [selectedColor, setSelectedColor] = useState("");
//   const [quantity, setQuantity] = useState(1);

//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [eventsData, regsData] = await Promise.all([
//         getPublishedEvents(),
//         getMyRegistrations(),
//       ]);
//       setEvents(eventsData);
//       setRegistrations(regsData);
//     } catch (err) {
//       console.error("Failed to fetch data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRegister = async (eventId) => {
//     try {
//       await registerForEvent(eventId);
//       alert("Registered successfully!");
//       fetchData();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to register");
//     }
//   };

//   const openPurchaseModal = (event) => {
//     setSelectedEvent(event);
//     setSelectedSize(event.merchandiseDetails?.sizes?.[0] || "");
//     setSelectedColor(event.merchandiseDetails?.colors?.[0] || "");
//     setQuantity(1);
//     setShowPurchaseModal(true);
//   };

//   const handlePurchase = async () => {
//     try {
//       await purchaseMerchandise(selectedEvent._id, {
//         size: selectedSize,
//         color: selectedColor,
//         quantity,
//       });
//       alert("Purchase successful!");
//       setShowPurchaseModal(false);
//       fetchData();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to purchase");
//     }
//   };

//   const handleCancel = async (eventId) => {
//     try {
//       await cancelRegistration(eventId);
//       alert("Registration cancelled!");
//       fetchData();
//     } catch (err) {
//       alert("Failed to cancel registration");
//     }
//   };

//   const isRegistered = (eventId) => {
//     return registrations.some((reg) => reg.eventId?._id === eventId);
//   };

//   if (loading) return <p>Loading...</p>;

//   return (
//     <Layout>
//       <h2>Participant Dashboard</h2>

//       <h3>Available Events</h3>
//       {events.map((event) => (
//         <div style={cardStyle} key={event._id}>
//           <h4>{event.eventName}</h4>
//           <p>{event.description}</p>
//           <p>Type: <strong>{event.eventType}</strong></p>
//           <p>Eligibility: {event.eligibility}</p>

//           {event.eventType === "NORMAL" && (
//             <p>Fee: ₹{event.registrationFee}</p>
//           )}

//           {event.eventType === "MERCHANDISE" && (
//             <>
//               <p>Item: {event.merchandiseDetails?.itemName}</p>
//               <p>Price: ₹{event.merchandiseDetails?.price}</p>
//               <p>Stock: {event.merchandiseDetails?.totalStock}</p>
//             </>
//           )}

//           {isRegistered(event._id) ? (
//             <button disabled style={disabledBtnStyle}>
//               {event.eventType === "MERCHANDISE" ? "Already Purchased" : "Already Registered"}
//             </button>
//           ) : event.eventType === "NORMAL" ? (
//             <button onClick={() => handleRegister(event._id)} style={btnStyle}>
//               Register
//             </button>
//           ) : (
//             <button onClick={() => openPurchaseModal(event)} style={btnStyle}>
//               Purchase
//             </button>
//           )}
//         </div>
//       ))}

//       <hr />

//       <h3>My Registrations / Purchases</h3>
//       {registrations.length === 0 ? (
//         <p>No registrations yet</p>
//       ) : (
//         registrations.map((reg) => (
//           <div style={registeredStyle} key={reg._id}>
//             <h4>{reg.eventId?.eventName}</h4>
//             <p>Type: {reg.eventId?.eventType}</p>
//             <p>Status: {reg.status}</p>
//             <p>Ticket ID: <strong>{reg.ticketId}</strong></p>

//             {reg.merchandisePurchase && (
//               <>
//                 <p>Size: {reg.merchandisePurchase.size}</p>
//                 <p>Color: {reg.merchandisePurchase.color}</p>
//                 <p>Quantity: {reg.merchandisePurchase.quantity}</p>
//                 <p>Total: ₹{reg.merchandisePurchase.totalAmount}</p>
//               </>
//             )}

//             {reg.status !== "CANCELLED" && reg.status !== "PURCHASED" && (
//               <button onClick={() => handleCancel(reg.eventId?._id)}>
//                 Cancel Registration
//               </button>
//             )}
//           </div>
//         ))
//       )}

//       {/* Purchase Modal */}
//       {showPurchaseModal && selectedEvent && (
//         <div style={modalOverlay}>
//           <div style={modalContent}>
//             <h3>Purchase: {selectedEvent.merchandiseDetails?.itemName}</h3>

//             <label>Size:</label>
//             <select
//               value={selectedSize}
//               onChange={(e) => setSelectedSize(e.target.value)}
//               style={selectStyle}
//             >
//               {selectedEvent.merchandiseDetails?.sizes?.map((size) => (
//                 <option key={size} value={size}>{size}</option>
//               ))}
//             </select>
//             <br /><br />

//             <label>Color:</label>
//             <select
//               value={selectedColor}
//               onChange={(e) => setSelectedColor(e.target.value)}
//               style={selectStyle}
//             >
//               {selectedEvent.merchandiseDetails?.colors?.map((color) => (
//                 <option key={color} value={color}>{color}</option>
//               ))}
//             </select>
//             <br /><br />

//             <label>Quantity:</label>
//             <input
//               type="number"
//               min="1"
//               max={selectedEvent.merchandiseDetails?.purchaseLimitPerParticipant}
//               value={quantity}
//               onChange={(e) => setQuantity(parseInt(e.target.value))}
//               style={{ width: 60, padding: 5 }}
//             />
//             <br /><br />

//             <p>Total: ₹{selectedEvent.merchandiseDetails?.price * quantity}</p>

//             <button onClick={handlePurchase} style={btnStyle}>
//               Confirm Purchase
//             </button>
//             <button onClick={() => setShowPurchaseModal(false)} style={cancelBtnStyle}>
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </Layout>
//   );
// }

// const cardStyle = {
//   border: "1px solid #ccc",
//   padding: 15,
//   marginBottom: 12,
//   borderRadius: 8,
// };

// const registeredStyle = {
//   border: "1px solid green",
//   padding: 15,
//   marginBottom: 12,
//   borderRadius: 8,
// };

// const btnStyle = {
//   padding: "8px 16px",
//   background: "#007bff",
//   color: "#fff",
//   border: "none",
//   borderRadius: 5,
//   cursor: "pointer",
//   marginRight: 10,
// };

// const disabledBtnStyle = {
//   padding: "8px 16px",
//   background: "#ccc",
//   color: "#666",
//   border: "none",
//   borderRadius: 5,
//   cursor: "not-allowed",
// };

// const cancelBtnStyle = {
//   padding: "8px 16px",
//   background: "#dc3545",
//   color: "#fff",
//   border: "none",
//   borderRadius: 5,
//   cursor: "pointer",
// };

// const selectStyle = {
//   padding: 8,
//   width: 150,
// };

// const modalOverlay = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   background: "rgba(0,0,0,0.5)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
// };

// const modalContent = {
//   background: "#fff",
//   padding: 30,
//   borderRadius: 10,
//   minWidth: 300,
// };

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getMyRegistrations, cancelRegistration } from "../services/eventService";

export default function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("NORMAL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch registrations");
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

  /* ---------------- Upcoming Events ---------------- */

  const upcomingEvents = registrations.filter(
    (reg) =>
      reg.status === "REGISTERED" &&
      new Date(reg.eventId?.eventDate) > new Date()
  );

  /* ---------------- Tab Filtering ---------------- */

  const filteredRegistrations = registrations.filter((reg) => {
    if (activeTab === "NORMAL")
      return reg.eventId?.eventType === "NORMAL";

    if (activeTab === "MERCHANDISE")
      return reg.eventId?.eventType === "MERCHANDISE";

    if (activeTab === "COMPLETED")
      return reg.status === "COMPLETED";

    if (activeTab === "CANCELLED")
      return reg.status === "CANCELLED";

    return true;
  });

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <h2>Participant Dashboard</h2>

      {/* ================= Upcoming Events ================= */}
      <h3>Upcoming Events</h3>

      {upcomingEvents.length === 0 ? (
        <p>No upcoming events</p>
      ) : (
        upcomingEvents.map((reg) => (
          <div style={cardStyle} key={reg._id}>
            <h4>{reg.eventId?.eventName}</h4>
            <p>Type: {reg.eventId?.eventType}</p>
            <p>Organizer: {reg.eventId?.organizerName}</p>
            <p>Date: {reg.eventId?.eventDate}</p>
            <p>Status: {reg.status}</p>
          </div>
        ))
      )}

      <hr />

      {/* ================= Participation History ================= */}
      <h3>Participation History</h3>

      {/* Tabs */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("NORMAL")}
          style={activeTab === "NORMAL" ? activeBtn : tabBtn}
        >
          Normal
        </button>

        <button
          onClick={() => setActiveTab("MERCHANDISE")}
          style={activeTab === "MERCHANDISE" ? activeBtn : tabBtn}
        >
          Merchandise
        </button>

        <button
          onClick={() => setActiveTab("COMPLETED")}
          style={activeTab === "COMPLETED" ? activeBtn : tabBtn}
        >
          Completed
        </button>

        <button
          onClick={() => setActiveTab("CANCELLED")}
          style={activeTab === "CANCELLED" ? activeBtn : tabBtn}
        >
          Cancelled
        </button>
      </div>

      {filteredRegistrations.length === 0 ? (
        <p>No records found</p>
      ) : (
        filteredRegistrations.map((reg) => (
          <div style={registeredStyle} key={reg._id}>
            <h4>{reg.eventId?.eventName}</h4>

            <p>Type: {reg.eventId?.eventType}</p>
            <p>Organizer: {reg.eventId?.organizerName}</p>
            <p>Status: {reg.status}</p>
            <p>Team Name: {reg.teamName || "N/A"}</p>

            <p>
              Ticket ID:{" "}
              <Link to={`/ticket/${reg.ticketId}`}>
                {reg.ticketId}
              </Link>
            </p>

            {reg.status !== "CANCELLED" &&
              reg.status !== "COMPLETED" &&
              reg.eventId?.eventType !== "MERCHANDISE" && (
                <button
                  onClick={() => handleCancel(reg.eventId?._id)}
                  style={cancelBtn}
                >
                  Cancel Registration
                </button>
              )}
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

const registeredStyle = {
  border: "1px solid green",
  padding: 15,
  marginBottom: 12,
  borderRadius: 8,
};

const tabBtn = {
  padding: "8px 16px",
  marginRight: 10,
  background: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: 5,
  cursor: "pointer",
};

const activeBtn = {
  ...tabBtn,
  background: "#007bff",
  color: "#fff",
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