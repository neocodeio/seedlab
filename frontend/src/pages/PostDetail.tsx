import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import ImageSlider from "../components/ImageSlider";
import ContentRenderer from "../components/ContentRenderer";
import MentionInput from "../components/MentionInput";
import CommentBlock, { type CommentWithMeta } from "../components/CommentBlock";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faHeart as faHeartSolid, faBookmark as faBookmarkSolid, faBookmark as faBookmarkRegular, faShareNodes, faComment } from "@fortawesome/free-solid-svg-icons";
import { useLikes } from "../hooks/useLikes";
import { useSaved } from "../hooks/useSaved";
import { formatRelativeDate } from "../utils/date";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[] | null;
  tags?: string[] | null;
  like_count?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  user?: {
    name: string;
    email: string | null;
    username?: string | null;
    avatar_url?: string | null;
  };
  view_count?: number;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useClerkAuth();
  const { isSignedIn, user } = useClerkUser();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [commentSort] = useState<"newest" | "top">("newest");
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { isLiked, likeCount, toggleLike, fetchLikeStatus, loading: likeLoading } = useLikes(Number(id), post?.isLiked, post?.like_count);
  const { isSaved, toggleSave, fetchSavedStatus } = useSaved(Number(id), post?.isSaved);

  useEffect(() => {
    if (id) {
      fetchLikeStatus();
      fetchSavedStatus();
    }
  }, [id]);


  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [postRes, commentsRes] = await Promise.all([
          api.get(`/posts/${id}`, { headers }),
          api.get(`/comments/${id}?sort=${commentSort}`, { headers })
        ]);
        if (isMounted) {
          setPost(postRes.data);
          setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        }
      } catch (e) {
        console.error("Error fetching post details:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [id, commentSort, getToken]);

  const handleSubmitComment = async () => {
    if (!isSignedIn || !commentContent.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post("/comments", { post_id: id, content: commentContent.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setCommentContent("");
      const res = await api.get(`/comments/${id}?sort=${commentSort}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    const token = await getToken();
    await api.post("/comments", { post_id: id, content, parent_id: parentId }, { headers: { Authorization: `Bearer ${token}` } });
    const res = await api.get(`/comments/${id}?sort=${commentSort}`);
    setComments(Array.isArray(res.data) ? res.data : []);
  };

  const handleShare = async () => {
    if (!post) return;
    const shareUrl = `https://seedlab0.vercel.app/post/${id}`;
    const shareData = {
      title: `SeedLab - Post by ${post.user?.name || 'User'}`,
      text: post.title || post.content?.substring(0, 100) || '',
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

  function buildTree(list: CommentWithMeta[]): CommentWithMeta[] {
    const map = new Map<number, CommentWithMeta & { children: CommentWithMeta[] }>();
    list.forEach(c => map.set(c.id, { ...c, children: [] }));
    const roots: (CommentWithMeta & { children: CommentWithMeta[] })[] = [];
    list.forEach(c => {
      if (c.parent_id) {
        map.get(c.parent_id)?.children.push(map.get(c.id)!);
      } else {
        roots.push(map.get(c.id)!);
      }
    });
    return roots;
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border-light)", borderTopColor: "#212121", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  if (!post) return <div style={{ textAlign: "center", padding: "100px" }}>Post not found</div>;

  const userName = post.user?.name || "User";
  const avatarUrl = post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <SEO
        title={post.title}
        description={post.content.substring(0, 150) + "..."}
        image={post.images && post.images.length > 0 ? post.images[0] : avatarUrl}
        url={window.location.href}
        type="article"
        author={userName}
        publishedTime={post.created_at}
      />

      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#fff",
        borderLeft: "1px solid #eff3f4",
        borderRight: "1px solid #eff3f4",
        minHeight: "100vh"
      }}>
        {/* Header: Back Button */}
        <div style={{
          height: "53px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          position: "sticky",
          top: 0,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 10,
          borderBottom: "1px solid transparent"
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              border: "none",
              background: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "16px", color: "#0f172a" }} />
          </button>
          <span style={{ marginLeft: "32px", fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>Post</span>
        </div>

        {/* Post Content */}
        <article style={{ padding: "16px", display: "flex", gap: "12px" }}>
          {/* Left Column: Avatar */}
          <div style={{ flexShrink: 0 }}>
            <img
              src={avatarUrl}
              alt={userName}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                display: "block"
              }}
            />
          </div>

          {/* Right Column: Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* User Info Line */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
                  {userName.toUpperCase()}
                </span>
                <VerifiedBadge username={post.user?.username} size="14px" />
              </div>
              <div style={{ fontSize: "15px", color: "#64748b" }}>
                @{post.user?.username || 'user'} • {formatRelativeDate(post.created_at)}
              </div>
            </div>

            {/* Content Text */}
            <div dir="auto" style={{
              fontSize: "15px",
              lineHeight: "1.5",
              color: "#0f172a",
              wordBreak: "break-word",
              marginBottom: "16px"
            }}>
              <ContentRenderer content={post.content} />
            </div>

            {/* Media/Images */}
            {post.images && post.images.length > 0 && (
              <div style={{
                marginBottom: "16px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid #eff3f4"
              }}>
                <ImageSlider images={post.images} />
              </div>
            )}

            {/* Links/Tags Placeholder - In your image there is a card below text */}
            {/* If we had link previews, they would go here. For now we just use ContentRenderer links */}

            {/* Actions Row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "425px",
              marginTop: "12px",
              borderTop: "1px solid #eff3f4",
              paddingTop: "4px"
            }}>
              {/* Comment */}
              <button
                onClick={() => {
                  const replyBox = document.querySelector('textarea');
                  if (replyBox) replyBox.focus();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
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
                <span>{comments.length || 0}</span>
              </button>

              {/* Like */}
              <button
                onClick={toggleLike}
                disabled={likeLoading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "none",
                  border: "none",
                  color: isLiked ? "#f91880" : "#64748b",
                  cursor: likeLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
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
                onClick={toggleSave}
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
        </article>

        {/* Reply Composer */}
        {isSignedIn && (
          <div style={{
            padding: "16px",
            borderTop: "1px solid #eff3f4",
            borderBottom: "1px solid #eff3f4",
            display: "flex",
            gap: "12px"
          }}>
            <img
              src={user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=212121&color=ffffff&bold=true`}
              alt="My Avatar"
              style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
            />
            <div style={{ flex: 1 }}>
              <MentionInput
                value={commentContent}
                onChange={setCommentContent}
                placeholder="Post your reply"
                transparent={true}
                minHeight="40px"
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: commentContent.trim() && !isSubmitting ? "#0f172a" : "#cbd5e1",
                    color: "#fff",
                    border: "none",
                    borderRadius: "100px",
                    fontWeight: 700,
                    fontSize: "15px",
                    cursor: commentContent.trim() && !isSubmitting ? "pointer" : "not-allowed",
                  }}
                >
                  {isSubmitting ? "Reply..." : "Reply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments Section */}
        <section style={{ backgroundColor: "#fff" }}>
          {comments.length === 0 ? (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "15px"
            }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {buildTree(comments).map(c => (
                <div key={c.id} style={{ borderBottom: "1px solid #eff3f4" }}>
                  <CommentBlock comment={c} depth={0} onReply={handleReply} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        body { background-color: #fff !important; }
      `}</style>
    </main>
  );
}
