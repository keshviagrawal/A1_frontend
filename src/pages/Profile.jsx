/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

// Import from existing service
import { getAllOrganizers, updateProfile, getProfile } from "../services/participantService";
import api from "../services/api";

const INTEREST_OPTIONS = [
  "Technology", "Sports", "Music", "Art", "Literature",
  "Science", "Business", "Gaming", "Photography", "Dance",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [allOrganizers, setAllOrganizers] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saveMsg, setSaveMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [contactError, setContactError] = useState("");

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [collegeOrOrgName, setCollegeOrOrgName] = useState("");
  const [interests, setInterests] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);

  // Non-editable fields
  const [email, setEmail] = useState("");
  const [participantType, setParticipantType] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profile, organizers] = await Promise.all([
        getProfile(),
        getAllOrganizers()
      ]);

      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setContactNumber(profile.contactNumber || "");
      setCollegeOrOrgName(profile.collegeOrOrgName || "");
      setInterests(profile.interests || []);
      setFollowedOrganizers(profile.followedOrganizers || []);
      setEmail(profile.email || "");
      setParticipantType(profile.participantType || "");
      setAllOrganizers(organizers);
    } catch (err) {
      alert("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveMsg(null);
    setContactError("");

    // Validate contact number
    if (contactNumber && !/^\d{10}$/.test(contactNumber)) {
      setContactError("Contact number must be exactly 10 digits");
      return;
    }

    try {
      await updateProfile({
        firstName,
        lastName,
        contactNumber,
        collegeOrOrgName,
        interests,
        followedOrganizers
      });
      setSaveMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: "Failed to update profile" });
    }
  };

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest)
      ? prev.filter(i => i !== interest)
      : [...prev, interest]);
  };

  const toggleOrganizer = (orgId) => {
    setFollowedOrganizers(prev => prev.includes(orgId)
      ? prev.filter(id => id !== orgId)
      : [...prev, orgId]);
  };

  const handleChangePassword = async () => {
    setPwMsg(null);

    if (!currentPassword || !newPassword) {
      setPwMsg({ type: "error", text: "Both fields are required" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }

    try {
      await api.put("/participants/change-password", {
        currentPassword,
        newPassword,
      });

      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update password";
      setPwMsg({ type: "error", text: msg });
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <Layout>
      <h2>My Profile</h2>

      <div style={{ marginBottom: 16, padding: "12px 16px", background: "#f8f9fa", borderRadius: 8 }}>
        <p style={{ margin: "4px 0" }}><strong>Email:</strong> {email}</p>
        <p style={{ margin: "4px 0" }}><strong>Participant Type:</strong> {participantType}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>First Name: </label>
        <input value={firstName} onChange={e => setFirstName(e.target.value)} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Last Name: </label>
        <input value={lastName} onChange={e => setLastName(e.target.value)} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Contact: </label>
        <input
          value={contactNumber}
          onChange={e => { setContactNumber(e.target.value); setContactError(""); }}
          placeholder="10-digit phone number"
          maxLength={10}
        />
        {contactError && <p style={{ color: "red", fontSize: "0.85rem", margin: "4px 0 0" }}>{contactError}</p>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>College / Organization: </label>
        <input value={collegeOrOrgName} onChange={e => setCollegeOrOrgName(e.target.value)} />
      </div>

      <hr />
      <h3>Interests</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {INTEREST_OPTIONS.map(interest => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            style={{
              padding: '5px 10px',
              background: interests.includes(interest) ? '#007bff' : '#eee',
              color: interests.includes(interest) ? 'white' : 'black',
              border: 'none', borderRadius: 5, cursor: 'pointer'
            }}
          >
            {interest}
          </button>
        ))}
      </div>

      <hr />
      <h3>Following</h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {allOrganizers.map(org => (
          <button
            key={org._id}
            onClick={() => toggleOrganizer(org._id)}
            style={{
              padding: '5px 10px',
              background: followedOrganizers.includes(org._id) ? '#007bff' : '#eee',
              color: followedOrganizers.includes(org._id) ? 'white' : 'black',
              border: 'none', borderRadius: 5, cursor: 'pointer'
            }}
          >
            {org.organizerName}
          </button>
        ))}
      </div>

      <hr />
      <button onClick={handleSave} style={{
        padding: '10px 20px', background: 'green', color: 'white', border: 'none', borderRadius: 5, marginTop: 20, cursor: 'pointer'
      }}>
        Save Changes
      </button>
      {saveMsg && (
        <p style={{ color: saveMsg.type === "success" ? "green" : "red", marginTop: 8 }}>{saveMsg.text}</p>
      )}

      <h3>Change Password</h3>

      <input
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />

      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <button onClick={handleChangePassword} style={{
        padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', marginTop: 10
      }}>
        Update Password
      </button>
      {pwMsg && (
        <p style={{ color: pwMsg.type === "success" ? "green" : "red", marginTop: 8 }}>{pwMsg.text}</p>
      )}
    </Layout>



  );
}
