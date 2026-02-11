import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useProjectLikes } from "../hooks/useProjectLikes";
import { useProjectSaved } from "../hooks/useProjectSaved";
import api from "../api/axios";
import type { Project } from "../types/project";
import ProjectModal from "./ProjectModal";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faComment,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen,
  faShareNodes,
  // faEye
} from "@fortawesome/free-solid-svg-icons";
// import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";

interface ProjectCardProps {
  project: Project;
  onUpdated?: () => void;
}

export default function ProjectCard({ project, onUpdated }: ProjectCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const { isLiked, likeCount, toggleLike } = useProjectLikes(project.id, project.isLiked, project.like_count);
  const { isSaved, toggleSave } = useProjectSaved(project.id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnProject = currentUser?.id === project.user_id;

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.user?.username) {
      navigate(`/${project.user.username}`);
    } else if (project.user_id) {
      navigate(`/user/${project.user_id}`);
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



  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'paused': return 'Paused';
      default: return status;
    }
  };

  const userName = project.user?.name || "User";
  const avatarUrl = project.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "U")}&background=212121&color=ffffff&bold=true`;

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This action cannot be undone.")) return;

    try {
      const token = await getToken();
      if (!token) return;
      await api.delete(`/projects/${project.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUpdated ? onUpdated() : window.location.reload();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    await toggleLike();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/sign-in");
      return;
    }
    await toggleSave();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `https://seedlab0.vercel.app/project/${project.id}`;
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

  return (
    <article
      onClick={handleClick}
      className="fade-in project-card-x-style"
      style={{
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        backgroundColor: "#fff",
        padding: isMobile ? "16px" : "20px 24px",
        position: "relative",
        display: "flex",
        gap: "12px",
        borderBottom: "1px solid #eff3f4",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#f7f7f7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#fff";
      }}
    >
      {/* Left Column: Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div
          onClick={handleUserClick}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            overflow: "hidden",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <img
            src={avatarUrl}
            alt={userName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Right Column: Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Row: Name, Handle, Time, Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
          flexWrap: "wrap",
          gap: "4px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
            <span
              onClick={handleUserClick}
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "#0f172a",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "2px"
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
            >
              {userName.toUpperCase()}
              <VerifiedBadge username={project.user?.username} size="14px" />
            </span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "400" }}>
              @{project.user?.username || 'user'}
            </span>
            <span style={{ fontSize: "14px", color: "#64748b" }}>•</span>
            <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "400" }}>
              {formatRelativeDate(project.created_at)}
            </span>
            <div style={{
              marginLeft: "4px",
              backgroundColor: getStatusColor(project.status),
              width: "8px",
              height: "8px",
              borderRadius: "50%"
            }} title={getStatusText(project.status)} />
          </div>

          {/* Own Actions */}
          {isOwnProject && (
            <div style={{ display: "flex", gap: "10px", opacity: 0.5 }}>
              <button
                onClick={handleEditClick}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
              >
                <FontAwesomeIcon icon={faPen} style={{ fontSize: "12px" }} />
              </button>
              <button
                onClick={handleDeleteClick}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px" }}
              >
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />
              </button>
            </div>
          )}
        </div>

        {/* Project Title & Description */}
        <div style={{ marginBottom: "12px" }}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: "800",
            color: "#0f172a",
            margin: "0 0 4px 0",
            lineHeight: "1.4"
          }}>
            {project.title}
          </h3>
          <p style={{
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#0f172a",
            wordBreak: "break-word",
            display: "-webkit-box",
            WebkitLineClamp: "3",
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {project.description}
          </p>
        </div>

        {/* Cover Image */}
        {project.cover_image && (
          <div style={{
            marginTop: "8px",
            marginBottom: "12px",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #eff3f4",
            aspectRatio: "16/9"
          }}>
            <img
              src={project.cover_image}
              alt={project.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}

        {/* Technologies */}
        {project.technologies_used && project.technologies_used.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            {project.technologies_used.map((tech, idx) => (
              <span
                key={idx}
                style={{ color: "#6366f1", fontSize: "14px", fontWeight: 500 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/search?q=${encodeURIComponent(tech)}`);
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
              >
                #{tech.replace(/\s+/g, "")}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "425px",
          marginTop: "4px"
        }}>
          {/* Comment */}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/project/${project.id}`); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              padding: "8px 0",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#6366f1";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#64748b";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.backgroundColor = "transparent";
            }}
          >
            <div className="footer-icon" style={{ padding: "8px", borderRadius: "50%", display: "flex", transition: "all 0.2s" }}>
              <FontAwesomeIcon icon={faComment} style={{ fontSize: "18px" }} />
            </div>
            <span>{project.comment_count || 0}</span>
          </button>

          {/* Like */}
          <button
            onClick={handleLike}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: isLiked ? "#f91880" : "#64748b",
              cursor: "pointer",
              fontSize: "13px",
              padding: "8px 0",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!isLiked) e.currentTarget.style.color = "#f91880";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.backgroundColor = "rgba(249, 24, 128, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (!isLiked) e.currentTarget.style.color = "#64748b";
              const icon = e.currentTarget.querySelector('.footer-icon') as HTMLDivElement;
              if (icon) icon.style.backgroundColor = "transparent";
            }}
          >
            <div className="footer-icon" style={{ padding: "8px", borderRadius: "50%", display: "flex", transition: "all 0.2s" }}>
              <FontAwesomeIcon icon={faHeartSolid} style={{ fontSize: "18px" }} />
            </div>
            <span style={{ fontWeight: isLiked ? "700" : "400" }}>{likeCount || 0}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            style={{
              display: "flex",
              background: "none",
              border: "none",
              color: shareCopied ? "#00ba7c" : "#64748b",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 186, 124, 0.1)";
              e.currentTarget.style.color = "#00ba7c";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              if (!shareCopied) e.currentTarget.style.color = "#64748b";
            }}
          >
            <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: "18px" }} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              display: "flex",
              background: "none",
              border: "none",
              color: isSaved ? "#6366f1" : "#64748b",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "50%",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.color = "#6366f1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              if (!isSaved) e.currentTarget.style.color = "#64748b";
            }}
          >
            <FontAwesomeIcon icon={isSaved ? faBookmarkSolid : faBookmarkRegular} style={{ fontSize: "18px" }} />
          </button>
        </div>
      </div>

      {showEditModal && (
        <ProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={() => {
            setShowEditModal(false);
            if (onUpdated) onUpdated();
          }}
          project={project}
        />
      )}
    </article>
  );
}
