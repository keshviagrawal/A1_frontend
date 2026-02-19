import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  return (
    <Layout>
      <h2>Admin Dashboard</h2>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={cardStyle} onClick={() => window.location.href = '/admin/organizers'}>
          <h3>Manage Organizers</h3>
          <p>View, Add, Disable Organizers</p>
        </div>
        {/* Future: Manage Events, View Reports */}
      </div>
    </Layout>
  );
}

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '20px',
  width: '250px',
  cursor: 'pointer',
  background: '#f8f9fa',
  textAlign: 'center'
};