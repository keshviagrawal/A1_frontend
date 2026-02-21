import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DiscussionForum from "../components/DiscussionForum";
import Layout from "../components/Layout";
import {
    getEventAnalytics, updateEvent, markAttendance, exportParticipantsCSV,
    publishEvent, getMerchOrders, approveMerchOrder, rejectMerchOrder, manualOverrideAttendance,
} from "../services/organizerService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function OrganizerEventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [analytics, setAnalytics] = useState({ totalRegistrations: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("participants");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [ticketIdInput, setTicketIdInput] = useState("");
    const [orders, setOrders] = useState([]);
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [overrideModal, setOverrideModal] = useState(null);
    const [overrideReason, setOverrideReason] = useState("");

    useEffect(() => { fetchDetails(); }, [eventId]);
    useEffect(() => {
        if (event?.eventType === "MERCHANDISE" && activeTab === "payments") fetchOrders();
    }, [activeTab, orderStatusFilter]);

    const fetchDetails = async () => {
        try {
            const data = await getEventAnalytics(eventId);
            setEvent(data.event);
            setParticipants(data.participants || []);
            setAnalytics({ totalRegistrations: data.totalRegistrations, totalRevenue: data.totalRevenue });
        } catch (err) { console.error("Failed to fetch event details"); }
        finally { setLoading(false); }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getMerchOrders(eventId, orderStatusFilter === "ALL" ? "" : orderStatusFilter);
            setOrders(data);
        } catch (err) { console.error("Failed to fetch orders:", err); }
        finally { setOrdersLoading(false); }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            if (newStatus === "PUBLISHED" && event.status === "DRAFT") await publishEvent(eventId);
            else await updateEvent(eventId, { status: newStatus });
            alert(`Event status updated to ${newStatus}`);
            fetchDetails();
        } catch (err) { alert("Failed to update status: " + (err.response?.data?.message || err.message)); }
    };

    const handleMarkAttendance = async () => {
        if (!ticketIdInput) return;
        try { await markAttendance(ticketIdInput); alert("Attendance Marked!"); setTicketIdInput(""); fetchDetails(); }
        catch (err) { alert(err.response?.data?.message || "Failed"); }
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
        } catch (err) { alert("Failed to download CSV"); }
    };

    const handleApprove = async (orderId) => {
        if (!window.confirm("Approve this payment? This will generate a ticket and decrement stock.")) return;
        try { await approveMerchOrder(eventId, orderId); fetchOrders(); fetchDetails(); }
        catch (err) { alert("Failed to approve: " + (err.response?.data?.message || err.message)); }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this payment?")) return;
        try { await rejectMerchOrder(eventId, orderId); fetchOrders(); }
        catch (err) { alert("Failed to reject: " + (err.response?.data?.message || err.message)); }
    };

    const handleManualOverride = async () => {
        if (!overrideModal || !overrideReason.trim()) { alert("Reason is required"); return; }
        try {
            await manualOverrideAttendance(eventId, overrideModal.registrationId, overrideModal.action, overrideReason.trim());
            setOverrideModal(null); setOverrideReason(""); fetchDetails();
        } catch (err) { alert("Override failed: " + (err.response?.data?.message || err.message)); }
    };

    const filteredParticipants = participants.filter(p => {
        const name = `${p.participantId?.firstName || ""} ${p.participantId?.lastName || ""}`.toLowerCase();
        const email = (p.participantId?.email || p.participantId?.userId?.email || "").toLowerCase();
        const ticket = (p.ticketId || "").toLowerCase();
        const q = search.toLowerCase();
        return (name.includes(q) || email.includes(q) || ticket.includes(q)) && (statusFilter === "ALL" || p.status === statusFilter);
    });

    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (!event) return <Layout><p>Event not found</p></Layout>;

    const isMerchEvent = event.eventType === "MERCHANDISE";
    const attendedCount = participants.filter(p => p.attended).length;
    const totalCount = participants.length;
    const attendancePercent = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

    const getStatusBadge = (status) => {
        const map = { DRAFT: "badge badge-gray", PUBLISHED: "badge badge-info", ONGOING: "badge badge-success", COMPLETED: "badge badge-purple", CLOSED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    const getPaymentBadge = (status) => {
        const map = { PENDING: "badge badge-warning", APPROVED: "badge badge-success", REJECTED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    return (
        <Layout>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">{event.eventName}</h2>
                    <span className={getStatusBadge(event.status)}>{event.status}</span>
                </div>
                <div className="flex gap-sm">
                    {event.status === "DRAFT" && <button onClick={() => handleStatusChange("PUBLISHED")} className="btn-primary btn-sm">Publish</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("ONGOING")} className="btn-success btn-sm">Start Event</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("CLOSED")} className="btn-danger btn-sm">Close</button>}
                    {event.status === "ONGOING" && <button onClick={() => handleStatusChange("COMPLETED")} className="btn-primary btn-sm">Complete</button>}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card"><h4>Registrations</h4><p className="stat-number">{analytics.totalRegistrations}</p></div>
                <div className="stat-card"><h4>Revenue</h4><p className="stat-number">₹{analytics.totalRevenue}</p></div>
                <div className="stat-card"><h4>Attendance</h4><p className="stat-number">{attendedCount}/{totalCount}</p></div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button onClick={() => setActiveTab("participants")} className={`tab ${activeTab === "participants" ? "active" : ""}`}>Participants</button>
                <button onClick={() => setActiveTab("attendance")} className={`tab ${activeTab === "attendance" ? "active" : ""}`}>📊 Attendance</button>
                {isMerchEvent && (
                    <button onClick={() => setActiveTab("payments")} className={`tab ${activeTab === "payments" ? "active" : ""}`}>
                        Payments {orders.filter(o => o.paymentStatus === "PENDING").length > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 6 }}>{orders.filter(o => o.paymentStatus === "PENDING").length}</span>
                        )}
                    </button>
                )}
                <button onClick={() => setActiveTab("discussion")} className={`tab ${activeTab === "discussion" ? "active" : ""}`}>💬 Discussion</button>
            </div>

            {/* ====== PARTICIPANTS TAB ====== */}
            {activeTab === "participants" && (
                <>
                    <div className="flex justify-between items-center flex-wrap gap mb-sm">
                        <h3>Participants</h3>
                        <div className="flex gap-sm">
                            <button onClick={handleDownloadCSV} className="btn-success btn-sm">📥 CSV</button>
                            <button onClick={() => navigate(`/organizer/event/${eventId}/scanner`)} className="btn-primary btn-sm">🔍 QR Scanner</button>
                        </div>
                    </div>

                    <div className="filters-bar mb">
                        <input placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="ALL">All Status</option>
                            <option value="REGISTERED">Registered</option>
                            <option value="ATTENDED">Attended</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Ticket ID</th><th>Status</th><th>Attended</th></tr>
                            </thead>
                            <tbody>
                                {filteredParticipants.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{p.participantId?.email || p.participantId?.userId?.email}</td>
                                        <td style={{ fontSize: "0.82rem" }}>{p.ticketId || "—"}</td>
                                        <td><span className={p.status === "CANCELLED" ? "badge badge-danger" : "badge badge-primary"}>{p.status}</span></td>
                                        <td>{p.attended ? "✅" : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ====== ATTENDANCE TAB ====== */}
            {activeTab === "attendance" && (
                <>
                    <div className="flex justify-between items-center mb">
                        <h3>Live Attendance Dashboard</h3>
                        <button onClick={() => navigate(`/organizer/event/${eventId}/scanner`)} className="btn-primary btn-sm">🔍 Open QR Scanner</button>
                    </div>

                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{
                            width: `${attendancePercent}%`,
                            background: attendancePercent > 75 ? "var(--success)" : attendancePercent > 40 ? "var(--warning)" : "var(--danger)",
                            minWidth: attendancePercent > 0 ? 40 : 0,
                        }}>
                            {attendancePercent}%
                        </div>
                    </div>

                    <div className="stats-row">
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--success)" }}><h4>Scanned</h4><p className="stat-number">{attendedCount}</p></div>
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--danger)" }}><h4>Not Scanned</h4><p className="stat-number">{totalCount - attendedCount}</p></div>
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--primary)" }}><h4>Total</h4><p className="stat-number">{totalCount}</p></div>
                    </div>

                    <div className="scanner-box mb">
                        <h4 style={{ margin: "0 0 10px" }}>Manual Ticket Entry</h4>
                        <div className="flex gap-sm">
                            <input placeholder="Enter Ticket ID" value={ticketIdInput} onChange={(e) => setTicketIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleMarkAttendance()} style={{ flex: 1 }} />
                            <button onClick={handleMarkAttendance} className="btn-primary btn-sm">Mark Present</button>
                        </div>
                    </div>

                    <h4 className="mb-sm">Participant Attendance</h4>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Name</th><th>Ticket ID</th><th>Status</th><th>Attended At</th><th>Override</th></tr></thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p._id} style={{ background: p.attended ? "var(--success-bg)" : "transparent" }}>
                                        <td>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                        <td style={{ fontSize: "0.82rem" }}>{p.ticketId || "—"}</td>
                                        <td>{p.attended ? <span className="badge badge-success">Attended</span> : <span style={{ color: "var(--text-muted)" }}>Not scanned</span>}</td>
                                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{p.attendedAt ? new Date(p.attendedAt).toLocaleString() : "—"}</td>
                                        <td>
                                            {p.attended ? (
                                                <button onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "UNMARK" })} className="btn-danger btn-sm">Unmark</button>
                                            ) : (
                                                <button onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "MARK" })} className="btn-success btn-sm">Force Mark</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ====== PAYMENT APPROVALS TAB ====== */}
            {activeTab === "payments" && isMerchEvent && (
                <>
                    <div className="flex justify-between items-center mb">
                        <h3>Merchandise Orders</h3>
                        <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} style={{ width: "auto" }}>
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>

                    {ordersLoading ? <p>Loading orders...</p> : orders.length === 0 ? (
                        <p style={{ color: "var(--text-muted)" }}>No orders found</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Participant</th><th>Variant</th><th>Qty</th><th>Amount</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>
                                                {order.participantId?.firstName} {order.participantId?.lastName}
                                                <br /><span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{order.participantId?.userId?.email}</span>
                                            </td>
                                            <td>{order.merchandisePurchase?.size} / {order.merchandisePurchase?.color}</td>
                                            <td>{order.merchandisePurchase?.quantity}</td>
                                            <td>₹{order.merchandisePurchase?.totalAmount}</td>
                                            <td>
                                                {order.paymentProof ? (
                                                    <img src={`${API_BASE}${order.paymentProof}`} alt="Proof"
                                                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid var(--border)" }}
                                                        onClick={() => setPreviewImage(`${API_BASE}${order.paymentProof}`)} />
                                                ) : "N/A"}
                                            </td>
                                            <td><span className={getPaymentBadge(order.paymentStatus)}>{order.paymentStatus}</span></td>
                                            <td>
                                                {order.paymentStatus === "PENDING" && (
                                                    <div className="flex gap-sm">
                                                        <button onClick={() => handleApprove(order._id)} className="btn-success btn-sm">✓</button>
                                                        <button onClick={() => handleReject(order._id)} className="btn-danger btn-sm">✗</button>
                                                    </div>
                                                )}
                                                {order.paymentStatus === "APPROVED" && order.ticketId && (
                                                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Ticket: {order.ticketId.slice(0, 8)}...</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Payment Proof" />
                </div>
            )}

            {/* Manual Override Modal */}
            {overrideModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ margin: "0 0 12px" }}>{overrideModal.action === "MARK" ? "Force Mark" : "Unmark"} Attendance</h3>
                        <p style={{ margin: "0 0 12px", color: "var(--text-secondary)" }}>Participant: <strong>{overrideModal.name}</strong></p>
                        <div className="form-group">
                            <textarea placeholder="Reason for override (required)..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                        </div>
                        <div className="flex gap-sm">
                            <button onClick={handleManualOverride} className={overrideModal.action === "MARK" ? "btn-success" : "btn-danger"}>
                                Confirm {overrideModal.action === "MARK" ? "Mark" : "Unmark"}
                            </button>
                            <button onClick={() => { setOverrideModal(null); setOverrideReason(""); }} className="btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== DISCUSSION TAB ====== */}
            {activeTab === "discussion" && <DiscussionForum eventId={eventId} isOrganizer={true} />}
        </Layout>
    );
}
