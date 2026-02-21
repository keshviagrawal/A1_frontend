import { useNavigate } from "react-router-dom";
import { logout, getRole } from "../utils/auth"; // Ensure getRole is imported

export default function Navbar() {
  const navigate = useNavigate();
  const role = getRole(); // "participant", "organizer", or "admin"

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.navbar}>
      <h3 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        Event Management
      </h3>

      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>

        {/* ONLY participants need a profile page */}
        {/* Participant Navigation */}

        {role === "participant" && (
          <>
            <button
              onClick={() => navigate("/participant")}
              style={styles.navBtn}
            >
              Dashboard
            </button>

            <button
              onClick={() => navigate("/browse")}
              style={styles.navBtn}
            >
              Browse Events
            </button>

            <button
              onClick={() => navigate("/clubs")}
              style={styles.navBtn}
            >
              Clubs / Organizers
            </button>

            <button
              onClick={() => navigate("/profile")}
              style={styles.navBtn}
            >
              My Profile
            </button>
          </>
        )}

        {/* Show Dashboard based on role */}
        {role === "organizer" && (
          <>
            <button
              onClick={() => navigate("/organizer")}
              style={styles.navBtn}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/organizer/create")}
              style={styles.navBtn}
            >
              Create Event
            </button>
            {/* Ongoing Events - linking to dashboard for now, could be filtered */}
            <button
              onClick={() => navigate("/organizer")}
              style={styles.navBtn}
            >
              Ongoing Events
            </button>
            <button
              onClick={() => navigate("/organizer/profile")}
              style={styles.navBtn}
            >
              Profile
            </button>
          </>
        )}

        {/* Admin Navigation */}
        {role === "admin" && (
          <>
            <button onClick={() => navigate("/admin")} style={styles.navBtn}>Dashboard</button>
            <button onClick={() => navigate("/admin/organizers")} style={styles.navBtn}>Manage Organizers</button>
            <button onClick={() => navigate("/admin/organizers?tab=resets")} style={styles.navBtn}>Password Resets</button>
          </>
        )}
      </div>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Logout
      </button>
    </div>
  );
}


const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#1e293b",
    color: "white",
  },
  navBtn: {
    padding: "8px 16px",
    cursor: "pointer",
    background: "transparent",
    color: "white",
    border: "1px solid white",
    borderRadius: "4px",
  },
  logoutBtn: {
    padding: "8px 16px",
    cursor: "pointer",
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
  },
};
