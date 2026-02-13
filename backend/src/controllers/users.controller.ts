import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { sendWelcomeEmail } from "../lib/email.js";
import { getOrCreateConversation } from "./messages.controller.js";


async function createWelcomeExperienceForNewUser(newUserId: string) {
  try {
    console.log(`[Welcome Message] Starting welcome experience for new user: ${newUserId}`);

    // First, try to find CEO in Supabase by username
    let ceoId: string | null = null;
    const { data: ceoUser, error: ceoError } = await supabase
      .from("users")
      .select("id")
      .eq("username", "amin.ceo")
      .single();

    if (ceoUser && !ceoError) {
      ceoId = ceoUser.id as string;
      console.log(`[Welcome Message] Found CEO in Supabase: ${ceoId}`);
    } else {
      // CEO not found in Supabase, try multiple methods to find them
      console.log(`[Welcome Message] CEO not found in Supabase, searching Clerk...`);

      // Method 1: Check environment variable for CEO Clerk ID (most reliable)
      const ceoClerkIdFromEnv = process.env.CEO_CLERK_ID;
      if (ceoClerkIdFromEnv) {
        ceoId = ceoClerkIdFromEnv;
        console.log(`[Welcome Message] Using CEO ID from environment variable: ${ceoId}`);

        // Verify this user exists and has the correct username
        try {
          const clerkCeo = await clerkClient.users.getUser(ceoId);
          if (clerkCeo.username === "amin.ceo") {
            // Ensure CEO exists in Supabase
            try {
              await ensureUserExists(ceoId, clerkCeo);
              console.log(`[Welcome Message] Synced CEO to Supabase`);
            } catch (syncError) {
              console.error(`[Welcome Message] Failed to sync CEO to Supabase:`, syncError);
            }
          } else {
            console.error(`[Welcome Message] CEO_CLERK_ID doesn't match username 'amin.ceo'. Found username: ${clerkCeo.username}`);
            ceoId = null; // Reset and try other methods
          }
        } catch (verifyError: any) {
          console.error(`[Welcome Message] Error verifying CEO from env var:`, verifyError?.message);
          ceoId = null; // Reset and try other methods
        }
      }

      // Method 2: Search through Clerk users (if env var didn't work)
      if (!ceoId && process.env.CLERK_SECRET_KEY) {
        try {
          console.log(`[Welcome Message] Searching Clerk users for username 'amin.ceo'...`);

          // Search through users in batches (Clerk doesn't support username filtering)
          let foundCeo = null;
          let offset = 0;
          const limit = 500;
          let hasMore = true;

          while (hasMore && !foundCeo && offset < 5000) { // Limit search to first 5000 users
            const clerkUsersResponse = await clerkClient.users.getUserList({
              limit,
              offset,
            });

            // Handle both response formats: { data: User[] } or User[]
            const clerkUsers = Array.isArray(clerkUsersResponse)
              ? clerkUsersResponse
              : (clerkUsersResponse as any).data || [];

            if (clerkUsers && clerkUsers.length > 0) {
              foundCeo = clerkUsers.find((u: any) => u.username === "amin.ceo");
              if (foundCeo && foundCeo.id) {
                const foundCeoId = foundCeo.id;
                ceoId = foundCeoId;
                console.log(`[Welcome Message] Found CEO in Clerk (offset ${offset}): ${foundCeoId}`);

                // Ensure CEO exists in Supabase
                try {
                  await ensureUserExists(foundCeoId, foundCeo);
                  console.log(`[Welcome Message] Synced CEO to Supabase`);
                } catch (syncError) {
                  console.error(`[Welcome Message] Failed to sync CEO to Supabase:`, syncError);
                }
                break;
              }

              hasMore = clerkUsers.length === limit;
              offset += limit;
            } else {
              hasMore = false;
            }
          }

          if (!foundCeo) {
            console.error(`[Welcome Message] CEO user 'amin.ceo' not found in Clerk after searching ${offset} users`);
          }
        } catch (clerkError: any) {
          console.error(`[Welcome Message] Error searching Clerk for CEO:`, clerkError?.message || clerkError);
        }
      }
    }

    if (!ceoId) {
      console.error(`[Welcome Message] CEO user 'amin.ceo' not found in Supabase or Clerk. Cannot send welcome message.`);
      return;
    }

    // Do not send a welcome message to the CEO account itself
    if (ceoId === newUserId) {
      console.log(`[Welcome Message] Skipping welcome message - new user is the CEO`);
      return;
    }

    console.log(`[Welcome Message] Creating conversation between CEO (${ceoId}) and new user (${newUserId})`);

    // Ensure there is a conversation between CEO and the new user
    const conversationId = await getOrCreateConversation(ceoId, newUserId);
    console.log(`[Welcome Message] Conversation created/found: ${conversationId}`);

    // Send a personal welcome message from the CEO
    const welcomeMessage =
      "Hey, welcome to SeedLab! I'm Amin, the CEO & Founder (amin.ceo). " +
      "Great to have you here — if you have any questions or feedback, just reply to this message.";

    console.log(`[Welcome Message] Inserting welcome message into conversation ${conversationId}`);
    const { data: insertedMessage, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: ceoId,
        content: welcomeMessage,
      })
      .select()
      .single();

    if (messageError) {
      console.error(`[Welcome Message] Error creating CEO welcome message:`, messageError);
      return;
    }

    console.log(`[Welcome Message] Welcome message created successfully:`, insertedMessage?.id);

    // Create a notification so the new user clearly sees the welcome
    console.log(`[Welcome Message] Creating notification for new user`);
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: newUserId,
        type: "message",
        actor_id: ceoId,
        read: false,
      });

    if (notifError) {
      console.error(`[Welcome Message] Error creating CEO welcome notification:`, notifError);
    } else {
      console.log(`[Welcome Message] Notification created successfully`);
    }

    console.log(`[Welcome Message] Welcome experience completed successfully for user ${newUserId}`);
  } catch (error: any) {
    console.error(`[Welcome Message] Unexpected error creating welcome experience for new user:`, error?.message || error);
    console.error(`[Welcome Message] Full error stack:`, error);
  }
}


