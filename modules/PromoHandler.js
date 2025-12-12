const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

class PromoHandler {
    constructor(sock) {
        this.sock = sock;
        this.PROMO_TARGET = '120363280006072640@g.us';
        this.FOLDER = path.join(__dirname, '..', 'data', 'images');
        this.promos = [
            {
                time: '40 7 * * *', 
                photo: 'promo_3d.jpg', 
                caption: `🔥 *JASA 3D FREE FIRE MURAH!*\n` +
                        `• 3D Solo       : 50rb\n` +
                        `• 3D Couple     : 70rb\n` +
                        `• 3D Squad     : 100rb-150rb\n\n` +
                        `Hasil Super HD! + Anti Pasaran!! \n` +
                        `Minat? Chat sekarang:\nwa.me/6289528950624\n\n` +
                        `#3DFreeFire #3DFF #Jasa3D`
            },
            {
                time: '41 7 * * *', 
                photo: 'promo_topup.jpg', 
                caption: `𝐒𝐚𝐦𝐀𝐥 | รักและรักคุณจริงๆ\n💎 TOPUP GAME MURAHHH!\n\n` +
                        `🔥 Free Fire\n70 Diamond : Rp7.951\n140 Diamond : Rp15.502\n🪪 Weekly Membership : Rp26.127\n\n` +
                        `⚡ Mobile Legends\n3 Diamond : Rp1.217\n1050 Diamond : Rp262.196\n🪪 Weekly Pass : Rp26.985\n\n` +
                        `🎮 Game Lainnya\nRoblox 1500 Robux : Rp215.438\nPUBG 120 UC : Rp29.917\nGenshin 60 Crystals : Rp12.211\n\n` +
                        `Keterangan lebih lanjut langsung chat:\nwa.me/6289528950624\n#TopUpMurah #SamSukabyone #DiamondMurah`
            },
            {
                time: '42 7 * * *', 
                photo: 'promo_sewa.jpg', 
                caption: `🤖 *SEWA BOT WHATSAPP PREMIUM CUMA 10K/BULAN!*\n` +
                        `Fitur gacor:\n` +
                        `• Tagall / Hidetag\n` +
                        `• Downloader (TT, IG, YT)\n` +
                        `• Stiker otomatis\n` +
                        `• Anti link + kick otomatis\n` +
                        `• Play lagu, open/close grup, dll\n` +
                        `Bot on 24 jam • Gacor • Zero DC\n` +
                        `Langsung sewa:\nwa.me/6289528950624\n` +
                        `#SewaBot #BotWA #BotPremium`
            }
        ];
    }

    setupCronJobs() {
        this.promos.forEach(p => {
            cron.schedule(p.time, async () => {
                const photoPath = path.join(this.FOLDER, p.photo);
                if (fs.existsSync(photoPath)) {
                    await this.sock.sendMessage(this.PROMO_TARGET, { 
                        image: fs.readFileSync(photoPath), 
                        caption: p.caption 
                    });
                }
            }, { timezone: 'Asia/Jakarta' });
        });
    }

    async sendPromo(sock, from) {
        const photo = path.join(this.FOLDER, 'promo_topup.jpg');
        if (fs.existsSync(photo)) {
            await sock.sendMessage(from, { 
                image: fs.readFileSync(photo), 
                caption: this.promos[1].caption 
            });
            return true;
        }
        return false;
    }
}

module.exports = PromoHandler;