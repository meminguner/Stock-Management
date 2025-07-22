// Ana Stok Yönetimi Modülü
import { Utils } from './utils.js';
import { StorageManager } from './storage.js';
import { NotificationManager } from './notification.js';
import { TagManager } from './tag-manager.js';
import { CSVHandler } from './csv-handler.js';
import { ModalManager } from './modal-manager.js';
import { TableRenderer } from './table-renderer.js';

export class StockManager {
    constructor() {
        // Core modüller
        this.storage = new StorageManager();
        this.notification = new NotificationManager();
        this.tagManager = new TagManager();
        this.csvHandler = new CSVHandler(this.notification);
        this.modalManager = new ModalManager();
        this.tableRenderer = new TableRenderer(this.tagManager);
        
        // Uygulama verileri
        this.products = [];
        this.productCounter = 1;
        
        // Unsaved changes tracking
        this.hasUnsavedChanges = false;
        
        this.init();
    }

    async init() {
        try {
            // Verileri yükle
            this.loadData();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // Sistemleri başlat
            this.setupBeforeUnloadWarning();
            this.setupDragAndDrop();
            this.setupModal();
            
            // Tag sistemini başlat
            this.tagManager.regenerateTagsFromProducts(this.products);
            this.storage.cleanupOldTagStorage();
            
            // Tabloyu render et
            this.renderTable();
            
            console.log('StockManager başarıyla başlatıldı');
        } catch (error) {
            console.error('StockManager başlatılırken hata:', error);
            this.notification.error('Uygulama başlatılırken hata oluştu!');
        }
    }

    // Verileri storage'dan yükle
    loadData() {
        this.products = this.storage.loadStockData();
        this.productCounter = this.storage.loadProductCounter();
        
        console.log(`${this.products.length} ürün yüklendi, counter: ${this.productCounter}`);
    }

    // Verileri storage'a kaydet
    saveData() {
        this.storage.saveAll(this.products, this.productCounter);
        this.hasUnsavedChanges = false;
    }

    // Event listener'ları kur
    setupEventListeners() {
        // Form işlemleri
        this.setupFormEvents();
        
        // Arama
        this.setupSearchEvents();
        
        // CSV işlemleri
        this.setupCSVEvents();
        
        // Tablo işlemleri
        this.setupTableEvents();
    }

