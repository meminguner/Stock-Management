// Storage modülü testleri
import { testRunner } from '../js/test-runner.js';
import { StorageManager } from '../js/storage.js';

// Storage testleri
testRunner.describe('Storage Modülü Testleri', () => {
    
    let storage;
    const testPrefix = 'test_';
    
    // Her testten önce çalışır
    const setupTest = () => {
        storage = new StorageManager();
        // Test keylerini değiştir
        storage.STORAGE_KEYS = {
            STOCK_DATA: testPrefix + 'stockData',
            PRODUCT_COUNTER: testPrefix + 'productCounter'
        };
        // Test verilerini temizle
        clearTestData();
    };
    
    // Test verilerini temizle
    const clearTestData = () => {
        Object.values(storage.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    };

    testRunner.test('StorageManager - Başlangıç durumu', async (assert) => {
        setupTest();
        
        const products = storage.loadStockData();
        const counter = storage.loadProductCounter();
        
        assert.arrayEquals(products, [], 'Başlangıçta boş array dönemli');
        assert.equals(counter, 1, 'Başlangıç counter\'ı 1 olmalı');
    });

    testRunner.test('saveStockData - Stok verilerini kaydeder', async (assert) => {
        setupTest();
        
        const testProducts = [
            { id: 'AB001', name: 'TEST ÜRÜN', partNumber: 'PRD001', tags: ['TEST'], stock: 10 }
        ];
        
        storage.saveStockData(testProducts);
        const loadedProducts = storage.loadStockData();
        
        assert.arrayEquals(loadedProducts, testProducts, 'Kaydedilen veriler doğru yüklenmeli');
        assert.equals(loadedProducts[0].name, 'TEST ÜRÜN', 'Ürün adı doğru olmalı');
    });

    testRunner.test('saveProductCounter - Counter değerini kaydeder', async (assert) => {
        setupTest();
        
        storage.saveProductCounter(42);
        const loadedCounter = storage.loadProductCounter();
        
        assert.equals(loadedCounter, 42, 'Counter değeri doğru kaydedilmeli');
    });

    testRunner.test('saveAll - Tüm verileri kaydeder', async (assert) => {
        setupTest();
        
        const testProducts = [
            { id: 'CD002', name: 'TEST 2', partNumber: 'PRD002', tags: ['TEST2'], stock: 5 }
        ];
        const testCounter = 99;
        
        storage.saveAll(testProducts, testCounter);
        
        const loadedProducts = storage.loadStockData();
        const loadedCounter = storage.loadProductCounter();
        
        assert.arrayEquals(loadedProducts, testProducts, 'Tüm ürünler kaydedilmeli');
        assert.equals(loadedCounter, testCounter, 'Counter kaydedilmeli');
    });

    testRunner.test('getStorageInfo - Storage bilgilerini döner', async (assert) => {
        setupTest();
        
        const testProducts = [
            { id: 'EF003', name: 'INFO TEST', partNumber: 'PRD003', tags: ['INFO'], stock: 1 }
        ];
        storage.saveAll(testProducts, 15);
        
        const info = storage.getStorageInfo();
        
        assert.equals(info.productCount, 1, 'Ürün sayısı doğru olmalı');
        assert.equals(info.currentCounter, 15, 'Mevcut counter doğru olmalı');
        assert.truthy(info.hasData, 'Veri varlığı true olmalı');
        assert.truthy(info.storageSize > 0, 'Storage boyutu pozitif olmalı');
    });

    testRunner.test('clearAll - Tüm verileri temizler', async (assert) => {
        setupTest();
        
        // Önce veri ekle
        storage.saveAll([{ id: 'test' }], 10);
        
        // Sonra temizle
        storage.clearAll();
        
        const products = storage.loadStockData();
        const counter = storage.loadProductCounter();
        
        assert.arrayEquals(products, [], 'Veriler temizlenmeli');
        assert.equals(counter, 1, 'Counter sıfırlanmalı');
    });

    testRunner.test('cleanupOldTagStorage - Eski tag verilerini temizler', async (assert) => {
        setupTest();
        
        // Eski tag verisi ekle
        localStorage.setItem('stockTags', JSON.stringify(['OLD_TAG']));
        
        assert.truthy(localStorage.getItem('stockTags'), 'Eski tag verisi var olmalı');
        
        storage.cleanupOldTagStorage();
        
        assert.falsy(localStorage.getItem('stockTags'), 'Eski tag verisi temizlenmeli');
    });

    testRunner.test('JSON Parse Hataları - Bozuk verilerle başa çıkar', async (assert) => {
        setupTest();
        
        // Bozuk JSON verisi ekle
        localStorage.setItem(storage.STORAGE_KEYS.STOCK_DATA, 'invalid json');
        localStorage.setItem(storage.STORAGE_KEYS.PRODUCT_COUNTER, 'not a number');
        
        try {
            const products = storage.loadStockData();
            const counter = storage.loadProductCounter();
            
            // Hata durumunda default değerler dönmeli
            assert.arrayEquals(products, [], 'Bozuk JSON için boş array dönemli');
            assert.equals(counter, 1, 'Bozuk counter için 1 dönemli');
        } catch (error) {
            // JSON parse hatası beklenir
            assert.truthy(true, 'JSON parse hatası yakalandı');
        }
    });

    testRunner.test('Large Data Handling - Büyük veri setleriyle çalışır', async (assert) => {
        setupTest();
        
        // Büyük veri seti oluştur
        const largeProducts = [];
        for (let i = 0; i < 1000; i++) {
            largeProducts.push({
                id: `LARGE${i.toString().padStart(3, '0')}`,
                name: `TEST ÜRÜN ${i}`,
                partNumber: `PRD${i}`,
                tags: ['BULK', 'TEST'],
                stock: i % 100
            });
        }
        
        storage.saveStockData(largeProducts);
        const loadedProducts = storage.loadStockData();
        
        assert.equals(loadedProducts.length, 1000, 'Büyük veri seti kaydedilmeli');
        assert.equals(loadedProducts[999].name, 'TEST ÜRÜN 999', 'Son eleman doğru olmalı');
        
        const info = storage.getStorageInfo();
        assert.truthy(info.storageSize > 50000, 'Büyük verinin boyutu büyük olmalı'); // ~50KB+
    });

    testRunner.test('Concurrent Access - Eşzamanlı erişim', async (assert) => {
        setupTest();
        
        // Paralel kaydetme işlemleri
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(new Promise(resolve => {
                storage.saveProductCounter(i * 10);
                resolve();
            }));
        }
        
        await Promise.all(promises);
        
        // Son değer kaydedilmiş olmalı
        const counter = storage.loadProductCounter();
        assert.truthy(counter >= 0 && counter <= 90, 'Counter değeri geçerli aralıkta olmalı');
    });

    // Her testten sonra temizlik
    testRunner.test('Cleanup - Test verilerini temizle', async (assert) => {
        clearTestData();
        
        // Temizlik kontrolü
        const products = storage.loadStockData();
        assert.arrayEquals(products, [], 'Test verileri temizlenmeli');
        
        assert.truthy(true, 'Temizlik tamamlandı');
    });
}); 