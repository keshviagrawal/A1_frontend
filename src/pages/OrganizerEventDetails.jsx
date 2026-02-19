import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import {
    getEventAnalytics,
    updateEvent,
    markAttendance,
    exportParticipantsCSV,
    publishEvent
} from "../services/organizerService";

export default function OrganizerEventDetails() {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [analytics, setAnalytics] = useState({ totalRegistrations: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Actions
    const [ticketIdInput, setTicketIdInput] = useState("");

    useEffect(() => {
        fetchDetails();
    }, [eventId]);

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
            alert("Failed: " + (err.response?.data?.message || err.message));
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

    const filteredParticipants = participants.filter(p => {
        const nameMatch = `${p.participantId.firstName} ${p.participantId.lastName}`.toLowerCase().includes(search.toLowerCase());
        const emailMatch = p.participantId.email?.toLowerCase().includes(search.toLowerCase()) || "";
        const ticketMatch = p.ticketId?.toLowerCase().includes(search.toLowerCase()) || "";

        const statusMatch = statusFilter === "ALL" || p.status === statusFilter;

        return (nameMatch || emailMatch || ticketMatch) && statusMatch;
    });

    if (loading) return <p>Loading...</p>;
    if (!event) return <p>Event not found</p>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>{event.eventName} <span style={{ fontSize: '0.6em', color: '#666' }}>({event.status})</span></h2>
                <div>
                    {event.status === "DRAFT" && <button onClick={() => handleStatusChange("PUBLISHED")} style={actionBtnStyle}>Publish Event</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("ONGOING")} style={actionBtnStyle}>Start Event</button>}
                    {event.status === "PUBLISHED" && <button onClick={() => handleStatusChange("CLOSED")} style={{ ...actionBtnStyle, background: 'red' }}>Close Event</button>}
                    {event.status === "ONGOING" && <button onClick={() => handleStatusChange("COMPLETED")} style={actionBtnStyle}>Mark Completed</button>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
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
                    <p style={statNumberStyle}>{participants.filter(p => p.attended).length}</p>
                </div>
            </div>

            {/* Manual Attendance Marking */}
            <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4>Mark Attendance</h4>
                <input
                    placeholder="Scan/Enter Ticket ID"
                    value={ticketIdInput}
                    onChange={(e) => setTicketIdInput(e.target.value)}
                    style={{ padding: '8px', width: '300px', marginRight: '10px' }}
                />
                <button onClick={handleMarkAttendance} style={btnStyle}>Mark Present</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Participants</h3>
                <button onClick={handleDownloadCSV} style={{ ...btnStyle, background: '#28a745' }}>Download CSV</button>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <input
                    placeholder="Search participants..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: '8px', width: '300px', marginRight: '10px' }}
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
                        <th style={thStyle}>Contact</th>
                        <th style={thStyle}>Ticket ID</th>
                        <th style={thStyle}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredParticipants.map(p => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}>{p.participantId.firstName} {p.participantId.lastName}</td>
                            <td style={tdStyle}>{p.participantId.email}</td>
                            <td style={tdStyle}>{p.participantId.contactNumber}</td>
                            <td style={tdStyle}>{p.ticketId}</td>
                            <td style={tdStyle}>
                                {p.status} {p.attended && "✅"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </Layout>
    );
}

const statCardStyle = {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    flex: 1,
    textAlign: 'center',
    border: '1px solid #ddd'
};

const statNumberStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '5px'
};

const btnStyle = {
    padding: "8px 16px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
};

const actionBtnStyle = {
    padding: "8px 16px",
    background: "#6f42c1",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    marginLeft: '10px'
};

const thStyle = { padding: '10px', borderBottom: '2px solid #ddd' };
const tdStyle = { padding: '10px' };
