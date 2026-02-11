import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { ensureUserExists } from "./users.controller.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function getPosts(req: Request, res: Response) {
  try {
    const { page = "1", limit = "20", filter = "all", tag, lang } = req.query;
    console.log("getPosts query params:", { page, limit, filter, tag, lang });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let postsQuery = supabase.from("posts").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (lang && typeof lang === 'string' && lang.trim().length > 0) {
      const languageCode = lang.toLowerCase().trim();
      console.log(`Applying language filter: '${languageCode}'`);

      // Filter strictly by the language column
      postsQuery = postsQuery.eq("language", languageCode);
    }

    if (tag) {
      postsQuery = postsQuery.contains("tags", [tag]);
    }

    if (String(filter).toLowerCase() === "following") {
      const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Sign in to view the Following feed." });
      }
      const { data: followingRows } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
      const followingIds = (followingRows || []).map((r: any) => r.following_id);
      if (followingIds.length === 0) {
        return res.json({ posts: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 });
      }
      postsQuery = postsQuery.in("user_id", followingIds);
    }

    const { data: posts, error: postsError, count } = await postsQuery.range(offset, offset + limitNum - 1);

    if (postsError) {
      console.error("Supabase error in getPosts:", postsError);
      return res.status(500).json({ error: "Failed to fetch posts", details: postsError.message });
    }

    if (!posts || posts.length === 0) {
      return res.json({ posts: [], total: count || 0, page: pageNum, limit: limitNum, totalPages: Math.ceil((count || 0) / limitNum) });
    }

    // Get unique user IDs
    const userIds = [...new Set(posts.map((p: any) => p.user_id))];

    // Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, avatar_url, username")
      .in("id", userIds);

    console.log(`Fetched ${users?.length || 0} users from Supabase for ${userIds.length} user IDs`);
    console.log(`User IDs requested:`, userIds);
    console.log(`Users found in Supabase:`, users?.map((u: any) => u.id) || []);

    if (usersError) {
      console.error("Supabase error fetching users:", usersError);
      // Continue without user data if users fetch fails
    }

    // Create a map of user_id to user data from Supabase
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));

    // Find user IDs that don't have data in Supabase
    const missingUserIds = userIds.filter((id: string) => !userMap.has(id));

    // Fetch missing users from Clerk as fallback
    const clerkUserMap = new Map();
    if (missingUserIds.length > 0 && process.env.CLERK_SECRET_KEY) {
      console.log(`Fetching ${missingUserIds.length} missing users from Clerk:`, missingUserIds);
      try {
        // Fetch users in parallel for better performance
        const clerkUserPromises = missingUserIds.map(async (userId: string) => {
          try {
            console.log(`Fetching Clerk user: ${userId}`);
            const clerkUser = await clerkClient.users.getUser(userId);
            console.log(`Clerk user data for ${userId}:`, {
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              username: clerkUser.username,
              email: clerkUser.emailAddresses?.[0]?.emailAddress,
              imageUrl: clerkUser.imageUrl,
            });

            // Get username - try multiple fields
            let userName: string | null = null;
            if (clerkUser.firstName && clerkUser.lastName) {
              userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
            } else if (clerkUser.firstName) {
              userName = clerkUser.firstName;
            } else if (clerkUser.lastName) {
              userName = clerkUser.lastName;
            } else if (clerkUser.username) {
              userName = clerkUser.username;
            } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
              const emailAddress = clerkUser.emailAddresses[0]?.emailAddress;
              if (emailAddress) {
                userName = emailAddress.split("@")[0] || null;
              }
            }

            // If still no name, use a default
            if (!userName) {
              userName = "User";
            }

            const userData: any = {
              name: userName,
              avatar_url: clerkUser.imageUrl || null,
              username: clerkUser.username || null,
            };

            console.log(`Setting user data for ${userId}:`, userData);
            clerkUserMap.set(userId, userData);

            // Also try to sync this user to Supabase for future requests
            try {
              await ensureUserExists(userId, clerkUser);
              console.log(`User ${userId} synced to Supabase`);
            } catch (syncError: any) {
              // Ignore sync errors, we already have the data from Clerk
              console.error(`Could not sync user ${userId} to Supabase:`, syncError?.message);
            }

            return { userId, success: true };
          } catch (clerkError: any) {
            console.error(`Error fetching user ${userId} from Clerk:`, clerkError?.message);
            console.error(`Full Clerk error:`, clerkError);
            return { userId, success: false, error: clerkError };
          }
        });

        await Promise.all(clerkUserPromises);
        console.log(`Fetched ${clerkUserMap.size} users from Clerk`);
      } catch (error: any) {
        console.error("Error fetching users from Clerk:", error?.message);
        console.error("Full error:", error);
      }
    } else if (missingUserIds.length > 0) {
      console.warn(`CLERK_SECRET_KEY not set, cannot fetch ${missingUserIds.length} missing users from Clerk`);
    }

    // Combine posts with user data (prefer Supabase, fallback to Clerk)
    const postsWithUsers = posts.map((post: any) => {
      const supabaseUser = userMap.get(post.user_id);
      const clerkUser = clerkUserMap.get(post.user_id);
      const user = supabaseUser || clerkUser;

      // Extract user data with better fallback logic
      let userData;
      if (user) {
        const userName = user.name ||
          (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : null) ||
          user.firstName ||
          user.lastName ||
          user.username ||
          null;

        const avatarUrl = user.avatar_url || user.imageUrl || null;

        userData = {
          name: userName || "User",
          avatar_url: avatarUrl,
          username: user.username || null,
        };
      } else {
        userData = {
          name: "User",
          email: null,
          avatar_url: null,
        };
      }

      return {
        ...post,
        user: userData
      };
    });

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let postsWithStats = postsWithUsers;

    if (currentUserId && postsWithUsers.length > 0) {
      const postIds = postsWithUsers.map(p => p.id);

      const [likesRes, savesRes] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
      ]);

      const likedPostIds = new Set((likesRes.data || []).map(l => l.post_id));
      const savedPostIds = new Set((savesRes.data || []).map(s => s.post_id));

      postsWithStats = postsWithUsers.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p.id),
        isSaved: savedPostIds.has(p.id)
      }));
    }

    return res.json({
      posts: postsWithStats,
      total: count || 0,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil((count || 0) / limitNum),
    });
  } catch (error: any) {
    console.error("Unexpected error in getPosts:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function getPostById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    // Fetch the post by ID
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Increment view count (non-blocking)
    supabase.rpc('increment_view_count', { row_id: id, table_name: 'posts' })
      .then(({ error }) => {
        if (error) {
          // If RPC fails, try standard update as fallback
          supabase.from("posts")
            .update({ view_count: (post.view_count || 0) + 1 })
            .eq("id", id)
            .then(() => { });
        }
      });

    // Get user data for the post author
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url, username")
      .eq("id", post.user_id)
      .single();

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        const clerkUser = await clerkClient.users.getUser(post.user_id);
        if (clerkUser) {
          const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;
          let name = null;
          if (clerkUser.firstName && clerkUser.lastName) {
            name = `${clerkUser.firstName} ${clerkUser.lastName}`;
          } else if (clerkUser.firstName) {
            name = clerkUser.firstName;
          } else if (clerkUser.lastName) {
            name = clerkUser.lastName;
          } else if (clerkUser.username) {
            name = clerkUser.username;
          } else if (email) {
            name = email.split("@")[0];
          }

          userData = {
            id: clerkUser.id,
            name: name || "User",
            avatar_url: clerkUser.imageUrl || null,
            username: clerkUser.username || null,
          };
        }
      } catch (clerkError) {
        console.error("Error fetching user from Clerk:", clerkError);
      }
    }

    // Format user data
    const userInfo = userData ? {
      name: userData.name || "User",
      avatar_url: userData.avatar_url || null,
      username: userData.username || null,
    } : {
      name: "User",
      avatar_url: null,
      username: null,
    };

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let isLiked = false;
    let isSaved = false;

    if (currentUserId) {
      const [likeRes, saveRes] = await Promise.all([
        supabase.from("likes").select("id").eq("user_id", currentUserId).eq("post_id", id).maybeSingle(),
        supabase.from("saved_posts").select("id").eq("user_id", currentUserId).eq("post_id", id).maybeSingle()
      ]);
      isLiked = !!likeRes.data;
      isSaved = !!saveRes.data;
    }

    return res.json({
      ...post,
      user: userInfo,
      isLiked,
      isSaved
    });
  } catch (error) {
    console.error("Unexpected error in getPostById:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

export async function getPostsByUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Fetch posts for the user
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Supabase error in getPostsByUser:", postsError);
      return res.status(500).json({
        error: "Failed to fetch posts",
        details: postsError.message
      });
    }

    if (!posts || posts.length === 0) {
      return res.json([]);
    }

    // Get user data for the post author (we already know it's the same user)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, avatar_url")
      .eq("id", userId)
      .single();

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        console.log(`User ${userId} not found in Supabase for getPostsByUser, fetching from Clerk`);
        const clerkUser = await clerkClient.users.getUser(userId);

        // Extract user name with better fallback logic
        let userName: string | null = null;
        if (clerkUser.firstName && clerkUser.lastName) {
          userName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim();
        } else if (clerkUser.firstName) {
          userName = clerkUser.firstName;
        } else if (clerkUser.lastName) {
          userName = clerkUser.lastName;
        } else if (clerkUser.username) {
          userName = clerkUser.username;
        } else if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
          const emailAddress = clerkUser.emailAddresses[0]?.emailAddress;
          if (emailAddress) {
            userName = (emailAddress?.split("@")[0] as string) || null; // Use email username as fallback
          }
        }

        // If still no name, use a default
        if (!userName) {
          userName = "User";
        }

        const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress || null;

        userData = {
          id: userId,
          name: userName,
          avatar_url: clerkUser.imageUrl || null,
          username: clerkUser.username || null,
        };

        // Sync user to Supabase for future requests
        try {
          await ensureUserExists(userId, clerkUser);
          console.log(`User ${userId} synced to Supabase from getPostsByUser`);
        } catch (syncError: any) {
          console.error(`Could not sync user ${userId} to Supabase:`, syncError?.message);
          // Continue anyway - we have the data from Clerk
        }
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk:", clerkError?.message || clerkError);
        console.error("Full Clerk error:", clerkError);
      }
    }

    // Combine posts with user data
    const postsWithUsers = posts.map((post: any) => {
      let userDisplayData;
      if (userData) {
        // Extract name with proper fallback
        const userName = (userData as any).name || "User";

        userDisplayData = {
          name: userName,
          avatar_url: (userData as any).avatar_url || null,
          username: (userData as any).username || null,
        };
      } else {
        // No user data found
        userDisplayData = {
          name: "User",
          avatar_url: null,
        };
      }

      return {
        ...post,
        user: userDisplayData
      };
    });

    // FETCH LIKE AND SAVE STATUS FOR CURRENT USER
    const currentUserId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    let postsWithStats = postsWithUsers;

    if (currentUserId && postsWithUsers.length > 0) {
      const postIds = postsWithUsers.map(p => p.id);

      const [likesRes, savesRes] = await Promise.all([
        supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds),
        supabase.from("saved_posts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
      ]);

      const likedPostIds = new Set((likesRes.data || []).map(l => l.post_id));
      const savedPostIds = new Set((savesRes.data || []).map(s => s.post_id));

      postsWithStats = postsWithUsers.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p.id),
        isSaved: savedPostIds.has(p.id)
      }));
    }

    return res.json({
      posts: postsWithStats,
      total: posts.length,
      page: 1,
      limit: posts.length,
      totalPages: 1,
    });
  } catch (error: any) {
    console.error("Unexpected error in getPostsByUser:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function createPost(req: Request, res: Response) {
  try {
    const user = req.user;
    const { title, content, images, tags, language } = req.body;

    // Validate input
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Validate images array if provided
    let imageUrls: string[] = [];
    if (images && Array.isArray(images)) {
      imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
    }

    // Extract and validate tags/hashtags
    let postTags: string[] = [];
    if (tags && Array.isArray(tags)) {
      postTags = tags
        .map((tag: any) => {
          const tagStr = typeof tag === "string" ? tag.trim().toLowerCase() : String(tag).trim().toLowerCase();
          // Remove # if present, we'll add it back when displaying
          return tagStr.startsWith("#") ? tagStr.substring(1) : tagStr;
        })
        .filter((tag: string) => tag.length > 0 && tag.length <= 50)
        .slice(0, 10); // Limit to 10 tags
    }

    // Also extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const contentHashtags = content.match(hashtagRegex) || [];
    const extractedTags = contentHashtags.map((tag: string) => tag.substring(1).toLowerCase());

    // Merge tags from both sources, remove duplicates
    const allTags = [...new Set([...postTags, ...extractedTags])].slice(0, 10);

    // Log user object to debug
    console.log("User object from Clerk:", JSON.stringify(user, null, 2));

    // Get user ID - Clerk uses 'sub' for the user ID
    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      console.error("No user ID found in user object:", user);
      return res.status(401).json({ error: "User ID not found" });
    }

    // Ensure user exists in Supabase (creates if doesn't exist)
    // If JWT token doesn't have full user data, fetch from Clerk API
    let userDataForSync = user as any;
    if (!user?.email_addresses && !user?.emailAddresses && process.env.CLERK_SECRET_KEY) {
      try {
        console.log("JWT token missing user data, fetching from Clerk API for userId:", userId);
        const fullUserData = await clerkClient.users.getUser(userId as string);
        userDataForSync = fullUserData;
        console.log("Fetched full user data from Clerk:", {
          firstName: fullUserData.firstName,
          lastName: fullUserData.lastName,
          email: fullUserData.emailAddresses?.[0]?.emailAddress,
        });
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk API:", clerkError?.message);
        // Continue with JWT token data
      }
    }

    // Ensure user exists in Supabase (creates if doesn't exist)
    // CRITICAL: This must succeed before we can create a post due to foreign key constraints
    try {
      const syncedUser = await ensureUserExists(userId as string, userDataForSync);
      console.log("User synced to Supabase:", syncedUser?.id || userId);
    } catch (error: any) {
      console.error("Error ensuring user exists:", error?.message || error);
      console.error("Full error:", error);
      return res.status(500).json({
        error: "Failed to synchronize user profile",
        details: "Could not ensure user exists in database. Please try again."
      });
    }

    // Validate and sanitize language
    let langCode = "en";
    if (language) {
      const rawLang = String(language).toLowerCase().trim();
      if (rawLang === "ar" || rawLang === "arabic") {
        langCode = "ar";
      } else if (rawLang === "en" || rawLang === "english") {
        langCode = "en";
      }
      // If it's neither, keep default "en"
    }

    console.log(`[CreatePost] Final language choice: '${langCode}' (Input was: '${language}')`);

    const { data, error } = await supabase.from("posts").insert({
      title: title.trim(),
      content: content.trim(),
      user_id: userId,
      images: imageUrls.length > 0 ? imageUrls : null,
      tags: allTags.length > 0 ? allTags : null,
      language: langCode,
    }).select().single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        error: "Failed to create post",
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log("Post created successfully:", data);
    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("Unexpected error in createPost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function updatePost(req: Request, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, content, images, language } = req.body;

    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Validate input
    if (title !== undefined && (!title || title.trim().length === 0)) {
      return res.status(400).json({ error: "Title cannot be empty" });
    }

    if (content !== undefined && (!content || content.trim().length === 0)) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    // Update post
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (language !== undefined) {
      const rawLang = String(language).toLowerCase().trim();
      const langCode = (rawLang === "ar" || rawLang === "arabic") ? "ar" : "en";
      updateData.language = langCode;
      console.log(`[UpdatePost] Updating language to: '${langCode}' (Input was: '${language}')`);
    }
    if (images !== undefined) {
      if (Array.isArray(images)) {
        const imageUrls = images.filter((img: any) => typeof img === "string" && img.trim().length > 0);
        updateData.images = imageUrls.length > 0 ? imageUrls : null;
      } else {
        updateData.images = null;
      }
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Supabase error:", updateError);
      return res.status(500).json({
        error: "Failed to update post",
        details: updateError.message
      });
    }

    return res.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error("Unexpected error in updatePost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

export async function deletePost(req: Request, res: Response) {
  try {
    const user = req.user;
    const { id } = req.params;

    const userId = user?.sub || user?.id || user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (existingPost.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Supabase error:", deleteError);
      return res.status(500).json({
        error: "Failed to delete post",
        details: deleteError.message
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Unexpected error in deletePost:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}
