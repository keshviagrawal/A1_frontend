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

    if (!email || !firstName || !lastName || !collegeOrOrgName || !contactNumber) {
      return setError("All fields are required");
    }
    if (!/^\d{10}$/.test(contactNumber)) {
      return setError("Contact number must be 10 digits");
    }

    const iiitDomains = ["@iiit.ac.in", "@students.iiit.ac.in", "@research.iiit.ac.in"];
    if (participantType === "IIIT") {
      const isValidIIIT = iiitDomains.some(domain => email.endsWith(domain));
      if (!isValidIIIT) {
        return setError("IIIT participants must use @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in email");
      }
    }

    if (participantType === "NON-IIIT" && collegeOrOrgName.trim().toLowerCase() === "iiit hyderabad") {
      return setError("You have selected Non-IIIT but entered IIIT Hyderabad as your college. Please select IIIT Student if you are an IIIT student.");
    }

    if (!password || !confirmPassword) return setError("Password is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");

    try {
      await registerUser({ email, password, firstName, lastName, participantType, collegeOrOrgName, contactNumber });
      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Felicity and explore events</p>

        <form onSubmit={handleSignup}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input placeholder="10 digit number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} maxLength={10} />
          </div>

          <div className="form-group">
            <label>Participant Type</label>
            <select
              value={participantType}
              onChange={(e) => {
                setParticipantType(e.target.value);
                if (e.target.value === "IIIT") setCollegeOrOrgName("IIIT Hyderabad");
                else setCollegeOrOrgName("");
              }}
            >
              <option value="NON-IIIT">Non-IIIT</option>
              <option value="IIIT">IIIT Student</option>
            </select>
          </div>

          <div className="form-group">
            <label>College / Organization</label>
            <input
              placeholder="Your college or organization"
              value={collegeOrOrgName}
              onChange={(e) => setCollegeOrOrgName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">Create Account</button>
        </form>

        {error && <p className="error-text mt-sm">{error}</p>}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}