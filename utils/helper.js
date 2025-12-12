class Helper {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    static formatDate(date = new Date()) {
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDuration(ms) {
        if (ms <= 0) return 'Kadaluarsa';
        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        
        const parts = [];
        if (days > 0) parts.push(`${days} hari`);
        if (hours > 0) parts.push(`${hours} jam`);
        if (minutes > 0 && days === 0) parts.push(`${minutes} menit`);
        
        return parts.length > 0 ? parts.join(', ') : 'Kurang dari 1 menit';
    }

    static validatePhone(phone) {
        const clean = phone.replace(/[^0-9]/g, '');
        if (clean.startsWith('0')) return '62' + clean.substring(1);
        if (clean.startsWith('62')) return clean;
        if (clean.startsWith('8')) return '62' + clean;
        return clean;
    }

    static extractText(msg) {
        return (
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            ''
        ).trim();
    }
}

module.exports = Helper;