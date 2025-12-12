const axios = require('axios');
const Helper = require('../utils/helper.');

class DownloaderHandler {
    constructor() {}

    async downloadTikTok(url) {
        try {
            const res = await axios.get(`https://tikwm.com/api/?url=${url}`);
            if (res.data.code !== 0) throw new Error('API error: ' + res.data.msg);
            
            return {
                success: true,
                videoUrl: res.data.data.play,
                title: res.data.data.title || 'TikTok Video',
                author: res.data.data.author.unique_id || 'unknown'
            };
        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    }

    async downloadInstagram(url) {
        try {
            const apiUrl = `http://localhost:3000/igdl?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            
            const videoData = response.data?.url?.data?.[0];
            if (videoData && videoData.url) {
                return {
                    success: true,
                    videoUrl: videoData.url
                };
            } else {
                throw new Error('Link download tidak ditemukan');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = DownloaderHandler;