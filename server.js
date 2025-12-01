// -----------------------------------------
// 📌 IMPORTS
// -----------------------------------------
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");
require("dotenv").config();

// -----------------------------------------
// 📌 APP SETUP
// -----------------------------------------
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// -----------------------------------------
// 📌 MONGO CONNECT
// -----------------------------------------
mongoose
  .connect("mongodb+srv://Maviya:maviya@cluster0.hrhvss3.mongodb.net/?retryWrites=true&w=majority")
  .then(() => console.log("✔ MongoDB connected"))
  .catch(err => console.log("❌ Mongo error:", err));

// -----------------------------------------
// 📌 CLOUDINARY CONFIG
// -----------------------------------------
cloudinary.config({
  cloud_name: "dgt4rfzqb",
  api_key: "654113358245137",
  api_secret: "PvU8z3ZRF8ciW_F-XD7TOcYSEnE"
});

// -----------------------------------------
// 📌 MULTER (TEMP STORAGE)
// -----------------------------------------
const upload = multer({ dest: "uploads/" });

// -----------------------------------------
// 📌 MONGO MODEL
// -----------------------------------------
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

// -----------------------------------------
// 📌 ROUTE: TEST
// -----------------------------------------
app.get("/", (req, res) => {
  res.send("🚀 Tracker Server Running!");
});

// -----------------------------------------
// 📌 ROUTE: SEND ENTRY
// -----------------------------------------
app.post("/send", upload.array("images", 10), async (req, res) => {
  try {
    const { ip, location, device, browser, message } = req.body;

    let photoUrls = [];

    // upload each image to cloudinary
    for (let file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "tracker_images"
      });

      photoUrls.push(result.secure_url);

      // delete temp file
      fs.unlinkSync(file.path);
    }

    // create db entry
    await Entry.create({
      ip,
      location,
      device,
      browser,
      message,
      photos: photoUrls
    });

    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ SEND ERROR:", err);
    res.json({ status: "error", message: "Server error" });
  }
});

// -----------------------------------------
// 📌 ROUTE: GET ALL ENTRIES (ADMIN)
// -----------------------------------------
app.get("/all", async (req, res) => {
  try {
    const list = await Entry.find().sort({ time: -1 });
    res.json(list);
  } catch (err) {
    console.error("❌ ALL ERROR:", err);
    res.json([]);
  }
});

// -----------------------------------------
// 📌 ROUTE: REAL DELETE
// -----------------------------------------
app.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const entry = await Entry.findById(id);
    if (!entry) return res.json({ status: "error", message: "Not found" });

    // delete cloudinary images
    for (let url of entry.photos) {
      try {
        const parts = url.split("/");
        const filename = parts[parts.length - 1];
        const publicId = "tracker_images/" + filename.split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("❌ Cloudinary delete issue:", err.message);
      }
    }

    // delete from Mongo
    await Entry.findByIdAndDelete(id);

    res.json({ status: "success" });
  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.json({ status: "error" });
  }
});

// -----------------------------------------
// 📌 START SERVER
// -----------------------------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