    // Form event'lerini kur
    setupFormEvents() {
        const form = document.getElementById('productForm');
        const clearBtn = document.getElementById('clearForm');
        const productNameInput = document.getElementById('productName');
        const partNumberInput = document.getElementById('partNumber');
        const productTagInput = document.getElementById('productTag');
        const stockInput = document.getElementById('stock');

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearForm());
        }

        // Text input'lar için normalizasyon
        [productNameInput, partNumberInput].forEach(input => {
            if (input) {
                input.addEventListener('input', (e) => {
                    const cursorPos = e.target.selectionStart;
                    e.target.value = Utils.normalizeText(e.target.value);
                    e.target.setSelectionRange(cursorPos, cursorPos);
                });
            }
        });

        // Tag input kurulumu
        if (productTagInput) {
            this.tagManager.setupTagInput(productTagInput, 'tagSuggestions');
        }

        // Stok input kurulumu
        if (stockInput) {
            this.setupStockInput(stockInput);
        }
    }

    // Stok input event'lerini kur
    setupStockInput(stockInput) {
        // Keydown event
        stockInput.addEventListener('keydown', (e) => this.handleStockKeydown(e));
        
        // Paste event
        stockInput.addEventListener('paste', (e) => this.handleStockPaste(e));
        
        // Input event
        stockInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value !== '' && value !== '?') {
                e.target.value = Utils.validateStockInput(value);
            }
        });
    }

    // Arama event'lerini kur
    setupSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));
        }
    }

    // CSV event'lerini kur
    setupCSVEvents() {
        const exportBtn = document.getElementById('exportBtn');
        const csvFileInput = document.getElementById('csvFileInput');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }

        if (csvFileInput) {
            this.csvHandler.setupFileInput(csvFileInput, (result) => this.handleCSVResult(result));
        }
    }

    // Tablo event'lerini kur
    setupTableEvents() {
        this.tableRenderer.setupTableEvents({
            increase: (productId) => this.increaseStock(productId),
            decrease: (productId) => this.decreaseStock(productId),
            edit: (productId) => this.editProduct(productId),
            delete: (productId) => this.deleteProduct(productId),
            save: (productId) => this.saveEdit(productId),
            cancel: (productId) => this.cancelEdit(productId),
            stockChange: (productId, value) => this.updateStock(productId, value),
            stockKeydown: (e) => this.handleStockKeydown(e)
        });
    }

    // Form submit işlemi
    handleFormSubmit(e) {
        e.preventDefault();
        
        const productName = document.getElementById('productName').value.trim();
        const partNumber = document.getElementById('partNumber').value.trim();
        const productTag = document.getElementById('productTag').value.trim();
        const stockValue = document.getElementById('stock').value.trim();

        if (!productName || !partNumber) {
            this.notification.error('Ürün adı ve ürün kodu zorunludur!');
            return;
        }

        const stock = Utils.validateStockInput(stockValue);
        const productTags = Utils.parseTags(productTag);

        // Yeni tag'ları listeye ekle
        this.tagManager.addNewTags(productTags);

        const product = {
            id: Utils.generateUniqueId(this.productCounter),
            name: Utils.normalizeText(productName),
            partNumber: Utils.normalizeText(partNumber),
            tags: productTags,
            stock: stock
        };

        this.productCounter++;
        this.products.push(product);
        this.saveData();
        this.renderTable();
        this.clearForm();
        this.notification.success('Ürün başarıyla eklendi!');
    }

    // Formu temizle
    clearForm() {
        const form = document.getElementById('productForm');
        if (form) {
            form.reset();
            const productNameInput = document.getElementById('productName');
            if (productNameInput) {
                productNameInput.focus();
            }
        }
    }

    // Ürün sil
    deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        this.modalManager.showConfirmModal(
            'Bu ürünü silmek istediğinizden emin misiniz?',
            product,
            () => {
                this.products = this.products.filter(p => p.id !== id);
                this.saveData();
                this.renderTable();
                this.notification.warning('Ürün silindi!');
            }
        );
    }

    // Stok güncelle
    updateStock(id, newStock) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            const validatedStock = Utils.validateStockInput(newStock.toString());
            product.stock = validatedStock;
            this.saveData();
            this.notification.success('Stok güncellendi!');
            this.markUnsavedChanges();
        }
    }

    // Stok artır
    increaseStock(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            if (product.stock === '?') {
                product.stock = 1;
            } else {
                product.stock = parseInt(product.stock) + 1;
            }
            this.saveData();
            this.tableRenderer.updateStockCell(id, product.stock);
        }
    }

    // Stok azalt
    decreaseStock(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            if (product.stock === '?' || product.stock <= 0) {
                this.notification.warning('Stok sıfır veya bilinmiyor!');
                return;
            }
            product.stock = Math.max(0, parseInt(product.stock) - 1);
            this.saveData();
            this.tableRenderer.updateStockCell(id, product.stock);
        }
    }

    // Ürün arama
    searchProducts(query) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.partNumber.toLowerCase().includes(query.toLowerCase()) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) ||
            // Eski format desteği
            (product.tag && product.tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        this.renderTable(filteredProducts);
        this.tableRenderer.renderFilterMessage(this.products.length, filteredProducts.length, query);
    }

    // Tabloyu render et
    renderTable(productsToShow = null) {
        const products = productsToShow || this.products;
        this.tableRenderer.renderTable(products);
    }

    // Ürün düzenle
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        // Aktif düzenleme varsa iptal et
        this.cancelEdit();

        const inputs = this.tableRenderer.renderEditMode(product);
        
        if (inputs) {
            // Input event'lerini kur
            [inputs.nameInput, inputs.partInput].forEach(input => {
                if (input) {
                    input.addEventListener('input', (e) => {
                        const cursorPos = e.target.selectionStart;
                        e.target.value = Utils.normalizeText(e.target.value);
                        e.target.setSelectionRange(cursorPos, cursorPos);
                    });
                }
            });

            // Tag input'u kur
            if (inputs.tagInput) {
                this.tagManager.setupTagInput(inputs.tagInput, `editTagSuggestions-${id}`);
            }

            // İlk input'a focus ver
            if (inputs.nameInput) {
                inputs.nameInput.focus();
                inputs.nameInput.select();
            }
        }
    }

    // Düzenlemeyi kaydet
    saveEdit(id) {
        const nameInput = document.getElementById(`edit-name-${id}`);
        const partInput = document.getElementById(`edit-part-${id}`);
        const tagInput = document.getElementById(`edit-tag-${id}`);

        if (!nameInput || !partInput || !tagInput) return;

        const newName = nameInput.value.trim();
        const newPart = partInput.value.trim();
        const newTag = tagInput.value.trim();

        if (!newName || !newPart) {
            this.notification.error('Ürün adı ve ürün kodu zorunludur!');
            return;
        }

        const product = this.products.find(p => p.id === id);
        if (product) {
            product.name = Utils.normalizeText(newName);
            product.partNumber = Utils.normalizeText(newPart);
            const newTags = Utils.parseTags(newTag);
            
            // Eski format desteği
            delete product.tag;
            product.tags = newTags;

            // Yeni tag'ları listeye ekle
            this.tagManager.addNewTags(newTags);

            this.saveData();
            this.renderTable();
            this.notification.success('Ürün güncellendi!');
        }
    }

    // Düzenlemeyi iptal et
    cancelEdit(id = null) {
        const editId = id || this.tableRenderer.getActiveEditId();
        if (!editId) return;

        const product = this.products.find(p => p.id === editId);
        if (product) {
            this.tableRenderer.cancelEditMode(product);
        }
    }

    // CSV'ye export et
    exportToCSV() {
        const success = this.csvHandler.exportToCSV(this.products);
        if (success) {
            this.hasUnsavedChanges = false;
        }
    }

    // CSV sonucu işle
    handleCSVResult(result) {
        if (!result || !result.isValid) return;

        this.csvHandler.showIntegrationDialog(
            result,
            (products) => this.addToExistingData(products),
            (products) => this.replaceExistingData(products)
        );
    }

    // Mevcut verilere ekleme
    addToExistingData(uploadedProducts) {
        const addedCount = uploadedProducts.length;
        this.products = [...this.products, ...uploadedProducts];
        
        uploadedProducts.forEach(product => {
            if (Array.isArray(product.tags)) {
                this.tagManager.addNewTags(product.tags);
            }
        });
        
        this.saveData();
        this.renderTable();
        this.notification.success(`${addedCount} ürün mevcut verilere eklendi!`);
    }

    // Mevcut verileri değiştirme
    replaceExistingData(uploadedProducts) {
        const replacedCount = uploadedProducts.length;
        
        // Mevcut tag'ları koru
        const currentTags = this.tagManager.getAllTags();
        
        this.products = uploadedProducts;
        
        // Tag'ları yeniden oluştur
        this.tagManager.regenerateTagsFromProducts(this.products);
        
        // Eski tag'ları da ekle
        currentTags.forEach(tag => this.tagManager.addNewTag(tag));
        
        this.saveData();
        this.renderTable();
        this.notification.success(`${replacedCount} ürün ile veriler değiştirildi! (Tag'lar korundu)`);
    }

    // Stok input keydown handler
    handleStockKeydown(e) {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
        const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '?'];

        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
            return;
        }

        if (!allowedChars.includes(e.key)) {
            e.preventDefault();
            
            if (e.key === '-') {
                this.notification.warning('Negatif değer girilemez!');
            } else if (['e', '+', '.'].includes(e.key.toLowerCase())) {
                this.notification.warning('Sadece rakam girebilirsiniz!');
            }
        }
    }

    // Stok input paste handler
    handleStockPaste(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const numbersOnly = pastedText.replace(/[^0-9]/g, '');
        
        if (numbersOnly) {
            e.target.value = numbersOnly;
        } else if (pastedText.includes('?')) {
            e.target.value = '?';
        }
    }

    // Sekme kapatma uyarısını kur
    setupBeforeUnloadWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'Kaydedilmemiş değişiklikleriniz var. Sayfayı kapatmak istediğinizden emin misiniz?';
                return e.returnValue;
            }
        });
    }

    // Drag and drop sistemi
    setupDragAndDrop() {
        const dropZone = document.querySelector('.table-section');
        if (dropZone) {
            this.csvHandler.setupDragAndDrop(dropZone, (result) => this.handleCSVResult(result));
        }
    }

    // Modal sistemi kurulumu
    setupModal() {
        // Modal sistemi otomatik olarak kurulur
    }

    // Kaydedilmemiş değişiklikleri işaretle
    markUnsavedChanges() {
        this.hasUnsavedChanges = true;
    }

    // Uygulama bilgilerini al
    getAppInfo() {
        return {
            productCount: this.products.length,
            tagCount: this.tagManager.getTagCount(),
            storage: this.storage.getStorageInfo(),
            hasUnsavedChanges: this.hasUnsavedChanges
        };
    }
} 