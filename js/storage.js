// LocalStorage yönetimi modülü
export class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            STOCK_DATA: 'stockData',
            PRODUCT_COUNTER: 'productCounter'
        };
    }

    // Stok verilerini yükle
    loadStockData() {
        const data = localStorage.getItem(this.STORAGE_KEYS.STOCK_DATA);
        return data ? JSON.parse(data) : [];
    }

    // Product counter'ı yükle
    loadProductCounter() {
        const counter = localStorage.getItem(this.STORAGE_KEYS.PRODUCT_COUNTER);
        return counter ? parseInt(counter) : 1;
    }

    // Stok verilerini kaydet
    saveStockData(products) {
        localStorage.setItem(this.STORAGE_KEYS.STOCK_DATA, JSON.stringify(products));
    }

    // Product counter'ı kaydet
    saveProductCounter(counter) {
        localStorage.setItem(this.STORAGE_KEYS.PRODUCT_COUNTER, counter.toString());
    }

    // Tüm verileri kaydet
    saveAll(products, counter) {
        this.saveStockData(products);
        this.saveProductCounter(counter);
    }

    // Eski tag verilerini temizle (migration için)
    cleanupOldTagStorage() {
        if (localStorage.getItem('stockTags')) {
            localStorage.removeItem('stockTags');
            console.log('Eski tag verileri localStorage\'dan temizlendi');
        }
    }

    // Storage'ı temizle
    clearAll() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }

    // Storage durumunu kontrol et
    getStorageInfo() {
        const products = this.loadStockData();
        const counter = this.loadProductCounter();
        
        return {
            productCount: products.length,
            currentCounter: counter,
            hasData: products.length > 0,
            storageSize: JSON.stringify(products).length
        };
    }
} 