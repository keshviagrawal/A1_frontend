import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { setAuth, getToken, getRole } from "../utils/auth";
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (token && role) {
      navigate(`/${role}`);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      return setError("Email is required");
    }

    if (!password) {
      return setError("Password is required");
    }

    try {
      const data = await loginUser(email, password);

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

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button type="submit">Login</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        New participant? <Link to="/signup">Register</Link>
      </p>
    </div>
  );
}