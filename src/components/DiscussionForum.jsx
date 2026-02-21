import { useState, useEffect, useRef } from "react";
import api from "../services/api";

const EMOJIS = ["👍", "❤️", "😂", "🎉"];
const POLL_INTERVAL = 5000;

export default function DiscussionForum({ eventId, isOrganizer = false }) {
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [loading, setLoading] = useState(true);
    const bottomRef = useRef(null);
    const currentUserId = (() => {
        try { const t = localStorage.getItem("token"); if (!t) return null; return JSON.parse(atob(t.split(".")[1])).userId; } catch { return null; }
    })();

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/forum/${eventId}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to fetch forum messages");
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newMsg.trim()) return;
        try {
            await api.post(`/forum/${eventId}`, { content: newMsg.trim(), isAnnouncement });
            setNewMsg("");
            setIsAnnouncement(false);
            fetchMessages();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post message");
        }
    };

    const handleReply = async (parentId) => {
        if (!replyContent.trim()) return;
        try {
            await api.post(`/forum/${eventId}`, { content: replyContent.trim(), parentId });
            setReplyTo(null);
            setReplyContent("");
            fetchMessages();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to post reply");
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            await api.delete(`/forum/${eventId}/${messageId}`);
            fetchMessages();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handlePin = async (messageId) => {
        try {
            await api.patch(`/forum/${eventId}/${messageId}/pin`);
            fetchMessages();
        } catch (err) {
            alert("Failed to toggle pin");
        }
    };

    const handleReact = async (messageId, emoji) => {
        try {
            await api.post(`/forum/${eventId}/${messageId}/react`, { emoji });
            fetchMessages();
        } catch (err) {
            console.error("Failed to react");
        }
    };

    // Organize: top-level messages, then group replies
    const topLevel = messages.filter(m => !m.parentId);
    const replies = messages.filter(m => m.parentId);
    const getReplies = (parentId) => replies.filter(r => r.parentId === parentId);

    // Sort: pinned first, then announcements, then chronological
    const sorted = [...topLevel].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isAnnouncement && !b.isAnnouncement) return -1;
        if (!a.isAnnouncement && b.isAnnouncement) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const renderMessage = (msg, isReply = false) => {
        const isOwn = currentUserId === msg.authorId;
        const canDelete = isOrganizer || isOwn;
        const msgReplies = getReplies(msg._id);

        return (
            <div key={msg._id} style={{
                ...msgStyle,
                marginLeft: isReply ? 30 : 0,
                borderLeft: isReply ? "3px solid #ddd" : msg.isAnnouncement ? "3px solid #e74c3c" : msg.isPinned ? "3px solid #f39c12" : "1px solid #eee",
                background: msg.isAnnouncement ? "#fff5f5" : msg.isPinned ? "#fffef0" : "#fff",
            }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div>
                        <strong style={{ color: msg.authorRole === "organizer" ? "#e74c3c" : "#333" }}>
                            {msg.authorName}
                        </strong>
                        {msg.authorRole === "organizer" && <span style={orgBadge}>Organizer</span>}
                        {msg.isAnnouncement && <span style={annBadge}>📢 Announcement</span>}
                        {msg.isPinned && <span style={pinBadge}>📌 Pinned</span>}
                        <span style={{ color: "#999", fontSize: "0.8rem", marginLeft: 8 }}>
                            {new Date(msg.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                        {isOrganizer && (
                            <button onClick={() => handlePin(msg._id)} style={actionBtnStyle} title={msg.isPinned ? "Unpin" : "Pin"}>
                                📌
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => handleDelete(msg._id)} style={{ ...actionBtnStyle, color: "#e74c3c" }} title="Delete">
                                🗑️
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <p style={{ margin: "0 0 8px", lineHeight: 1.5 }}>{msg.content}</p>

                {/* Reactions + Reply */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {EMOJIS.map(emoji => {
                        const reactors = msg.reactions?.[emoji] || [];
                        const hasReacted = reactors.includes(currentUserId);
                        return (
                            <button
                                key={emoji}
                                onClick={() => handleReact(msg._id, emoji)}
                                style={{
                                    ...reactionBtn,
                                    background: hasReacted ? "#e3f2fd" : "#f5f5f5",
                                    border: hasReacted ? "1px solid #90caf9" : "1px solid #ddd",
                                }}
                            >
                                {emoji} {reactors.length > 0 && <span style={{ fontSize: "0.75rem" }}>{reactors.length}</span>}
                            </button>
                        );
                    })}
                    {!isReply && (
                        <button onClick={() => setReplyTo(replyTo === msg._id ? null : msg._id)} style={{ ...actionBtnStyle, fontSize: "0.8rem" }}>
                            💬 Reply
                        </button>
                    )}
                </div>

                {/* Reply Form */}
                {replyTo === msg._id && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <input
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc", fontSize: "0.9rem" }}
                            onKeyDown={(e) => e.key === "Enter" && handleReply(msg._id)}
                        />
                        <button onClick={() => handleReply(msg._id)} style={postBtnSmall}>Reply</button>
                    </div>
                )}

                {/* Nested Replies */}
                {msgReplies.map(r => renderMessage(r, true))}
            </div>
        );
    };

    if (loading) return <p>Loading forum...</p>;

    return (
        <div style={{ marginTop: 10 }}>
            <h3 style={{ marginBottom: 10 }}>💬 Discussion Forum</h3>
            <p style={{ fontSize: "0.85rem", color: "#888", margin: "0 0 16px" }}>
                Messages auto-refresh every 5 seconds
            </p>

            {/* Post Box */}
            <div style={{ background: "#f8f9fa", padding: 14, borderRadius: 8, marginBottom: 20, border: "1px solid #ddd" }}>
                <textarea
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Write a message..."
                    style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 60, boxSizing: "border-box", fontSize: "0.95rem" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div>
                        {isOrganizer && (
                            <label style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                                <input type="checkbox" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} style={{ marginRight: 6 }} />
                                📢 Post as Announcement
                            </label>
                        )}
                    </div>
                    <button onClick={handlePost} style={postBtn}>Post Message</button>
                </div>
            </div>

            {/* Messages */}
            {sorted.length === 0 ? (
                <p style={{ color: "#999", textAlign: "center", padding: 30 }}>No messages yet. Start the conversation!</p>
            ) : (
                sorted.map(msg => renderMessage(msg))
            )}
            <div ref={bottomRef} />
        </div>
    );
}

/* =================== Styles =================== */
const msgStyle = {
    padding: 14, borderRadius: 8, marginBottom: 10,
    border: "1px solid #eee",
};
const orgBadge = {
    background: "#e74c3c", color: "#fff", padding: "2px 8px",
    borderRadius: 4, fontSize: "0.7rem", marginLeft: 8, fontWeight: "bold",
};
const annBadge = {
    background: "#fff3cd", color: "#856404", padding: "2px 8px",
    borderRadius: 4, fontSize: "0.7rem", marginLeft: 6,
};
const pinBadge = {
    background: "#ffeaa7", color: "#856404", padding: "2px 8px",
    borderRadius: 4, fontSize: "0.7rem", marginLeft: 6,
};
const actionBtnStyle = {
    background: "transparent", border: "none", cursor: "pointer", fontSize: "1rem", padding: "2px 6px",
};
const reactionBtn = {
    padding: "3px 8px", borderRadius: 12, cursor: "pointer", fontSize: "0.9rem",
    display: "inline-flex", alignItems: "center", gap: 3,
};
const postBtn = {
    padding: "8px 20px", background: "#007bff", color: "#fff",
    border: "none", borderRadius: 5, cursor: "pointer", fontWeight: "bold",
};
const postBtnSmall = {
    padding: "6px 14px", background: "#007bff", color: "#fff",
    border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem",
};
