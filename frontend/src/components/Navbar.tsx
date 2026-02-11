import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useWindowSize } from "../hooks/useWindowSize";
import { useAvatar } from "../hooks/useAvatar";
import CreatePostModal from "./CreatePostModal";
import ProjectModal from "./ProjectModal";
import NotificationDropdown from "./NotificationDropdown";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  Search01Icon,
  Mail01Icon,
  Rocket01Icon,
  UserIcon,
  Notification01Icon,
  Add01Icon,
  Logout01Icon,
  MoreHorizontalIcon,
  Login01Icon,
  // faEllipsisH,
  // faSignOutAlt,
  // faPlus,
  // faBell
} from '@hugeicons/core-free-icons';
import logo from "../assets/icon-removebg.png";
import VerifiedBadge from "./VerifiedBadge";

export default function Navbar() {
  const { isSignedIn, user } = useClerkUser();
  const { signOut } = useClerkAuth();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width < 768; // Mobile breakpoint

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Use the centralized avatar hook
  const { avatarUrl: userAvatarUrl } = useAvatar(
    user?.id,
    user?.imageUrl,
    user?.fullName || user?.username || "User"
  );

  const logoutRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setIsLogoutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Styles
  const linkStyle = (path: string) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "12px",
    textDecoration: "none",
    color: location.pathname === path ? "#10633b" : "#10633b",
    backgroundColor: location.pathname === path ? "#f0f0f0" : "transparent",
    fontWeight: location.pathname === path ? 700 : 500,
    fontSize: "16px",
    transition: "all 0.2s ease",
    marginBottom: "4px"
  });

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 32px 20px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "2px", textDecoration: "none" }}>
          <img src={logo} alt="SeedLab" style={{ height: "60px", width: "auto" }} />
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#10633b", letterSpacing: "-0.5px" }}>
            SeedLab
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <Link to="/" style={linkStyle("/")}>
          <HugeiconsIcon icon={Home01Icon} style={{ width: "20px" }} />
          Feed
        </Link>
        <Link to="/search" style={linkStyle("/search")}>
          <HugeiconsIcon icon={Search01Icon} style={{ width: "20px" }} />
          Search
        </Link>
        {isSignedIn && (
          <>
            <Link to="/messages" style={linkStyle("/messages")}>
              <HugeiconsIcon icon={Mail01Icon} style={{ width: "20px" }} />
              Chat
            </Link>

            {/* Notification Item */}
            <NotificationDropdown
              align="right"
              renderTrigger={(toggleOpen, unreadCount, isOpen) => (
                <div
                  onClick={toggleOpen}
                  style={{
                    ...linkStyle(""),
                    cursor: "pointer",
                    color: isOpen ? "#10633b" : "#10633b",
                    backgroundColor: isOpen ? "#f0f0f0" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <HugeiconsIcon icon={Notification01Icon} style={{ width: "20px" }} />
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        backgroundColor: "#dc2626",
                        color: "#fff",
                        borderRadius: "50%",
                        width: "14px",
                        height: "14px",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        border: "2px solid #fff"
                      }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  Notifications
                </div>
              )}
            />

            <div
              onClick={() => setIsModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer", color: "#10633b" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <HugeiconsIcon icon={Add01Icon} style={{ width: "20px" }} />
              Create Post
            </div>

            <div
              onClick={() => setIsProjectModalOpen(true)}
              style={{ ...linkStyle(""), cursor: "pointer", color: "#10633b" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <HugeiconsIcon icon={Rocket01Icon} style={{ width: "20px" }} />
              Launch Product
            </div>

            <Link to="/profile" style={linkStyle("/profile")}>
              <HugeiconsIcon icon={UserIcon} style={{ width: "20px" }} />
              Profile
            </Link>
          </>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>

      {/* FoundrList Badge */}
      {/* <div style={{ padding: "0 20px 20px 20px", display: "flex", justifyContent: "center" }}>
        <a href="https://www.foundrlist.com/product/codeown" target="_blank" rel="noopener noreferrer">
          <img
            src="https://www.foundrlist.com/api/badge/codeown"
            alt="Codeown - Live on FoundrList"
            width="240"
            height="96"
            style={{ width: "100%", height: "auto", borderRadius: "12px", display: "block" }}
          />
        </a>
      </div> */}

      {/* Footer Links & Profile */}
      <div style={{ padding: "0 20px 20px 20px" }}>
        {/* Footer Links */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", fontSize: "11px", color: "#94a3b8", marginBottom: "20px", padding: "0 4px" }}>
          <Link to="/privacy" style={{ color: "#94a3b8", textDecoration: "none" }}>Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms" style={{ color: "#94a3b8", textDecoration: "none" }}>Terms</Link>
          <span>•</span>
          <Link to="/about" style={{ color: "#94a3b8", textDecoration: "none" }}>About Us</Link>
        </div>

        {/* Profile Card */}
        {isSignedIn && user ? (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px",
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              position: "relative",
              boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
            }}>
              <img
                src={userAvatarUrl || user.imageUrl}
                alt="Profile"
                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center" }}>
                  {user.fullName || user.username}
                  <VerifiedBadge username={user.username} size="14px" />
                </div>
                <div style={{ color: "#64748b", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  @{user.username}
                </div>
              </div>

              {/* 3 Dots Menu */}
              <div ref={logoutRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setIsLogoutOpen(!isLogoutOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "8px" }}
                >
                  <HugeiconsIcon icon={MoreHorizontalIcon} />
                </button>

                {isLogoutOpen && (
                  <div style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "8px",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    padding: "6px",
                    minWidth: "140px",
                    zIndex: 100
                  }}>
                    <button
                      onClick={() => signOut()}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        width: "100%", padding: "10px",
                        background: "none", border: "none",
                        color: "#ef4444", fontWeight: 600, fontSize: "14px",
                        cursor: "pointer", borderRadius: "8px",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <HugeiconsIcon icon={Logout01Icon} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: "12px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
              © 2026 SeedLab.
            </div>
          </>
        ) : (
          <Link to="/sign-in" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#10633b",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}>
              <HugeiconsIcon icon={Login01Icon} />
              Sign In
            </button>
          </Link>
        )}
      </div>
    </div>
  );

  // Desktop Render
  if (!isMobile) {
    return (
      <>
        <div style={{
          width: "280px",
          height: "100vh",
          position: "sticky",
          top: 0,
          borderRight: "1px solid #e2e8f0",
          backgroundColor: "#fff",
          zIndex: 50
        }}>
          <SidebarContent />
        </div>

        {/* Modals */}
        <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
        <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => window.dispatchEvent(new CustomEvent("projectCreated"))} />
      </>
    );
  }

  // Mobile Render
  return (
    <>
      {/* Mobile Top Header */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 2000,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <img src={logo} alt="SeedLab" style={{ height: "32px", width: "auto" }} />
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.5px" }}>
            SeedLab
          </span>
        </Link>
        {/* <a href="https://www.foundrlist.com/product/codeown" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://www.foundrlist.com/api/badge/codeown"
            alt="Codeown - Live on FoundrList"
            width="240"
            height="96"
            style={{ height: "36px", width: "auto", borderRadius: "8px" }}
          />
        </a> */}
      </div>

      {/* Spacer for Top Header */}
      <div style={{ height: "64px" }} />

      {/* Mobile Bottom Tab Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        padding: "12px 10px 24px 10px",
        zIndex: 2000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box"
      }}>
        <Link to="/" style={{ color: location.pathname === "/" ? "#212121" : "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", flex: 1 }}>
          <HugeiconsIcon icon={Home01Icon} style={{ fontSize: "20px" }} />
        </Link>

        <Link to="/search" style={{ color: location.pathname === "/search" ? "#212121" : "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", flex: 1 }}>
          <HugeiconsIcon icon={Search01Icon} style={{ fontSize: "20px" }} />
        </Link>

        <Link to="/messages" style={{ color: location.pathname === "/messages" ? "#212121" : "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", flex: 1 }}>
          <HugeiconsIcon icon={Mail01Icon} style={{ fontSize: "20px" }} />
        </Link>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
          <div onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)} style={{
            color: isCreateMenuOpen ? "#212121" : "#94a3b8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            cursor: "pointer",
            transition: "all 0.2s"
          }}>
            <HugeiconsIcon
              icon={Add01Icon}
              style={{
                fontSize: "20px",
                transform: isCreateMenuOpen ? "rotate(45deg)" : "rotate(0deg)",
                transition: "transform 0.2s"
              }}
            />
          </div>

          {/* Create Menu - Absolute positioned above button */}
          {isCreateMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "60px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "160px",
              zIndex: 2001
            }}>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: "pointer", color: "#1e293b", fontWeight: 600, fontSize: "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0f0f0", color: "#212121", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HugeiconsIcon icon={Add01Icon} />
                </div>
                Create Post
              </div>
              <div
                onClick={() => { setIsCreateMenuOpen(false); setIsProjectModalOpen(true); }}
                style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px", borderRadius: "8px", cursor: "pointer", color: "#1e293b", fontWeight: 600, fontSize: "14px" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f0f0f0", color: "#212121", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HugeiconsIcon icon={Rocket01Icon} />
                </div>
                Launch Product
              </div>
            </div>
          )}

        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <NotificationDropdown
            align="bottom"
            renderTrigger={(toggleOpen, unreadCount, isOpen) => (
              <div onClick={toggleOpen} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: isOpen ? "#212121" : "#94a3b8" }}>
                <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "20px" }} />
                {unreadCount > 0 && (
                  <span style={{ position: "absolute", top: "-2px", right: "-2px", width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
                )}
              </div>
            )}
          />
        </div>

        <Link to="/profile" style={{ color: location.pathname === "/profile" ? "#212121" : "#94a3b8", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", flex: 1 }}>
          {userAvatarUrl ? (
            <img src={userAvatarUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "50%", border: location.pathname === "/profile" ? "2px solid #212121" : "none", objectFit: "cover" }} />
          ) : (
            <HugeiconsIcon icon={UserIcon} style={{ fontSize: "20px" }} />
          )}
        </Link>
      </div>

      <CreatePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => window.dispatchEvent(new CustomEvent("postCreated"))} />
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => window.dispatchEvent(new CustomEvent("projectCreated"))} />


    </>
  );
}
