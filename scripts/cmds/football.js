const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function football(api, event) {
    api.setMessageReaction("🕢", event.messageID, (err) => {}, true);
    try {
        const response = await axios.get('https://free-football-soccer-videos.p.rapidapi.com/', {
            headers: {
                'X-RapidAPI-Key': 'b38444b5b7mshc6ce6bcd5c9e446p154fa1jsn7bbcfb025b3b',
                'X-RapidAPI-Host': 'free-football-soccer-videos.p.rapidapi.com'
            }
        });

        const randomVideoIndex = Math.floor(Math.random() * response.data.length);
        const randomVideo = response.data[randomVideoIndex];

        const title = randomVideo.title;
        const videoUrl = randomVideo.url;

     
        await video(api, event, [title, videoUrl]);

        api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Error occurred while fetching football updates.", event.threadID, event.messageID);
    }
}

async function video(api, event, args) {
    try {
        const [searchQuery, videoUrl] = args;

       
        const searchResponse = await axios.get(`https://youtube-kshitiz.vercel.app/youtube?search=${encodeURIComponent(searchQuery)}`);

        if (searchResponse.data.length === 0) {
            api.sendMessage("no match found.", event.threadID);
            return;
        }

       
        const videoId = searchResponse.data[0].videoId;

      
        const downloadResponse = await axios.get(`https://youtube-kshitiz.vercel.app/download?id=${encodeURIComponent(videoId)}`);

        if (downloadResponse.data.length === 0) {
            api.sendMessage("api issue.", event.threadID, event.messageID);
            return;
        }

     
        const videoFileUrl = downloadResponse.data[0];

       
        const writer = fs.createWriteStream(path.join(__dirname, "cache", "video.mp4"));
        const response = await axios({
            url: videoFileUrl,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        writer.on('finish', () => {
            const videoStream = fs.createReadStream(path.join(__dirname, "cache", "video.mp4"));
            const videoBody = `│𝗧𝗜𝗧𝗜𝗟𝗘:${searchQuery}\n│ 𝗗𝗘𝗧𝗔𝗜𝗟𝗦:${videoUrl}`;
            api.sendMessage({ body: videoBody, attachment: videoStream }, event.threadID, event.messageID);
        });

        writer.on('error', (error) => {
            console.error("Error:", error);
            api.sendMessage("Error occurred while downloading the video.", event.threadID, event.messageID);
        });
    } catch (error) {
        console.error("Error:", error);
        api.sendMessage("Error occurred while processing the request.", event.threadID, event.messageID);
    }
}

module.exports = {
    config: {
        name: "football",
        version: "2.0",
        author: "vex_kshitiz",
        countDown: 5,
        role: 0,
        shortDescription: "lado",
        longDescription: "get latest football match highlights",
        category: "media",
        guide: "{p} football"
    },
    onStart: function ({ api, event }) {
        return football(api, event);
    }
};
