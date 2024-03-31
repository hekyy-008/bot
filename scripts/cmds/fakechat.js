const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const jimp = require('jimp');

module.exports = {
    config: {
        name: "fakechat",
        aliases: [],
        version: "1.0",
        author: "kshitiz",
        countDown: 5,
        role: 0,
        shortDescription: "",
        longDescription: "fake fb chat",
        category: "fun",
        guide: "{p} mention | {text1} | {text2} or {P}fakechat mention | text"
    },

    onStart: async function ({ api, event, args }) {
        const mention = Object.keys(event.mentions);
        if (mention.length === 0) return api.sendMessage("Please mention someone. ex: @mention | text", event.threadID, event.messageID);

        const mentionedUserID = mention[0];
        const mentionedUserProfilePic = await getUserProfilePic(mentionedUserID);

        if (!mentionedUserProfilePic) {
            return api.sendMessage("Failed to load profile picture.", event.threadID, event.messageID);
        }

        const circleSize = 90;
        const avtwo = await createCircularImage(mentionedUserProfilePic, circleSize);

        const background = await loadImage("https://i.ibb.co/SVmYmrn/420578140-383334164549458-685915027190897272-n.jpg");
        const canvas = createCanvas(background.width, background.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(background, 0, 0);


        const profilePicY = 90;
        const mentionNameY = 50;
        const greyBoxY = 80; 
        const blueBoxY = greyBoxY + 130; 

        drawImage(ctx, avtwo, 30, profilePicY);

        const a = getMentionName(args); 


      if (a.toLowerCase().includes("kshitiz") || a.toLowerCase().includes("hacker")) {
          api.sendMessage("You can't mention that user.", event.threadID, event.messageID);
          return;
      }

        ctx.font = '38px Arial'; 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const originalFontSize = ctx.font;
        ctx.font = '34px Arial'; 
        ctx.fillText(`${a}`, 130 + circleSize + 1, mentionNameY); 
        ctx.font = originalFontSize;

        const textParts = args.join(" ").split('|').map(part => part.trim());

        const textWidth = ctx.measureText(textParts[1]).width;
        const textHeight = 70;
        const textPadding = 10; 
        const textBoxWidth = textWidth + 2 * textPadding;
        const textBoxHeight = textHeight + 2 * textPadding;
        const textBoxX = 150;

        const borderRadius = Math.min(textBoxWidth, textBoxHeight) / 2; 

        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.beginPath();
        ctx.arc(textBoxX + borderRadius, greyBoxY + borderRadius, borderRadius, Math.PI, 1.5 * Math.PI);
        ctx.lineTo(textBoxX + textBoxWidth - borderRadius, greyBoxY);
        ctx.arc(textBoxX + textBoxWidth - borderRadius, greyBoxY + borderRadius, borderRadius, 1.5 * Math.PI, 2 * Math.PI);
        ctx.lineTo(textBoxX + textBoxWidth, greyBoxY + textBoxHeight - borderRadius);
        ctx.arc(textBoxX + textBoxWidth - borderRadius, greyBoxY + textBoxHeight - borderRadius, borderRadius, 0, 0.5 * Math.PI);
        ctx.lineTo(textBoxX + borderRadius, greyBoxY + textBoxHeight);
        ctx.arc(textBoxX + borderRadius, greyBoxY + textBoxHeight - borderRadius, borderRadius, 0.5 * Math.PI, Math.PI);
        ctx.closePath();
        ctx.fill(); 

        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillText(textParts[1], textBoxX + textBoxWidth / 2, greyBoxY + textBoxHeight / 2);


        if (textParts.length > 2) {
            const blueTextBoxWidth = textWidth + 2 * textPadding;
            const blueTextBoxHeight = textHeight + 2 * textPadding;
            const blueTextBoxX = background.width - blueTextBoxWidth - 30; 
            const blueTextBoxY = blueBoxY; 

            ctx.fillStyle = '#0084FF'; 
            ctx.beginPath();
            ctx.arc(blueTextBoxX + borderRadius, blueTextBoxY + borderRadius, borderRadius, Math.PI, 1.5 * Math.PI);
            ctx.lineTo(blueTextBoxX + blueTextBoxWidth - borderRadius, blueTextBoxY);
            ctx.arc(blueTextBoxX + blueTextBoxWidth - borderRadius, blueTextBoxY + borderRadius, borderRadius, 1.5 * Math.PI, 2 * Math.PI);
            ctx.lineTo(blueTextBoxX + blueTextBoxWidth, blueTextBoxY + blueTextBoxHeight - borderRadius);
            ctx.arc(blueTextBoxX + blueTextBoxWidth - borderRadius, blueTextBoxY + blueTextBoxHeight - borderRadius, borderRadius, 0, 0.5 * Math.PI);
            ctx.lineTo(blueTextBoxX + borderRadius, blueTextBoxY + blueTextBoxHeight);
            ctx.arc(blueTextBoxX + borderRadius, blueTextBoxY + blueTextBoxHeight - borderRadius, borderRadius, 0.5 * Math.PI, Math.PI);
            ctx.closePath();
            ctx.fill(); 

            ctx.fillStyle = '#FFFFFF'; 
            ctx.fillText(textParts[2], blueTextBoxX + blueTextBoxWidth / 2, blueTextBoxY + blueTextBoxHeight / 2);
        }

        const imgPath = path.join(__dirname, "cache", `result_image.png`);
        const out = fs.createWriteStream(imgPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', () => {
            api.sendMessage({ attachment: fs.createReadStream(imgPath) }, event.threadID, () => fs.unlinkSync(imgPath), event.messageID);
        });
    }
};

async function getUserProfilePic(userID) {
    try {
        const response = await axios.get(`https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error fetching profile picture:", error);
        return null;
    }
}

async function createCircularImage(imageData, size) {
    const img = await jimp.read(imageData);
    img.resize(size, size);
    img.circle();
    return img.getBufferAsync(jimp.MIME_PNG);
}

function drawImage(ctx, imageData, x, y) {
    loadImage(imageData).then(image => {
        ctx.drawImage(image, x, y);
    }).catch(error => {
        console.error("Error :", error);
    });
}

function getMentionName(args) {
    const mentionIndex = args.findIndex(arg => arg.startsWith('@'));
    if (mentionIndex !== -1 && mentionIndex + 1 < args.length) {
        const mentionParts = args[mentionIndex].split('@');
        return mentionParts[1];
    }
    return "someone";
}