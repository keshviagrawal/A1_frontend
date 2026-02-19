import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getOrganizerProfile, updateOrganizerProfile } from "../services/organizerService";

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

    useEffect(() => {
        fetchProfile();
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
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
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

    if (loading) return <p>Loading...</p>;

    return (
        <Layout>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2>Organizer Profile</h2>

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
    border: '1px solid #ccc'
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
