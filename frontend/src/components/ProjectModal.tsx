import { useState, useEffect } from "react";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Project, ProjectFormData } from "../types/project";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus } from "@fortawesome/free-solid-svg-icons";
import VerifiedBadge from "./VerifiedBadge";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  project?: Project | null;
}

export default function ProjectModal({ isOpen, onClose, onUpdated, project }: ProjectModalProps) {
  const { getToken } = useClerkAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [techInput, setTechInput] = useState("");

  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    description: "",
    technologies_used: [],
    status: "in_progress",
    github_repo: "",
    live_demo: "",
    cover_image: "",
    project_details: "",
    contributors: [],
  });
  const [contributorInput, setContributorInput] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description,
        technologies_used: project.technologies_used,
        status: project.status,
        github_repo: project.github_repo || "",
        live_demo: project.live_demo || "",
        cover_image: project.cover_image || "",
        project_details: project.project_details,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        technologies_used: [],
        status: "in_progress",
        github_repo: "",
        live_demo: "",
        cover_image: "",
        project_details: "",
        contributors: [],
      });
    }
    setTechInput("");
    setContributorInput("");
    setError("");
  }, [project, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTech = () => {
    if (techInput.trim() && !formData.technologies_used.includes(techInput.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies_used: [...prev.technologies_used, techInput.trim()]
      }));
      setTechInput("");
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      technologies_used: prev.technologies_used.filter(tech => tech !== techToRemove)
    }));
  };

  const handleAddContributor = () => {
    if (contributorInput.trim() && !formData.contributors?.includes(contributorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        contributors: [...(prev.contributors || []), contributorInput.trim()]
      }));
      setContributorInput("");
    }
  };

  const handleRemoveContributor = (contributorToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      contributors: prev.contributors?.filter(c => c !== contributorToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = await getToken();
      const response = await api.post("/upload/image", formData, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      setFormData(prev => ({
        ...prev,
        cover_image: response.data.url
      }));
    } catch (error) {
      setError("Failed to upload image");
      console.error("Upload error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      if (project) {
        await api.put(`/projects/${project.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await api.post("/projects", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      onUpdated();
      onClose();
    } catch (error: any) {
      const backendError = error.response?.data?.error || error.response?.data?.message || "Failed to save project";
      const backendDetails = error.response?.data?.details ? ` (${error.response.data.details})` : "";
      const backendCode = error.response?.data?.code ? ` [Code: ${error.response.data.code}]` : "";

      setError(`${backendError}${backendDetails}${backendCode}`);
      console.error("Project save error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "0",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-content {
          animation: modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (max-width: 640px) {
          .modal-content {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          .modal-header-title {
            font-size: 22px !important;
            margin-bottom: 20px !important;
          }
          .form-item-label {
            font-size: 14px !important;
          }
          .form-input, .form-textarea, .form-select {
            padding: 10px !important;
            font-size: 14px !important;
          }
          .add-button-text {
            display: none;
          }
          .add-button-icon {
            display: block !important;
          }
          .responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          borderRadius: 12px;
          fontSize: 16px;
          transition: all 0.2s ease;
          background-color: #f8fafc;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          border-color: #212121;
          box-shadow: 0 0 0 4px rgba(33, 33, 33, 0.1);
          background-color: #fff;
        }
        .responsive-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
      `}</style>
      <div
        className="modal-content"
        style={{
          backgroundColor: "#fff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          overflow: "hidden",
          margin: "16px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div style={{ padding: "24px 32px 16px", borderBottom: "1px solid #f1f5f9", position: "relative" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#f1f5f9",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
              zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
          <h2 className="modal-header-title" style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
            {project ? "Edit Project" : "Add New Project"}
          </h2>
        </div>

        {/* Scrolling Content */}
        <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #fecaca",
            }}>
              {error}
            </div>
          )}

          <form id="project-form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Project Name *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "13px",
                }}
                required
                className="form-input"
                placeholder="e.g. My Awesome App"
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "13px",
                }}
                className="form-textarea"
                placeholder="A short punchy intro for your project..."
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Technologies Used *
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                  placeholder="e.g. React, Node.js"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                  className="form-input"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#10633b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "60px",
                  }}
                >
                  <span className="add-button-text">Add</span>
                  <span className="add-button-icon" style={{ display: "none" }}><FontAwesomeIcon icon={faPlus} /></span>
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {formData.technologies_used.map((tech, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#666",
                        fontSize: "16px",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>


            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Contributors (Usernames)
              </label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={contributorInput}
                  onChange={(e) => setContributorInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddContributor())}
                  placeholder="Enter username"
                  className="form-input"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddContributor}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#10633b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "60px",
                  }}
                >
                  <span className="add-button-text">Add</span>
                  <span className="add-button-icon" style={{ display: "none" }}><FontAwesomeIcon icon={faPlus} /></span>
                </button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(formData.contributors || []).map((contributor, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 500
                    }}
                  >
                    @{contributor}
                    <VerifiedBadge username={contributor} size="14px" />
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(contributor)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#0369a1",
                        fontSize: "16px",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Project Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="form-select"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "13px",
                }}
              >
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>

            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name="looking_for_contributors"
                  checked={formData.looking_for_contributors || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, looking_for_contributors: e.target.checked }))}
                  style={{ width: "20px", height: "20px" }}
                />
                <span style={{ fontWeight: 600 }}>Looking for Contributors</span>
              </label>
              <p style={{ fontSize: "14px", color: "var(--text-tertiary)", marginTop: "4px", marginLeft: "30px" }}>
                Check this if you want to invite others to help with your project.
              </p>
            </div>

            <div className="responsive-grid">
              <div>
                <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  GitHub Repository
                </label>
                <input
                  type="url"
                  name="github_repo"
                  value={formData.github_repo}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repo"
                  className="form-input"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
              </div>

              <div>
                <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Live Demo
                </label>
                <input
                  type="url"
                  name="live_demo"
                  value={formData.live_demo}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="form-input"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Cover Image
              </label>
              {formData.cover_image && (
                <div style={{ marginBottom: "10px" }}>
                  <img
                    src={formData.cover_image}
                    alt="Cover"
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "14px",
                }}
              />
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label className="form-item-label" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                Project Details *
              </label>
              <textarea
                name="project_details"
                value={formData.project_details}
                onChange={handleInputChange}
                required
                rows={6}
                className="form-textarea"
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  fontSize: "13px",
                }}
                placeholder="Describe your project in detail..."
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div style={{ padding: "20px 32px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "15px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="project-form"
            disabled={loading}
            style={{
              padding: "12px 24px",
              backgroundColor: loading ? "#0d4a2d" : "#10633b",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "15px",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? "Saving..." : (project ? "Update Project" : "Create Project")}
          </button>
        </div>
      </div>
    </div>
  );
}
