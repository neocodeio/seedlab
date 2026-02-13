import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendWelcomeEmail(email: string, name: string) {
  if (!resend) {
    console.warn("Resend is not configured. Skipping welcome email.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "SeedLab Team <welcome@seedlab0.vercel.app>",
      to: email,
      subject: "Welcome to SeedLab! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 600px;
              margin: 0 auto;
              padding: 40px 20px;
              color: #000;
              background-color: #ffffff;
            }
            .card {
              background: linear-gradient(145deg, #ffffff, #f5f7ff);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(99, 102, 241, 0.1);
              border: 1px solid rgba(99, 102, 241, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: 800;
              color: #6366f1;
              text-decoration: none;
              letter-spacing: -0.5px;
            }
            h1 {
              color: #000;
              font-size: 24px;
              font-weight: 700;
              margin-top: 20px;
              text-align: center;
            }
            p {
              font-size: 16px;
              line-height: 1.6;
              color: #000;
              margin-bottom: 20px;
            }
            .feature-list {
              list-style: none;
              padding: 0;
              margin: 25px 0;
            }
            .feature-item {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
              color: #000;
            }
            .feature-icon {
              margin-right: 12px;
              color: #6366f1;
            }
            .button-container {
              text-align: center;
              margin-top: 35px;
            }
            .button {
              background-color: #6366f1;
              color: #ffffff !important;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              transition: transform 0.2s ease;
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ccc;
            }
            .footer-text {
              font-size: 14px;
              color: #000;
            }
            .social-links {
              margin-top: 15px;
            }
            .social-link {
              color: #6366f1;
              text-decoration: none;
              margin: 0 10px;
              font-weight: 500;
            }
          </style>
        </head>
        <body style="background-color: #f9fafb; margin: 0; padding: 0; color: #000">
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">SeedLab</div>
                <h1>Welcome aboard, ${name}! 🚀</h1>
              </div>
              
              <p>We're absolutely thrilled to have you join SeedLab. You've just joined a vibrant community of creators, developers, and innovators building the future of code.</p>
              
              <p>SeedLab is designed to help you showcase your work, collaborate with others, and find inspiration for your next big project.</p>
              
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">✨</span>
                  <span><strong>Build your portfolio:</strong> Showcase your best work with beautiful project pages.</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🤝</span>
                  <span><strong>Collaborate:</strong> Get feedback and insights from fellow developers.</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔍</span>
                  <span><strong>Discover:</strong> Explore a huge library of open-source projects.</span>
                </div>
              </div>

              <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'https://seedlab0.vercel.app'}/profile" class="button">Check Your Profile</a>
              </div>
              
              <div class="footer">
                <p class="footer-text">Questions? We're here to help. Just reply to this email.</p>
                <div class="social-links">
                  <a href="${process.env.FRONTEND_URL || 'https://seedlab0.vercel.app'}/about" class="social-link">About Us</a>
                  <a href="${process.env.FRONTEND_URL || 'https://seedlab0.vercel.app'}/privacy" class="social-link">Privacy Policy</a>
                </div>
                <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} SeedLab. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });


    if (error) {
      console.error("Error sending welcome email:", error);
    } else {
      console.log("Welcome email sent successfully:", data?.id);
    }
  } catch (err) {
    console.error("Unexpected error sending welcome email:", err);
  }
}

export async function sendOrgRegistrationNotification(adminEmail: string, orgData: any) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "SeedLab System <system@seedlab0.vercel.app>",
      to: adminEmail,
      subject: `New Organization Registration: ${orgData.name}`,
      html: `
                <h2>New Organization Request</h2>
                <p><strong>Name:</strong> ${orgData.name}</p>
                <p><strong>Website:</strong> ${orgData.website}</p>
                <p><strong>Domain Email:</strong> ${orgData.domain_email}</p>
                <p><strong>Industry:</strong> ${orgData.industry}</p>
                <p><strong>Description:</strong> ${orgData.description}</p>
                <p>Please review this registration in Supabase and update the status.</p>
            `
    });
  } catch (err) {
    console.error("Error sending org registration notification:", err);
  }
}

export async function sendOrgStatusUpdateEmail(email: string, orgName: string, status: string) {
  if (!resend) return;
  const isApproved = status === 'approved';
  const subject = isApproved ? `Organization Approved: ${orgName} 🎉` : `Update on your Organization Registration: ${orgName}`;
  const message = isApproved
    ? `Great news! Your organization ${orgName} has been approved. You can now access organization features.`
    : `Your registration for ${orgName} has been ${status}. If you have any questions, please reply to this email.`;

  try {
    await resend.emails.send({
      from: "SeedLab <support@seedlab0.vercel.app>",
      to: email,
      subject: subject,
      html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Status Update: ${orgName}</h2>
                    <p>${message}</p>
                    ${isApproved ? '<a href="https://seedlab0.vercel.app/search" style="padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Discover Developers</a>' : ''}
                </div>
            `
    });
  } catch (err) {
    console.error("Error sending org status update email:", err);
  }
}
