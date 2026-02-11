import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { normalizeLanguage } from "../utils/language";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  post: {
    id: number;
    title: string;
    content: string;

    images?: string[] | null;
    language?: "en" | "ar";
  };
}

export default function EditPostModal({ isOpen, onClose, onUpdated, post }: EditPostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [images, setImages] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  useEffect(() => {
    if (isOpen && post) {
      setTitle(post.title || "");
      setContent(post.content || "");

      setImages(post.images || []);
      setLanguage(normalizeLanguage(post.language));
    }
  }, [isOpen, post]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 10;
    if (images.length + files.length > maxImages) {
      alert(`You can upload a maximum of ${maxImages} images`);
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImages((prev) => [...prev, base64String]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!isLoaded) {
      alert("Please sign in to edit post");
      return;
    }

    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    if (!content.trim()) {
      alert("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to edit post");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : null,
        language: normalizeLanguage(language),
      };

      console.log("Submitting edit payload:", payload);

      await api.put(`/posts/${post.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating post:", error);
      let errorMessage = "Failed to update post";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string } } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          if (errorData.details) {
            errorMessage = `${errorData.error || "Failed to update post"}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to update post: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .modal-backdrop {
          animation: modalFadeIn 0.15s ease-out;
        }
        .modal-dialog {
          animation: modalSlideIn 0.2s ease-out;
        }
      `}</style>

      <div
        className="modal-backdrop"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          overflowY: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-dialog"
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 32px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "25px",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-xl)",
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              overflow: "hidden",
            }}
          >
            <div
              className="modal-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1a1a1a" }}>
                Edit Post
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  fontWeight: 300,
                  color: "#64748b",
                  cursor: "pointer",
                  padding: 0,
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  transition: "all 0.15s",
                }}
              >
                ×
              </button>
            </div>

            <div
              className="modal-body"
              style={{
                padding: "20px",
                overflowY: "auto",
                flex: "1 1 auto",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post Title"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #e4e7eb",
                  borderRadius: "8px",
                  fontSize: "18px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#212121";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e4e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
                autoFocus
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "12px 16px",
                  border: "1px solid #e4e7eb",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#212121";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(33, 33, 33, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e4e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              {/* Image Upload Section */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Images (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                  id="edit-image-upload"
                />
                <label
                  htmlFor="edit-image-upload"
                  style={{
                    display: "inline-block",
                    padding: "10px 16px",
                    backgroundColor: "#f8fafc",
                    border: "2px dashed #212121",
                    borderRadius: "8px",
                    color: "#212121",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <FontAwesomeIcon icon={faImage} style={{ marginRight: "8px" }} />
                  Upload Images
                </label>
                {images.length > 0 && (
                  <div style={{
                    marginTop: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "8px",
                  }}>
                    {images.map((img, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #e4e7eb",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(220, 38, 38, 0.9)",
                            border: "none",
                            color: "#ffffff",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                padding: "16px 20px",
                borderTop: "1px solid #e4e7eb",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#10633b",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "20px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isLoaded || !title.trim() || !content.trim() || isSubmitting}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isLoaded && title.trim() && content.trim() && !isSubmitting ? "#10633b" : "#e4e7eb",
                  border: "none",
                  color: isLoaded && title.trim() && content.trim() && !isSubmitting ? "#ffffff" : "#94a3b8",
                  borderRadius: "20px",
                  cursor: isLoaded && title.trim() && content.trim() && !isSubmitting ? "pointer" : "not-allowed",
                  fontSize: "15px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

