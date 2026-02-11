import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";

interface NotificationDropdownProps {
  align?: "right" | "bottom";
  renderTrigger?: (onClick: () => void, unreadCount: number, isOpen: boolean) => React.ReactNode;
}

export default function NotificationDropdown(props: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { isSignedIn } = useClerkAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    if (notification.post_id) {
      navigate(`/post/${notification.post_id}`);
    } else if (notification.project_id) {
      navigate(`/project/${notification.project_id}`);
    } else if (notification.type === "message") {
      navigate(`/messages?userId=${notification.actor_id}`);
    } else if (notification.actor?.username) {
      navigate(`/${notification.actor.username}`);
    } else if (notification.actor_id) {
      navigate(`/user/${notification.actor_id}`);
    }
    setIsOpen(false);
  };

  const getNotificationMessage = (notification: Notification) => {
    const actorName = notification.actor?.name || "Someone";
    const username = notification.actor?.username;

    const nameWrapper = (
      <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
        {actorName}
        <VerifiedBadge username={username} size="14px" />
      </span>
    );

    switch (notification.type) {
      case "message":
        return <span>{nameWrapper} sent you a message</span>;
      case "like":
        return <span>{nameWrapper} {notification.project_id ? "liked your project" : "liked your post"}</span>;
      case "comment":
        return <span>{nameWrapper} {notification.project_id ? "commented on your project" : "commented on your post"}</span>;
      case "follow":
        return <span>{nameWrapper} started following you</span>;
      case "mention":
        return <span>{nameWrapper} mentioned you</span>;
      case "reply":
        return <span>{nameWrapper} replied to your comment</span>;
      case "save":
        return <span>{nameWrapper} saved your project</span>;
      default:
        return <span>New notification</span>;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {props.renderTrigger ? (
        props.renderTrigger(
          () => setIsOpen(!isOpen),
          unreadCount || 0,
          isOpen
        )
      ) : (
        isSignedIn && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              position: "relative",
              padding: "9px",
              backgroundColor: "#fff",
              border: "none",
              cursor: "pointer",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#212121",
            }}
          >
            <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "20px" }} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  backgroundColor: "#10633b",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )
      )}

      {isOpen && (
        <div
          style={{
            position: isMobile ? "fixed" : "absolute",
            top: isMobile ? "auto" : (props.align === "bottom" ? "calc(100% + 12px)" : "0"), // Mobile: auto top
            bottom: isMobile ? "90px" : "auto", // Mobile: above tab bar, Desktop: auto
            left: isMobile ? "10px" : (props.align === "right" ? "100%" : "0"), // Desktop Right: Pop to right
            right: isMobile ? "10px" : "auto", // Desktop: Auto width
            marginLeft: (!isMobile && props.align === "right") ? "12px" : "0",
            width: isMobile ? "auto" : "360px",
            maxHeight: isMobile ? "calc(100vh - 200px)" : "min(500px, 80vh)", // Responsive height
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
            border: "1px solid #e4e7eb",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "16px", borderBottom: "1px solid #e4e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  notifications.forEach(n => !n.read && markAsRead(n.id));
                }}
                style={{ background: "none", border: "none", color: "#212121", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
                <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "24px", marginBottom: "12px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "14px" }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    backgroundColor: notification.read ? "#fff" : "#f8fafc",
                    transition: "background-color 0.2s",
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? "#fff" : "#f8fafc"}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={notification.actor?.avatar_url || "https://via.placeholder.com/40"}
                      alt=""
                      style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                    />
                    {/* Icon Badge based on type */}
                    <div style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      backgroundColor: "#10633b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                      fontSize: "10px",
                      color: "#fff"
                    }}>
                      <HugeiconsIcon icon={Notification01Icon} style={{ fontSize: "10px" }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", color: "#1e293b", lineHeight: "1.4" }}>
                      {getNotificationMessage(notification)}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                      {formatRelativeDate(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10633b", marginTop: "6px" }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
