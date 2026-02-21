import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import Layout from "../components/Layout";
import api from "../services/api";

export default function QRScanner() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualTicket, setManualTicket] = useState("");
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        setScanResult(null);
        const html5Qrcode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5Qrcode;

        try {
            await html5Qrcode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess,
                () => { } // ignore scan errors (no QR in frame)
            );
            setScanning(true);
        } catch (err) {
            console.error("Camera error:", err);
            setScanResult({
                type: "error",
                message: "Could not access camera. Try file upload instead.",
            });
        }
    };

    const stopScanner = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop();
                html5QrcodeRef.current.clear();
            } catch (e) {
                // ignore
            }
            html5QrcodeRef.current = null;
        }
        setScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        // Pause scanner while processing
        await stopScanner();
        await processScan(decodedText);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanResult(null);
        const html5Qrcode = new Html5Qrcode("qr-reader-file");

        try {
            const result = await html5Qrcode.scanFile(file, true);
            await processScan(result);
        } catch (err) {
            setScanResult({
                type: "error",
                message: "Could not read QR code from this image.",
            });
        }
    };

    const processScan = async (qrData) => {
        try {
            const res = await api.post(`/events/${eventId}/attendance/scan`, { qrData });
            const entry = {
                type: "success",
                message: res.data.message,
                participant: res.data.participant,
                ticketId: res.data.ticketId,
                time: new Date().toLocaleTimeString(),
            };
            setScanResult(entry);
            setScanHistory(prev => [entry, ...prev]);
        } catch (err) {
            const data = err.response?.data;
            const entry = {
                type: data?.duplicate ? "duplicate" : "error",
                message: data?.message || "Scan failed",
                participant: data?.participant,
                time: new Date().toLocaleTimeString(),
            };
            setScanResult(entry);
            setScanHistory(prev => [entry, ...prev]);
        }
    };

    const handleManualEntry = async () => {
        if (!manualTicket.trim()) return;
        try {
            const res = await api.post("/events/attendance/mark", { ticketId: manualTicket.trim() });
            const entry = {
                type: "success",
                message: res.data.message,
                participant: res.data.participant,
                ticketId: manualTicket.trim(),
                time: new Date().toLocaleTimeString(),
            };
            setScanResult(entry);
            setScanHistory(prev => [entry, ...prev]);
            setManualTicket("");
        } catch (err) {
            const data = err.response?.data;
            setScanResult({
                type: data?.duplicate ? "duplicate" : "error",
                message: data?.message || "Failed",
                participant: data?.participant,
                time: new Date().toLocaleTimeString(),
            });
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>🔍 QR Scanner</h2>
                    <button
                        onClick={() => navigate(`/organizer/event/${eventId}`)}
                        style={linkBtnStyle}
                    >
                        ← Back to Event
                    </button>
                </div>

                {/* Scanner Controls */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                    {!scanning ? (
                        <button onClick={startScanner} style={{ ...btnStyle, background: "#28a745" }}>
                            📷 Start Camera
                        </button>
                    ) : (
                        <button onClick={stopScanner} style={{ ...btnStyle, background: "#dc3545" }}>
                            ⏹ Stop Camera
                        </button>
                    )}
                </div>

                {/* Camera View */}
                <div
                    id="qr-reader"
                    ref={scannerRef}
                    style={{
                        width: "100%",
                        minHeight: scanning ? 300 : 0,
                        borderRadius: 8,
                        overflow: "hidden",
                        marginBottom: 16,
                    }}
                />

                {/* File Upload */}
                <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>
                        📁 Or upload QR image:
                    </label>
                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                    <div id="qr-reader-file" style={{ display: "none" }} />
                </div>

                {/* Manual Ticket Entry */}
                <div style={{ background: "#f8f9fa", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <label style={{ fontWeight: "bold", display: "block", marginBottom: 8 }}>
                        ⌨️ Manual Ticket Entry:
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            placeholder="Enter Ticket ID"
                            value={manualTicket}
                            onChange={(e) => setManualTicket(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleManualEntry()}
                            style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <button onClick={handleManualEntry} style={btnStyle}>
                            Mark
                        </button>
                    </div>
                </div>

                {/* Scan Result */}
                {scanResult && (
                    <div style={resultStyle(scanResult.type)}>
                        <strong style={{ fontSize: "1.1rem" }}>
                            {scanResult.type === "success" ? "✅ " : scanResult.type === "duplicate" ? "⚠️ " : "❌ "}
                            {scanResult.message}
                        </strong>
                        {scanResult.participant && (
                            <p style={{ margin: "8px 0 0" }}>
                                <strong>{scanResult.participant.name}</strong>
                                {scanResult.participant.email && ` — ${scanResult.participant.email}`}
                            </p>
                        )}
                        {scanResult.type !== "error" && scanning === false && (
                            <button
                                onClick={startScanner}
                                style={{ ...btnStyle, marginTop: 10, background: "#28a745" }}
                            >
                                Scan Next
                            </button>
                        )}
                    </div>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <h4>Scan History ({scanHistory.length})</h4>
                        <div style={{ maxHeight: 300, overflow: "auto" }}>
                            {scanHistory.map((entry, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: "8px 12px",
                                        borderLeft: `4px solid ${entry.type === "success" ? "#28a745" : entry.type === "duplicate" ? "#ffc107" : "#dc3545"}`,
                                        background: "#f8f9fa",
                                        marginBottom: 6,
                                        borderRadius: "0 4px 4px 0",
                                    }}
                                >
                                    <span style={{ fontSize: "0.85rem", color: "#888" }}>{entry.time}</span>
                                    {" — "}
                                    <strong>{entry.participant?.name || entry.ticketId || "Unknown"}</strong>
                                    {" — "}
                                    <span style={{ color: entry.type === "success" ? "green" : entry.type === "duplicate" ? "#e67e22" : "red" }}>
                                        {entry.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

const btnStyle = {
    padding: "10px 18px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.95rem",
};

const linkBtnStyle = {
    padding: "8px 14px",
    background: "transparent",
    color: "#007bff",
    border: "1px solid #007bff",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "bold",
};

const resultStyle = (type) => ({
    padding: 16,
    borderRadius: 8,
    border: `2px solid ${type === "success" ? "#28a745" : type === "duplicate" ? "#ffc107" : "#dc3545"}`,
    background: type === "success" ? "#d4edda" : type === "duplicate" ? "#fff3cd" : "#f8d7da",
    marginBottom: 16,
});
