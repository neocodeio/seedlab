import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
// import { useWindowSize } from "../hooks/useWindowSize";

export default function SearchBar() {
  const { query, setQuery, users, posts, showResults, setShowResults, clearSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedHistory = localStorage.getItem("seedlab_search_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history");
      }
    }
  }, []);

  const addToHistory = (q: string) => {
    if (!q || q.trim().length < 2) return;
    const newHistory = [q.trim(), ...history.filter((item) => item !== q.trim())].slice(0, 6);
    setHistory(newHistory);
    localStorage.setItem("seedlab_search_history", JSON.stringify(newHistory));
  };

  const removeFromHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const newHistory = history.filter((item) => item !== q);
    setHistory(newHistory);
    localStorage.setItem("seedlab_search_history", JSON.stringify(newHistory));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowResults]);

  const handleUserClick = (userId: string) => {
    addToHistory(query);
    navigate(`/user/${userId}`);
    clearSearch();
    setIsOpen(false);
  };

  const handlePostClick = (postId: number) => {
    addToHistory(query);
    navigate(`/post/${postId}`);
    clearSearch();
    setIsOpen(false);
  };

  const handleHistoryClick = (q: string) => {
    setQuery(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <input
        type="text"
        placeholder="SEARCH..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        style={{
          outline: "none",
          width: "100%",
          padding: "10px 16px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: "#f1f5f9",
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim().length >= 2) {
            addToHistory(query);
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setIsOpen(false);
          }
        }}
      />

      {isOpen && (
        <div className="fade-in scroll-styled" style={{
          position: "absolute",
          top: "140%",
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          border: "1px solid #f1f5f9",
          borderRadius: "20px",
          maxHeight: "360px",
          overflowY: "auto",
          zIndex: 2000,
          padding: "12px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}>
          {/* History Section */}
          {!query && history.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Recent Searches</span>
              </div>
              {history.map((h, i) => (
                <div key={i} onClick={() => handleHistoryClick(h)} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderRadius: "14px",
                  marginBottom: "4px",
                  transition: "all 0.2s ease",
                  backgroundColor: "#f8fafc"
                }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f0f0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f8fafc"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>{h}</span>
                  </div>
                  <button onClick={(e) => removeFromHistory(e, h)} style={{ border: "none", background: "none", padding: "4px 8px", cursor: "pointer", color: "#94a3b8", borderRadius: "8px" }} onMouseEnter={(e) => e.currentTarget.style.color = "#ef4444"}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query && showResults && (
            <>
              {users.length > 0 && (
                <div style={{ padding: "8px 0" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 10px 12px", display: "block" }}>People</span>
                  {users.map((u) => (
                    <div key={u.id} onClick={() => handleUserClick(u.id)} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      cursor: "pointer",
                      borderRadius: "14px",
                      marginBottom: "4px",
                      transition: "all 0.2s ease"
                    }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f0f0f0"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=212121&color=fff&bold=true`} alt="" style={{ width: "28px", height: "28px", borderRadius: "10px", border: "1px solid #f1f5f9" }} />
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{u.name}</div>
                    </div>
                  ))}
                </div>
              )}
              {posts.length > 0 && (
                <div style={{ padding: "8px 0", borderTop: "1px solid #f1f5f9", marginTop: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 10px", display: "block" }}>Posts</span>
                  {posts.map((p) => (
                    <div key={p.id} onClick={() => handlePostClick(p.id)} style={{
                      padding: "12px",
                      cursor: "pointer",
                      borderRadius: "14px",
                      marginBottom: "4px",
                      transition: "all 0.2s ease"
                    }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || p.content.slice(0, 40) + "..."}</div>
                    </div>
                  ))}
                </div>
              )}
              {users.length === 0 && posts.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
                  No results found for "{query}"
                </div>
              )}
            </>
          )}

          {query && !showResults && (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
