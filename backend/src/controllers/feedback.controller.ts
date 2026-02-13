// import type { Request, Response } from "express";
// import { Resend } from "resend";

// const FEEDBACK_TO = "ameen65022@gmail.com"; // Your feedback inbox

// // Using Resend for reliable email delivery in production

// export async function submitFeedback(req: Request, res: Response) {
//   try {
//     const { fullName, email, username, message } = req.body;

//     // Validation
//     if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
//       return res.status(400).json({ error: "Full name is required." });
//     }
//     if (!email || typeof email !== "string" || !email.trim()) {
//       return res.status(400).json({ error: "Email is required." });
//     }
//     if (!message || typeof message !== "string" || !message.trim()) {
//       return res.status(400).json({ error: "Message is required." });
//     }

//     // Check for Resend API key
//     const resendApiKey = process.env.RESEND_API_KEY;
//     if (!resendApiKey) {
//       console.error("RESEND_API_KEY is not set in environment variables");
//       return res.status(503).json({
//         error: "Email service is not configured. Please contact support."
//       });
//     }

//     // Initialize Resend
//     const resend = new Resend(resendApiKey);

//     const un = typeof username === "string" && username.trim() ? username.trim() : "(not provided)";

//     // Send email using Resend
//     console.log("Sending feedback email via Resend...");
//     const { data, error } = await resend.emails.send({
//       from: `${fullName} <feedback@seedlab0.vercel.app>`, // Shows sender name in inbox
//       to: FEEDBACK_TO,
//       subject: `[SeedLab Feedback] ${fullName} (${email})`,
//       text: `Feedback from SeedLab

// Full name: ${fullName}
// Email: ${email}
// Username: ${un}

// Message:
// ${message}`,
//       replyTo: email, // User can reply directly to the sender
//     });

//     if (error) {
//       console.error("Resend error:", error);
//       return res.status(500).json({
//         error: "Failed to send feedback. Please try again later.",
//         details: process.env.NODE_ENV === "development" ? error : undefined
//       });
//     }

//     console.log("Feedback email sent successfully:", data);
//     return res.status(200).json({ success: true, messageId: data?.id });

//   } catch (e: any) {
//     console.error("Feedback send error:", e);
//     return res.status(500).json({
//       error: e?.message || "Failed to send feedback. Please try again later.",
//       details: process.env.NODE_ENV === "development" ? e?.message : undefined
//     });
//   }
// }
