// Uygulama başlatıcı modülü
import { StockManager } from './stock-manager.js';

class App {
    constructor() {
        this.stockManager = null;
        this.init();
    }

    async init() {
        try {
            console.log('📦 Stock Takip Uygulaması başlatılıyor...');
            
            // DOM hazır olmasını bekle
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.startApp());
            } else {
                this.startApp();
            }
            
        } catch (error) {
            console.error('Uygulama başlatılırken hata:', error);
            this.showErrorMessage('Uygulama başlatılamadı!');
        }
    }

    startApp() {
        try {
            // StockManager'ı başlat
            this.stockManager = new StockManager();
            
            // Global erişim için window'a ekle (debugging için)
            window.stockManager = this.stockManager;
            
            // Debug bilgileri
            this.logAppInfo();
            
            console.log('✅ Uygulama başarıyla başlatıldı!');
            
        } catch (error) {
            console.error('StockManager başlatılırken hata:', error);
            this.showErrorMessage('Stok yöneticisi başlatılamadı!');
        }
    }

    logAppInfo() {
        if (this.stockManager) {
            const info = this.stockManager.getAppInfo();
            console.log('📊 Uygulama Bilgileri:', {
                'Ürün Sayısı': info.productCount,
                'Tag Sayısı': info.tagCount,
                'Storage Boyutu': `${Math.round(info.storage.storageSize / 1024)} KB`,
                'Kaydedilmemiş Değişiklik': info.hasUnsavedChanges ? 'Var' : 'Yok'
            });
        }
    }

    showErrorMessage(message) {
        // Basit hata mesajı göster
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Uygulamayı başlat
const app = new App();

// Hot reload desteği (development için)
if (module.hot) {
    module.hot.accept();
} 