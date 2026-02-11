import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate, Link } from "react-router-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faEnvelope, faKey, faLock } from "@fortawesome/free-solid-svg-icons";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [step, setStep] = useState<"email" | "code">("email");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { isLoaded, signIn, setActive } = useSignIn();
    const navigate = useNavigate();
    const { width } = useWindowSize();
    const isMobile = width < 640;

    if (!isLoaded) return null;

    async function onRequestCode(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!signIn) return;
            await signIn.create({
                strategy: "reset_password_email_code",
                identifier: email,
            });
            setStep("code");
        } catch (err: any) {
            console.error("Error requesting code:", err);
            setError(err.errors?.[0]?.longMessage || "Failed to send verification code. Please check your email.");
        } finally {
            setLoading(false);
        }
    }

    async function onResetPassword(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!signIn || !setActive) return;
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code,
                password,
            });

            if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                navigate("/");
            } else {
                console.error("Incomplete verification:", result);
                setError("Something went wrong. Please try again.");
            }
        } catch (err: any) {
            console.error("Error resetting password:", err);
            setError(err.errors?.[0]?.longMessage || "Failed to reset password. Please check your code.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fade-in" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 120px)",
            padding: isMobile ? "20px 16px" : "40px 20px",
        }}>
            <div style={{
                width: "100%",
                maxWidth: "460px",
                backgroundColor: "var(--bg-card)",
                borderRadius: isMobile ? "20px" : "24px",
                padding: isMobile ? "32px 24px" : "48px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.05)",
                border: "1px solid var(--border-light)",
                position: "relative",
            }}>
                <div style={{ marginBottom: "32px" }}>
                    <Link to="/sign-in" style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-secondary)",
                        fontSize: "14px",
                        fontWeight: 600,
                        marginBottom: "24px",
                        transition: "color 0.2s ease"
                    }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back
                    </Link>
                    <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px", color: "#0f172a" }}>
                        {step === "email" ? "Reset Password" : "Check Your Email"}
                    </h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.5" }}>
                        {step === "email"
                            ? "No worries, it happens correctly. We'll send you reset instructions."
                            : (
                                <>
                                    We've sent a 6-digit verification code to <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{email}</span>.
                                    <span style={{ display: "block", marginTop: "12px", fontSize: "13px", color: "#6366f1", fontWeight: 700 }}>
                                        Note: If you don't see the email, please check your junk box.
                                    </span>
                                </>
                            )}
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#fff1f2",
                        border: "1px solid #fecdd3",
                        borderRadius: "12px",
                        color: "#e11d48",
                        fontSize: "14px",
                        fontWeight: 500,
                        marginBottom: "24px",
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={step === "email" ? onRequestCode : onResetPassword} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {step === "email" ? (
                        <div>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                Email Address
                            </label>
                            <div style={{ position: "relative" }}>
                                <FontAwesomeIcon icon={faEnvelope} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    style={{
                                        paddingLeft: "44px",
                                        borderRadius: "12px",
                                        backgroundColor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                        paddingTop: isMobile ? "12px" : "14px",
                                        paddingBottom: isMobile ? "12px" : "14px",
                                        paddingRight: isMobile ? "12px" : "20px",
                                        fontSize: isMobile ? "14px" : "16px",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    Verification Code
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FontAwesomeIcon icon={faKey} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        required
                                        maxLength={6}
                                        style={{
                                            paddingLeft: "44px",
                                            borderRadius: "12px",
                                            backgroundColor: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            letterSpacing: "0.2em",
                                            fontWeight: 700,
                                            paddingTop: isMobile ? "12px" : "14px",
                                            paddingBottom: isMobile ? "12px" : "14px",
                                            paddingRight: isMobile ? "12px" : "20px",
                                            fontSize: isMobile ? "14px" : "16px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                                    New Password
                                </label>
                                <div style={{ position: "relative" }}>
                                    <FontAwesomeIcon icon={faLock} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        required
                                        style={{
                                            paddingLeft: "44px",
                                            borderRadius: "12px",
                                            backgroundColor: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            paddingTop: isMobile ? "12px" : "14px",
                                            paddingBottom: isMobile ? "12px" : "14px",
                                            paddingRight: isMobile ? "12px" : "20px",
                                            fontSize: isMobile ? "14px" : "16px",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="primary"
                        style={{
                            padding: "14px",
                            borderRadius: "12px",
                            fontSize: "14px",
                            fontWeight: 700,
                            backgroundColor: "#10633b",
                            color: "white",
                            border: "none",
                            marginTop: "12px",
                        }}
                    >
                        {loading ? "Please wait..." : (step === "email" ? "Send Instructions" : "Reset Password")}
                    </button>
                </form>

                {step === "code" && (
                    <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-secondary)" }}>
                        Didn't receive the email?{" "}
                        <button
                            onClick={onRequestCode}
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#5046e5",
                                fontWeight: 600,
                                textTransform: "none",
                                letterSpacing: "normal",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                        >
                            Click to resend
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
