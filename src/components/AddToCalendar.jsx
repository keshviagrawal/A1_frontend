/**
 * AddToCalendar – export event to .ics / Google Calendar / Outlook
 * Props: event (object with eventName, eventStartDate, eventEndDate, description)
 */
export default function AddToCalendar({ event }) {
    if (!event || !event.eventStartDate) return null;

    const pad = (n) => String(n).padStart(2, "0");

    // Format date to ICS format: 20260215T103000Z
    const toICS = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };

    // Format date for Google Calendar: 20260215T103000Z
    const toGCal = (dateStr) => toICS(dateStr);

    const startDate = toICS(event.eventStartDate);
    const endDate = event.eventEndDate ? toICS(event.eventEndDate) : toICS(new Date(new Date(event.eventStartDate).getTime() + 2 * 60 * 60 * 1000)); // default 2 hours
    const title = event.eventName || "Event";
    const description = (event.description || "").replace(/\n/g, "\\n").slice(0, 500);
    const location = event.venue || "";

    // ===== .ics file download =====
    const handleDownloadICS = () => {
        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Felicity//Event//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            location ? `LOCATION:${location}` : "",
            `STATUS:CONFIRMED`,
            "END:VEVENT",
            "END:VCALENDAR",
        ].filter(Boolean).join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ===== Google Calendar link =====
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGCal(event.eventStartDate)}/${event.eventEndDate ? toGCal(event.eventEndDate) : toGCal(new Date(new Date(event.eventStartDate).getTime() + 2 * 60 * 60 * 1000))}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(location)}`;

    // ===== Outlook link =====
    const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${new Date(event.eventStartDate).toISOString()}&enddt=${(event.eventEndDate ? new Date(event.eventEndDate) : new Date(new Date(event.eventStartDate).getTime() + 2 * 60 * 60 * 1000)).toISOString()}&body=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(location)}`;

    return (
        <div style={containerStyle}>
            <span style={{ fontWeight: "bold", fontSize: "0.9rem", marginRight: 6 }}>🗓️ Add to Calendar:</span>
            <button onClick={handleDownloadICS} style={calBtn} title="Download .ics file">
                📥 .ics File
            </button>
            <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" style={calLink}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="" width={16} height={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                Google
            </a>
            <a href={outlookUrl} target="_blank" rel="noopener noreferrer" style={{ ...calLink, background: "#0078d4" }}>
                📧 Outlook
            </a>
        </div>
    );
}

const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    padding: "12px 16px",
    background: "#f0f7ff",
    borderRadius: 8,
    border: "1px solid #bee3f8",
    marginTop: 16,
};

const calBtn = {
    padding: "6px 12px",
    background: "#6c757d",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
};

const calLink = {
    padding: "6px 12px",
    background: "#4285f4",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
};
