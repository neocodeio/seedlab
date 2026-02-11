import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useUserPosts } from "../hooks/useUserPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FollowersModal from "../components/FollowersModal";
import BioRenderer from "../components/BioRenderer";
import { formatJoinDate } from "../utils/date";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faThumbtack,
  faUserCheck,
  faEnvelope,
  faRocket,
  faLayerGroup,
  faCalendarAlt,
  faGlobe,
  faShareNodes,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { useWindowSize } from "../hooks/useWindowSize";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";
import { toast } from "react-toastify";
import Lightbox from "../components/Lightbox";

interface User {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  username: string | null;
  follower_count: number;
  following_count: number;
  total_likes: number;
  pinned_post_id: number | null;
  pinned_post: any | null;
  job_title: string | null;
  location: string | null;
  experience_level: string | null;
  skills: string[] | null;
  is_hirable: boolean;
  is_organization: boolean;
  github_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  banner_url: string | null;
  created_at: string | null;
}

export default function UserProfile() {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isSignedIn } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Hooks depend on user ID. If we use username route, we need to wait for user fetch to get ID.
  // We pass user?.id which will update once user is fetched.
  const { posts, fetchUserPosts } = useUserPosts(user?.id || userId || null);
  const { projects, fetchUserProjects } = useUserProjects(user?.id || userId || null);

  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [activeTab, setActiveTab] = useState<"posts" | "projects">("posts");
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const isOwnProfile = currentUser?.id === (user?.id || userId);

  useEffect(() => {
    const fetchUser = async () => {
      const param = userId || username;
      if (!param) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getToken();
        // Assuming backend works with both ID and Username at this endpoint, 
        // or frontend needs to query different endpoints.
        // For now, let's try the generic endpoint.
        const userRes = await api.get(`/users/${param}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (userRes.data) {
          setUser(userRes.data);

          // If we accessed via ID but user has a username, update the URL
          if (userId && userRes.data.username) {
            const newPath = `/${userRes.data.username}`;
            window.history.replaceState(null, "", newPath);
          }
        } else {
          setUser(null);
        }

        if (isSignedIn && userRes.data && currentUser?.id !== userRes.data.id) {
          try {
            const followRes = await api.get(`/follows/${userRes.data.id}/status`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setIsFollowing(followRes.data.isFollowing || false);
          } catch (error) {
            console.error("Error checking follow status:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, username, isSignedIn, currentUser?.id, getToken]);

  const handleFollow = async () => {
    const targetId = user?.id || userId;
    if (!isSignedIn || !targetId) {
      navigate("/sign-in");
      return;
    }

    setFollowLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await api.post(`/follows/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFollowing(res.data.following);

      if (user) {
        setUser({
          ...user,
          follower_count: res.data.followerCount ?? (res.data.following ? user.follower_count + 1 : Math.max(0, user.follower_count - 1)),
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "40px 20px"
      }}>
        {/* Banner Skeleton */}
        <div style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          borderRadius: "32px",
          backgroundColor: "#e2e8f0",
          position: "relative",
          marginBottom: isMobile ? "60px" : "80px",
          animation: "pulse 1.5s infinite ease-in-out"
        }}>
          {/* Avatar Skeleton */}
          <div style={{
            position: "absolute",
            bottom: isMobile ? "-40px" : "-60px",
            left: isMobile ? "50%" : "40px",
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "100px" : "150px",
            height: isMobile ? "100px" : "150px",
            borderRadius: "100%",
            border: "4px solid white",
            backgroundColor: "#cbd5e1",
            zIndex: 10
          }} />
        </div>

        {/* User Info Skeleton */}
        <div style={{
          padding: isMobile ? "0 4px" : "0 10px",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "center" : "flex-end",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", alignItems: isMobile ? "center" : "flex-start" }}>
              <div style={{ width: "60%", height: "40px", backgroundColor: "#e2e8f0", borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "30%", height: "24px", backgroundColor: "#f1f5f9", borderRadius: "6px", animation: "pulse 1.5s infinite ease-in-out" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "140px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
              <div style={{ width: "44px", height: "44px", borderRadius: "100px", backgroundColor: "#e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
            </div>
          </div>

          <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "8px", alignItems: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "100%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "90%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80%", height: "16px", backgroundColor: "#f1f5f9", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          <div style={{ display: "flex", gap: "24px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "80px", height: "20px", backgroundColor: "#e2e8f0", borderRadius: "4px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>
        </div>

        {/* Content Skeleton (mimics tabs and posts) */}
        <div style={{ marginTop: "40px", display: "flex", flexDirection: "column", gap: "32px", alignItems: isMobile ? "center" : "flex-start" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "100px", height: "40px", backgroundColor: "#e2e8f0", borderRadius: "12px", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "100px", height: "40px", backgroundColor: "#f1f5f9", borderRadius: "12px", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>

          {/* Content Grid */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ width: "100%", height: "200px", backgroundColor: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
            <div style={{ width: "100%", height: "200px", backgroundColor: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", animation: "pulse 1.5s infinite ease-in-out" }} />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.995); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </main>
  );

  if (!user) return <div style={{ textAlign: "center", padding: "100px", fontWeight: 800 }}>USER NOT FOUND.</div>;

  if (isOwnProfile) {
    navigate("/profile", { replace: true });
    return null;
  }

  const avatarUrl = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "U")}&background=212121&color=ffffff&bold=true`;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <SEO
        title={`${user.name} (@${user.username})`}
        description={user.bio || `Check out ${user.name}'s developer profile on SeedLab.`}
        image={avatarUrl}
        url={user.username ? `${window.location.origin}/${user.username}` : window.location.href}
        type="profile"
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tab-content-enter { animation: tabContentEnter 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        
        .profile-btn {
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          color: #334155;
          cursor: pointer;
        }
        .profile-btn:hover {
          background: #fff;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          border-color: #cbd5e1;
        }
        .profile-btn-primary {
          background: #1e293b;
          color: white;
          border-color: #1e293b;
        }
        .profile-btn-primary:hover {
          background: #0f172a;
          color: white;
        }
        .profile-btn-following {
          background: white;
          color: #1e293b;
          border: 2px solid #1e293b;
        }
        
        .tab-btn {
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: transparent;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-radius: 12px;
        }
        .tab-btn:hover {
          color: #1e293b;
          background: rgba(241, 245, 249, 0.6);
        }
        .tab-btn.active {
          color: #1e293b;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px;
          border-right: 1px solid #f1f5f9;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .stat-item:last-child { border-right: none; }
        .stat-item:hover { transform: translateY(-2px); }
        .stat-value { font-size: 20px; font-weight: 800; color: #1e293b; }
        .stat-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>

      <div style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: isMobile ? "20px 16px" : "40px 20px"
      }}>
        {/* Banner Section */}
        <div style={{
          width: "100%",
          height: isMobile ? "200px" : "320px",
          borderRadius: "32px",
          backgroundColor: "#fff",
          border: "1px solid #e2e8f0",
          overflow: "visible", // Allow avatar to overlap
          position: "relative",
          marginBottom: isMobile ? "60px" : "80px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.02)"
        }}>
          {user.banner_url ? (
            <img
              src={user.banner_url}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "32px" }}
              alt="Banner"
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              // Dynamic gradient based on username length to give some variety
              background: `linear-gradient(135deg, hsl(${(user.username?.length || 5) * 40}, 80%, 96%) 0%, hsl(${(user.username?.length || 5) * 40 + 40}, 80%, 96%) 100%)`,
              borderRadius: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }} />
          )}

          {/* Avatar overlapped bottom */}
          <div style={{
            position: "absolute",
            bottom: isMobile ? "-40px" : "-60px",
            left: isMobile ? "50%" : "40px",
            transform: isMobile ? "translateX(-50%)" : "none",
            width: isMobile ? "100px" : "150px",
            height: isMobile ? "100px" : "150px",
            borderRadius: "100%",
            border: "1px solid white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
            backgroundColor: "white",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            cursor: "pointer"
          }} onClick={() => {
            setLightboxImage(avatarUrl);
            setLightboxOpen(true);
          }}>
            <img
              src={avatarUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="Profile"
            />
          </div>
        </div>

        <Lightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageSrc={lightboxImage}
        />

        {/* User Info Section */}
        <div style={{
          padding: isMobile ? "0 4px" : "0 10px",
          textAlign: isMobile ? "center" : "left",
          display: "flex",
          flexDirection: "column",
          gap: "24px"
        }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "center" : "flex-end",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <h1 style={{
                fontSize: isMobile ? "28px" : "36px",
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.03em",
                display: "flex",
                alignItems: "center",
                justifyContent: isMobile ? "center" : "flex-start",
                gap: "10px"
              }}>
                {user.name}
                <VerifiedBadge username={user.username} size={isMobile ? "22px" : "26px"} />
              </h1>
              <div style={{
                fontSize: "18px",
                color: "#64748b",
                fontWeight: 500,
                letterSpacing: "0.01em"
              }}>
                @{user.username}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {isSignedIn && (
                <button
                  onClick={() => navigate(`/messages?userId=${user.id}`)}
                  className="profile-btn"
                  title="Message"
                  style={{ width: "44px", height: "44px", padding: 0, justifyContent: "center" }}
                >
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: "16px" }} />
                </button>
              )}
              {isSignedIn && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`profile-btn ${isFollowing ? 'profile-btn-following' : 'profile-btn-primary'}`}
                  style={{ minWidth: isMobile ? "120px" : "140px", justifyContent: "center" }}
                >
                  <FontAwesomeIcon icon={isFollowing ? faUserCheck : faUserPlus} />
                  <span>{isFollowing ? "Following" : "Follow"}</span>
                </button>
              )}
              <button
                onClick={() => {
                  const shareUrl = user.username
                    ? `${window.location.origin}/${user.username}`
                    : window.location.href;

                  if (navigator.share) {
                    navigator.share({
                      title: `${user.name} on SeedLab`,
                      text: user.bio || `Check out ${user.name}'s profile on SeedLab!`,
                      url: shareUrl,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Profile link copied to clipboard!");
                  }
                }}
                className="profile-btn"
                title="Share Profile"
                style={{ width: "44px", height: "44px", padding: 0, justifyContent: "center" }}
              >
                <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: "16px" }} />
              </button>
            </div>
          </div>

          {user.bio && (
            <div style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#334155",
              marginBottom: "20px",
              maxWidth: "600px"
            }}>
              <BioRenderer bio={user.bio} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: "6px", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Joined {formatJoinDate(user.created_at || "")}
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "center" : "flex-start",
              gap: "24px",
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 600
            }}>
              <span
                onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                style={{ cursor: "pointer", color: "#1e293b" }}
              >
                <strong style={{ fontWeight: 800 }}>{user.follower_count || 0}</strong> followers
              </span>
              <span
                onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                style={{ cursor: "pointer", color: "#1e293b" }}
              >
                <strong style={{ fontWeight: 800 }}>{user.following_count || 0}</strong> following
              </span>
              <span style={{ color: "#1e293b" }}>
                <strong style={{ fontWeight: 800 }}>{user.total_likes || 0}</strong> likes
              </span>
            </div>
          </div>

          {/* Social Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
            {user.github_url && (
              <a href={user.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGithub} />
              </a>
            )}
            {user.twitter_url && (
              <a href={user.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            )}
            {user.linkedin_url && (
              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
            )}
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGlobe} />
              </a>
            )}
          </div>

          {/* Tech Stack / Skills */}
          {user.skills && user.skills.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Tech Stack</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#334155",
                      transition: "all 0.2s ease",
                      cursor: "default"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#212121";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        <div style={{
          display: "flex",
          justifyContent: isMobile ? "center" : "flex-start",
          padding: "6px",
          backgroundColor: "#f1f5f9",
          borderRadius: "18px",
          width: "fit-content",
          marginBottom: "32px",
          marginTop: "40px",
          margin: isMobile ? "40px auto 32px" : "40px 0 32px"
        }}>
          <button
            onClick={() => setActiveTab("posts")}
            className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          >
            POSTS
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
          >
            PROJECTS
          </button>
        </div>

        {/* Tab Content */}
        <div key={activeTab} className="tab-content-enter">
          {activeTab === "posts" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {posts.length === 0 ? (
                <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faLayerGroup} /></div>
                  No posts published yet.
                </div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <PostCard post={p} onUpdated={fetchUserPosts} />
                    {user.pinned_post_id === p.id && (
                      <div style={{
                        position: "absolute",
                        top: "20px",
                        left: "20px",
                        background: "#212121",
                        color: "white",
                        padding: "6px 14px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        zIndex: 10,
                        boxShadow: "0 4px 15px rgba(33, 33, 33, 0.3)"
                      }}>
                        <FontAwesomeIcon icon={faThumbtack} />
                        Featured
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {projects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                  No projects launched yet.
                </div>
              ) : (
                projects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={fetchUserProjects} />)
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: "100px" }} />

      {user.id && (
        <FollowersModal
          isOpen={followersModalOpen}
          onClose={() => setFollowersModalOpen(false)}
          userId={user.id}
          type={followersModalType}
          title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"}
        />
      )}
    </main>
  );
}
