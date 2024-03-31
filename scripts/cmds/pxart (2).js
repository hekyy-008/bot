const fs = require("fs");
const path = require("path");
const axios = require("axios");
const tinyurl = require('tinyurl');

module.exports = {
  config: {
    name: "pxart",
    aliases: [],
    version: "1.0",
    author: "Kshitiz",
    countDown: 20,
    role: 0,
    shortDescription: "lado puti",
    longDescription: "image to image",
    category: "game",
    guide: {
      en: "{p}pxart reply to image or {p}pxart [prompt]"
    }
  },
  onStart: async function ({ message, event, args }) {
    try {
      const promptApiUrl = "https://www.api.vyturex.com/describe?url="; // api credit Jarif
      const pixartApiUrl = "https://ai-tools.replit.app/pixart";

      let imageUrl = null;
      let prompt = '';

      if (event.type === "message_reply") {
        const attachment = event.messageReply.attachments[0];
        if (!attachment || !["photo", "sticker"].includes(attachment.type)) {
          return message.reply("❌ | Reply must be an image.");
        }
        imageUrl = attachment.url;
        const promptResponse = await axios.get(promptApiUrl + encodeURIComponent(imageUrl));
        prompt = promptResponse.data;
      } else if (args.length > 0 && args[0].startsWith("http")) {
        imageUrl = args[0];
        const promptResponse = await axios.get(promptApiUrl + encodeURIComponent(imageUrl));
        prompt = promptResponse.data;
      } else if (args.length > 0) {
        prompt = args.join(" ").trim();
      } else {
        return message.reply("❌ | Please reply to an image, provide a valid image URL, or provide a prompt to use the command.");
      }

      const styleArg = args.join(" ").split("|")[1];
      let style = 7;
      if (styleArg) {
        style = parseInt(styleArg.trim());
      }

      const pixartResponse = await axios.get(pixartApiUrl, {
        params: {
          prompt: prompt,
          styles: style
        },
        responseType: "arraybuffer"
      });

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }
      const imagePath = path.join(cacheFolderPath, `${Date.now()}_generated_image.png`);
      fs.writeFileSync(imagePath, Buffer.from(pixartResponse.data, "binary"));

      const stream = fs.createReadStream(imagePath);
      message.reply({
        body: "",
        attachment: stream
      });

    } catch (error) {
      console.error("Error:", error);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};
