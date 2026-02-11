import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faCode } from "@fortawesome/free-solid-svg-icons";
import MentionInput from "./MentionInput";
import { normalizeLanguage } from "../utils/language";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePostModal({ isOpen, onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken, isLoaded } = useClerkAuth();

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setContent("");
      setImages([]);
      setLanguage("en");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 10; // Limit to 10 images

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
      alert("Please sign in to create a post");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title for your post");
      return;
    }

    if (!content.trim()) {
      alert("Please enter content for your post");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        alert("Please sign in to create a post");
        setIsSubmitting(false);
        return;
      }

      // Extract tags from content and combine with manually added tags
      const hashtagRegex = /#(\w+)/g;
      const contentTags = content.match(hashtagRegex)?.map((tag) => tag.substring(1).toLowerCase()) || [];
      const allTags = [...new Set([...tags, ...contentTags])].slice(0, 10);

      const payload = {
        title: title.trim(),
        content: content.trim(),
        images: images.length > 0 ? images : null,
        tags: allTags.length > 0 ? allTags : null,
        language: normalizeLanguage(language),
      };

      console.log("Submitting post payload:", payload);

      await api.post("/posts", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTitle("");
      setContent("");
      setImages([]);
      setTags([]);
      setTagInput("");
      // Dispatch custom event to refresh posts
      window.dispatchEvent(new CustomEvent("postCreated"));
      onCreated();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      let errorMessage = "Failed to create post";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string; details?: string; message?: string } } };
        const errorData = axiosError.response?.data;

        if (errorData) {
          if (errorData.details) {
            errorMessage = `${errorData.error || "Failed to create post"}: ${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(`Failed to create post: ${errorMessage}`);
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
        
        @media (max-width: 640px) {
          .modal-dialog {
            margin: 16px !important;
            max-width: calc(100% - 32px) !important;
          }
          .modal-header {
            padding: 16px !important;
          }
          .modal-body {
            padding: 16px !important;
          }
          .modal-footer {
            padding: 12px 16px !important;
            flex-direction: column-reverse !important;
            gap: 8px !important;
          }
          .modal-footer button {
            width: 100% !important;
          }
          .modal-title {
            font-size: 18px !important;
          }
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
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          zIndex: 10000,
          backdropFilter: "blur(8px)",
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
            {/* Modal Header */}
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
              <h2
                className="modal-title"
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  lineHeight: 1.5,
                }}
              >
                Create Post
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
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f5f7fa";
                  e.currentTarget.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
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
                  borderRadius: "25px",
                  fontSize: "18px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  outline: "none",
                  transition: "all 0.15s",
                  color: "#1a1a1a",
                  backgroundColor: "#ffffff",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#000";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e4e7eb";
                  e.currentTarget.style.boxShadow = "none";
                }}
                autoFocus
              />

              <MentionInput
                value={content}
                onChange={setContent}
                placeholder="What's on your mind? (Use @ to mention users, ``` for code blocks)"
                minHeight="150px"
              />

              {/* Code block helper */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "-8px",
                marginBottom: "8px",
              }}>
                <button
                  type="button"
                  onClick={() => {
                    const codeTemplate = "\n```javascript\n// Your code here\n```\n";
                    setContent(content + codeTemplate);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    backgroundColor: "#f5f7fa",
                    border: "1px solid #e4e7eb",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#64748b",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e4e7eb";
                    e.currentTarget.style.color = "#1a1a1a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f5f7fa";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  <FontAwesomeIcon icon={faCode} />
                  Add Code Block
                </button>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Tip: Use ```language for syntax highlighting (js, python, etc.)
                </span>
              </div>

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
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  style={{
                    display: "inline-block",
                    padding: "10px 16px",
                    backgroundColor: "#f0f7ff",
                    border: "2px dashed #000",
                    borderRadius: "8px",
                    color: "#000",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    textAlign: "center",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0f2fe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f7ff";
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

              {/* Tags Section */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}>
                  Tags / Hashtags (Optional)
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "4px 10px",
                        backgroundColor: "#f0f7ff",
                        color: "#2563eb",
                        borderRadius: "12px",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      const tag = tagInput.trim().toLowerCase().replace(/^#/, "");
                      if (tag && tag.length > 0 && tag.length <= 50 && !tags.includes(tag) && tags.length < 10) {
                        setTags([...tags, tag]);
                        setTagInput("");
                      }
                    }
                  }}
                  placeholder="Add tags (press Enter or comma)"
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #e4e7eb",
                    borderRadius: "25px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    outline: "none",
                    transition: "all 0.15s",
                    color: "#1a1a1a",
                    backgroundColor: "#ffffff",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#000";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(49, 127, 245, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e4e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  {tags.length}/10 tags. Tags starting with # in content are automatically added.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
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
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = "#444";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = "#10633b";
                  }
                }}
              >
                Close
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
                onMouseEnter={(e) => {
                  if (isLoaded && title.trim() && content.trim() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = "#444";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isLoaded && title.trim() && content.trim() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = "#10633b";
                  }
                }}
              >
                {isSubmitting ? "Posting..." : "Post it"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}

