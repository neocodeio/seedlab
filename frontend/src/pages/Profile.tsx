import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useWindowSize } from "../hooks/useWindowSize";
import { useClerkUser } from "../hooks/useClerkUser";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useUserPosts } from "../hooks/useUserPosts";
import { useSavedPosts } from "../hooks/useSavedPosts";
import { useUserProjects } from "../hooks/useUserProjects";
import { useUserSavedProjects } from "../hooks/useUserSavedProjects";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import EditProfileModal from "../components/EditProfileModal";
import ProjectModal from "../components/ProjectModal";
import FollowersModal from "../components/FollowersModal";
import BioRenderer from "../components/BioRenderer";
import Lightbox from "../components/Lightbox";
import { formatJoinDate } from "../utils/date";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faUserEdit, faSignOutAlt, faKey, faLayerGroup, faRocket, faCalendarAlt, faGlobe, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { faGithub, faInstagram, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import VerifiedBadge from "../components/VerifiedBadge";
import { SEO } from "../components/SEO";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  username_changed_at: string | null;
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

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { signOut, getToken } = useClerkAuth();
  const navigate = useNavigate();
  const userId = user?.id || null;
  const { posts, fetchUserPosts } = useUserPosts(userId);
  const { savedPosts, loading: savedPostsLoading, fetchSavedPosts } = useSavedPosts();
  const { projects, fetchUserProjects } = useUserProjects(userId);
  const { projects: savedProjects, loading: savedProjectsLoading, fetchUserSavedProjects } = useUserSavedProjects(userId);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "saved">("posts");
  const [savedSubTab, setSavedSubTab] = useState<"posts" | "projects">("posts");
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<"followers" | "following">("followers");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const handleProfileUpdated = useCallback(async () => {
    if (userId) {
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setUserProfile(res.data);
        fetchUserPosts();
        fetchSavedPosts();
        fetchUserProjects();
        fetchUserSavedProjects();
      } catch (error) {
        console.error("Error refreshing profile:", error);
      }
    }
  }, [userId, getToken, fetchUserPosts, fetchSavedPosts, fetchUserProjects, fetchUserSavedProjects]);

  useEffect(() => {
    const closeMenu = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [isMenuOpen]);

  useEffect(() => {
    window.addEventListener("profileUpdated", handleProfileUpdated);
    window.addEventListener("projectCreated", fetchUserProjects);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdated);
      window.removeEventListener("projectCreated", fetchUserProjects);
    };
  }, [handleProfileUpdated, fetchUserProjects]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const token = await getToken();
        const res = await api.get(`/users/${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data) setUserProfile(res.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    if (userId) fetchProfile();
  }, [userId, getToken]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  if (!isLoaded) return (
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

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  const avatarUrl = userProfile?.avatar_url || user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "U")}&background=212121&color=fff&bold=true`;

  return (
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <SEO title="My Profile" description="Manage your SeedLab profile and settings." />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUpMobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes tabContentEnter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .tab-content-enter { animation: tabContentEnter 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
        .slide-up-mobile { animation: slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .menu-item {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: none;
          background: none;
          color: #1e293b;
          font-weight: 700;
          cursor: pointer;
          border-radius: 16px;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }
        .menu-item:active {
          background-color: #f1f5f9;
          transform: scale(0.98);
        }
        .menu-item-danger {
          color: #ef4444;
        }
        .menu-item-danger:active {
          background-color: #fff1f2;
        }
        .menu-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background-color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .menu-item:active .menu-icon-box {
          transform: scale(0.9);
        }
        
        .profile-btn {
          padding: 10px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #334155;
          cursor: pointer;
        }
        .profile-btn:hover {
          background: #f1f5f9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .profile-btn-primary {
          background: #212121;
          color: white;
          border-color: #212121;
        }
        .profile-btn-primary:hover {
          background: #444;
          border-color: #444;
          color: white;
        }
        .tab-item {
          padding: 16px 24px;
          font-size: 14px;
          font-weight: 800;
          color: #94a3b8;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          border: none;
          background: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tab-item.active {
          color: #212121;
        }
        .stat-card {
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          background: white;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.05);
          border-color: #e2e8f0;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          background: #f1f5f9;
          color: #64748b;
          transition: all 0.3s ease;
        }
        .stat-card:hover .stat-icon {
          background: #f0f0f0;
          color: #212121;
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
          {userProfile?.banner_url ? (
            <img
              src={userProfile.banner_url}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "32px" }}
              alt="Banner"
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              // Dynamic gradient based on username length to give some variety
              background: `linear-gradient(135deg, hsl(${(userProfile?.username?.length || 5) * 40}, 80%, 96%) 0%, hsl(${(userProfile?.username?.length || 5) * 40 + 40}, 80%, 96%) 100%)`,
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
        <div style={{ padding: "0 10px" }}>
          <div style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "12px" : "16px",
            marginBottom: "16px"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <h1 style={{
                fontSize: isMobile ? "28px" : "42px",
                fontWeight: 900,
                color: "#000",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "-0.04em",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {userProfile?.name || user?.fullName}
                <VerifiedBadge username={userProfile?.username || user?.username} size={isMobile ? "24px" : "16px"} />
              </h1>
              <div style={{
                fontSize: "18px",
                color: "#64748b",
                fontWeight: 500
              }}>
                @{userProfile?.username || user?.username}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "100px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                <FontAwesomeIcon icon={faUserEdit} style={{ fontSize: "14px" }} />
                Edit Profile
              </button>

              <button
                onClick={() => {
                  const username = userProfile?.username || user?.username;
                  const shareUrl = username
                    ? `${window.location.origin}/${username}`
                    : `${window.location.origin}/user/${user?.id}`;

                  if (navigator.share) {
                    navigator.share({
                      title: `${userProfile?.name || user?.fullName} on SeedLab`,
                      text: userProfile?.bio || `Check out my profile on SeedLab!`,
                      url: shareUrl,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Profile link copied to clipboard!");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                title="Share Profile"
              >
                <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: "14px" }} />
              </button>

              <div style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "10px",
                    fontSize: isMobile ? "22px" : "18px"
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisV} />
                </button>
                {isMenuOpen && createPortal(
                  <>
                    {/* Backdrop */}
                    <div
                      onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                      style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(8px)",
                        zIndex: 10000,
                        cursor: "pointer",
                        animation: "fadeIn 0.3s ease-out"
                      }}
                    />
                    <div style={{
                      position: "fixed",
                      bottom: isMobile ? "0" : "auto",
                      left: isMobile ? "0" : "50%",
                      right: isMobile ? "0" : "auto",
                      transform: isMobile ? "none" : "translate(-50%, -50%)",
                      top: isMobile ? "auto" : "50%",
                      backgroundColor: "#fff",
                      borderRadius: isMobile ? "32px 32px 0 0" : "28px",
                      boxShadow: isMobile ? "0 -10px 40px rgba(0,0,0,0.3)" : "0 20px 60px rgba(0,0,0,0.2)",
                      width: isMobile ? "100%" : "380px",
                      zIndex: 10001,
                      padding: isMobile ? "16px 20px calc(24px + env(safe-area-inset-bottom))" : "24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      animation: isMobile ? "slideUpMobile 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "fadeIn 0.3s ease-out"
                    }} onClick={(e) => e.stopPropagation()}>
                      {isMobile && (
                        <div style={{
                          width: "40px",
                          height: "4px",
                          backgroundColor: "#e2e8f0",
                          borderRadius: "2px",
                          margin: "0 auto 12px",
                          flexShrink: 0
                        }} />
                      )}

                      <div style={{ padding: "8px 16px", marginBottom: "4px" }}>
                        <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Settings & Account</h3>
                      </div>

                      <button
                        className="menu-item"
                        onClick={() => { setIsMenuOpen(false); navigate("/forgot-password"); }}
                      >
                        <div className="menu-icon-box">
                          <FontAwesomeIcon icon={faKey} style={{ fontSize: "18px" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "16px", fontWeight: 800 }}>Reset Password</span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Update your security credentials</span>
                        </div>
                      </button>

                      <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "8px 16px" }} />

                      <button
                        className="menu-item menu-item-danger"
                        onClick={() => { setIsMenuOpen(false); handleSignOut(); }}
                      >
                        <div className="menu-icon-box" style={{ backgroundColor: "#fff1f2", color: "#ef4444" }}>
                          <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: "18px" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "16px", fontWeight: 800 }}>Sign Out</span>
                          <span style={{ fontSize: "12px", color: "#fca5a5", fontWeight: 500 }}>Exit from your account session</span>
                        </div>
                      </button>

                      {isMobile && (
                        <button
                          onClick={() => setIsMenuOpen(false)}
                          style={{
                            marginTop: "16px",
                            width: "100%",
                            padding: "16px",
                            border: "none",
                            background: "#f1f5f9",
                            color: "#64748b",
                            fontWeight: 800,
                            borderRadius: "18px",
                            fontSize: "14px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          CANCEL
                        </button>
                      )}
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>

          {userProfile?.bio && (
            <div style={{
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#334155",
              marginBottom: "20px",
              maxWidth: "600px"
            }}>
              <BioRenderer bio={userProfile.bio} />
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "14px", fontWeight: 600 }}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              Joined {formatJoinDate(userProfile?.created_at || "")}
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              color: "#64748b",
              fontSize: "14px",
              fontWeight: 600
            }}>
              <span
                onClick={() => { setFollowersModalType("followers"); setFollowersModalOpen(true); }}
                style={{ cursor: "pointer", color: "#1e293b" }}
              >
                <strong style={{ fontWeight: 800 }}>{userProfile?.follower_count || 0}</strong> followers
              </span>
              <span
                onClick={() => { setFollowersModalType("following"); setFollowersModalOpen(true); }}
                style={{ cursor: "pointer", color: "#1e293b" }}
              >
                <strong style={{ fontWeight: 800 }}>{userProfile?.following_count || 0}</strong> following
              </span>
              <span style={{ color: "#1e293b" }}>
                <strong style={{ fontWeight: 800 }}>{userProfile?.total_likes || 0}</strong> likes
              </span>
            </div>
          </div>

          {/* Social Icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
            {userProfile?.github_url && (
              <a href={userProfile.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGithub} />
              </a>
            )}
            {userProfile?.twitter_url && (
              <a href={userProfile.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            )}
            {userProfile?.linkedin_url && (
              <a href={userProfile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
            )}
            {userProfile?.website_url && (
              <a href={userProfile.website_url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontSize: "20px" }}>
                <FontAwesomeIcon icon={faGlobe} />
              </a>
            )}
          </div>

          {/* Tech Stack / Skills */}
          {userProfile?.skills && userProfile.skills.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Tech Stack</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {userProfile.skills.map((skill) => (
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
          <button
            onClick={() => setActiveTab("saved")}
            className={`tab-btn ${activeTab === "saved" ? "active" : ""}`}
          >
            SAVED
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
                  <PostCard
                    key={p.id}
                    post={p}
                    onUpdated={handleProfileUpdated}
                    isPinned={userProfile?.pinned_post_id === p.id}
                  />
                ))
              )}
            </div>
          ) : activeTab === "projects" ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {projects.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3 }}><FontAwesomeIcon icon={faRocket} /></div>
                  No projects launched yet.
                </div>
              ) : (
                projects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={() => fetchUserProjects()} />)
              )}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                <button
                  onClick={() => setSavedSubTab("posts")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: savedSubTab === "posts" ? "#000" : "white",
                    color: savedSubTab === "posts" ? "white" : "#64748b",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  POSTS
                </button>
                <button
                  onClick={() => setSavedSubTab("projects")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    background: savedSubTab === "projects" ? "#000" : "white",
                    color: savedSubTab === "projects" ? "white" : "#64748b",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  PROJECTS
                </button>
              </div>
              {savedSubTab === "posts" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {savedPostsLoading ? <div style={{ padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                    savedPosts.length === 0 ? <div style={{ padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>No saved posts.</div> :
                      savedPosts.map((p) => <PostCard key={p.id} post={p} onUpdated={handleProfileUpdated} />)
                  }
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                  {savedProjectsLoading ? <div style={{ gridColumn: "1 / -1", padding: "40px 0", textAlign: "center" }}>Loading...</div> :
                    savedProjects.length === 0 ? <div style={{ gridColumn: "1 / -1", padding: "80px 0", textAlign: "center", color: "#94a3b8", fontWeight: 700, backgroundColor: "white", borderRadius: "24px", border: "1px solid #f1f5f9" }}>No saved projects.</div> :
                      savedProjects.map((p) => <ProjectCard key={p.id} project={p} onUpdated={fetchUserSavedProjects} />)
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {userProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUpdated={handleProfileUpdated} currentUser={userProfile} />}
      <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onUpdated={() => fetchUserProjects()} />
      {userId && <FollowersModal isOpen={followersModalOpen} onClose={() => setFollowersModalOpen(false)} userId={userId} type={followersModalType} title={followersModalType === "followers" ? "FOLLOWERS" : "FOLLOWING"} />}
    </main>
  );
}
