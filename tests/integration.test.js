// Integration testleri - Modüllerin birlikte çalışması
import { testRunner } from '../js/test-runner.js';
import { Utils } from '../js/utils.js';
import { StorageManager } from '../js/storage.js';
import { TagManager } from '../js/tag-manager.js';
import { NotificationManager } from '../js/notification.js';

testRunner.describe('Integration Testleri', () => {
    
    // Test ortamı hazırlığı
    const setupIntegrationTest = () => {
        // LocalStorage'ı temizle
        localStorage.clear();
        
        // Test DOM elementleri oluştur
        if (!document.getElementById('testContainer')) {
            const container = document.createElement('div');
            container.id = 'testContainer';
            container.innerHTML = `
                <div id="tagSuggestions" class="tag-suggestions"></div>
                <input id="testTagInput" type="text">
            `;
            document.body.appendChild(container);
        }
    };
    
    const cleanupIntegrationTest = () => {
        const container = document.getElementById('testContainer');
        if (container) {
            container.remove();
        }
    };

    testRunner.test('Utils + Storage Integration - Veri dönüşümü ve kayıt', async (assert) => {
        setupIntegrationTest();
        
        const storage = new StorageManager();
        
        // Raw veri
        const rawProduct = {
            id: 'ab001',
            name: 'test ürün',
            partNumber: 'prd-001',
            tags: ['elektronik', 'relay'],
            stock: '10abc'
        };
        
        // Utils ile normalize et
        const normalizedProduct = {
            id: Utils.generateUniqueId(1),
            name: Utils.normalizeText(rawProduct.name),
            partNumber: Utils.normalizeText(rawProduct.partNumber),
            tags: Utils.parseTags(rawProduct.tags.join(' ')),
            stock: Utils.validateStockInput(rawProduct.stock)
        };
        
        // Storage'a kaydet
        storage.saveStockData([normalizedProduct]);
        
        // Geri yükle ve kontrol et
        const loadedProducts = storage.loadStockData();
        
        assert.equals(loadedProducts[0].name, 'TEST URUN', 'Ürün adı normalize edilmiş olmalı');
        assert.equals(loadedProducts[0].partNumber, 'PRD-001', 'Ürün kodu normalize edilmiş olmalı');
        assert.arrayEquals(loadedProducts[0].tags, ['ELEKTRONIK', 'RELAY'], 'Tag\'ler normalize edilmiş olmalı');
        assert.equals(loadedProducts[0].stock, 10, 'Stok normalize edilmiş olmalı');
        
        cleanupIntegrationTest();
    });

    testRunner.test('TagManager + Utils Integration - Tag yönetimi', async (assert) => {
        setupIntegrationTest();
        
        const tagManager = new TagManager();
        
        // Test ürünleri
        const testProducts = [
            { id: 'AB001', tags: ['elektronik', 'direnç'] },
            { id: 'CD002', tags: ['mekanik', 'vida'] },
            { id: 'EF003', tags: ['elektronik', 'kondansatör'] }
        ];
        
        // Tag'ları yeniden oluştur
        tagManager.regenerateTagsFromProducts(testProducts);
        
        // Unique tag'ler oluşmalı
        const allTags = tagManager.getAllTags();
        assert.arrayEquals(allTags.sort(), ['ELEKTRONIK', 'DIRENÇ', 'KONDANSATÖR', 'MEKANIK', 'VIDA'].sort(), 'Unique tag\'ler oluşmalı');
        
        // Tag class integration
        assert.equals(Utils.getTagClass('ELEKTRONIK'), 'electronics', 'Utils getTagClass ile uyumlu olmalı');
        assert.equals(Utils.getTagClass('DIRENÇ'), 'resistor', 'Türkçe karakterler düzgün çalışmalı');
        
        cleanupIntegrationTest();
    });

    testRunner.test('Notification + DOM Integration - Bildirim sistemi', async (assert) => {
        setupIntegrationTest();
        
        const notification = new NotificationManager();
        
        // Bildirim göster
        const notificationElement = notification.success('Test bildirimi');
        
        // DOM'da var mı kontrol et
        assert.truthy(document.body.contains(notificationElement), 'Bildirim DOM\'a eklenmiş olmalı');
        assert.truthy(notificationElement.classList.contains('notification'), 'Notification class\'ı olmalı');
        assert.truthy(notificationElement.classList.contains('success'), 'Success class\'ı olmalı');
        
        // Otomatik temizlik için bekle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Temizle
        notification.clearAll();
        
        cleanupIntegrationTest();
    });

    testRunner.test('Full Product Workflow - Tam ürün işlem akışı', async (assert) => {
        setupIntegrationTest();
        
        const storage = new StorageManager();
        const tagManager = new TagManager();
        
        // 1. Ürün oluştur
        const rawProductData = {
            name: 'çıkış diyotu',
            partNumber: 'd-1n4007',
            tags: 'elektronik diyot güç',
            stock: '50'
        };
        
        // 2. Veriyi normalize et
        const product = {
            id: Utils.generateUniqueId(1),
            name: Utils.normalizeText(rawProductData.name),
            partNumber: Utils.normalizeText(rawProductData.partNumber),
            tags: Utils.parseTags(rawProductData.tags),
            stock: Utils.validateStockInput(rawProductData.stock)
        };
        
        // 3. Tag manager'a tag'leri ekle
        tagManager.addNewTags(product.tags);
        
        // 4. Storage'a kaydet
        storage.saveAll([product], 2);
        
        // 5. Veriyi geri yükle
        const loadedProducts = storage.loadStockData();
        const loadedCounter = storage.loadProductCounter();
        
        // 6. Doğrula
        assert.equals(loadedProducts.length, 1, 'Bir ürün kaydedilmiş olmalı');
        assert.equals(loadedProducts[0].name, 'CIKIS DIYOTU', 'Ürün adı doğru normalize edilmiş olmalı');
        assert.equals(loadedProducts[0].partNumber, 'D-1N4007', 'Ürün kodu doğru normalize edilmiş olmalı');
        assert.arrayEquals(loadedProducts[0].tags, ['ELEKTRONIK', 'DIYOT', 'GUC'], 'Tag\'ler doğru normalize edilmiş olmalı');
        assert.equals(loadedProducts[0].stock, 50, 'Stok doğru parse edilmiş olmalı');
        assert.equals(loadedCounter, 2, 'Counter doğru kaydedilmiş olmalı');
        
        // 7. Tag manager'da tag'ler var mı kontrol et
        const allTags = tagManager.getAllTags();
        assert.truthy(allTags.includes('ELEKTRONIK'), 'ELEKTRONIK tag\'i eklenmeli');
        assert.truthy(allTags.includes('DIYOT'), 'DIYOT tag\'i eklenmeli');
        assert.truthy(allTags.includes('GUC'), 'GUC tag\'i eklenmeli');
        
        // 8. Tag rendering
        const tagHtml = tagManager.renderProductTag(product.tags);
        assert.truthy(tagHtml.includes('electronics'), 'ELEKTRONIK tag\'i için electronics class\'ı olmalı');
        assert.truthy(tagHtml.includes('ELEKTRONIK'), 'Tag metni renderlanmış olmalı');
        
        cleanupIntegrationTest();
    });

    testRunner.test('CSV Data Processing Simulation - CSV veri işleme simülasyonu', async (assert) => {
        setupIntegrationTest();
        
        // CSV verisi simülasyonu
        const csvLine = 'AB001,"Test Ürün","PRD-001","elektronik relay",10';
        
        // CSV parsing
        const values = Utils.parseCSVLine(csvLine);
        
        // Product oluştur
        const product = {
            id: values[0],
            name: Utils.normalizeText(values[1]),
            partNumber: Utils.normalizeText(values[2]),
            tags: Utils.parseTags(values[3]),
            stock: Utils.validateStockInput(values[4])
        };
        
        // Verify processed data
        assert.equals(product.id, 'AB001', 'ID doğru parse edilmeli');
        assert.equals(product.name, 'TEST URUN', 'Ürün adı normalize edilmeli');
        assert.equals(product.partNumber, 'PRD-001', 'Ürün kodu normalize edilmeli');
        assert.arrayEquals(product.tags, ['ELEKTRONIK', 'RELAY'], 'Tag\'ler normalize edilmeli');
        assert.equals(product.stock, 10, 'Stok parse edilmeli');
        
        // Storage integration
        const storage = new StorageManager();
        storage.saveStockData([product]);
        
        const loadedProducts = storage.loadStockData();
        assert.equals(loadedProducts.length, 1, 'CSV\'den oluşturulan ürün kaydedilmeli');
        assert.equals(loadedProducts[0].name, product.name, 'Kaydedilen veri doğru olmalı');
        
        cleanupIntegrationTest();
    });

    testRunner.test('Error Handling Integration - Hata yönetimi entegrasyonu', async (assert) => {
        setupIntegrationTest();
        
        // Geçersiz verilerle test
        const invalidData = {
            name: null,
            partNumber: undefined,
            tags: '',
            stock: 'invalid'
        };
        
        // Utils'in hata durumları
        const normalizedName = Utils.normalizeText(invalidData.name);
        const normalizedPart = Utils.normalizeText(invalidData.partNumber);
        const parsedTags = Utils.parseTags(invalidData.tags);
        const validatedStock = Utils.validateStockInput(invalidData.stock);
        
        // Hata durumlarında güvenli değerler döner
        assert.equals(normalizedName, 'NULL', 'Null değer string\'e dönmeli');
        assert.equals(normalizedPart, 'UNDEFINED', 'Undefined değer string\'e dönmeli');
        assert.arrayEquals(parsedTags, [], 'Boş tag string boş array dönemli');
        assert.equals(validatedStock, '?', 'Geçersiz stok ? olmalı');
        
        // Storage ile entegrasyon
        const storage = new StorageManager();
        const product = {
            id: 'ERROR001',
            name: normalizedName,
            partNumber: normalizedPart,
            tags: parsedTags,
            stock: validatedStock
        };
        
        storage.saveStockData([product]);
        const loadedProducts = storage.loadStockData();
        
        assert.equals(loadedProducts[0].name, 'NULL', 'Hatalı veri güvenli şekilde kaydedilmeli');
        assert.equals(loadedProducts[0].stock, '?', 'Geçersiz stok güvenli şekilde kaydedilmeli');
        
        cleanupIntegrationTest();
    });

    testRunner.test('Performance Integration - Performans testi', async (assert) => {
        setupIntegrationTest();
        
        const storage = new StorageManager();
        const tagManager = new TagManager();
        
        // Büyük veri seti oluştur
        const startTime = performance.now();
        const products = [];
        
        for (let i = 0; i < 100; i++) {
            const product = {
                id: Utils.generateUniqueId(i + 1),
                name: Utils.normalizeText(`ürün ${i}`),
                partNumber: Utils.normalizeText(`prd-${i}`),
                tags: Utils.parseTags(`tag${i % 10} kategori${i % 5}`),
                stock: Utils.validateStockInput((i * 3).toString())
            };
            products.push(product);
        }
        
        // Storage'a kaydet
        storage.saveStockData(products);
        
        // Tag manager'a ekle
        tagManager.regenerateTagsFromProducts(products);
        
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        
        // Performance kontrolü (100 ürün için 100ms'den az olmalı)
        assert.truthy(processingTime < 100, `İşlem süresi çok uzun: ${processingTime}ms`);
        
        // Veri kontrolü
        const loadedProducts = storage.loadStockData();
        assert.equals(loadedProducts.length, 100, '100 ürün kaydedilmiş olmalı');
        
        const allTags = tagManager.getAllTags();
        assert.truthy(allTags.length >= 10, 'En az 10 unique tag olmalı');
        
        cleanupIntegrationTest();
    });
}); 