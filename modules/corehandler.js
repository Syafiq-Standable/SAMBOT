const Database = require('../utils/database');
const Helper = require('../utils/helper');

class CoreHandler {
    constructor() {
        this.usersDB = new Database('./data/users.json');
        this.sewaHandler = require('./sewahandler');
    }

    async updateUserRecord(msg) {
        try {
            const userJid = msg.key.participant || msg.key.remoteJid;
            if (!userJid) return;
            
            const users = this.usersDB.getAll();
            const id = userJid.split('@')[0];
            const now = Date.now();
            
            if (!users[id]) {
                users[id] = {
                    jid: userJid,
                    name: msg.pushName || '',
                    firstSeen: now,
                    count: 1
                };
            } else {
                users[id].count = (users[id].count || 0) + 1;
                if (msg.pushName) users[id].name = msg.pushName;
                if (!users[id].firstSeen) users[id].firstSeen = now;
            }
            
            this.usersDB.save(users);
        } catch (e) {
            console.log('updateUserRecord error:', e.message);
        }
    }

    async handleProfile(sock, from, msg) {
        const ext = msg.message?.extendedTextMessage;
        let targetJid = null;
        
        if (ext?.contextInfo?.mentionedJid && ext.contextInfo.mentionedJid.length) {
            targetJid = ext.contextInfo.mentionedJid[0];
        } else if (ext?.contextInfo?.participant) {
            targetJid = ext.contextInfo.participant;
        } else {
            targetJid = msg.key.participant || msg.key.remoteJid;
        }

        const users = this.usersDB.getAll();
        const id = (targetJid || msg.key.remoteJid).split('@')[0];
        const record = users[id] || { 
            jid: targetJid || msg.key.remoteJid, 
            name: msg.pushName || 'Unknown', 
            firstSeen: null, 
            count: 0 
        };
        
        const name = record.name || 'Unknown';
        const waId = id;
        const count = record.count || 0;
        const firstSeen = record.firstSeen ? Helper.formatDate(new Date(record.firstSeen)) : 'Unknown';

        const profileText = `*-- [ PROFILE KAMU ] --*\n👤 Nama: ${name}\n📞 NO. HP: ${waId}\n📊 Total Penggunaan: ${count} chat\nTerus gunakan bot ini ya! 😉`;

        const mentions = targetJid ? [targetJid] : [];
        await sock.sendMessage(from, { text: profileText, mentions });
        return true;
    }

    async handlePing(sock, from, msg) {
        const msgTs = msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now();
        const tickMs = Date.now() - msgTs;
        const tickS = (tickMs / 1000).toFixed(2);
        
        await sock.sendMessage(from, { 
            text: `🚀 Bot aktif!\nLatency: ${tickS} detik (${tickMs} ms)` 
        });
        return true;
    }

    async handleMenu(sock, from) {
        const menuText = `📌 *𝐒𝐚𝐦𝐀𝐥 | รักและรักคุณจริงๆ 🔥*
• .menu / .help - Tampilkan menu
• .ping - Cek status & latency
• .profile [@user] - Lihat profil
• .stiker - Buat stiker dari gambar
• .cekidgroup - Lihat ID grup

📥 *DOWNLOADER:*
• .tt [link] - Download TikTok
• .ig [link] - Download Instagram

👥 *ADMIN GRUP:*
• .tagall - Tag semua anggota
• .hidetag [pesan] - Tag tanpa notif
• .promote/demote [@user] - Atur admin
• .kick/ban/unban [@user] - Kelola member
• .close/opengroup - Buka/tutup grup

🔐 *SEWA & AKSES:*
• .sewa - Info sewa bot
• .ceksewa - Cek status sewa

────────────────────
📞 *KONTAK OWNER:*
wa.me/6289528950624 - Sam @Sukabyone

💎 *Note:* Beberapa fitur membutuhkan sewa bot. Ketik .sewa untuk info lengkap!`;

        await sock.sendMessage(from, { text: menuText });
        return true;
    }

    async handleSewaInfo(sock, from) {
        const sewaText = `🌟 *Sistem Penyewaan Bot* 🌟 \n 𝐒𝐚𝐦𝐀𝐥 | รักและรักคุณจริงๆ \n\n` +
                        `✨ *Sistem sewa sederhana:*\n` +
                        `• *Sewa = Bisa menggunakan semua fitur bot*\n` +
                        `• *Tidak sewa = Tidak bisa menggunakan sama sekali*\n\n` +
                        `📌 Cara penyewaan:\n` +
                        `• Hubungi kontak Owner / Admin di bawah \n` +
                        `• Chat Admin dan katakan bahwa ingin menyewa bot. \n  •_contoh: "Saya ingin menyewa bot selama 30 hari"_ \n\n` +
                        `💰 *Harga Sewa:*\n` +
                        `• Rp 10.000 untuk 30 hari (1 bulan)\n` +
                        `• Rp 25.000 untuk 90 hari (3 bulan)\n` +
                        `• Rp 45.000 untuk 180 hari (6 bulan)\n\n` +
                        `📞 *Kontak Owner / Admin:*\n` +
                        `• wa.me/6289528950624 - Sam @Sukabyone \n\n` +
                        `Terima kasih! ✨`;
        
        await sock.sendMessage(from, { text: sewaText });
        return true;
    }

    async handleCheckSewa(sock, from, text, msg) {
        try {
            const isGroup = from.endsWith('@g.us');
            let key = null;
            
            if (isGroup) {
                key = from;
            } else {
                key = (msg.key.participant || from).split('@')[0];
                key = Helper.validatePhone(key);
            }
            
            const rental = this.sewaHandler.getRental(key);
            if (!rental) {
                await sock.sendMessage(from, { 
                    text: `Tidak ada sewa aktif untuk ${isGroup ? 'grup ini' : 'akun Anda'}` 
                });
                return true;
            }
            
            const remainingMs = rental.expires - Date.now();
            const textOut = `📌 Info Sewa\n` +
                          `Target: ${key}\n` +
                          `Kadaluarsa: ${Helper.formatDate(new Date(rental.expires))}\n` +
                          `Sisa waktu: ${Helper.formatDuration(remainingMs)}\n` +
                          `Diberikan oleh: ${rental.grantedBy || 'unknown'}`;
            
            await sock.sendMessage(from, { text: textOut });
            return true;
        } catch (e) {
            console.log('ceksewa error:', e.message);
            return false;
        }
    }

    async handleCekIdGroup(sock, from) {
        if (!from.endsWith('@g.us')) return false;
        
        const meta = await sock.groupMetadata(from);
        const gid = from;
        const title = meta?.subject || 'Group';
        
        await sock.sendMessage(from, { 
            text: `Group: ${title}\nID: ${gid}` 
        });
        return true;
    }
}

module.exports = CoreHandler;