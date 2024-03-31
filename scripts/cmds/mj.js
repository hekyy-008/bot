const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "mj",
    aliases: [],
    version: "1.0",
    author: "Vex_kshitiz",
    countDown: 20,
    role: 2,
    shortDescription: "mid journey",
    longDescription: "mid journey",
    category: "image",
    guide: {
      en: "{p}mj [prompt]"
    }
  },
  onStart: async function ({ message, event, args, api }) {
    try {
      let prompt = args.join(" ").trim();

      if (!prompt) {
        return message.reply("Please provide a prompt.");
      }

      const response = await axios.get(`https://muji-journey.vercel.app/muji?prompt=${encodeURIComponent(prompt)}`);
      const { taskId } = response.data;

      let imageUrl = null;

      while (!imageUrl) {
        const progressResponse = await axios.get(`https://muji-progress.vercel.app/muji?id=${taskId}`);
        const { imageUrl: progressImageUrl } = progressResponse.data;

        if (progressImageUrl) {
          imageUrl = progressImageUrl;
        } else {
          await new Promise(resolve => setTimeout(resolve, 20000)); 
        }
      }

      const cacheFolderPath = path.join(__dirname, "/cache");
      if (!fs.existsSync(cacheFolderPath)) {
        fs.mkdirSync(cacheFolderPath);
      }

      const imagePath = path.join(cacheFolderPath, `mj.png`);
      const writer = fs.createWriteStream(imagePath);
      const imageResponse = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
      });

      imageResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stream = fs.createReadStream(imagePath);
      await message.reply({
        body: "",
        attachment: stream
      });

    } catch (error) {
      console.error("Error:", error.message);
      message.reply("❌ | An error occurred. Please try again later.");
    }
  }
};
