import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { createEvent } from "../services/organizerService";
import FormBuilder from "../components/FormBuilder";

export default function CreateEvent() {
    const navigate = useNavigate();

    // Basic event fields
    const [eventName, setEventName] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("NORMAL");
    const [eligibility, setEligibility] = useState("ALL");
    const [registrationDeadline, setRegistrationDeadline] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [registrationLimit, setRegistrationLimit] = useState("");
    const [registrationFee, setRegistrationFee] = useState("");
    const [tags, setTags] = useState("");

    // Custom Form
    const [customForm, setCustomForm] = useState([]);

    // Merchandise fields
    const [itemName, setItemName] = useState("");
    const [price, setPrice] = useState("");
    const [sizes, setSizes] = useState("S,M,L,XL");
    const [colors, setColors] = useState("Black,White");
    const [totalStock, setTotalStock] = useState("");
    const [purchaseLimit, setPurchaseLimit] = useState("2");

    const handleCreate = async () => {
        try {
            const eventData = {
                eventName,
                description,
                eventType,
                eligibility,
                registrationDeadline,
                eventStartDate,
                eventEndDate,
                registrationLimit: parseInt(registrationLimit),
                registrationFee: eventType === "NORMAL" ? parseFloat(registrationFee) : parseFloat(price),
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                customForm: customForm, // Include custom form
            };

            // Add merchandise details if MERCHANDISE type
            if (eventType === "MERCHANDISE") {
                const sizeArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
                const colorArray = colors.split(",").map((c) => c.trim()).filter(Boolean);

                // Generate variants with stock
                const stockPerVariant = Math.floor(parseInt(totalStock) / (sizeArray.length * colorArray.length));
                const variants = [];
                for (const size of sizeArray) {
                    for (const color of colorArray) {
                        variants.push({ size, color, stock: stockPerVariant });
                    }
                }

                eventData.merchandiseDetails = {
                    itemName,
                    price: parseFloat(price),
                    sizes: sizeArray,
                    colors: colorArray,
                    variants,
                    totalStock: parseInt(totalStock),
                    purchaseLimitPerParticipant: parseInt(purchaseLimit),
                };
            }

            await createEvent(eventData);
            alert("Event created successfully!");
            navigate("/organizer/dashboard");
        } catch (err) {
            alert("Failed to create event: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2>Create New Event</h2>

                <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    style={selectStyle}
                >
                    <option value="NORMAL">Normal Event</option>
                    <option value="MERCHANDISE">Merchandise Event</option>
                </select>
                <br /><br />

                <input
                    placeholder="Event Name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    style={inputStyle}
                />

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ ...inputStyle, height: 80 }}
                />

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Eligibility:</label>
                        <select
                            value={eligibility}
                            onChange={(e) => setEligibility(e.target.value)}
                            style={{ ...selectStyle, width: '100%' }}
                        >
                            <option value="ALL">All Participants</option>
                            <option value="IIIT">IIIT Only</option>
                            <option value="NON-IIIT">Non-IIIT Only</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Reg. Limit:</label>
                        <input
                            placeholder="Limit"
                            type="number"
                            value={registrationLimit}
                            onChange={(e) => setRegistrationLimit(e.target.value)}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label>Starts:</label>
                        <input
                            type="datetime-local"
                            value={eventStartDate}
                            onChange={(e) => setEventStartDate(e.target.value)}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label>Ends:</label>
                        <input
                            type="datetime-local"
                            value={eventEndDate}
                            onChange={(e) => setEventEndDate(e.target.value)}
                            style={{ ...inputStyle, width: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <label>Deadline:</label>
                    <input
                        type="datetime-local"
                        value={registrationDeadline}
                        onChange={(e) => setRegistrationDeadline(e.target.value)}
                        style={{ ...inputStyle, width: '100%' }}
                    />
                </div>

                {/* Normal Event: Registration Fee */}
                {eventType === "NORMAL" && (
                    <div style={{ marginTop: '10px' }}>
                        <input
                            placeholder="Registration Fee (₹)"
                            type="number"
                            value={registrationFee}
                            onChange={(e) => setRegistrationFee(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                )}

                <input
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    style={{ ...inputStyle, marginTop: '10px' }}
                />

                {/* Form Builder */}
                {eventType === "NORMAL" && (
                    <FormBuilder formFields={customForm} setFormFields={setCustomForm} locked={false} />
                )}

                {/* Merchandise Event: Additional Fields */}
                {eventType === "MERCHANDISE" && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                        <h4>Merchandise Details</h4>

                        <input
                            placeholder="Item Name (e.g., Club T-Shirt)"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            style={inputStyle}
                        />

                        <input
                            placeholder="Price per item (₹)"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={inputStyle}
                        />

                        <input
                            placeholder="Sizes (e.g., S,M,L)"
                            value={sizes}
                            onChange={(e) => setSizes(e.target.value)}
                            style={inputStyle}
                        />

                        <input
                            placeholder="Colors (e.g., Black,White)"
                            value={colors}
                            onChange={(e) => setColors(e.target.value)}
                            style={inputStyle}
                        />

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <input
                                placeholder="Total Stock"
                                type="number"
                                value={totalStock}
                                onChange={(e) => setTotalStock(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Purchase Limit"
                                type="number"
                                value={purchaseLimit}
                                onChange={(e) => setPurchaseLimit(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '30px', marginBottom: '50px' }}>
                    <button onClick={handleCreate} style={btnStyle}>
                        Create Event
                    </button>
                    <button onClick={() => navigate("/organizer/dashboard")} style={{ ...btnStyle, background: "#6c757d", marginLeft: "10px" }}>
                        Cancel
                    </button>
                </div>
            </div>
        </Layout>
    );
}

const inputStyle = {
    padding: "10px",
    width: "100%",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    boxSizing: "border-box"
};

const selectStyle = {
    padding: "10px",
    width: "100%",
    marginBottom: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc"
};

const btnStyle = {
    padding: "12px 24px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: "bold"
};
