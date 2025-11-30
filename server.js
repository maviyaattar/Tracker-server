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

app.get("/", (req, res) => {
    res.send("🚀 Multi-Image Resend Server Running Successfully!");
});

// uploads folder
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// multer multi-upload
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const upload = multer({ storage });

// resend email sender
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

app.post("/send", upload.array("images", 10), async (req, res) => {
    try {
        const { name, message, clientEmail } = req.body;
        const fileList = req.files.map(f => f.filename).join("<br>");

        // email to you
        await sendEmail({
            to: ["maviyaattar4@gmail.com"],
            subject: "New Submission (Multi Images)",
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>Uploaded Files:</strong><br>${fileList}</p>
            `
        });

        // email to client
        await sendEmail({
            to: clientEmail || "maviyaattar4@gmail.com",
            subject: "Submission Received",
            html: "<p>Your submission was received successfully.</p>"
        });

        res.json({ status: "success" });

    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// start server
app.listen(PORT, () => console.log("🚀 Server running on port:", PORT));
