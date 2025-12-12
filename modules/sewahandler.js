const Database = require('../utils/database');
const Helper = require('../utils/helper');

class SewaHandler {
    constructor() {
        this.rentalsDB = new Database('./data/rentals.json');
        this.ownersDB = new Database('./data/owners.json');
    }

    isOwner(jid) {
        if (!jid) return false;
        const owners = this.ownersDB.getAll();
        const numeric = jid.split('@')[0];
        return owners[numeric] === true;
    }

    isGroupAdmin(groupParticipants, senderJid) {
        const participant = groupParticipants.find(p => p.id === senderJid);
        return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
    }

    hasAccess(isGroup, senderJid, groupId, groupParticipants) {
        // Owner selalu punya akses
        if (this.isOwner(senderJid)) return true;
        
        // Di grup: cek apakah admin grup
        if (isGroup) {
            return this.isGroupAdmin(groupParticipants, senderJid);
        }
        
        // Di private: cek apakah menyewa
        const senderId = senderJid.split('@')[0];
        const rental = this.getRental(senderId);
        return !!rental;
    }

    getRental(id) {
        const rentals = this.rentalsDB.getAll();
        const rental = rentals[id];
        if (!rental) return null;
        
        if (rental.expires && Date.now() > rental.expires) {
            delete rentals[id];
            this.rentalsDB.save(rentals);
            return null;
        }
        
        return rental;
    }

    grantRental(scope, id, days, grantedBy) {
        const rentals = this.rentalsDB.getAll();
        const expires = Date.now() + (Number(days) || 0) * 24 * 60 * 60 * 1000;
        
        rentals[id] = {
            scope,
            expires,
            grantedBy,
            grantedAt: Date.now(),
            notified3days: false,
            notified1day: false,
            notifiedExpired: false
        };
        
        this.rentalsDB.save(rentals);
        return rentals[id];
    }

    revokeRental(id) {
        const rentals = this.rentalsDB.getAll();
        if (rentals[id]) {
            delete rentals[id];
            this.rentalsDB.save(rentals);
            return true;
        }
        return false;
    }

    async sendReminders(sock) {
        const rentals = this.rentalsDB.getAll();
        const now = Date.now();
        let changed = false;
        
        for (const [id, rental] of Object.entries(rentals)) {
            if (!rental.expires) continue;
            const remaining = rental.expires - now;
            
            if (remaining <= 0 && !rental.notifiedExpired) {
                const target = rental.scope === 'group' ? id : `${id}@s.whatsapp.net`;
                await sock.sendMessage(target, { 
                    text: `⚠️ Masa sewa Anda untuk *${rental.scope}* telah berakhir. Akses fitur akan dihentikan.` 
                });
                rental.notifiedExpired = true;
                changed = true;
            } else if (remaining <= 24 * 3600 * 1000 && !rental.notified1day) {
                const target = rental.scope === 'group' ? id : `${id}@s.whatsapp.net`;
                await sock.sendMessage(target, { 
                    text: `📢 Masa sewa akan berakhir dalam kurang dari 24 jam!` 
                });
                rental.notified1day = true;
                changed = true;
            } else if (remaining <= 3 * 24 * 3600 * 1000 && !rental.notified3days) {
                const target = rental.scope === 'group' ? id : `${id}@s.whatsapp.net`;
                await sock.sendMessage(target, { 
                    text: `📢 Masa sewa akan berakhir dalam ${Math.ceil(remaining / (24 * 3600 * 1000))} hari.` 
                });
                rental.notified3days = true;
                changed = true;
            }
        }
        
        if (changed) this.rentalsDB.save(rentals);
    }
}

module.exports = SewaHandler;