// Ensure user exists in Supabase (create if doesn't exist)
export async function ensureUserExists(userId: string, userData?: any) {
  // Helper function to extract user info from different Clerk data formats
  const getUserInfo = (data: any) => {
    console.log("Extracting user info from:", JSON.stringify(data, null, 2));

    // Handle Clerk API format (from clerkClient.users.getUser)
    if (data?.firstName || data?.lastName || data?.emailAddresses) {
      const email = data.emailAddresses?.[0]?.emailAddress || data.email || null;
      let name = null;
      if (data.firstName && data.lastName) {
        name = `${data.firstName} ${data.lastName}`;
      } else if (data.firstName) {
        name = data.firstName;
      } else if (data.lastName) {
        name = data.lastName;
      } else if (data.username) {
        name = data.username;
      } else if (email) {
        name = email.split("@")[0]; // Use email username as fallback
      }

      return {
        email: email,
        name: name || "User",
        avatar_url: data.imageUrl || null,
        username: data.username || name || null, // Use name as fallback for username
      };
    }

    // Handle JWT token format (from verifyToken)
    if (data?.email_addresses || data?.first_name || data?.last_name) {
      const email = data.email_addresses?.[0]?.email_address || data.email || null;
      let name = null;
      if (data.first_name && data.last_name) {
        name = `${data.first_name} ${data.last_name}`;
      } else if (data.first_name) {
        name = data.first_name;
      } else if (data.last_name) {
        name = data.last_name;
      } else if (data.username) {
        name = data.username;
      } else if (email) {
        name = email.split("@")[0]; // Use email username as fallback
      }

      return {
        email: email,
        name: name || "User",
        avatar_url: data?.avatar_url || data?.image_url || null,
        username: data.username || name || null, // Use name as fallback for username
      };
    }

    // Fallback - try to extract from any available fields
    const email = data?.email || data?.email_address || (Array.isArray(data?.email_addresses) ? data.email_addresses[0]?.email_address : null) || null;
    const name = data?.username || data?.name || (email ? email.split("@")[0] : null) || "User";

    return {
      email: email,
      name: name,
      avatar_url: data?.avatar_url || data?.image_url || null,
      username: data?.username || (name ? name.replace(/\s+/g, "").toLowerCase() : null) || null, // remove spaces from name for username
    };
  };

  const userInfo = userData ? getUserInfo(userData) : { email: null, name: "User", avatar_url: null, username: null };

  // Ensure username is not null and unique
  let finalUsername = userInfo.username;
  if (!finalUsername) {
    finalUsername = `user_${userId.substring(0, 8)}`;
  }

  // Sanitize username
  finalUsername = finalUsername.replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase();

  if (!finalUsername) {
    finalUsername = `user_${userId.substring(0, 8)}`;
  }

  // Check if username is taken by another user
  const { data: existingUsernameUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", finalUsername)
    .neq("id", userId) // exclude self
    .maybeSingle();

  if (existingUsernameUser) {
    // Username taken, append random suffix
    finalUsername = `${finalUsername}_${Math.floor(Math.random() * 10000)}`;
  }

  // Update userInfo with final username
  userInfo.username = finalUsername;

  console.log("User info extracted:", userInfo);

  // Check if user exists
  const { data: existingUser, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error fetching user:", fetchError);
  }

  if (existingUser) {
    // User exists, optionally update their data
    if (userData) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email: userInfo.email,
          name: userInfo.name,
          avatar_url: userInfo.avatar_url,
          username: userInfo.username, // This now contains the sanitized/unique username
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user:", updateError);
      } else {
        console.log("User updated successfully");
      }
    }
    return existingUser;
  }

  // Create new user
  console.log("Creating new user in Supabase:", { userId, userInfo });
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email: userInfo.email,
      name: userInfo.name,
      avatar_url: userInfo.avatar_url,
      username: userInfo.username,
      // onboarding_completed: false, // Column may be missing in unclear schemas
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, username')
    .single();

  if (error) {
    console.error("Error creating user in Supabase:", error);
    throw error;
  }

  console.log("User created successfully:", newUser);

  // Create a CEO welcome DM + notification for this brand new user
  try {
    await createWelcomeExperienceForNewUser(userId);
  } catch (welcomeError) {
    console.error("Error during CEO welcome experience:", welcomeError);
  }

  // Send welcome email if email exists
  if (userInfo.email) {
    // We don't await this to avoid delaying the response
    sendWelcomeEmail(userInfo.email, userInfo.name || "User");
  }

  return newUser;
}

