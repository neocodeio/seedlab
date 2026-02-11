
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThumbtack, faRocket, faAdd, faHeart, } from "@fortawesome/free-solid-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";

export default function WelcomeCard() {
    const { width } = useWindowSize();
    const isMobile = width < 768;

    return (
        <div
            className="fade-in slide-up welcome-card-minimal"
            style={{
                backgroundColor: "#fff",
                borderRadius: isMobile ? "32px" : "40px",
                padding: isMobile ? "28px" : "40px",
                marginBottom: "48px",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02), 0 10px 40px rgba(0, 0, 0, 0.03)",
                border: "1px solid rgba(226, 232, 240, 0.5)",
                background: "#fff",
            }}
        >
            {/* Decorative subtle gradient blob */}
            <div style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "200px",
                height: "200px",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)",
                borderRadius: "50%",
                zIndex: 0
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                            padding: "6px 14px",
                            backgroundColor: "#f8fafc",
                            color: "#64748b",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            border: "1px solid #f1f5f9"
                        }}>
                            <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: "10px" }} />
                            <span>ANNOUNCEMENT</span>
                        </div>
                    </div>

                    <div>
                        <h2 style={{
                            fontSize: isMobile ? "28px" : "36px",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: 0,
                            letterSpacing: "-0.04em",
                            lineHeight: "1.2"
                        }}>
                            Welcome to SeedLab <span style={{ color: "#6366f1" }}>🚀</span>
                        </h2>
                        <p style={{
                            fontSize: "17px",
                            lineHeight: "1.7",
                            color: "#475569",
                            marginTop: "16px",
                            marginBottom: 0,
                            fontWeight: 500,
                            maxWidth: "600px"
                        }}>
                            The social home for developers. Showcase your projects, share coding insights, and connect with builders shaping the future.
                        </p>
                    </div>

                    <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "16px",
                        marginTop: "8px"
                    }}>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent("openProjectModal"))}
                            style={{
                                padding: "14px 28px",
                                borderRadius: "100px",
                                backgroundColor: "#0f172a",
                                border: "none",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 0.3s ease",
                                boxShadow: "0 10px 20px rgba(15, 23, 42, 0.15)"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.backgroundColor = "#1e293b";
                                e.currentTarget.style.boxShadow = "0 15px 30px rgba(15, 23, 42, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.backgroundColor = "#0f172a";
                                e.currentTarget.style.boxShadow = "0 10px 20px rgba(15, 23, 42, 0.15)";
                            }}
                        >
                            <FontAwesomeIcon icon={faRocket} style={{ fontSize: "14px" }} />
                            Launch a Project
                        </button>

                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent("openPostModal"))}
                            style={{
                                padding: "14px 28px",
                                borderRadius: "100px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                color: "#475569",
                                fontWeight: 700,
                                fontSize: "15px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-3px)";
                                e.currentTarget.style.backgroundColor = "#f8fafc";
                                e.currentTarget.style.borderColor = "#0f172a";
                                e.currentTarget.style.color = "#0f172a";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.backgroundColor = "#fff";
                                e.currentTarget.style.borderColor = "#e2e8f0";
                                e.currentTarget.style.color = "#475569";
                            }}
                        >
                            <FontAwesomeIcon icon={faAdd} style={{ fontSize: "14px", opacity: 0.7 }} />
                            Share a Thought
                        </button>
                    </div>

                    <div style={{
                        marginTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#94a3b8",
                        fontSize: "13px",
                        fontWeight: 600
                    }}>
                        <span>Made with</span>
                        <FontAwesomeIcon icon={faHeart} style={{ color: "#ef4444", fontSize: "12px" }} />
                        <span>for builders</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
