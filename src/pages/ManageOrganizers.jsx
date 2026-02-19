import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

export default function ManageOrganizers() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New Organizer Form State
    const [newOrg, setNewOrg] = useState({
        organizerName: "",
        email: "",
        category: "",
        description: "",
        contactEmail: ""
    });

    const [createdCredentials, setCreatedCredentials] = useState(null);

    useEffect(() => {
        fetchOrganizers();
    }, []);

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

    const handleCreate = async () => {
        try {
            const response = await api.post("/admin/organizers", newOrg);
            setCreatedCredentials(response.data); // Contains email and auto-generated password
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
            // Toggle logic would go here, currently backend only has disable
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

                {loading ? <p>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
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
                )}

                {/* Modal for Creating Organizer */}
                {showModal && (
                    <div style={modalOverlay}>
                        <div style={modalContent}>
                            <h3>Add New Organizer</h3>
                            <input
                                placeholder="Organizer Name (Club Name)"
                                value={newOrg.organizerName}
                                onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Login Email"
                                value={newOrg.email}
                                onChange={e => setNewOrg({ ...newOrg, email: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Category (e.g. Tech, Music)"
                                value={newOrg.category}
                                onChange={e => setNewOrg({ ...newOrg, category: e.target.value })}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Contact Email"
                                value={newOrg.contactEmail}
                                onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                                style={inputStyle}
                            />
                            <textarea
                                placeholder="Description"
                                value={newOrg.description}
                                onChange={e => setNewOrg({ ...newOrg, description: e.target.value })}
                                style={{ ...inputStyle, height: '80px' }}
                            />

                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowModal(false)} style={{ ...btnStyle, background: '#6c757d' }}>Cancel</button>
                                <button onClick={handleCreate} style={btnStyle}>Create</button>
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

const modalOverlay = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalContent = {
    background: '#fff', padding: '20px', borderRadius: '8px', width: '400px'
};