export async function completeOnboarding(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.sub || (req as any).user?.id || (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { error } = await supabase
      .from("users")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (error) return res.status(500).json({ error: "Failed to complete onboarding" });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get user profile
export async function getUserProfile(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const currentUserId = currentUser?.sub || currentUser?.id || currentUser?.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Determine query field
    // Check if it's a standard UUID or a Clerk ID (starts with "user_")
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) || userId.startsWith("user_");
    const field = isId ? "id" : "username";

    // Fetch user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq(field, userId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      console.error("Supabase error:", userError);
      return res.status(500).json({ error: "Failed to fetch user", details: userError.message });
    }

    // If user not in Supabase, try Clerk
    let userData = user;
    if (!user && process.env.CLERK_SECRET_KEY) {
      try {
        let clerkUser;

        if (isId) {
          console.log(`User ${userId} not found in Supabase, fetching from Clerk by ID`);
          clerkUser = await clerkClient.users.getUser(userId);
        } else {
          console.log(`User ${userId} not found in Supabase, scouting Clerk by username`);
          const clerkUsers = await clerkClient.users.getUserList({ username: [userId], limit: 1 });
          // Handle both array/object return types from Clerk SDK
          const usersList = Array.isArray(clerkUsers) ? clerkUsers : (clerkUsers as any).data;
          clerkUser = usersList && usersList.length > 0 ? usersList[0] : null;
        }

        if (clerkUser) {
          console.log(`Clerk user data for ${userId}:`, {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            username: clerkUser.username,
            imageUrl: clerkUser.imageUrl,
          });

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
              userName = emailAddress.split("@")[0] || null;
            }
          }

          if (!userName) userName = "User";

          const emailAddress = clerkUser.emailAddresses?.[0]?.emailAddress || null;

          userData = {
            id: clerkUser.id, // Ensure we use the actual UUID from Clerk
            name: userName,
            email: emailAddress,
            avatar_url: clerkUser.imageUrl || null,
            bio: null,
            username: clerkUser.username || null,
            username_changed_at: null,
            pinned_post_id: null,
            follower_count: 0,
            following_count: 0,
            total_likes: 0,
            github_url: null,
            twitter_url: null,
            linkedin_url: null,
            website_url: null,
            created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()
          };

          // Sync user to Supabase for future requests
          try {
            await ensureUserExists(clerkUser.id, clerkUser);
            console.log(`User ${clerkUser.id} synced to Supabase`);
          } catch (syncError: any) {
            console.error(`Could not sync user ${clerkUser.id} to Supabase:`, syncError?.message);
          }
        }
      } catch (clerkError: any) {
        console.error("Error fetching user from Clerk:", clerkError?.message || clerkError);
        console.error("Full Clerk error:", clerkError);
        // Fallback to 404
      }
    }

    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // For other queries, we need the UUID
    const targetUserId = userData.id;

    // Get accurate follow counts
    const [followerResult, followingResult] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId),
    ]);

    // Get total likes on user's posts
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", targetUserId);

    let totalLikes = 0;
    if (userPosts && userPosts.length > 0) {
      const postIds = userPosts.map((p: any) => p.id);
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .in("post_id", postIds);
      totalLikes = likesCount || 0;
    }

    // Fetch pinned post if exists
    let pinnedPost = null;
    if (userData.pinned_post_id) {
      const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", userData.pinned_post_id)
        .single();

      if (post) {
        pinnedPost = {
          ...post,
          user: {
            name: userData.name,
            email: userData.email,
            avatar_url: userData.avatar_url,
          },
        };
      }
    }

    // Build response data
    const responseData: any = {
      id: userData.id,
      name: userData.name,
      avatar_url: userData.avatar_url,
      // banner_url: userData.banner_url || null,
      bio: userData.bio || null,
      username: userData.username || null,
      follower_count: followerResult.count || 0,
      following_count: followingResult.count || 0,
      total_likes: totalLikes,
      pinned_post_id: userData.pinned_post_id || null,
      pinned_post: pinnedPost,
      // Professional info - commenting out until verified in schema
      /*
      location: userData.location || null,
      job_title: userData.job_title || null,
      skills: userData.skills || null,
      experience_level: userData.experience_level || null,
      is_hirable: userData.is_hirable ?? false,
      is_organization: userData.is_organization ?? false,
      // Social links
      github_url: userData.github_url || null,
      twitter_url: userData.twitter_url || null,
      linkedin_url: userData.linkedin_url || null,
      website_url: userData.website_url || null,
      */
      // Metadata
      created_at: userData.created_at || null,
      updated_at: userData.updated_at || null,
    };

    if (currentUserId === targetUserId) {
      responseData.username_changed_at = userData.username_changed_at || null;
      responseData.onboarding_completed = userData.onboarding_completed || false;
    }

    return res.json(responseData);
  } catch (error: any) {
    console.error("Unexpected error in getUserProfile:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

// Update user profile
export async function updateUserProfile(req: Request, res: Response) {
  try {
    const user = req.user;
    const authenticatedUserId = user?.sub || user?.id || user?.userId;

    if (!authenticatedUserId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Validate that the userId in the URL matches the authenticated user
    const { userId: urlUserId } = req.params;
    if (urlUserId && urlUserId !== authenticatedUserId) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const userId = authenticatedUserId;
    const {
      name,
      username,
      bio,
      avatar_url,
      banner_url,
      location,
      job_title,
      skills,
      is_hirable,
      experience_level,
      is_organization,
      onboarding_completed,
      github_url,
      twitter_url,
      linkedin_url,
      website_url
    } = req.body;

    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from("users")
      .select("username, username_changed_at")
      .eq("id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError);
    }

    // Check username change restriction (14 days)
    if (username && username !== currentUser?.username) {
      if (currentUser?.username_changed_at) {
        const lastChanged = new Date(currentUser.username_changed_at);
        const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceChange < 14) {
          const daysRemaining = Math.ceil(14 - daysSinceChange);
          return res.status(400).json({
            error: `Username can only be changed once every 14 days. You can change it again in ${daysRemaining} day(s).`
          });
        }
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    // if (banner_url !== undefined) updateData.banner_url = banner_url;
    /*
    if (location !== undefined) updateData.location = location;
    if (job_title !== undefined) updateData.job_title = job_title;
    if (skills !== undefined) updateData.skills = skills;
    if (is_hirable !== undefined) updateData.is_hirable = is_hirable;
    if (experience_level !== undefined) updateData.experience_level = experience_level;
    if (is_organization !== undefined) updateData.is_organization = is_organization;
    // if (onboarding_completed !== undefined) updateData.onboarding_completed = onboarding_completed;
    if (github_url !== undefined) updateData.github_url = github_url;
    if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (website_url !== undefined) updateData.website_url = website_url;
    */

    if (username && username !== currentUser?.username) {
      updateData.username = username;
      updateData.username_changed_at = new Date().toISOString();
    }

    // Update in Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return res.status(500).json({
        error: "Failed to update profile",
        details: updateError.message
      });
    }

    // Update in Clerk if name or username changed
    if (process.env.CLERK_SECRET_KEY && userId && (name || username)) {
      try {
        const updateClerkData: Record<string, string> = {};
        if (name) {
          const nameParts = name.split(" ");
          updateClerkData.firstName = nameParts[0] || "";
          updateClerkData.lastName = nameParts.slice(1).join(" ") || "";
        }
        if (username) {
          updateClerkData.username = username;
        }

        const hasUpdates = Object.keys(updateClerkData).length > 0;
        if (hasUpdates && userId) {
          await (clerkClient.users as any).updateUser(userId, updateClerkData);
        }
      } catch (clerkError) {
        console.error("Error updating Clerk user:", clerkError);
        // Continue even if Clerk update fails
      }
    }

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Unexpected error in updateUserProfile:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error?.message
    });
  }
}

