// Yardımcı fonksiyonlar modülü
export class Utils {
    // Türkçe karakterleri İngilizce karşılıklarına çevir
    static convertTurkishChars(text) {
        const turkishChars = {
            'ç': 'C', 'Ç': 'C',
            'ğ': 'G', 'Ğ': 'G',
            'ı': 'I', 'İ': 'I', 'i': 'I',
            'ö': 'O', 'Ö': 'O',
            'ş': 'S', 'Ş': 'S',
            'ü': 'U', 'Ü': 'U'
        };

        return text.replace(/[çÇğĞıİiöÖşŞüÜ]/g, function(match) {
            return turkishChars[match] || match;
        });
    }

    // Metin inputlarını büyük harfe çevir ve Türkçe karakter dönüşümü yap
    static normalizeText(text) {
        return this.convertTurkishChars(text.toUpperCase());
    }

    // Stok input validasyonu
    static validateStockInput(value) {
        // Boş ise veya ? ise "?" döndür
        if (value === '' || value === '?') {
            return '?';
        }

        // Sadece rakamları al
        const numbersOnly = value.replace(/[^0-9]/g, '');
        
        // Eğer hiç rakam yoksa "?" döndür
        if (numbersOnly === '') {
            return '?';
        }

        return parseInt(numbersOnly);
    }

    // Tag'ları parse et (boşlukla ayrılmış)
    static parseTags(tagString) {
        if (!tagString) return [];
        
        return tagString
            .split(/\s+/) // Boşluklarla ayır (birden fazla boşluk da destekle)
            .map(tag => tag.trim()) // Başındaki/sonundaki boşlukları temizle
            .filter(tag => tag.length > 0) // Boş tag'ları filtrele
            .map(tag => this.normalizeText(tag)); // Büyük harfe çevir
    }

    // Tag'ları string'e çevir
    static tagsToString(tags) {
        if (!Array.isArray(tags)) return '';
        return tags.join(' ');
    }

    // CSV satırını parse et (virgül ve tırnak işareti desteği)
    static parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        values.push(currentValue.trim());
        return values;
    }

    // Unique ID oluştur
    static generateUniqueId(counter) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
        const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
        const number = counter.toString().padStart(3, '0');
        return `${randomLetter1}${randomLetter2}${number}`;
    }

    // Tag class'ını belirle
    static getTagClass(tag) {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('elektronik') || lowerTag.includes('electronic')) return 'electronics';
        if (lowerTag.includes('direnç') || lowerTag.includes('resistor')) return 'resistor';
        if (lowerTag.includes('kondansatör') || lowerTag.includes('capacitor')) return 'capacitor';
        if (lowerTag.includes('entegre') || lowerTag.includes('ic') || lowerTag.includes('integrated')) return 'integrated';
        if (lowerTag.includes('mekanik') || lowerTag.includes('mechanical')) return 'mechanical';
        return '';
    }
} 