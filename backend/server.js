const express = require("express");
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const pdfCreator = require("pdf-creator-node"); // CHANGED
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ====================== ENV VALIDATION ======================
const requiredEnvVars = [
  "EMAIL_USER",
  "EMAIL_APP_PASSWORD",
  "CONTACTOUT_API_KEY",
  "NOTIFY_EMAIL",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;

// ====================== CORS CONFIG ======================
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  methods: ["POST"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// ====================== RATE LIMITER ======================
const enrichLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

// ====================== NODEMAILER SETUP ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Nodemailer configuration error:", error);
    process.exit(1);
  } else {
    console.log("✅ Nodemailer transporter ready");
  }
});

// ====================== ENRICH FUNCTION ======================
async function enrichPerson(email) {
  try {
    const payload = { email, include: ["work_email", "personal_email", "phone"] };
    const response = await axios.post(
      "https://api.contactout.com/v1/people/enrich",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          token: process.env.CONTACTOUT_API_KEY,
        },
      }
    );

    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.warn(`⚠️ No profile found for ${email}`);
      throw new Error(`No ContactOut profile found for ${email}`);
    }
    throw new Error(
      `ContactOut API error: ${err.response?.status || "Unknown"} - ${
        JSON.stringify(err.response?.data || err.message)
      }`
    );
  }
}

// ====================== PDF GENERATOR (NEW) ======================
async function generateProfilePDF(profileData, filePath) {
  // Read HTML Template
  const html = fs.readFileSync(
    path.join(__dirname, "profile-template.html"),
    "utf-8"
  );

  // PDF options
  const options = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
  };

  // Data to inject into the template
  // Set default values for any missing data to avoid template errors
  const p = profileData.profile || {};
  const docData = {
    profile: {
      full_name: p.full_name || "N/A",
      headline: p.headline || "N/A",
      location: p.location || "N/A",
      industry: p.industry || "N/A",
      seniority: p.seniority || "N/A",
      job_function: p.job_function || "N/A",
      education: p.education || [],
      experience: p.experience || [],
      skills: p.skills || [],
      email: p.email?.join(", ") || "N/A",
      work_email: p.work_email?.join(", ") || "N/A",
      phone: p.phone?.join(", ") || "N/A",
      summary: p.summary || "N/A",
    },
    company: p.company || {
      name: "N/A",
      domain: "N/A",
      founded_at: "N/A",
      headquarter: "N/A",
      industry: "N/A",
      size: "N/A",
      overview: "N/A",
      website: "N/A",
    },
  };

  const document = {
    html: html,
    data: docData,
    path: filePath,
    type: "file",
  };

  try {
    const res = await pdfCreator.create(document, options);
    console.log(`✅ PDF created at: ${res.filename}`);
  } catch (error) {
    console.error("❌ PDF generation failed:", error);
    throw new Error("Failed to generate PDF report");
  }
}

// ====================== EMAIL SENDER (UPDATED) ======================
async function sendEmailNotification(profileData, recipientEmail) { // UPDATED signature
  const p = profileData.profile || {};
  const fullName = p.full_name?.replace(/[\\/:*?"<>|]/g, "_") || "Unknown_User";
  
  // Create a temporary path for the PDF
  // Using 'os.tmpdir()' is safer for cross-platform compatibility
  const pdfPath = path.join(__dirname, `${fullName}_Profile.pdf`);

  // Generate PDF
  await generateProfilePDF(profileData, pdfPath);

  // Email content
  const message = {
    from: process.env.EMAIL_USER,
    to: recipientEmail, // UPDATED: Send to the user who made the request
    cc: process.env.NOTIFY_EMAIL, // UPDATED: Notify the admin
    subject: `🧠 Enriched Profile Report: ${fullName}`, // UPDATED subject
    html: `
      <h3>Here is your Enriched Profile Report</h3>
      <p>
        Thank you for using the enrichment service. Please find the detailed
        report for <strong>${fullName}</strong> attached to this email.
      </p>
      <hr/>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Headline:</strong> ${p.headline || "N/A"}</p>
      <p><strong>Location:</strong> ${p.location || "N/A"}</p>
      <p><strong>Company:</strong> ${p.company?.name || "N/A"}</p>
      <hr/>
      <p>📎 The full enriched profile is attached as a PDF.</p>
    `,
    attachments: [
      {
        filename: `${fullName}_Profile.pdf`,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(message);
    console.log(
      `✅ Email sent successfully with PDF for: ${fullName} to ${recipientEmail}`
    );
  } catch (err) {
    console.error(`❌ Failed to send email for ${fullName}:`, err);
    throw new Error("Email sending failed");
  } finally {
    // Cleanup temporary PDF
    fs.unlink(pdfPath, (err) => {
      if (err)
        console.warn(
          `⚠️ Failed to delete temporary PDF: ${pdfPath}`,
          err
        );
    });
  }
}

// ====================== API ENDPOINT (UPDATED) ======================
app.post("/enrich", enrichLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    const profileData = await enrichPerson(email);
    console.log("✅ Enriched profile data received");
    
    // UPDATED: Pass the user's email to the notification function
    await sendEmailNotification(profileData, email);

    // UPDATED: Send the new success message
    res.json({
      message: `Success! You will shortly receive an email with the enriched profile at ${email}.`,
      profileData, // Still sending data back, your front-end might use it
    });

  } catch (err) {
    console.error("❌ Error enriching profile:", {
      email,
      error: err.message,
      stack: err.stack,
    });
    res
      .status(500)
      .json({ error: "Failed to enrich profile", details: err.message });
  }
});

// ====================== SERVER START ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});