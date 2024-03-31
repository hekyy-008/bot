const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchStatusVideos() {
  try {
    const response = await axios.get("https://status-kshitiz.vercel.app/status");
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch status videos");
  }
}

async function downloadVideo(videoUrl) {
  try {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const fileName = path.join(cacheDir, `${Date.now()}.mp4`);

    const response = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(fileName);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(fileName));
      writer.on("error", reject);
    });
  } catch (error) {
    console.error(error);
    throw new Error("Failed to download video");
  }
}

module.exports = {
  config: {
    name: "status",
    author: "Vex_Kshitiz",
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Get status videos",
    longDescription: "Get a list of available status videos and download them",
    category: "social",
    guide: "{p}status",
  },

  onStart: async function ({ api, event }) {
    api.setMessageReaction("🕐", event.messageID, () => {}, true);

    try {
      const videos = await fetchStatusVideos();

      if (!videos || videos.length === 0) {
        api.sendMessage({ body: `No status videos found.` }, event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return;
      }

      const videoList = videos.map((video, index) => `${index + 1}. ${video.title}`).join("\n");
      const message = `Choose a video by replying with its number:\n\n${videoList}`;

      api.sendMessage({ body: message }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: "status",
          messageID: info.messageID,
          author: event.senderID,
          videos,
        });
      });

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "Sorry, an error occurred while processing your request." }, event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, commandName, videos } = Reply;

    if (event.senderID !== author || !videos) {
      return;
    }

    const videoIndex = parseInt(args[0], 10);

    if (isNaN(videoIndex) || videoIndex <= 0 || videoIndex > videos.length) {
      api.sendMessage({ body: "Invalid input.\nPlease provide a valid number." }, event.threadID, event.messageID);
      return;
    }

    const selectedVideo = videos[videoIndex - 1];
    const videoUrl = selectedVideo.video_url;

    try {
      const videoPath = await downloadVideo(videoUrl);
      const videoStream = fs.createReadStream(videoPath);
      api.sendMessage({ body: "Here is your status video:", attachment: videoStream }, event.threadID, event.messageID);
    } catch (error) {
      console.error(error);
      api.sendMessage({ body: "An error occurred while processing the video.\nPlease try again later." }, event.threadID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};
