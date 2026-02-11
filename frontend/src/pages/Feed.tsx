import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import ProjectCard from "../components/ProjectCard";
import FeedPostComposer from "../components/FeedPostComposer";
import { usePosts, type FeedFilter } from "../hooks/usePosts";
import { useProjects } from "../hooks/useProjects";
import { useClerkAuth } from "../hooks/useClerkAuth";
import { useClerkUser } from "../hooks/useClerkUser";
import { useWindowSize } from "../hooks/useWindowSize";
import { PostCardSkeleton } from "../components/LoadingSkeleton";
import { SEO } from "../components/SEO";

export default function Feed() {
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync state with URL params
  const feedType = (searchParams.get("type") as "posts" | "projects") || "posts";
  const feedFilter = (searchParams.get("filter") as FeedFilter) || "all";
  const selectedTag = searchParams.get("tag") || "";
  const selectedLang = (searchParams.get("lang") as "en" | "ar" | "") || "";
  const [page, setPage] = useState(1);

  // Helper to update search params
  const updateParams = (newParams: Record<string, string | null>) => {
    setSearchParams(prev => {
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") prev.delete(key);
        else prev.set(key, value);
      });
      return prev;
    }, { replace: true });
    setPage(1); // Reset page on any filter change
  };

  const setFeedFilter = (filter: FeedFilter) => updateParams({ filter });

  const { getToken } = useClerkAuth();
  const { isSignedIn } = useClerkUser();

  // Hooks - only pagination for the active tab; inactive tab stays at page 1
  const postsPage = feedType === 'posts' ? page : 1;
  const projectsPage = feedType === 'projects' ? page : 1;

  const { posts, loading: postsLoading, fetchPosts, hasMore: postsHasMore } = usePosts(postsPage, 20, feedFilter, getToken, selectedTag, selectedLang || undefined);
  const { projects, loading: projectsLoading, fetchProjects, hasMore: projectsHasMore } = useProjects(projectsPage, 20, feedFilter, getToken, selectedTag);

  const loading = feedType === "posts" ? postsLoading : projectsLoading;
  const hasMore = feedType === "posts" ? postsHasMore : projectsHasMore;

  useEffect(() => {
    if (!isSignedIn && feedFilter === "following") setFeedFilter("all");
  }, [isSignedIn, feedFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        if (hasMore && !loading) {
          setPage((prev) => prev + 1);
          if (feedType === "posts") {
            fetchPosts(page + 1, true);
          } else {
            fetchProjects(page + 1, true);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, page, fetchPosts, fetchProjects, feedType]);

  const handleFilterChange = (f: FeedFilter) => {
    setFeedFilter(f);
    setPage(1);
  };

  const currentItems = feedType === "posts" ? posts : projects;

  // Handle click outside for filter dropdown
  const handlePostCreated = () => {
    setPage(1);
    fetchPosts(1, false);
  };

  useEffect(() => {
    window.addEventListener("postCreated", handlePostCreated);
    return () => window.removeEventListener("postCreated", handlePostCreated);
  }, []);

  return (
    <main style={{ padding: 0, minHeight: "100vh", backgroundColor: "#fff" }}>
      <SEO
        title="Home"
        description="Share your projects, discover amazing code, and connect with developers worldwide on Codeown."
      />
      <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "#fff", borderLeft: "1px solid #eff3f4", borderRight: "1px solid #eff3f4", minHeight: "100vh" }}>
        {/* Top Tabs */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #eff3f4",
          position: "sticky",
          top: isMobile ? "64px" : 0,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          zIndex: 10
        }}>
          <div
            onClick={() => handleFilterChange("all")}
            style={{
              flex: 1,
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: feedFilter === "all" ? 700 : 500,
              color: feedFilter === "all" ? "#0f172a" : "#64748b",
              position: "relative",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            For You
            {feedFilter === "all" && (
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "56px", height: "4px", backgroundColor: "#10633b", borderRadius: "0px" }} />
            )}
          </div>
          <div
            onClick={() => handleFilterChange("following")}
            style={{
              flex: 1,
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: feedFilter === "following" ? 700 : 500,
              color: feedFilter === "following" ? "#0f172a" : "#64748b",
              position: "relative",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#eff3f4"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            Following
            {feedFilter === "following" && (
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "70px", height: "4px", backgroundColor: "#10633b", borderRadius: "0px" }} />
            )}
          </div>
        </div>

        {/* Content Type Selector */}
        <div style={{
          display: "flex",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid #eff3f4",
          backgroundColor: "#fff"
        }}>
          <button
            onClick={() => updateParams({ type: "posts" })}
            style={{
              padding: "6px 14px",
              borderRadius: "100px",
              border: "1px solid #eff3f4",
              backgroundColor: feedType === "posts" ? "#0f172a" : "#fff",
              color: feedType === "posts" ? "#fff" : "#64748b",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Posts
          </button>
          <button
            onClick={() => updateParams({ type: "projects" })}
            style={{
              padding: "6px 14px",
              borderRadius: "100px",
              border: "1px solid #eff3f4",
              backgroundColor: feedType === "projects" ? "#0f172a" : "#fff",
              color: feedType === "projects" ? "#fff" : "#64748b",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Projects
          </button>
        </div>

        {/* Composer */}
        {feedType === "posts" && (
          <FeedPostComposer onCreated={() => { setPage(1); fetchPosts(1, false); }} />
        )}

        {
          loading && (!currentItems || currentItems.length === 0) ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ padding: "20px", borderBottom: "1px solid #eff3f4" }}>
                  <PostCardSkeleton />
                </div>
              ))}
            </div>
          ) : !Array.isArray(currentItems) || currentItems.length === 0 ? (
            <div className="fade-in" style={{ padding: "80px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {feedFilter === "following" ? (
                <>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                    Follow creators to see their activity
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6, maxWidth: "400px", margin: "0 auto 32px" }}>
                    It looks like you haven't followed anyone yet. Discover amazing creators and start building your feed!
                  </p>
                  <button
                    onClick={() => handleFilterChange("all")}
                    style={{
                      padding: "12px 24px",
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "100px",
                      fontWeight: 700,
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Explore
                  </button>
                </>
              ) : (
                <>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px", color: "#0f172a" }}>
                    Nothing here yet
                  </h2>
                  <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.6 }}>
                    Check back later for new {feedType}!
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="feed-stream" style={{ display: "flex", flexDirection: "column" }}>
              {feedType === "posts" ? (
                // Items are Posts
                (currentItems as any[]).map((p) => (
                  <PostCard key={p.id} post={p} onUpdated={() => fetchPosts(page, false)} />
                ))
              ) : (
                // Items are Projects
                (currentItems as any[]).map((p) => (
                  <ProjectCard key={p.id} project={p} onUpdated={() => fetchProjects(page, false)} />
                ))
              )}

              {loading && (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <div className="spinner" />
                </div>
              )}
            </div>
          )
        }
      </div >
    </main >
  );
}
