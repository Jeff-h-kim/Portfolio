import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/upload", (req, res) => {
  const song = req.body;

  fs.writeFileSync("song.json", JSON.stringify(song, null, 2));

  console.log("Received:", song.title);

  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});