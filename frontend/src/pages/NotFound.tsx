import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faGhost } from "@fortawesome/free-solid-svg-icons";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 120px)",
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "#f8fafc"
        }}>
            <div className="fade-in slide-up" style={{
                maxWidth: "500px",
                backgroundColor: "white",
                padding: "60px 40px",
                borderRadius: "32px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.05)",
                border: "1px solid #f1f5f9"
            }}>
                <div style={{
                    fontSize: "80px",
                    color: "#212121",
                    marginBottom: "24px",
                    opacity: 0.8
                }}>
                    <FontAwesomeIcon icon={faGhost} className="bounce" />
                </div>

                <h1 style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    color: "#1e293b",
                    marginBottom: "16px",
                    letterSpacing: "-0.04em"
                }}>
                    404
                </h1>

                <h2 style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#64748b",
                    marginBottom: "32px",
                    lineHeight: "1.5"
                }}>
                    Oops! The page you're looking for has vanished into thin air.
                </h2>

                <button
                    onClick={() => navigate("/")}
                    className="primary"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "16px 32px",
                        borderRadius: "16px",
                        fontSize: "15px",
                        fontWeight: 800,
                        backgroundColor: "#10633b",
                        color: "white",
                        border: "none",
                        margin: "0 auto",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 10px 25px rgba(33, 33, 33, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1) translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    <FontAwesomeIcon icon={faHome} />
                    Back to Safety
                </button>
            </div>

            <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .bounce {
          animation: bounce 3s infinite ease-in-out;
        }
      `}</style>
        </div>
    );
}
