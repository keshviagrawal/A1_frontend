import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DiscussionForum from "../components/DiscussionForum";
import Layout from "../components/Layout";
import {
    getEventAnalytics,
    updateEvent,
    markAttendance,
    exportParticipantsCSV,
    publishEvent,
    getMerchOrders,
    approveMerchOrder,
    rejectMerchOrder,
    manualOverrideAttendance,
} from "../services/organizerService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function OrganizerEventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [analytics, setAnalytics] = useState({ totalRegistrations: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    // Tabs
    const [activeTab, setActiveTab] = useState("participants");

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Actions
    const [ticketIdInput, setTicketIdInput] = useState("");

    // Payment Approval state
    const [orders, setOrders] = useState([]);
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Manual Override state
    const [overrideModal, setOverrideModal] = useState(null); // { registrationId, name, action }
    const [overrideReason, setOverrideReason] = useState("");

    useEffect(() => {
        fetchDetails();
    }, [eventId]);

    useEffect(() => {
        if (event?.eventType === "MERCHANDISE" && activeTab === "payments") {
            fetchOrders();
        }
    }, [activeTab, orderStatusFilter]);

    const fetchDetails = async () => {
        try {
            const data = await getEventAnalytics(eventId);
            setEvent(data.event);
            setParticipants(data.participants || []);
            setAnalytics({
                totalRegistrations: data.totalRegistrations,
                totalRevenue: data.totalRevenue
            });
        } catch (err) {
            console.error("Failed to fetch event details");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getMerchOrders(eventId, orderStatusFilter === "ALL" ? "" : orderStatusFilter);
            setOrders(data);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            if (newStatus === "PUBLISHED" && event.status === "DRAFT") {
                await publishEvent(eventId);
            } else {
                await updateEvent(eventId, { status: newStatus });
            }
            alert(`Event status updated to ${newStatus}`);
            fetchDetails();
        } catch (err) {
            alert("Failed to update status: " + (err.response?.data?.message || err.message));
        }
    };

    const handleMarkAttendance = async () => {
        if (!ticketIdInput) return;
        try {
            await markAttendance(ticketIdInput);
            alert("Attendance Marked!");
            setTicketIdInput("");
            fetchDetails();
        } catch (err) {
            alert(err.response?.data?.message || "Failed");
        }
    };

    const handleDownloadCSV = async () => {
        try {
            const response = await exportParticipantsCSV(eventId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `participants-${eventId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Failed to download CSV");
        }
    };

    const handleApprove = async (orderId) => {
        if (!window.confirm("Approve this payment? This will generate a ticket and decrement stock.")) return;
        try {
            await approveMerchOrder(eventId, orderId);
            fetchOrders();
            fetchDetails();
        } catch (err) {
            alert("Failed to approve: " + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this payment?")) return;
        try {
            await rejectMerchOrder(eventId, orderId);
            fetchOrders();
        } catch (err) {
            alert("Failed to reject: " + (err.response?.data?.message || err.message));
        }
    };

    const handleManualOverride = async () => {
        if (!overrideModal || !overrideReason.trim()) {
            alert("Reason is required");
            return;
        }
        try {
            await manualOverrideAttendance(eventId, overrideModal.registrationId, overrideModal.action, overrideReason.trim());
            setOverrideModal(null);
            setOverrideReason("");
            fetchDetails();
        } catch (err) {
            alert("Override failed: " + (err.response?.data?.message || err.message));
        }
    };

    const filteredParticipants = participants.filter(p => {
        const name = `${p.participantId?.firstName || ""} ${p.participantId?.lastName || ""}`.toLowerCase();
        const email = (p.participantId?.email || p.participantId?.userId?.email || "").toLowerCase();
        const ticket = (p.ticketId || "").toLowerCase();
        const q = search.toLowerCase();

        const textMatch = name.includes(q) || email.includes(q) || ticket.includes(q);
        const statusMatch = statusFilter === "ALL" || p.status === statusFilter;

        return textMatch && statusMatch;
    });

    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (!event) return <Layout><p>Event not found</p></Layout>;

    const isMerchEvent = event.eventType === "MERCHANDISE";
    const attendedCount = participants.filter(p => p.attended).length;
    const totalCount = participants.length;
    const attendancePercent = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: "wrap" }}>
                <h2>{event.eventName} <span style={{ fontSize: '0.6em', color: '#666' }}>({event.status})</span></h2>
                <div>
                    {event.status === "DRAFT" && <button onClick={() => handleStatusChange("PUBLISHED")} style={actionBtnStyle}>Publish Event</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("ONGOING")} style={actionBtnStyle}>Start Event</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("CLOSED")} style={{ ...actionBtnStyle, background: 'red' }}>Close Event</button>}
                    {event.status === "ONGOING" && <button onClick={() => handleStatusChange("COMPLETED")} style={actionBtnStyle}>Mark Completed</button>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: "wrap" }}>
                <div style={statCardStyle}>
                    <h3>Registrations</h3>
                    <p style={statNumberStyle}>{analytics.totalRegistrations}</p>
                </div>
                <div style={statCardStyle}>
                    <h3>Revenue</h3>
                    <p style={statNumberStyle}>₹{analytics.totalRevenue}</p>
                </div>
                <div style={statCardStyle}>
                    <h3>Attendance</h3>
                    <p style={statNumberStyle}>{attendedCount} / {totalCount}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #ddd", flexWrap: "wrap" }}>
                <button onClick={() => setActiveTab("participants")} style={tabStyle(activeTab === "participants")}>
                    Participants
                </button>
                <button onClick={() => setActiveTab("attendance")} style={tabStyle(activeTab === "attendance")}>
                    📊 Attendance
                </button>
                {isMerchEvent && (
                    <button onClick={() => setActiveTab("payments")} style={tabStyle(activeTab === "payments")}>
                        Payment Approvals
                        {orders.filter(o => o.paymentStatus === "PENDING").length > 0 && (
                            <span style={pendingBadge}>
                                {orders.filter(o => o.paymentStatus === "PENDING").length}
                            </span>
                        )}
                    </button>
                )}
                <button onClick={() => setActiveTab("discussion")} style={tabStyle(activeTab === "discussion")}>
                    💬 Discussion
                </button>
            </div>

            {/* ===== PARTICIPANTS TAB ===== */}
            {activeTab === "participants" && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3>Participants</h3>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={handleDownloadCSV} style={{ ...btnStyle, background: '#28a745' }}>📥 Download CSV</button>
                            <button onClick={() => navigate(`/organizer/event/${eventId}/scanner`)} style={{ ...btnStyle, background: '#6f42c1' }}>🔍 QR Scanner</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '15px', display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <input
                            placeholder="Search participants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ padding: '8px', width: '300px' }}
                        />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px' }}>
                            <option value="ALL">All Status</option>
                            <option value="REGISTERED">Registered</option>
                            <option value="ATTENDED">Attended</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Email</th>
                                <th style={thStyle}>Ticket ID</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Attended</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParticipants.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                    <td style={tdStyle}>{p.participantId?.email || p.participantId?.userId?.email}</td>
                                    <td style={{ ...tdStyle, fontSize: "0.85rem" }}>{p.ticketId || "—"}</td>
                                    <td style={tdStyle}>{p.status}</td>
                                    <td style={tdStyle}>{p.attended ? "✅" : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* ===== ATTENDANCE TAB ===== */}
            {activeTab === "attendance" && (
                <>
                    {/* Open Scanner Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <h3 style={{ margin: 0 }}>Live Attendance Dashboard</h3>
                        <button
                            onClick={() => navigate(`/organizer/event/${eventId}/scanner`)}
                            style={{ ...btnStyle, background: "#6f42c1", fontSize: "1rem" }}
                        >
                            🔍 Open QR Scanner
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: "#e9ecef", borderRadius: 10, height: 30, marginBottom: 20, overflow: "hidden" }}>
                        <div
                            style={{
                                width: `${attendancePercent}%`,
                                height: "100%",
                                background: attendancePercent > 75 ? "#28a745" : attendancePercent > 40 ? "#ffc107" : "#dc3545",
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontWeight: "bold",
                                transition: "width 0.5s",
                                minWidth: attendancePercent > 0 ? 40 : 0,
                            }}
                        >
                            {attendancePercent}%
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
                        <div style={{ ...statCardStyle, borderLeft: "4px solid #28a745" }}>
                            <h4 style={{ margin: 0, color: "#28a745" }}>Scanned</h4>
                            <p style={{ fontSize: 28, fontWeight: "bold", margin: "8px 0 0" }}>{attendedCount}</p>
                        </div>
                        <div style={{ ...statCardStyle, borderLeft: "4px solid #dc3545" }}>
                            <h4 style={{ margin: 0, color: "#dc3545" }}>Not Scanned</h4>
                            <p style={{ fontSize: 28, fontWeight: "bold", margin: "8px 0 0" }}>{totalCount - attendedCount}</p>
                        </div>
                        <div style={{ ...statCardStyle, borderLeft: "4px solid #007bff" }}>
                            <h4 style={{ margin: 0, color: "#007bff" }}>Total</h4>
                            <p style={{ fontSize: 28, fontWeight: "bold", margin: "8px 0 0" }}>{totalCount}</p>
                        </div>
                    </div>

                    {/* Manual Ticket Entry */}
                    <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                        <h4 style={{ margin: "0 0 10px" }}>Manual Ticket Entry</h4>
                        <div style={{ display: "flex", gap: 8 }}>
                            <input
                                placeholder="Enter Ticket ID"
                                value={ticketIdInput}
                                onChange={(e) => setTicketIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleMarkAttendance()}
                                style={{ flex: 1, padding: '10px', borderRadius: 6, border: "1px solid #ccc" }}
                            />
                            <button onClick={handleMarkAttendance} style={btnStyle}>Mark Present</button>
                        </div>
                    </div>

                    {/* Attendance List with Override */}
                    <h4>Participant Attendance</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                <th style={thStyle}>Name</th>
                                <th style={thStyle}>Ticket ID</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Attended At</th>
                                <th style={thStyle}>Override</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #eee', background: p.attended ? "#eafaf1" : "transparent" }}>
                                    <td style={tdStyle}>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                    <td style={{ ...tdStyle, fontSize: "0.85rem" }}>{p.ticketId || "—"}</td>
                                    <td style={tdStyle}>
                                        {p.attended ? (
                                            <span style={{ color: "#28a745", fontWeight: "bold" }}>✅ Attended</span>
                                        ) : (
                                            <span style={{ color: "#888" }}>Not scanned</span>
                                        )}
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: "0.85rem", color: "#666" }}>
                                        {p.attendedAt ? new Date(p.attendedAt).toLocaleString() : "—"}
                                    </td>
                                    <td style={tdStyle}>
                                        {p.attended ? (
                                            <button
                                                onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "UNMARK" })}
                                                style={{ ...smallBtn, background: "#dc3545" }}
                                            >
                                                Unmark
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "MARK" })}
                                                style={{ ...smallBtn, background: "#28a745" }}
                                            >
                                                Force Mark
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* ===== PAYMENT APPROVALS TAB ===== */}
            {activeTab === "payments" && isMerchEvent && (
                <>
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0 }}>Merchandise Orders</h3>
                        <select
                            value={orderStatusFilter}
                            onChange={(e) => setOrderStatusFilter(e.target.value)}
                            style={{ padding: '8px', borderRadius: 4 }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {ordersLoading ? (
                        <p>Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <p style={{ color: "#888" }}>No orders found</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={thStyle}>Participant</th>
                                    <th style={thStyle}>Variant</th>
                                    <th style={thStyle}>Qty</th>
                                    <th style={thStyle}>Amount</th>
                                    <th style={thStyle}>Payment Proof</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>
                                            {order.participantId?.firstName} {order.participantId?.lastName}
                                            <br />
                                            <span style={{ fontSize: "0.8rem", color: "#888" }}>
                                                {order.participantId?.userId?.email}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {order.merchandisePurchase?.size} / {order.merchandisePurchase?.color}
                                        </td>
                                        <td style={tdStyle}>{order.merchandisePurchase?.quantity}</td>
                                        <td style={tdStyle}>₹{order.merchandisePurchase?.totalAmount}</td>
                                        <td style={tdStyle}>
                                            {order.paymentProof ? (
                                                <img
                                                    src={`${API_BASE}${order.paymentProof}`}
                                                    alt="Payment Proof"
                                                    style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid #ddd" }}
                                                    onClick={() => setPreviewImage(`${API_BASE}${order.paymentProof}`)}
                                                />
                                            ) : "N/A"}
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={paymentBadge(order.paymentStatus)}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            {order.paymentStatus === "PENDING" && (
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    <button onClick={() => handleApprove(order._id)} style={{ ...smallBtn, background: "#28a745" }}>✓ Approve</button>
                                                    <button onClick={() => handleReject(order._id)} style={{ ...smallBtn, background: "#dc3545" }}>✗ Reject</button>
                                                </div>
                                            )}
                                            {order.paymentStatus === "APPROVED" && order.ticketId && (
                                                <span style={{ fontSize: "0.8rem", color: "#555" }}>
                                                    Ticket: {order.ticketId.slice(0, 8)}...
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.7)", display: "flex",
                        alignItems: "center", justifyContent: "center", zIndex: 1000, cursor: "pointer",
                    }}
                >
                    <img src={previewImage} alt="Payment Proof"
                        style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}
                    />
                </div>
            )}

            {/* Manual Override Modal */}
            {overrideModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", display: "flex",
                    alignItems: "center", justifyContent: "center", zIndex: 1000,
                }}>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, maxWidth: 420, width: "90%" }}>
                        <h3 style={{ margin: "0 0 12px" }}>
                            {overrideModal.action === "MARK" ? "Force Mark" : "Unmark"} Attendance
                        </h3>
                        <p style={{ margin: "0 0 12px", color: "#555" }}>
                            Participant: <strong>{overrideModal.name}</strong>
                        </p>
                        <textarea
                            placeholder="Reason for override (required)..."
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 80, boxSizing: "border-box" }}
                        />
                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            <button onClick={handleManualOverride} style={{ ...btnStyle, background: overrideModal.action === "MARK" ? "#28a745" : "#dc3545" }}>
                                Confirm {overrideModal.action === "MARK" ? "Mark" : "Unmark"}
                            </button>
                            <button onClick={() => { setOverrideModal(null); setOverrideReason(""); }} style={{ ...btnStyle, background: "#6c757d" }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DISCUSSION TAB ===== */}
            {activeTab === "discussion" && (
                <DiscussionForum eventId={eventId} isOrganizer={true} />
            )}

        </Layout>
    );
}

const statCardStyle = {
    background: '#f8f9fa', padding: '15px', borderRadius: '8px',
    flex: 1, textAlign: 'center', border: '1px solid #ddd', minWidth: 120,
};
const statNumberStyle = { fontSize: '20px', fontWeight: 'bold', marginTop: '5px' };

const btnStyle = {
    padding: "8px 16px", background: "#007bff", color: "#fff",
    border: "none", borderRadius: 5, cursor: "pointer", fontWeight: "bold",
};
const actionBtnStyle = {
    padding: "8px 16px", background: "#6f42c1", color: "#fff",
    border: "none", borderRadius: 5, cursor: "pointer", marginLeft: '10px',
};
const smallBtn = {
    padding: "5px 10px", color: "#fff", border: "none",
    borderRadius: 4, cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold",
};

const thStyle = { padding: '10px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px', verticalAlign: "top" };

const tabStyle = (active) => ({
    padding: "10px 20px", border: "none",
    borderBottom: active ? "3px solid #007bff" : "3px solid transparent",
    background: "transparent", fontWeight: active ? "bold" : "normal",
    color: active ? "#007bff" : "#555", cursor: "pointer", fontSize: "1rem",
});

const pendingBadge = {
    background: "#e74c3c", color: "#fff", padding: "2px 8px",
    borderRadius: 10, fontSize: "0.75rem", marginLeft: 6, fontWeight: "bold",
};

const paymentBadge = (status) => ({
    padding: "3px 10px", borderRadius: 4, fontSize: "0.8rem",
    fontWeight: "bold", color: "#fff",
    background: status === "PENDING" ? "#f39c12" : status === "APPROVED" ? "#27ae60" : status === "REJECTED" ? "#e74c3c" : "#95a5a6",
});
