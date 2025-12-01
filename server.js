const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// MONGODB CONNECTION
// ----------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✔ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

// ----------------------
// CLOUDINARY CONFIG
// ----------------------
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// ----------------------
// CLOUDINARY STORAGE
// ----------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tracker_images",
    allowed_formats: ["jpg", "jpeg", "png"]
  }
});
const upload = multer({ storage });

// ----------------------
// MONGOOSE SCHEMA (NO MODEL FOLDER NEEDED)
// ----------------------
const entrySchema = new mongoose.Schema({
  ip: String,
  location: String,
  device: String,
  browser: String,
  message: String,
  photos: [String],
  time: { type: Date, default: Date.now }
});

const Entry = mongoose.model("Entry", entrySchema);

// ----------------------
// TEST ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send("🚀 Tracker Server Running (DB + Cloudinary Active)");
});

// ----------------------
// SAVE ENTRY (UPLOAD + DB SAVE)
// ----------------------
app.post("/send", upload.array("images", 10), async (req, res) => {
  try {
    const { ip, location, device, browser, message } = req.body;

    // Cloudinary URLs
    const imageURLs = req.files.map(f => f.path);

    await Entry.create({
      ip,
      location,
      device,
      browser,
      message,
      photos: imageURLs,
      time: new Date()
    });

    res.json({ status: "success" });

  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// ----------------------
// FETCH ALL ENTRIES
// ----------------------
app.get("/all", async (req, res) => {
  const data = await Entry.find().sort({ time: -1 });
  res.json(data);
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running on port:", PORT));
