import { useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faComment } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "@clerk/clerk-react";
import { useWindowSize } from "../hooks/useWindowSize";
import { HugeiconsIcon } from '@hugeicons/react';
import { CommentAdd02Icon } from "@hugeicons/core-free-icons";


export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const reset = () => {
    setFullName(user?.fullName || "");
    setEmail(user?.primaryEmailAddress?.emailAddress || "");
    setUsername(user?.username || "");
    setMessage("");
    setSent(false);
    setError("");
  };


  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!trimmedMessage) {
      setError("Message is required.");
      return;
    }
    setSending(true);
    try {
      await api.post("/feedback", {
        fullName: trimmedName,
        email: trimmedEmail,
        username: trimmedUsername || undefined,
        message: trimmedMessage,
      });
      setSent(true);
      setMessage("");
      setTimeout(() => handleClose(), 1500);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Failed to send. Try again.";
      setError(msg || "Failed to send. Try again.");
    } finally {
      setSending(false);
    }
  };

  const modal = open && createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "400px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#fff",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          padding: "32px",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>Feedback</h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ width: "60px", height: "60px", background: "#dcfce7", color: "#166534", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "24px" }} />
            </div>
            <h3 style={{ margin: "0 0 8px", color: "#1e293b", fontSize: "18px" }}>Thank You!</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: "1.5" }}>Your feedback helps us improve SeedLab.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#475569" }}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#212121"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#475569" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#212121"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#475569" }}>Username <span style={{ fontWeight: 400, opacity: 0.6 }}>(Optional)</span></label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#212121"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#475569" }}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#1e293b",
                  fontSize: "14px",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "100px",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => e.target.style.borderColor = "#212121"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "#ef4444",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              style={{
                width: "100%",
                padding: "14px",
                backgroundColor: "#10633b",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "15px",
                cursor: sending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: sending ? 0.7 : 1,
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => !sending && (e.currentTarget.style.transform = "translateY(-1px)")}
              onMouseLeave={(e) => !sending && (e.currentTarget.style.transform = "translateY(0)")}
            >
              {sending ? "Sending Feedback..." : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          reset(); // Pre-fill with user data if available
        }}
        style={{
          position: "fixed",
          bottom: isMobile ? "70px" : "24px",
          right: "10px",
          zIndex: 900,
          width: "66px",
          height: "66px",
          borderRadius: "50%",
          backgroundColor: "transparent",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Feedback"
      >
        <HugeiconsIcon icon={CommentAdd02Icon} style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", backgroundColor: "#10633b", padding: "12px", borderRadius: "25px" }} />
      </button>
      {modal}
    </>
  );
}
