import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown, message } from "antd";
import { PlusOutlined, LogoutOutlined, UserOutlined, LoginOutlined, CameraOutlined } from "@ant-design/icons";
import { useAuth } from "@/store/AuthContext";
import { getInitials } from "@/lib/utils";

export default function Navbar({ onNewPost }) {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [text, setText] = useState('https://ant.design/');

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      message.success("Logged out. See you soon! 👋");
      navigate("/");
    } catch {
      message.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  }

  const menuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: userProfile?.displayName || user?.displayName || "My Profile",
      onClick: () => navigate(`/profile/${user.uid}`),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: loggingOut ? "Logging out…" : "Log Out",
      onClick: handleLogout,
      danger: true,
    },
  ];

  const displayName = userProfile?.displayName || user?.displayName || "You";
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid oklch(91% 0 0)",
        boxShadow: "0 1px 12px oklch(0% 0 0 / 0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 1.25rem",
          height: 62,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "oklch(55% 0.18 265)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px oklch(55% 0.18 265 / 0.35)",
            }}
          >
            <CameraOutlined style={{ color: "#fff", fontSize: 16 }} />
          </span>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "oklch(16% 0 0)",
              letterSpacing: "-0.02em",
            }}
          >
            Dayfie
          </span>
        </Link>

        {/* Tagline — hidden on mobile */}
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "0.78rem",
            color: "oklch(58% 0 0)",
            fontStyle: "italic",
            display: "none",
          }}
          className="md-tagline"
        >
          daily selfie · daily story
        </span>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user ? (
            <>
              <button
                className="btn-primary"
                onClick={onNewPost}
                style={{ fontSize: "0.85rem", padding: "0.5rem 1.1rem" }}
              >
                <PlusOutlined />
                New Post
              </button>
              <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={["click"]}>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => navigate(`/profile/${user.uid}`)}
                >
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid oklch(91% 0 0)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "oklch(96% 0.04 265)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Poppins, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        color: "oklch(55% 0.18 265)",
                        border: "2px solid oklch(91% 0 0)",
                      }}
                    >
                      {getInitials(displayName)}
                    </div>
                  )}
                </button>
              </Dropdown>
            </>
          ) : (
            <button
              className="btn-primary"
              onClick={() => navigate("/login")}
              style={{ fontSize: "0.85rem", padding: "0.5rem 1.1rem" }}
            >
              <LoginOutlined />
              Sign In
            </button>
          )}
        </div>
        
      </div>
    </header>
  );
}
