import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const ClubsList = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await api.get("/participants/organizers");
            setOrganizers(res.data);
        } catch (err) {
            console.error("Failed to fetch organizers:", err);
            setError("Failed to load organizers");
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (id) => {
        try {
            await api.post(`/participants/follow/${id}`);
            fetchOrganizers();
        } catch (err) {
            alert("Failed to follow organizer");
        }
    };

    const handleUnfollow = async (id) => {
        try {
            await api.delete(`/participants/follow/${id}`);
            fetchOrganizers();
        } catch (err) {
            alert("Failed to unfollow organizer");
        }
    };

    if (loading) return <Layout><p style={{ padding: 20 }}>Loading...</p></Layout>;
    if (error) return <Layout><p style={{ padding: 20, color: "red" }}>{error}</p></Layout>;

    return (
        <Layout>
            <h2>Clubs / Organizers</h2>

            {organizers.length === 0 ? (
                <p style={{ color: "#888" }}>No organizers found.</p>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                    {organizers.map((org) => (
                        <div key={org._id} style={cardStyle}>
                            <h3
                                onClick={() => navigate(`/organizer/${org._id}`)}
                                style={{ cursor: "pointer", color: "#007bff", margin: "0 0 8px 0" }}
                            >
                                {org.organizerName}
                            </h3>

                            {org.category && (
                                <span style={categoryBadge}>{org.category}</span>
                            )}

                            <p style={{ color: "#555", fontSize: "0.9rem", marginTop: 8 }}>
                                {org.description || "No description available."}
                            </p>

                            {org.isFollowed ? (
                                <button onClick={() => handleUnfollow(org._id)} style={unfollowBtn}>
                                    Unfollow
                                </button>
                            ) : (
                                <button onClick={() => handleFollow(org._id)} style={followBtn}>
                                    Follow
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

/* ================= Styles ================= */

const cardStyle = {
    border: "1px solid #e0e0e0",
    padding: 16,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
};

const categoryBadge = {
    background: "#e8e8e8",
    padding: "2px 8px",
    borderRadius: 4,
    fontSize: "0.8rem",
    color: "#555",
};

const followBtn = {
    padding: "8px 20px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 12,
};

const unfollowBtn = {
    padding: "8px 20px",
    background: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginTop: 12,
};

export default ClubsList;