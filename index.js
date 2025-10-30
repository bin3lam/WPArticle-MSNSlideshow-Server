const express = require("express");
const handler = require("handler.js");
const { createTable, getFeed, handleData, deleteData } = require("./handler");
const app = express();
const port = 3000;
app.use(express.json());

console.log("[Output] RSS Feed Server started.");

const Feeds = {
  "jibriel-testing": {
    blocked: false,
    ip: "172.31.196.65",
  },
};

function extractUrlName(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname; // Get the hostname part of the URL
    const parts = hostname.split(".");
    const name = parts[0];
    return name;
  } catch (error) {
    console.error("Error parsing URL:", error.message);
    return null; // or any appropriate default/fallback value
  }
}

app.post("/req", (req, res) => {
  let ipAddress = req.ip;
  let cleanIpAddress = ipAddress.split(":").pop(); // Assuming IPv4 and removing port
  let allowed = Object.values(Feeds).some((feed) => feed.ip === cleanIpAddress);
  if (req.body.content.type == "slideshow") {
    let parsedData = createTable(
      req.body.content.post_title,
      req.body.content.post_link,
      req.body.content.featured_image,
      req.body.content.post_content,
    );
    let feedName = extractUrlName(req.body.content.post_link);

    if (req.body.content.delete == true) {
      console.log("deletion was requested");
      deleteData(feedName, req.body.content.post_title);
    } else {
      handleData(feedName, parsedData);
      console.log("updating was requested");
    }
  }
  res.json({ message: "Data received!", yourData: req.body });
});

app.get("/rss/feed/:feedName", (req, res) => {
  const feedName = req.params.feedName;
  console.log(`[Output] Request received for ${feedName}`);
  const rss = getFeed(feedName);
  console.log(rss)
  res.header("Content-Type", "application/rss+xml");
  res.send(rss);
});

app.listen(port, () => {
  // Listening
});
