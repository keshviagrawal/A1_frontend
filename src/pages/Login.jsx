import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { setAuth, getToken, getRole } from "../utils/auth";
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isIIIT, setIsIIIT] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (token && role) {
      navigate(`/${role}`);
    }
  }, []);

  // Auto-detect IIIT email
  useEffect(() => {
    setIsIIIT(email.endsWith("@iiit.ac.in"));
  }, [email]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      return setError("Email is required");
    }

    if (!isIIIT && !password) {
      return setError("Password is required");
    }

    try {
      const data = await loginUser(email, isIIIT ? undefined : password);

      setAuth(data.token, data.role);

      // Check if participant needs onboarding
      if (data.role === "participant" && !data.onboardingCompleted) {
        navigate("/onboarding");
      } else {
        navigate(`/${data.role}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        {/* Show password field only for non-IIIT users */}
        {!isIIIT && (
          <>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <br /><br />
          </>
        )}

        {isIIIT && (
          <p style={{ color: "green", margin: "0 0 15px 0" }}>
            ✓ IIIT email detected - No password required
          </p>
        )}

        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        New participant? <Link to="/signup">Register</Link>
      </p>
    </div>
  );
}

// the frontend thing starts from here (login page) finally receive the full address, then send {token ,role} stored in local storage and navigate to the correct role