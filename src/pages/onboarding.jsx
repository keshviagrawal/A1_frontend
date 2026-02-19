import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  saveOnboarding,
  skipOnboarding,
  getAllOrganizers,
} from "../services/participantService";

const INTEREST_OPTIONS = [
  "Technology",
  "Sports",
  "Music",
  "Art",
  "Literature",
  "Science",
  "Business",
  "Gaming",
  "Photography",
  "Dance",
];

export default function Onboarding() {
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const data = await getAllOrganizers();
      setOrganizers(data);
    } catch (err) {
      console.error("Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleOrganizer = (organizerId) => {
    setSelectedOrganizers((prev) =>
      prev.includes(organizerId)
        ? prev.filter((id) => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleSave = async () => {
    try {
      await saveOnboarding({
        interests,
        followedOrganizers: selectedOrganizers,
      });
      alert("Preferences saved!");
      navigate("/participant");
    } catch (err) {
      alert("Failed to save preferences");
    }
  };

  const handleSkip = async () => {
    try {
      await skipOnboarding();
      navigate("/participant");
    } catch (err) {
      alert("Failed to skip onboarding");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <h2>Welcome! Set Your Preferences</h2>
      <p>You can skip this and configure later from your Profile page.</p>

      <hr />

      <h3>1. Select Your Areas of Interest</h3>
      <div style={gridStyle}>
        {INTEREST_OPTIONS.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            style={
              interests.includes(interest) ? selectedBtnStyle : btnStyle
            }
          >
            {interest}
          </button>
        ))}
      </div>

      <hr />

      <h3>2. Follow Clubs / Organizers</h3>
      {organizers.length === 0 ? (
        <p>No organizers available yet.</p>
      ) : (
        <div style={gridStyle}>
          {organizers.map((org) => (
            <button
              key={org._id}
              onClick={() => toggleOrganizer(org._id)}
              style={
                selectedOrganizers.includes(org._id)
                  ? selectedBtnStyle
                  : btnStyle
              }
            >
              {org.organizerName} ({org.category})
            </button>
          ))}
        </div>
      )}

      <hr />

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave} style={saveBtnStyle}>
          Save Preferences
        </button>
        <button onClick={handleSkip} style={skipBtnStyle}>
          Skip for Now
        </button>
      </div>
    </Layout>
  );
}

const gridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 10,
};

const btnStyle = {
  padding: "10px 15px",
  border: "1px solid #ccc",
  borderRadius: 5,
  background: "#fff",
  cursor: "pointer",
};

const selectedBtnStyle = {
  padding: "10px 15px",
  border: "2px solid #007bff",
  borderRadius: 5,
  background: "#e7f1ff",
  cursor: "pointer",
};

const saveBtnStyle = {
  padding: "12px 24px",
  background: "#28a745",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  marginRight: 10,
};

const skipBtnStyle = {
  padding: "12px 24px",
  background: "#6c757d",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
};