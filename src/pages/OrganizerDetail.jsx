import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const OrganizerDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
    }, []);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/events/organizers/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch organizer details:", err);
            setError(err.response?.data?.message || "Failed to load organizer details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric",
        });
    };

    if (loading) return <Layout><p style={{ padding: 20 }}>Loading...</p></Layout>;
    if (error) return <Layout><p style={{ padding: 20, color: "red" }}>Error: {error}</p></Layout>;
    if (!data) return <Layout><p style={{ padding: 20 }}>No data found</p></Layout>;

    return (
        <Layout>
            <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <h2>{data.Organizer.organizerName}</h2>
                <p style={{ color: "#555" }}>{data.Organizer.category}</p>
                <p>{data.Organizer.description}</p>
                {data.Organizer.contactEmail && (
                    <p><strong>Email:</strong> {data.Organizer.contactEmail}</p>
                )}

                <hr style={{ margin: "20px 0" }} />

                <h3>Upcoming Events</h3>
                {data.Upcoming.length === 0 ? (
                    <p style={{ color: "#888" }}>No upcoming events</p>
                ) : (
                    data.Upcoming.map((event) => (
                        <div key={event._id} style={eventCard}>
                            <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                                {formatDate(event.eventStartDate)} • {event.eventType}
                            </p>
                        </div>
                    ))
                )}

                <h3 style={{ marginTop: 24 }}>Past Events</h3>
                {data.Past.length === 0 ? (
                    <p style={{ color: "#888" }}>No past events</p>
                ) : (
                    data.Past.map((event) => (
                        <div key={event._id} style={{ ...eventCard, opacity: 0.7 }}>
                            <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                            <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "#555" }}>
                                {formatDate(event.eventStartDate)} • {event.eventType}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </Layout>
    );
};

const eventCard = {
    border: "1px solid #e0e0e0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    background: "#fafafa",
};

export default OrganizerDetail;