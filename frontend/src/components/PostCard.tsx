import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import api from "../api/axios";
import type { Post } from "../hooks/usePosts";
import EditPostModal from "./EditPostModal";
import ImageSlider from "./ImageSlider";
import ContentRenderer from "./ContentRenderer";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { useWindowSize } from "../hooks/useWindowSize";
import { getAvatarUrl } from "../hooks/useAvatar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faComment,
  faBookmark as faBookmarkSolid,
  faBookmark as faBookmarkRegular,
  faTrash,
  faPen,
  faShareNodes,
  faThumbtack,
} from "@fortawesome/free-solid-svg-icons";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "./VerifiedBadge";

interface PostCardProps {
  post: Post;
  onUpdated?: () => void;
  isPinned?: boolean;
}

export default function PostCard({ post, onUpdated, isPinned }: PostCardProps) {
  const navigate = useNavigate();
  const { user: currentUser } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { isLiked, likeCount, toggleLike, loading: likeLoading } = useLikes(post.id, post.isLiked, post.like_count);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(post.id, post.isSaved);
  const [shareCopied, setShareCopied] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const isOwnPost = currentUser?.id === post.user_id;

  useEffect(() => {
    if (post.id && post.user_id) {
      // fetchLikeStatus(); // Handled internally by useLikes hook now
      fetchSavedStatus();
    }
  }, [post.id, post.user_id]);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.user?.username) {
      navigate(`/${post.user.username}`);
    } else if (post.user_id) {
      navigate(`/user/${post.user_id}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSave();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${post.id}#comments`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `SeedLab - Post by ${post.user?.name || post.user?.username || 'User'}`,
      text: post.title || post.content?.substring(0, 100) || '',
      url: `https://seedlab0.vercel.app/post/${post.id}`,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`https://seedlab0.vercel.app/post/${post.id}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = await getToken();
        await api.delete(`/posts/${post.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onUpdated?.();
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  const userName = post.user?.name || post.user?.username || "User";
  const avatarUrl = getAvatarUrl(post.user?.avatar_url, undefined, userName);
  return (
    <>
      <div
        className="fade-in post-card-x-style"
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
        onClick={handleCardClick}
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
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              overflow: "hidden",
              transition: "opacity 0.2s ease",
            }}
            onClick={handleUserClick}
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
                <VerifiedBadge username={post.user?.username} size="14px" />
              </span>
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "400" }}>
                @{post.user?.username || 'user'}
              </span>
              <span style={{ fontSize: "14px", color: "#64748b" }}>•</span>
              <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "400" }}>
                {formatRelativeDate(post.created_at)}
              </span>
              {isPinned && (
                <FontAwesomeIcon icon={faThumbtack} style={{ fontSize: "11px", color: "#64748b", marginLeft: "4px" }} />
              )}
            </div>

            {/* Menu Dropdown Placeholder / Own Actions */}
            {isOwnPost && (
              <div style={{ display: "flex", gap: "10px", opacity: 0.5 }}>
                <button
                  onClick={handleEdit}
                  style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#0f172a"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
                >
                  <FontAwesomeIcon icon={faPen} style={{ fontSize: "12px" }} />
                </button>
                <button
                  onClick={handleDelete}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "4px", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />
                </button>
              </div>
            )}
          </div>

          {/* Title - Optional in X style but we keep it */}
          {post.title && post.title !== '<<<NO_TITLE>>>' && post.title !== post.content && (
            <h2 dir="auto" style={{
              fontSize: "17px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 6px 0",
              lineHeight: "1.4"
            }}>
              {post.title}
            </h2>
          )}

          {/* Content */}
          <div dir="auto" style={{
            fontSize: "15px",
            lineHeight: "1.5",
            color: "#0f172a",
            wordBreak: "break-word",
            marginBottom: "12px"
          }}>
            <ContentRenderer content={post.content} />
          </div>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div style={{
              marginTop: "8px",
              marginBottom: "12px",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #eff3f4"
            }}>
              <ImageSlider images={post.images} />
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{ color: "#6366f1", fontSize: "14px", fontWeight: 500 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/search?q=${encodeURIComponent(tag)}`);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  #{tag}
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
              onClick={handleComment}
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
              <span>{post.comment_count || 0}</span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeLoading}
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
      </div>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onUpdated={onUpdated || (() => { })}
      />
    </>
  );
}

