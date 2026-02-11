import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { useWindowSize } from "../hooks/useWindowSize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUsers,
  faLayerGroup,
  faRocket,
  faChevronDown,
  faClock,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import type { Post } from "../hooks/usePosts";
import type { Project } from "../types/project";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import VerifiedBadge from "../components/VerifiedBadge";

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  is_organization?: boolean;
}

interface SearchPost {
  id: number;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  tags?: string[] | null;
  user?: { name: string; email: string | null; avatar_url: string | null; username?: string | null };
}

interface SearchProject {
  id: number;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  technologies_used: string[];
  status: string;
  user?: { name: string; email: string | null; avatar_url: string | null; username?: string | null };
}

type FilterType = "people" | "posts" | "projects";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>("people");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const { getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded } = useClerkUser();

  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentUserFollowing, setCurrentUserFollowing] = useState<string[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync query state with URL
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Fetch Logic
  // 1. Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.trim().length < 1) {
        setUsers([]);
        setPosts([]);
        setProjects([]);
        return;
      }

      setLoading(true);
      let cancelled = false;

      try {
        // Save to history if query is significant
        if (query.trim().length >= 2) {
          const savedHistory = localStorage.getItem("codeown_search_history");
          let currentHistory: string[] = [];
          if (savedHistory) {
            try {
              currentHistory = JSON.parse(savedHistory);
            } catch (e) {
              console.error("Failed to parse search history");
            }
          }
          const newHistory = [query.trim(), ...currentHistory.filter((item) => item !== query.trim())].slice(0, 6);
          setHistory(newHistory);
          localStorage.setItem("codeown_search_history", JSON.stringify(newHistory));
        }

        // Re-use logic for search type
        const isTag = query.startsWith("#");
        const isMention = query.startsWith("@");
        const cleanQ = isTag || isMention ? query.slice(1) : query;

        let userPromise, postPromise, projectPromise;

        if (isMention) {
          userPromise = api.get(`/search/users?q=${encodeURIComponent(cleanQ)}`);
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20`);
        } else if (isTag) {
          userPromise = Promise.resolve({ data: [] });
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(cleanQ)}&limit=20`);
        } else {
          userPromise = api.get(`/search/users?q=${encodeURIComponent(query)}`);
          postPromise = api.get(`/search/posts?q=${encodeURIComponent(query)}&limit=20`);
          projectPromise = api.get(`/search/projects?q=${encodeURIComponent(query)}&limit=20`);
        }

        const [uRes, pRes, prRes] = await Promise.all([userPromise, postPromise, projectPromise]);

        if (!cancelled) {
          setUsers(Array.isArray(uRes.data) ? uRes.data : []);
          setPosts(pRes.data?.posts || []);
          setProjects(prRes.data?.projects || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
      return () => { cancelled = true; };
    };

    const timeoutId = setTimeout(fetchResults, 300);

    return () => clearTimeout(timeoutId);
  }, [query, getToken]);

  // 2. Fetch following list for current user and initialize history
  useEffect(() => {
    if (isLoaded && clerkUser?.id) {
      api.get(`/follows/${clerkUser.id}/following`)
        .then(res => {
          if (Array.isArray(res.data)) {
            setCurrentUserFollowing(res.data.map((u: any) => u.id));
          }
        })
        .catch(console.error);
    }

    const savedHistory = localStorage.getItem("codeown_search_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history");
      }
    }
  }, [isLoaded, clerkUser?.id]);


  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSearchParams(val ? { q: val } : {});
  };

  const removeFromHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item !== q);
    setHistory(newHistory);
    localStorage.setItem("codeown_search_history", JSON.stringify(newHistory));
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    setSearchParams({ q });
  };

  const handleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    try {
      const token = await getToken();
      if (!token) return alert("Please sign in to follow");

      // Use the consistent toggle endpoint used in UserProfile
      const res = await api.post(`/follows/${targetId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const isNowFollowing = res.data.following;

      setCurrentUserFollowing(prev => {
        if (isNowFollowing) {
          return prev.includes(targetId) ? prev : [...prev, targetId];
        } else {
          return prev.filter(id => id !== targetId);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main style={{ backgroundColor: "#fff", minHeight: "100vh", paddingBottom: "40px" }}>

      {/* Top Search Bar Configuration */}
      <div style={{
        position: "sticky",
        top: isMobile ? "64px" : 0,
        backgroundColor: "#fff",
        zIndex: 100,
        borderBottom: "1px solid #f1f5f9",
        padding: "16px 0"
      }}>
        <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 16px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "30px", // Pill shape
            padding: "6px 6px 6px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            gap: "8px",
            height: "50px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <FontAwesomeIcon icon={faSearch} style={{ color: "#94a3b8", fontSize: "16px" }} />

            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={`Search...`}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "15px",
                fontWeight: 500,
                color: "#1e293b",
                background: "transparent",
                minWidth: 0 // Prevent overflow
              }}
              autoFocus
            />

            {/* Filter Dropdown */}
            <div style={{ position: "relative" }} ref={filterRef}>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#10633b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "24px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                <FontAwesomeIcon icon={activeFilter === "people" ? faUsers : activeFilter === "posts" ? faLayerGroup : faRocket} />
                <span style={{ textTransform: "capitalize" }}>{activeFilter}</span>
                <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: "12px", marginLeft: "4px" }} />
              </button>

              {isFilterOpen && (
                <div style={{
                  position: "absolute",
                  top: "120%",
                  right: 0,
                  backgroundColor: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  border: "1px solid #f1f5f9",
                  padding: "6px",
                  minWidth: "160px",
                  flexDirection: "column",
                  display: "flex",
                  zIndex: 200
                }}>
                  {[
                    { id: "people", icon: faUsers, label: "People" },
                    { id: "posts", icon: faLayerGroup, label: "Posts" },
                    { id: "projects", icon: faRocket, label: "Projects" }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setActiveFilter(opt.id as FilterType); setIsFilterOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 14px",
                        border: "none",
                        background: activeFilter === opt.id ? "#f1f5f9" : "transparent",
                        color: activeFilter === opt.id ? "#212121" : "#475569",
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                      onMouseEnter={(e) => { if (activeFilter !== opt.id) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                      onMouseLeave={(e) => { if (activeFilter !== opt.id) e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                      <FontAwesomeIcon icon={opt.icon} style={{ width: "16px" }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="container" style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : !query ? (
          <div className="fade-in">
            {history.length > 0 ? (
              <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", color: "#94a3b8" }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: "14px" }} />
                  <span style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Searches</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleHistoryClick(h)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        border: "1px solid transparent"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fff";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.transform = "translateX(4px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <FontAwesomeIcon icon={faSearch} style={{ color: "#cbd5e1", fontSize: "14px" }} />
                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#334155" }}>{h}</span>
                      </div>
                      <button
                        onClick={(e) => removeFromHistory(e, h)}
                        style={{
                          border: "none",
                          background: "none",
                          padding: "8px",
                          cursor: "pointer",
                          color: "#cbd5e1",
                          borderRadius: "8px",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={(e) => e.currentTarget.style.color = "#cbd5e1"}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "80px 40px", color: "#94a3b8" }}>
                <FontAwesomeIcon icon={faSearch} style={{ fontSize: "48px", opacity: 0.1, marginBottom: "20px" }} />
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>Search Codeown</div>
                <p style={{ margin: 0, fontSize: "14px" }}>Find people, posts, and projects from the community</p>
              </div>
            )}
          </div>
        ) : !loading && !users.length && !posts.length && !projects.length ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>No results found for "{query}"</div>
          </div>
        ) : (
          <div className="fade-in">
            {/* ... rest of the component remains same ... */}

            {activeFilter === "people" && (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px"
              }}>
                {users.map((user) => (
                  <div key={user.id}
                    onClick={() => navigate(user.username ? `/${user.username}` : `/user/${user.id}`)}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "24px",
                      padding: "24px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      backgroundColor: "#fff"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ position: "relative", marginBottom: "16px" }}>
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                        alt={user.name}
                        style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    </div>

                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center" }}>
                      {user.name}
                      <VerifiedBadge username={user.username} size="14px" />
                    </h3>
                    <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#64748b" }}>@{user.username || "user"}</p>

                    <button
                      onClick={(e) => handleFollow(e, user.id)}
                      style={{
                        backgroundColor: currentUserFollowing.includes(user.id) ? "#f1f5f9" : "#10633b",
                        color: currentUserFollowing.includes(user.id) ? "#475569" : "#fff",
                        border: "none",
                        borderRadius: "20px",
                        padding: "8px 24px",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                        width: "100%"
                      }}
                    >
                      {currentUserFollowing.includes(user.id) ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
                {users.length === 0 && <EmptyState type="People" />}
              </div>
            )}

            {activeFilter === "posts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post as Post} />
                ))}
                {posts.length === 0 && <EmptyState type="Posts" />}
              </div>
            )}

            {activeFilter === "projects" && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}>
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project as Project} />
                ))}
                {projects.length === 0 && <EmptyState type="Projects" />}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div style={{
      gridColumn: "1 / -1",
      textAlign: "center",
      padding: "60px",
      backgroundColor: "#f8fafc",
      borderRadius: "20px",
      color: "#64748b"
    }}>
      <div style={{ fontSize: "18px", fontWeight: 600 }}>No {type} found</div>
      <p>Try adjusting your search terms</p>
    </div>
  )
}
