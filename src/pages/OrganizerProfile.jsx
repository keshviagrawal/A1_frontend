import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getOrganizerProfile, updateOrganizerProfile } from "../services/organizerService";
import api from "../services/api";

export default function OrganizerProfile() {
    const [profile, setProfile] = useState({
        organizerName: "",
        category: "",
        description: "",
        contactEmail: "",
        contactNumber: "",
        discordWebhook: ""
    });
    const [loading, setLoading] = useState(true);
    const [loginEmail, setLoginEmail] = useState("");

    // Password reset request state
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetReason, setResetReason] = useState("");
    const [resetRequests, setResetRequests] = useState([]);
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchResetRequests();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getOrganizerProfile();
            setProfile({
                organizerName: data.organizerName || "",
                category: data.category || "",
                description: data.description || "",
                contactEmail: data.contactEmail || "",
                contactNumber: data.contactNumber || "",
                discordWebhook: data.discordWebhook || ""
            });
            setLoginEmail(data.userId?.email || "");
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResetRequests = async () => {
        try {
            const res = await api.get("/organizer/reset-requests");
            setResetRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch reset requests");
        }
    };

    const handleSubmitReset = async () => {
        if (!resetReason.trim()) return alert("Please provide a reason");
        setResetLoading(true);
        try {
            await api.post("/organizer/reset-request", { reason: resetReason.trim() });
            alert("Password reset request submitted successfully!");
            setResetReason("");
            setShowResetForm(false);
            fetchResetRequests();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to submit request");
        } finally {
            setResetLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        try {
            await updateOrganizerProfile(profile);
            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile: " + (err.response?.data?.message || err.message));
        }
    };

    const getResetBadge = (status) => ({
        padding: "3px 10px", borderRadius: 4, fontSize: "0.8rem", fontWeight: "bold", color: "#fff",
        background: status === "PENDING" ? "#f39c12" : status === "APPROVED" ? "#27ae60" : "#e74c3c",
    });

    const hasPending = resetRequests.some(r => r.status === "PENDING");

    if (loading) return <p>Loading...</p>;

    return (
        <Layout>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2>Organizer Profile</h2>

                <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f8f9fa", borderRadius: 8 }}>
                    <p style={{ margin: "4px 0" }}><strong>Login Email:</strong> {loginEmail}</p>
                </div>

                <label>Organizer Name:</label>
                <input
                    name="organizerName"
                    value={profile.organizerName}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <label>Category (e.g., Tech Club, Music Society):</label>
                <input
                    name="category"
                    value={profile.category}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <label>Description:</label>
                <textarea
                    name="description"
                    value={profile.description}
                    onChange={handleChange}
                    style={{ ...inputStyle, height: '80px' }}
                />

                <label>Contact Email:</label>
                <input
                    name="contactEmail"
                    value={profile.contactEmail}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <label>Contact Number:</label>
                <input
                    name="contactNumber"
                    value={profile.contactNumber}
                    onChange={handleChange}
                    style={inputStyle}
                />

                <hr />
                <h3>Integrations</h3>
                <label>Discord Webhook URL:</label>
                <p style={{ fontSize: '0.8rem', color: '#666' }}>
                    Enter a Discord Webhook URL to automatically post new events to your server when Published.
                </p>
                <input
                    name="discordWebhook"
                    value={profile.discordWebhook}
                    onChange={handleChange}
                    placeholder="https://discord.com/api/webhooks/..."
                    style={inputStyle}
                />

                <button onClick={handleUpdate} style={btnStyle}>
                    Save Changes
                </button>

                {/* Password Reset Request Section */}
                <hr />
                <div style={{ background: "#f8f9fa", padding: 20, borderRadius: 8, marginTop: 10, border: "1px solid #ddd" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0 }}>🔑 Password Reset</h3>
                        {!hasPending && (
                            <button
                                onClick={() => setShowResetForm(!showResetForm)}
                                style={{ ...btnStyle, background: showResetForm ? "#6c757d" : "#dc3545", fontSize: "0.9rem", padding: "8px 14px", marginTop: 0 }}
                            >
                                {showResetForm ? "Cancel" : "Request Reset"}
                            </button>
                        )}
                        {hasPending && (
                            <span style={getResetBadge("PENDING")}>Request Pending</span>
                        )}
                    </div>

                    {showResetForm && (
                        <div style={{ marginTop: 16 }}>
                            <textarea
                                placeholder="Reason for password reset (e.g., forgot password, account compromised)..."
                                value={resetReason}
                                onChange={(e) => setResetReason(e.target.value)}
                                style={{ ...inputStyle, minHeight: 80, marginBottom: 0 }}
                            />
                            <button
                                onClick={handleSubmitReset}
                                disabled={resetLoading}
                                style={{ ...btnStyle, background: "#dc3545" }}
                            >
                                {resetLoading ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    )}

                    {resetRequests.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <h4 style={{ margin: "0 0 10px" }}>Request History</h4>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: "#e9ecef", textAlign: "left" }}>
                                        <th style={thStyle}>Date</th>
                                        <th style={thStyle}>Reason</th>
                                        <th style={thStyle}>Status</th>
                                        <th style={thStyle}>Admin Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {resetRequests.map(req => (
                                        <tr key={req._id} style={{ borderBottom: "1px solid #eee" }}>
                                            <td style={tdStyle}>{new Date(req.createdAt).toLocaleDateString()}</td>
                                            <td style={tdStyle}>{req.reason}</td>
                                            <td style={tdStyle}><span style={getResetBadge(req.status)}>{req.status}</span></td>
                                            <td style={tdStyle}>{req.adminComment || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '8px',
    marginBottom: '15px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
};

const btnStyle = {
    padding: "10px 20px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: '10px'
};

const thStyle = { padding: "8px 10px", borderBottom: "2px solid #ddd" };
const tdStyle = { padding: "8px 10px" };

