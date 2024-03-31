const { writeFileSync, createReadStream, existsSync, mkdirSync } = require("fs");
const { join } = require("path");
const axios = require("axios");

module.exports = {
 config: {
   name: "4k",
   aliases: [],
   version: "1.0",
   author: "Kshitiz",
   countDown: 20,
   role: 2,
   shortDescription: "enhance image to 4k",
   longDescription: "enhance image quality to 4k",
   category: "tool",
   guide: {
     en: "{p}4k (reply to image)",
   },
 },

 onStart: async function ({ message, event, api }) {
   api.setMessageReaction("🕐", event.messageID, (err) => {}, true);
   const { type: a, messageReply: b } = event;
   const { attachments: c, threadID: d, messageID: e } = b || {};

   if (a === "message_reply" && c) {
     const [f] = c;
     const { url: g, type: h } = f || {};

     if (!f || !["photo", "sticker"].includes(h)) {
       return message.reply("❌ | Reply must be an image.");
     }

     try {
       const response = await axios.get(
         "http://server.gamehosting.vn:25755/taoanhdep/lamnetanh?url=" +
           encodeURIComponent(g)
       );
       const imageUrl = response.data.data;

       try {
         const { data } = await axios.get(imageUrl, { responseType: "arraybuffer" });

         const cacheDir = join(__dirname, "cache");
         if (!existsSync(cacheDir)) {
           mkdirSync(cacheDir, { recursive: true });
         }

         const enhancedImagePath = join(cacheDir, "4k_image.png");
         writeFileSync(enhancedImagePath, Buffer.from(data));

         message.reply({ attachment: createReadStream(enhancedImagePath) });
       } catch (error) {
         console.error("Error downloading image:", error);
         message.reply("❌ | Error occurred while downloading enhanced image.");
       }
     } catch (error) {
       console.error("Error from API:", error);
       message.reply("❌ | Error occurred while enhancing image.");
     }
   } else {
     message.reply("❌ | Please reply to an image.");
   }
 },
};