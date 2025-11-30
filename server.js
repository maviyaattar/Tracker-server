const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Root route
app.get("/", (req, res) => {
    res.send("🚀 Multi-Image Resend Server Running Successfully!");
});

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer setup (multiple files allowed)
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage });

// Resend email sender
async function sendEmail({ to, subject, html }) {
    try {
        await axios.post(
            "https://api.resend.com/emails",
            { from: "onboarding@resend.dev", to, subject, html },
            {
                headers: {
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (err) {
        console.error("❌ Resend Error:", err.response?.data || err.message);
    }
}

// API: Multi-image upload + email
app.post("/send", upload.array("images", 10), async (req, res) => {
    try {
        const { name, message, clientEmail } = req.body;

        // List of uploaded files
        const fileNames = req.files.map(f => f.filename).join("<br>");

        // Email to YOU
        await sendEmail({
            to: ["maviyaattar4@gmail.com", "merajattar20@gmail.com"],
            subject: "New Submission Received (Multi-Images)",
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>Uploaded Files:</strong><br>${fileNames}</p>
            `
        });

        // Email to client/user
        await sendEmail({
            to: clientEmail || "maviyaattar4@gmail.com",
            subject: "We received your submission!",
            html: "<p>Thanks! Your details and images were received successfully.</p>"
        });

        res.json({ status: "success" });

    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).json({ status: "error", message: "Server failed" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log("🚀 Server running on port:", PORT);
});
