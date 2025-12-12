const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');

class StickerHandler {
    constructor() {}

    async createSticker(imgMsg) {
        try {
            const stream = await downloadContentFromMessage(imgMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, { 
                    fit: 'contain', 
                    background: { r: 0, g: 0, b: 0, alpha: 0 } 
                })
                .webp({ quality: 80 })
                .toBuffer();

            return {
                success: true,
                buffer: stickerBuffer
            };
        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    }

    shouldCreateSticker(text, msg) {
        const lowerText = text.toLowerCase();
        const isCommand = lowerText.startsWith('.s ') || 
                          lowerText === '.s' ||
                          lowerText.startsWith('.stiker ') || 
                          lowerText === '.stiker' ||
                          lowerText.startsWith('.sticker ') || 
                          lowerText === '.sticker';

        if (!isCommand) return false;

        // Check if image is in caption or quoted
        if (msg.message?.imageMessage) {
            const caption = (msg.message.imageMessage.caption || '').toLowerCase();
            if (caption.includes('.s') || caption.includes('.stiker') || caption.includes('.sticker')) {
                return msg.message.imageMessage;
            }
        }

        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            return msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
        }

        return null;
    }
}

module.exports = StickerHandler;