// Pin or unpin a post to user's profile
export async function pinPost(req: Request, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // If postId is "unpin", unpin the current post
    if (postId === "unpin") {
      const { error: updateError } = await supabase
        .from("users")
        .update({ pinned_post_id: null })
        .eq("id", userId);

      if (updateError) {
        console.error("Error unpinning post:", updateError);
        return res.status(500).json({ error: "Failed to unpin post" });
      }

      return res.json({ success: true, message: "Post unpinned" });
    }

    if (!postId) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const postIdNum = parseInt(postId, 10);
    if (isNaN(postIdNum)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Verify the post exists and belongs to the user
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postIdNum)
      .single();

    if (postError || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "You can only pin your own posts" });
    }

    // Pin the post
    const { error: updateError } = await supabase
      .from("users")
      .update({ pinned_post_id: postIdNum })
      .eq("id", userId);

    if (updateError) {
      console.error("Error pinning post:", updateError);
      return res.status(500).json({ error: "Failed to pin post" });
    }

    return res.json({ success: true, message: "Post pinned", pinnedPostId: postIdNum });
  } catch (error: any) {
    console.error("Unexpected error in pinPost:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}

// Get user's total likes
export async function getUserTotalLikes(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Get all posts by user
    const { data: posts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId);

    if (!posts || posts.length === 0) {
      return res.json({ totalLikes: 0 });
    }

    const postIds = posts.map((p: any) => p.id);

    // Count likes on all user's posts
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .in("post_id", postIds);

    return res.json({ totalLikes: count || 0 });
  } catch (error: any) {
    console.error("Unexpected error in getUserTotalLikes:", error);
    return res.status(500).json({ error: "Internal server error", details: error?.message });
  }
}
