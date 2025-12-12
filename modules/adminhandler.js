const Database = require('../utils/database');
const Helper = require('../utils/helper');

class AdminHandler {
    constructor() {
        this.bannedDB = new Database('./data/banned.json');
        this.welcomeDB = new Database('./data/welcome.json');
    }

    // ====================== SISTEM BAN ======================
    async handleBan(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.find(p => p.id === sender)?.admin;
        if (!isAdmin) return false;

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (text.split(' ')[1]) {
            target = text.split(' ')[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) return false;

        try {
            await sock.groupParticipantsUpdate(from, [target], 'remove');
            const bans = this.bannedDB.getAll();
            if (!bans[from]) bans[from] = [];
            if (!bans[from].includes(target)) bans[from].push(target);
            this.bannedDB.save(bans);
            
            await sock.sendMessage(from, { 
                text: `✅ @${target.split('@')[0]} berhasil dibanned & dikick!`, 
                mentions: [target] 
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    async handleUnban(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.find(p => p.id === sender)?.admin;
        if (!isAdmin) return false;

        let target = null;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (text.split(' ')[1]) {
            target = text.split(' ')[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) return false;

        const bans = this.bannedDB.getAll();
        if (bans[from]?.includes(target)) {
            bans[from] = bans[from].filter(u => u !== target);
            if (bans[from].length === 0) delete bans[from];
            this.bannedDB.save(bans);
            await sock.sendMessage(from, { 
                text: `✅ @${target.split('@')[0]} berhasil di-unban!`, 
                mentions: [target] 
            });
            return true;
        }
        return false;
    }

    async autoKickBanned(sock, update) {
        const { id, participants, action } = update;
        if (action !== 'add') return;

        const bans = this.bannedDB.getAll();
        if (!bans[id]) return;

        const toKick = participants.filter(p => bans[id].includes(p));
        if (toKick.length > 0) {
            try {
                await sock.groupParticipantsUpdate(id, toKick, 'remove');
                for (const p of toKick) {
                    await sock.sendMessage(id, { 
                        text: `@${p.split('@')[0]} dibanned dari grup ini!`, 
                        mentions: [p] 
                    });
                }
            } catch (e) { 
                console.log('Auto kick join error:', e); 
            }
        }
    }

    // ====================== WELCOME MESSAGE ======================
    async handleSetWelcome(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.find(p => p.id === sender)?.admin;
        if (!isAdmin) return false;

        const newMsg = text.slice(12);
        const welcomes = this.welcomeDB.getAll();
        welcomes[from] = newMsg;
        this.welcomeDB.save(welcomes);

        await sock.sendMessage(from, { 
            text: `Welcome diupdate!\nPreview:\n${newMsg.replace('$nama', 'Nama').replace('$nomor', '628xxx').replace('$grup', group.subject)}` 
        });
        return true;
    }

    async sendWelcome(sock, update) {
        if (update.action !== 'add') return;
        
        const welcomes = this.welcomeDB.getAll();
        const caption = welcomes[update.id] || `SELAMAT DATANG $nama DI $grup!\nNomor: $nomor\nSemoga betah ya! 🔥`;

        for (const user of update.participants) {
            try {
                const meta = await sock.groupMetadata(update.id);
                const pp = await sock.profilePictureUrl(user, 'image').catch(() => 'https://i.ibb.co/3mZmy8Z/default-pp.jpg');
                const name = await sock.getName(user) || 'User';
                const finalCaption = caption
                    .replace('$nama', name)
                    .replace('$nomor', user.split('@')[0])
                    .replace('$grup', meta.subject);

                await sock.sendMessage(update.id, { 
                    image: { url: pp }, 
                    caption: finalCaption 
                });
            } catch (e) { }
        }
    }

    // ====================== ADMIN GROUP COMMANDS ======================
    async handlePromoteDemote(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.some(p => p.id === sender && p.admin);
        if (!isAdmin) return false;

        let targets = [];
        const ext = msg.message?.extendedTextMessage;
        if (ext?.contextInfo?.mentionedJid && ext.contextInfo.mentionedJid.length) {
            targets = ext.contextInfo.mentionedJid;
        } else if (ext?.contextInfo?.participant) {
            targets = [ext.contextInfo.participant];
        }

        if (!targets.length) return false;

        try {
            const action = text.toLowerCase().startsWith('.promote') ? 'promote' : 'demote';
            await sock.groupParticipantsUpdate(from, targets, action);
            const mentionText = targets.map(jid => `@${jid.split('@')[0]}`).join(', ');
            await sock.sendMessage(from, { 
                text: `Sukses melakukan ${action} untuk ${mentionText}`, 
                mentions: targets 
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    async handleGroupControl(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.some(p => p.id === sender && p.admin);
        if (!isAdmin) return false;

        try {
            const mode = text.toLowerCase() === '.closegroup' ? 'announcement' : 'not_announcement';
            if (typeof sock.groupSettingChange === 'function') {
                await sock.groupSettingChange(from, mode);
            } else if (typeof sock.groupSettingUpdate === 'function') {
                await sock.groupSettingUpdate(from, mode);
            } else {
                return false;
            }

            const message = text.toLowerCase() === '.closegroup' 
                ? 'Sukses! Grup ditutup — hanya admin yang bisa mengirim pesan sekarang.'
                : 'Sukses! Grup dibuka — semua anggota bisa mengirim pesan sekarang.';
            
            await sock.sendMessage(from, { text: message });
            return true;
        } catch (err) {
            return false;
        }
    }

    async handleTagAll(sock, from, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        let teks = 'TAG SEMUA ORANG!\n';
        for (let mem of group.participants) {
            teks += ` @${mem.id.split('@')[0]}\n`;
        }
        teks += ` \nBERHASIL TAG SEMUA ORANG ✅`;
        
        await sock.sendMessage(from, { 
            text: teks, 
            mentions: group.participants.map(a => a.id) 
        });
        return true;
    }

    async handleHideTag(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        let pesan = '';
        if (text.toLowerCase().startsWith('.hidetag ')) {
            pesan = text.slice(9).trim();
        } else if (text.toLowerCase().startsWith('.h ')) {
            pesan = text.slice(3).trim();
        }
        
        const messageToSend = pesan ? pesan : '\n‎';
        const group = await sock.groupMetadata(from);
        
        await sock.sendMessage(from, {
            text: messageToSend,
            mentions: group.participants.map(a => a.id)
        });
        return true;
    }

    async handleKick(sock, from, text, msg) {
        if (!from.endsWith('@g.us')) return false;
        
        const group = await sock.groupMetadata(from);
        const sender = msg.key.participant || from;
        const isAdmin = group.participants.some(p => p.id === sender && p.admin);
        if (!isAdmin) return false;

        let targets = [];
        const ext = msg.message?.extendedTextMessage;
        if (ext?.contextInfo?.mentionedJid && ext.contextInfo.mentionedJid.length) {
            targets = ext.contextInfo.mentionedJid;
        } else if (ext?.contextInfo?.participant) {
            targets = [ext.contextInfo.participant];
        }

        if (!targets.length) return false;

        try {
            await sock.groupParticipantsUpdate(from, targets, 'remove');
            await sock.sendMessage(from, { 
                text: `Sukses mengeluarkan: ${targets.map(t => '@' + t.split('@')[0]).join(', ')}`, 
                mentions: targets 
            });
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = AdminHandler;