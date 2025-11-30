const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// 🚀 Render PORT support
const PORT = process.env.PORT || 3000;

// 🔓 Global CORS
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 🏠 Default route
app.get("/", (req, res) => {
    res.send("🚀 Server running successfully!");
});

// 📁 Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// 📸 Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const unique = `photo_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
        cb(null, unique);
    }
});
const upload = multer({ storage });

// 📧 Nodemailer transporter (YOUR EMAIL + APP PASSWORD)
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "maviyaattar4@gmail.com",
        pass: "rwav vpsq ppcg wvaj"
    }
});

// 🚀 API: Upload + Email Send
app.post("/send", upload.single("image"), async (req, res) => {
    try {
        const { name, message } = req.body;
        const filePath = req.file ? req.file.path : null;

        // 📩 Email #1 → To YOU (Meraj + Maviya)
        const mailToYou = {
            from: "maviyaattar4@gmail.com",
            to: ["merajattar20@gmail.com", "maviyaattar4@gmail.com"],
            subject: "New Submission Received",
            text: `Name: ${name}\nMessage: ${message}`,
            attachments: filePath
                ? [{ filename: req.file.filename, path: filePath }]
                : []
        };

        // 📩 Email #2 → To client/user (if needed)
        const mailToClient = {
            from: "maviyaattar4@gmail.com",
            to: req.body.clientEmail || "maviyaattar4@gmail.com",
            subject: "Thanks for your submission!",
            text: "We received your entry successfully."
        };

        await transporter.sendMail(mailToYou);
        await transporter.sendMail(mailToClient);

        return res.json({ status: "success", message: "Email sent successfully" });

    } catch (err) {
        console.error("❌ ERROR:", err);
        return res.status(500).json({ status: "error", message: "Something went wrong" });
    }
});

// 🚀 Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
