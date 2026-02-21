import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

export default function ManageOrganizers() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState("organizers");

    // New Organizer Form State
    const [newOrg, setNewOrg] = useState({
        organizerName: "",
        email: "",
        category: "",
        description: "",
        contactEmail: ""
    });

    const [createdCredentials, setCreatedCredentials] = useState(null);

    // Reset Requests state
    const [resetRequests, setResetRequests] = useState([]);
    const [resetFilter, setResetFilter] = useState("ALL");
    const [rejectModal, setRejectModal] = useState(null); // { requestId }
    const [rejectComment, setRejectComment] = useState("");

    useEffect(() => {
        fetchOrganizers();
        fetchResetRequests();
    }, []);

    useEffect(() => {
        if (activeTab === "resets") fetchResetRequests();
    }, [activeTab, resetFilter]);

    const fetchOrganizers = async () => {
        try {
            const response = await api.get("/admin/organizers");
            setOrganizers(response.data);
        } catch (err) {
            alert("Failed to fetch organizers");
        } finally {
            setLoading(false);
        }
    };

    const fetchResetRequests = async () => {
        try {
            const params = resetFilter !== "ALL" ? `?status=${resetFilter}` : "";
            const response = await api.get(`/admin/reset-requests${params}`);
            setResetRequests(response.data);
        } catch (err) {
            console.error("Failed to fetch reset requests");
        }
    };

    const handleCreate = async () => {
        try {
            const response = await api.post("/admin/organizers", newOrg);
            setCreatedCredentials(response.data);
            setShowModal(false);
            fetchOrganizers();
            alert("Organizer Created Successfully!");
        } catch (err) {
            alert("Failed to create organizer: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDisable = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'enable' : 'disable'} this organizer?`)) return;
        try {
            await api.patch(`/admin/organizers/${id}/disable`);
            alert("Organizer disabled");
            fetchOrganizers();
        } catch (err) {
            alert("Action failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the account and profile PERMANENTLY.")) return;
        try {
            await api.delete(`/admin/organizers/${id}`);
            alert("Organizer deleted");
            setOrganizers(organizers.filter(o => o._id !== id));
        } catch (err) {
            alert("Delete failed");
        }
    };

    const handleResetPassword = async (id) => {
        if (!window.confirm("Are you sure? This will generate a NEW password and email it to the Contact Email.")) return;
        try {
            await api.patch(`/admin/reset-password/${id}`);
            alert("Password reset successfully! New credentials sent to organizer's email.");
        } catch (err) {
            alert("Failed to reset password: " + (err.response?.data?.message || err.message));
        }
    };

    const handleApproveReset = async (requestId) => {
        if (!window.confirm("Approve this reset? A new password will be generated and emailed to the organizer.")) return;
        try {
            const res = await api.patch(`/admin/reset-requests/${requestId}/approve`);
            alert(`Approved! New password: ${res.data.newPassword}`);
            fetchResetRequests();
        } catch (err) {
            alert("Failed to approve: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectReset = async () => {
        if (!rejectModal) return;
        try {
            await api.patch(`/admin/reset-requests/${rejectModal.requestId}/reject`, { comment: rejectComment });
            alert("Request rejected");
            setRejectModal(null);
            setRejectComment("");
            fetchResetRequests();
        } catch (err) {
            alert("Failed to reject: " + (err.response?.data?.message || err.message));
        }
    };

    const pendingCount = resetRequests.filter(r => r.status === "PENDING").length;

    return (
        <Layout>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Manage Organizers</h2>
                    <button onClick={() => setShowModal(true)} style={btnStyle}>+ Add New</button>
                </div>

                {createdCredentials && (
                    <div style={{ background: '#d4edda', color: '#155724', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                        <h4>✅ Organizer Created!</h4>
                        <p>Please share these credentials with the organizer:</p>
                        <p><b>Email:</b> {createdCredentials.email}</p>
                        <p><b>Password:</b> {createdCredentials.password}</p>
                        <button onClick={() => setCreatedCredentials(null)} style={{ marginTop: '10px' }}>Dismiss</button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #ddd" }}>
                    <button onClick={() => setActiveTab("organizers")} style={tabStyle(activeTab === "organizers")}>
                        Organizers
                    </button>
                    <button onClick={() => setActiveTab("resets")} style={tabStyle(activeTab === "resets")}>
                        🔑 Reset Requests
                        {pendingCount > 0 && (
                            <span style={pendingBadge}>{pendingCount}</span>
                        )}
                    </button>
                </div>

                {/* ===== ORGANIZERS TAB ===== */}
                {activeTab === "organizers" && (
                    loading ? <p>Loading...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>Email (Login)</th>
                                    <th style={thStyle}>Category</th>
                                    <th style={thStyle}>Contact</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organizers.map(org => (
                                    <tr key={org._id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={tdStyle}>{org.organizerName}</td>
                                        <td style={tdStyle}>{org.email}</td>
                                        <td style={tdStyle}>{org.category}</td>
                                        <td style={tdStyle}>{org.contactEmail}</td>
                                        <td style={tdStyle}>
                                            {org.isDisabled ? <span style={{ color: 'red' }}>Disabled</span> : <span style={{ color: 'green' }}>Active</span>}
                                        </td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleResetPassword(org._id)} style={{ ...actionBtn, background: '#17a2b8' }}>Reset Pwd</button>
                                            {!org.isDisabled && (
                                                <button onClick={() => handleDisable(org._id, org.isDisabled)} style={{ ...actionBtn, background: '#ffc107', color: '#000' }}>Disable</button>
                                            )}
                                            <button onClick={() => handleDelete(org._id)} style={{ ...actionBtn, background: '#dc3545' }}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}

                {/* ===== RESET REQUESTS TAB ===== */}
                {activeTab === "resets" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Password Reset Requests</h3>
                            <select value={resetFilter} onChange={(e) => setResetFilter(e.target.value)} style={{ padding: 8, borderRadius: 4 }}>
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {resetRequests.length === 0 ? (
                            <p style={{ color: "#888" }}>No reset requests found</p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                        <th style={thStyle}>Club / Organizer</th>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Reason</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resetRequests.map(req => (
                                        <tr key={req._id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={tdStyle}><strong>{req.organizerName}</strong></td>
                                            <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td style={tdStyle}>{req.reason}</td>
                                            <td style={tdStyle}>
                                                <span style={statusBadge(req.status)}>{req.status}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                {req.status === "PENDING" ? (
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        <button onClick={() => handleApproveReset(req._id)} style={{ ...actionBtn, background: "#28a745" }}>✓ Approve</button>
                                                        <button onClick={() => setRejectModal({ requestId: req._id })} style={{ ...actionBtn, background: "#dc3545" }}>✗ Reject</button>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "0.85rem", color: "#888" }}>
                                                        {req.adminComment ? `"${req.adminComment}"` : "—"}
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

                {/* Modal for Creating Organizer */}
                {showModal && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <h3>Add New Organizer</h3>
                            <input placeholder="Organizer Name (Club Name)" value={newOrg.organizerName} onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })} style={inputStyle} />
                            <input placeholder="Login Email" value={newOrg.email} onChange={e => setNewOrg({ ...newOrg, email: e.target.value })} style={inputStyle} />
                            <input placeholder="Category (e.g. Tech, Music)" value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })} style={inputStyle} />
                            <input placeholder="Contact Email" value={newOrg.contactEmail} onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })} style={inputStyle} />
                            <textarea placeholder="Description" value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })} style={{ ...inputStyle, height: '80px' }} />
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowModal(false)} style={{ ...btnStyle, background: '#6c757d' }}>Cancel</button>
                                <button onClick={handleCreate} style={btnStyle}>Create</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {rejectModal && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <h3>Reject Reset Request</h3>
                            <textarea
                                placeholder="Comment / reason for rejection (optional)..."
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                style={{ ...inputStyle, height: '80px' }}
                            />
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => { setRejectModal(null); setRejectComment(""); }} style={{ ...btnStyle, background: '#6c757d' }}>Cancel</button>
                                <button onClick={handleRejectReset} style={{ ...btnStyle, background: '#dc3545' }}>Reject</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

const thStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '12px' };
const btnStyle = { padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const actionBtn = { padding: '5px 10px', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', marginLeft: '5px', fontSize: '0.8rem' };
const inputStyle = { display: 'block', width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };

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

const statusBadge = (status) => ({
    padding: "3px 10px", borderRadius: 4, fontSize: "0.8rem",
    fontWeight: "bold", color: "#fff",
    background: status === "PENDING" ? "#f39c12" : status === "APPROVED" ? "#27ae60" : "#e74c3c",
});

const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
};
const modalContent = {
    background: '#fff', padding: '20px', borderRadius: '8px', width: '400px'
};
