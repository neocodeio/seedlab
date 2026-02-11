import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Project } from "../types/project";
import { formatRelativeDate } from "../utils/date";
import ProjectModal from "../components/ProjectModal";
import CommentsSection from "../components/CommentsSection";
import ContentRenderer from "../components/ContentRenderer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen,
  faExternalLinkAlt,
  faArrowLeft,
  faPlay,
  faPause,
  faCheck,
  faStar,
  faShareNodes,
  faEye
} from "@fortawesome/free-solid-svg-icons";
import { faGithub as faGithubBrand } from "@fortawesome/free-brands-svg-icons";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [likeCount, setLikeCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  const viewLogged = useRef(false);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchReactionStatus();

      // Increment view count
      if (!viewLogged.current) {
        viewLogged.current = true;
        api.post(`/projects/${id}/view`).catch(err => console.error("Failed to record view", err));
      }
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);

      setLikeCount(response.data.like_count || 0);
      setUserRating(response.data.user_rating || 0);
    } catch (error) {
      console.error("Error fetching project:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchReactionStatus = async () => {
    try {
      const token = await getToken();
      if (!token || !currentUser) return;

      const [likeRes, savedRes] = await Promise.all([
        api.get(`/projects/${id}/like`, { headers: { Authorization: `Bearer ${token}` } }),
        api.get(`/projects/${id}/save`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setIsLiked(likeRes.data.isLiked);
      setIsSaved(savedRes.data.isSaved);
    } catch (error) {
      console.error("Error fetching reaction status:", error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in_progress': return '#007bff';
      case 'paused': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return faCheck;
      case 'in_progress': return faPlay;
      case 'paused': return faPause;
      default: return faCheck;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      default: return status;
    }
  };

  const handleUserClick = () => {
    if (project?.user_id) {
      navigate(`/user/${project.user_id}`);
    }
  };

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async () => {
    if (!confirm("Delete this project? This action cannot be undone.")) return;

    setIsDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSaved(response.data.isSaved);
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  }


  const handleRate = async (rating: number) => {
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.post(
        `/projects/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserRating(rating);
      // Update project with new average
      setProject(prev => prev ? {
        ...prev,
        rating: response.data.average,
        rating_count: response.data.count
      } : null);
    } catch (error) {
      console.error("Error rating project:", error);
    }
  };

  const handleShare = async () => {
    if (!project) return;
    const shareUrl = `https://seedlab0.vercel.app/project/${id}`;
    const shareData = {
      title: `SeedLab Project - ${project.title}`,
      text: project.description?.substring(0, 100) || '',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleProjectUpdated = () => {
    fetchProject();
    setIsEditModalOpen(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div>Project not found</div>
      </div>
    );
  }

  const isOwnProject = currentUser?.id === project.user_id;
  const userName = project.user?.name || "User";
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;

  return (
    <main className="container" style={{ padding: "60px 20px" }}>
      <SEO
        title={`${project.title} by ${userName}`}
        description={project.description || `Check out ${project.title} on SeedLab.`}
        image={project.cover_image || avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={project.created_at}
      />
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "30px",
            padding: "10px 16px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>

        {project.cover_image && (
          <div style={{
            width: "100%",
            height: "400px",
            overflow: "hidden",
            borderRadius: "20px",
            marginBottom: "40px",
            position: "relative"
          }}>
            <img
              src={project.cover_image}
              alt={project.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: getStatusColor(project.status),
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              {getStatusIcon(project.status) && (
                <FontAwesomeIcon icon={getStatusIcon(project.status)} />
              )}
              {getStatusText(project.status)}
            </div>
          </div>
        )}

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "40px"
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: "48px",
              fontWeight: 800,
              marginBottom: "16px",
              lineHeight: "1.2",
            }}>
              {project.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div
                onClick={handleUserClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#10633b",
                  border: "1px solid var(--border-color)",
                  overflow: "hidden",
                  borderRadius: "50%",
                }}>
                  <img
                    src={avatarUrl}
                    alt={userName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    {userName}
                    <VerifiedBadge username={project.user?.username} size="14px" />
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 700, letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>{formatRelativeDate(project.created_at).toUpperCase()}</span>
                    {project.view_count !== undefined && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <FontAwesomeIcon icon={faEye} style={{ fontSize: "10px" }} />
                        <span>{project.view_count} VIEWS</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: "18px",
              lineHeight: "1.6",
              color: "var(--text-secondary)",
              marginBottom: "30px",
            }}>
              {project.description}
            </p>

            {project.technologies_used && project.technologies_used.length > 0 && (
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>Technologies Used</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {project.technologies_used.map((tech, idx) => (
                    <span
                      key={idx}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(tech)}`)}
                      style={{
                        fontSize: "14px",
                        padding: "6px 14px",
                        backgroundColor: "#e9ecef",
                        color: "#495057",
                        borderRadius: "20px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background-color 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#dee2e6";
                        e.currentTarget.style.color = "#212121";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#e9ecef";
                        e.currentTarget.style.color = "#495057";
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.contributors && project.contributors.length > 0 && (
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>Contributors</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {project.contributors.map((contrib) => (
                    <div
                      key={contrib.user_id}
                      onClick={() => navigate(`/user/${contrib.user_id}`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "30px",
                        cursor: "pointer",
                        border: "1px solid var(--border-light)"
                      }}
                    >
                      <img
                        src={contrib.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(contrib.name || contrib.username)}&background=212121&color=ffffff&bold=true`}
                        alt={contrib.username}
                        style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                      />
                      <span style={{ fontWeight: 600, fontSize: "14px", display: "flex", alignItems: "center" }}>
                        {contrib.name || contrib.username}
                        <VerifiedBadge username={contrib.username} size="14px" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "30px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Rate this Project</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "24px",
                      color: (hoverRating || userRating) >= star ? "#f57f17" : "#e0e0e0",
                      transition: "color 0.2s"
                    }}
                  >
                    <FontAwesomeIcon icon={faStar} />
                  </button>
                ))}
                <span style={{ fontSize: "14px", color: "var(--text-secondary)", marginLeft: "10px", fontWeight: 600 }}>
                  {project.rating ? `${project.rating.toFixed(1)} (${project.rating_count} ratings)` : "No ratings yet"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "30px" }}>
              {project.github_repo && (
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    backgroundColor: "#10633b",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "16px",
                    fontWeight: 600,
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#10633b";
                  }}
                >
                  <FontAwesomeIcon icon={faGithubBrand} />
                  GitHub Repository
                </a>
              )}
              {project.live_demo && (
                <a
                  href={project.live_demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    backgroundColor: "#28a745",
                    color: "#fff",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "16px",
                    fontWeight: 600,
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#218838";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#28a745";
                  }}
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  Live Demo
                </a>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {isOwnProject && (
              <>
                <button
                  onClick={handleEditClick}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#10633b",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <FontAwesomeIcon icon={faPen} style={{ marginRight: "8px" }} />
                  Edit Project
                </button>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  style={{
                    padding: "12px 20px",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ marginRight: "8px" }} />
                  {isDeleting ? "Deleting..." : "Delete Project"}
                </button>
              </>
            )}
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "16px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          marginBottom: "40px",
        }}>
          <button
            onClick={handleLike}
            disabled={!currentUser}
            style={{
              flex: 1,
              padding: "16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: isLiked ? "#ff6b6b" : "#fff",
              color: isLiked ? "#fff" : "var(--text-primary)",
              cursor: currentUser ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            <FontAwesomeIcon icon={faHeartSolid} />
            {likeCount || 0} Likes
          </button>

          <button
            onClick={handleSave}
            disabled={!currentUser}
            style={{
              flex: 1,
              padding: "16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: isSaved ? "#10633b" : "#fff",
              color: isSaved ? "#fff" : "var(--text-primary)",
              cursor: currentUser ? "pointer" : "not-allowed",
              fontWeight: 600,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <FontAwesomeIcon
              icon={isSaved ? faBookmarkSolid : faBookmarkRegular}
              style={{
                transform: isSaved ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
            />
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: "16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: shareCopied ? "#10b981" : "#fff",
              color: shareCopied ? "#fff" : "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              position: "relative",
            }}
          >
            <FontAwesomeIcon icon={faShareNodes} />
            {shareCopied ? "Copied" : "Share"}
            {shareCopied && (
              <span style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#10b981",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "10px",
                whiteSpace: "nowrap",
                marginBottom: "8px",
                fontWeight: 700,
              }}>
                LINK COPIED!
              </span>
            )}
          </button>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "24px" }}>Project Details</h2>
          <div style={{
            fontSize: "16px",
            lineHeight: "1.8",
            color: "var(--text-secondary)",
          }}>
            <ContentRenderer content={project.project_details} />
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "24px" }}>Comments</h2>
          <CommentsSection
            resourceId={project.id}
            resourceType="project"
            onCommentAdded={() => {
              // Refresh project to update comment count
              fetchProject();
            }}
          />
        </div>
      </div>

      {project && (
        <ProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleProjectUpdated}
          project={project}
        />
      )}
    </main>
  );
}
