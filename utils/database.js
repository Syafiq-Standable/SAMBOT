const fs = require('fs');
const path = require('path');

class Database {
    constructor(filePath) {
        this.filePath = filePath;
        this.ensureFile();
    }

    ensureFile() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, '{}');
        }
    }

    load() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error(`Error loading ${this.filePath}:`, e.message);
            return {};
        }
    }

    save(data) {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (e) {
            console.error(`Error saving ${this.filePath}:`, e.message);
            return false;
        }
    }

    get(key) {
        const data = this.load();
        return data[key];
    }

    set(key, value) {
        const data = this.load();
        data[key] = value;
        return this.save(data);
    }

    delete(key) {
        const data = this.load();
        if (data[key]) {
            delete data[key];
            return this.save(data);
        }
        return false;
    }

    getAll() {
        return this.load();
    }
}

module.exports = Database;