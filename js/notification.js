// Bildirim sistemi modülü
export class NotificationManager {
    constructor() {
        this.activeNotifications = new Set();
        this.maxNotifications = 5; // Aynı anda maksimum bildirim sayısı
    }

    // Bildirim göster
    show(message, type = 'success', duration = 3000) {
        // Çok fazla bildirim varsa eski olanları kaldır
        if (this.activeNotifications.size >= this.maxNotifications) {
            this.clearOldest();
        }

        const notification = this.createElement(message, type);
        document.body.appendChild(notification);
        this.activeNotifications.add(notification);

        // Animasyon ile göster
        setTimeout(() => notification.classList.add('show'), 100);

        // Otomatik kaldırma
        setTimeout(() => {
            this.hide(notification);
        }, duration);

        return notification;
    }

    // Bildirim elementi oluştur
    createElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        // Close butonu event'i
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide(notification);
        });

        // Tıklayarak kapatma
        notification.addEventListener('click', () => {
            this.hide(notification);
        });

        return notification;
    }

    // Bildirim gizle
    hide(notification) {
        if (!notification || !notification.parentNode) return;

        notification.classList.remove('show');
        this.activeNotifications.delete(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }

    // En eski bildirimi kaldır
    clearOldest() {
        const oldest = this.activeNotifications.values().next().value;
        if (oldest) {
            this.hide(oldest);
        }
    }

    // Tüm bildirimleri kaldır
    clearAll() {
        this.activeNotifications.forEach(notification => {
            this.hide(notification);
        });
    }

    // Başarı bildirimi
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    // Hata bildirimi
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    // Uyarı bildirimi
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    // Bilgi bildirimi
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
} 