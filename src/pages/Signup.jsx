import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [participantType, setParticipantType] = useState("NON-IIIT");
  const [collegeOrOrgName, setCollegeOrOrgName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (!email || !firstName || !lastName || !collegeOrOrgName || !contactNumber) {
      return setError("All fields are required");
    }

    // Validate contact number (10 digits)
    if (!/^\d{10}$/.test(contactNumber)) {
      return setError("Contact number must be 10 digits");
    }

    // IIIT email validation
    if (participantType === "IIIT" && !email.endsWith("@iiit.ac.in")) {
      return setError("IIIT participants must use @iiit.ac.in email");
    }

    // Non-IIIT password validation
    if (participantType === "NON-IIIT") {
      if (!password || !confirmPassword) {
        return setError("Password is required for Non-IIIT participants");
      }
      if (password.length < 6) {
        return setError("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        return setError("Passwords do not match");
      }
    }

    try {
      await registerUser({
        email,
        password: participantType === "IIIT" ? undefined : password,
        firstName,
        lastName,
        participantType,
        collegeOrOrgName,
        contactNumber,
      });

      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Participant Signup</h2>

      <form onSubmit={handleSignup}>
        <input
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Contact Number (10 digits)"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          maxLength={10}
        />
        <br /><br />

        <select
          value={participantType}
          onChange={(e) => setParticipantType(e.target.value)}
          style={{ padding: "8px", width: "200px" }}
        >
          <option value="NON-IIIT">Non-IIIT</option>
          <option value="IIIT">IIIT Student</option>
        </select>
        <br /><br />

        {/* Only show password fields for Non-IIIT */}
        {participantType === "NON-IIIT" && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <br /><br />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <br /><br />
          </>
        )}

        <input
          placeholder="College / Organization Name"
          value={collegeOrOrgName}
          onChange={(e) => setCollegeOrOrgName(e.target.value)}
        />
        <br /><br />

        <button type="submit">Register</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}