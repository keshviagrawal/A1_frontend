import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div style={{ padding: 30 }}>{children}</div>
    </div>
  );
}