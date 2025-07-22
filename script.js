// Stok verileri için sınıf
class StockManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('stockData')) || [];
        this.tags = JSON.parse(localStorage.getItem('stockTags')) || [];
        this.productCounter = parseInt(localStorage.getItem('productCounter')) || 1;
        
        // Sadece sekme kapatma uyarısı için
        this.hasUnsavedChanges = false;
        
        // Keyboard navigation için
        this.currentSuggestionIndex = -1;
        this.currentEditSuggestionIndex = -1;
        this.activeSuggestionContainer = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupBeforeUnloadWarning();
        this.renderTable();
    }

    // Türkçe karakterleri İngilizce karşılıklarına çevir
    convertTurkishChars(text) {
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
    normalizeText(text) {
        return this.convertTurkishChars(text.toUpperCase());
    }

    // Stok input validasyonu
    validateStockInput(value) {
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
    parseTags(tagString) {
        if (!tagString) return [];
        
        return tagString
            .split(/\s+/) // Boşluklarla ayır (birden fazla boşluk da destekle)
            .map(tag => tag.trim()) // Başındaki/sonundaki boşlukları temizle
            .filter(tag => tag.length > 0) // Boş tag'ları filtrele
            .map(tag => this.normalizeText(tag)); // Büyük harfe çevir
    }

    // Tag'ları string'e çevir
    tagsToString(tags) {
        if (!Array.isArray(tags)) return '';
        return tags.join(' ');
    }

    // Unique ID oluştur
    generateUniqueId() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomLetter1 = letters[Math.floor(Math.random() * letters.length)];
        const randomLetter2 = letters[Math.floor(Math.random() * letters.length)];
        const number = this.productCounter.toString().padStart(3, '0');
        this.productCounter++;
        return `${randomLetter1}${randomLetter2}${number}`;
    }

    // Bildirim göster
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Event listener'ları ayarla
    setupEventListeners() {
        const form = document.getElementById('productForm');
        const productNameInput = document.getElementById('productName');
        const partNumberInput = document.getElementById('partNumber');
        const productTagInput = document.getElementById('productTag');
        const stockInput = document.getElementById('stock');
        const clearBtn = document.getElementById('clearForm');
        const searchInput = document.getElementById('searchInput');
        const exportBtn = document.getElementById('exportBtn');
        const csvFileInput = document.getElementById('csvFileInput');

        // Form submit
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Temizle butonu
        clearBtn.addEventListener('click', () => this.clearForm());

        // Ürün adı input - büyük harf ve Türkçe karakter dönüşümü
        productNameInput.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            e.target.value = this.normalizeText(e.target.value);
            e.target.setSelectionRange(cursorPos, cursorPos);
        });

        // Ürün kodu input - büyük harf ve Türkçe karakter dönüşümü
        partNumberInput.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            e.target.value = this.normalizeText(e.target.value);
            e.target.setSelectionRange(cursorPos, cursorPos);
        });

        // Tag input - autocomplete ve büyük harf dönüşümü
        productTagInput.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const normalizedValue = this.normalizeText(oldValue);
            e.target.value = normalizedValue;
            
            // Cursor pozisyonunu ayarla (büyük harf dönüşümü sonrası)
            const lengthDiff = normalizedValue.length - oldValue.length;
            e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
            
            this.showTagSuggestions(normalizedValue);
        });

        // Tag input - focus ve blur events
        productTagInput.addEventListener('focus', (e) => {
            this.showTagSuggestions(e.target.value);
        });

        productTagInput.addEventListener('blur', (e) => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => this.hideTagSuggestions(), 200);
        });

        // Tag input - keyboard navigation
        productTagInput.addEventListener('keydown', (e) => {
            const suggestionsContainer = document.getElementById('tagSuggestions');
            const suggestions = suggestionsContainer.querySelectorAll('.tag-suggestion');
            
            if (suggestions.length > 0 && suggestionsContainer.classList.contains('show')) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.currentSuggestionIndex = Math.min(this.currentSuggestionIndex + 1, suggestions.length - 1);
                    this.highlightSuggestion(suggestions, this.currentSuggestionIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.currentSuggestionIndex = Math.max(this.currentSuggestionIndex - 1, 0);
                    this.highlightSuggestion(suggestions, this.currentSuggestionIndex);
                } else if (e.key === 'Enter' && this.currentSuggestionIndex >= 0) {
                    e.preventDefault();
                    const selectedSuggestion = suggestions[this.currentSuggestionIndex];
                    const tagText = selectedSuggestion.textContent;
                    this.selectTag(tagText);
                } else if (e.key === 'Escape') {
                    this.hideTagSuggestions();
                }
            }
        });

        // Stok input - sadece rakam ve ? kabul et
        stockInput.addEventListener('keydown', (e) => {
            // İzin verilen tuşlar: Backspace, Delete, Tab, Escape, Enter, ?, rakamlar
            const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
            const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '?'];

            if (allowedKeys.includes(e.key)) {
                return;
            }

            // Ctrl/Cmd kombinasyonlarına izin ver (copy/paste/select all)
            if (e.ctrlKey || e.metaKey) {
                return;
            }

            // İzin verilmeyen karakterleri engelle
            if (!allowedChars.includes(e.key)) {
                e.preventDefault();
                
                // Negatif değer uyarısı
                if (e.key === '-') {
                    this.showNotification('Negatif değer girilemez! Lütfen pozitif değer girin.', 'warning');
                }
                // Diğer engellenmiş karakterler için uyarı
                else if (['e', '+', '.'].includes(e.key.toLowerCase())) {
                    this.showNotification('Sadece rakam girebilirsiniz!', 'warning');
                }
                return;
            }
        });

        // Stok input - yapıştırma kontrolü
        stockInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numbersOnly = pastedText.replace(/[^0-9]/g, '');
            
            if (numbersOnly) {
                e.target.value = numbersOnly;
            } else if (pastedText.includes('?')) {
                e.target.value = '?';
            }
        });

        // Stok input - input event (otomatik temizleme)
        stockInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value !== '' && value !== '?') {
                e.target.value = this.validateStockInput(value);
            }
        });

        // Arama
        searchInput.addEventListener('input', (e) => this.searchProducts(e.target.value));

        // Export butonu
        exportBtn.addEventListener('click', () => this.exportToCSV());

        // CSV upload
        csvFileInput.addEventListener('change', (e) => this.handleCSVUpload(e));
        
        // Drag and drop desteği
        this.setupDragAndDrop();
        
        // Custom modal sistemi
        this.setupModal();
    }

    // Form submit işlemi
    handleFormSubmit(e) {
        e.preventDefault();
        
        const productName = document.getElementById('productName').value.trim();
        const partNumber = document.getElementById('partNumber').value.trim();
        const productTag = document.getElementById('productTag').value.trim();
        const stockValue = document.getElementById('stock').value.trim();

        if (!productName || !partNumber) {
            this.showNotification('Ürün adı ve ürün kodu zorunludur!', 'error');
            return;
        }

        const stock = this.validateStockInput(stockValue);
        const productTags = this.parseTags(productTag);

        // Yeni tag'ları listeye ekle (eğer daha önce yoksa)
        productTags.forEach(tag => {
            if (!this.tags.includes(tag)) {
                this.tags.push(tag);
            }
        });

        const product = {
            id: this.generateUniqueId(),
            name: this.normalizeText(productName),
            partNumber: this.normalizeText(partNumber),
            tags: productTags,
            stock: stock
        };

        this.products.push(product);
        this.saveToStorage();
        this.renderTable();
        this.clearForm();
        this.showNotification('Ürün başarıyla eklendi!');
    }

    // Formu temizle
    clearForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productName').focus();
    }

    // Ürün sil
    deleteProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        this.showConfirmModal(
            'Bu ürünü silmek istediğinizden emin misiniz?',
            product,
            () => {
                this.products = this.products.filter(p => p.id !== id);
                this.saveToStorage();
                this.renderTable();
                this.showNotification('Ürün silindi!', 'warning');
            }
        );
    }

    // Stok güncelle
    updateStock(id, newStock) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            const validatedStock = this.validateStockInput(newStock.toString());
            product.stock = validatedStock;
            this.saveToStorage();
            this.renderTable();
            this.showNotification('Stok güncellendi!');
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
            this.saveToStorage();
            this.renderTable();
        }
    }

    // Stok azalt
    decreaseStock(id) {
        const product = this.products.find(p => p.id === id);
        if (product) {
            if (product.stock === '?' || product.stock <= 0) {
                this.showNotification('Stok sıfır veya bilinmiyor!', 'warning');
                return;
            }
            product.stock = Math.max(0, parseInt(product.stock) - 1);
            this.saveToStorage();
            this.renderTable();
        }
    }

    // Ürün arama
    searchProducts(query) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.partNumber.toLowerCase().includes(query.toLowerCase()) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) ||
            // Eski format desteği (tag -> tags migration)
            (product.tag && product.tag.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderTable(filteredProducts);
    }

    // Tabloyu render et
    renderTable(productsToShow = null) {
        const tbody = document.getElementById('stockTableBody');
        const products = productsToShow || this.products;

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        <h3>Henüz ürün eklenmemiş</h3>
                        <p>Yukarıdaki formdan yeni ürün ekleyebilirsiniz</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td class="editable-cell" id="name-${product.id}">${product.name}</td>
                <td class="editable-cell" id="part-${product.id}">${product.partNumber}</td>
                <td class="editable-cell" id="tag-${product.id}">${this.renderProductTag(product.tags || product.tag)}</td>
                <td>
                    <input type="text" 
                           class="stock-input" 
                           value="${product.stock}" 
                           onchange="stockManager.updateStock('${product.id}', this.value)"
                           onkeydown="stockManager.handleStockKeydown(event)"
                           onpaste="stockManager.handleStockPaste(event)"
                           autocomplete="off">
                </td>
                <td class="stock-actions">
                    <button class="stock-btn increase-btn" onclick="stockManager.increaseStock('${product.id}')">+</button>
                    <button class="stock-btn decrease-btn" onclick="stockManager.decreaseStock('${product.id}')">-</button>
                    <button class="stock-btn edit-btn" onclick="stockManager.editProduct('${product.id}')" title="Düzenle">✏️</button>
                    <button class="stock-btn delete-btn" onclick="stockManager.deleteProduct('${product.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    // Stok input keydown handler (tablo içi)
    handleStockKeydown(e) {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'];
        const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '?'];

        if (allowedKeys.includes(e.key)) {
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            return;
        }

        if (!allowedChars.includes(e.key)) {
            e.preventDefault();
            
            if (e.key === '-') {
                this.showNotification('Negatif değer girilemez!', 'warning');
            } else if (['e', '+', '.'].includes(e.key.toLowerCase())) {
                this.showNotification('Sadece rakam girebilirsiniz!', 'warning');
            }
        }
    }

    // Stok input paste handler (tablo içi)
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

    // CSV'ye export et
    exportToCSV() {
        if (this.products.length === 0) {
            this.showNotification('Export edilecek veri bulunamadı!', 'warning');
            return;
        }

        const headers = ['ID', 'Ürün Adı', 'Ürün Kodu', 'Kategori', 'Stok'];
        const csvContent = [
            headers.join(','),
            ...this.products.map(product => [
                product.id,
                `"${product.name}"`,
                `"${product.partNumber}"`,
                `"${product.tags ? this.tagsToString(product.tags) : (product.tag || '')}"`,
                product.stock
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // 2025-01-22
        const time = now.toTimeString().slice(0, 5).replace(':', '-'); // 14-30
        const fileName = `stock_takip_${date}_${time}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Veriler CSV dosyasına aktarıldı!');
        this.hasUnsavedChanges = false; // Export edildiğinde unsaved changes'ı temizle
    }

    // Tag önerileri göster
    showTagSuggestions(value) {
        const suggestionsContainer = document.getElementById('tagSuggestions');
        
        // Index'i sıfırla
        this.currentSuggestionIndex = -1;
        
        // Mevcut tag'ları parse et
        const currentTags = this.parseTags(value);
        const lastTag = currentTags[currentTags.length - 1] || '';
        
        if (!value || value.endsWith(' ')) {
            // Boşsa veya son karakter boşluksa tüm tag'ları göster
            if (this.tags.length > 0) {
                const availableTags = this.tags.filter(tag => !currentTags.includes(tag));
                if (availableTags.length > 0) {
                    suggestionsContainer.innerHTML = availableTags.map(tag => 
                        `<div class="tag-suggestion" onclick="stockManager.selectTag('${tag}')">${tag}</div>`
                    ).join('');
                    suggestionsContainer.classList.add('show');
                } else {
                    this.hideTagSuggestions();
                }
            } else {
                this.hideTagSuggestions();
            }
            return;
        }

        // Son tag'a göre eşleşen tag'ları filtrele
        const matchingTags = this.tags.filter(tag => 
            tag.toLowerCase().includes(lastTag.toLowerCase()) && 
            tag !== lastTag &&
            !currentTags.includes(tag)
        );

        if (matchingTags.length > 0) {
            suggestionsContainer.innerHTML = matchingTags.map(tag => 
                `<div class="tag-suggestion" onclick="stockManager.selectTag('${tag}')">${tag}</div>`
            ).join('');
            suggestionsContainer.classList.add('show');
        } else {
            this.hideTagSuggestions();
        }
    }

    // Tag önerileri gizle
    hideTagSuggestions() {
        const suggestionsContainer = document.getElementById('tagSuggestions');
        suggestionsContainer.classList.remove('show');
        this.currentSuggestionIndex = -1;
    }

    // Tag seç
    selectTag(tag) {
        const productTagInput = document.getElementById('productTag');
        const currentValue = productTagInput.value;
        const currentTags = this.parseTags(currentValue);
        
        if (currentValue.endsWith(' ') || currentTags.length === 0) {
            // Yeni tag ekle
            productTagInput.value = currentValue + tag + ' ';
        } else {
            // Son tag'ı değiştir
            currentTags[currentTags.length - 1] = tag;
            productTagInput.value = this.tagsToString(currentTags) + ' ';
        }
        
        this.hideTagSuggestions();
        productTagInput.focus();
    }

    // Düzenleme modu için tag önerileri göster
    showEditTagSuggestions(id, value) {
        const suggestionsContainer = document.getElementById(`editTagSuggestions-${id}`);
        if (!suggestionsContainer) return;
        
        // Index'i sıfırla
        this.currentEditSuggestionIndex = -1;
        
        // Mevcut tag'ları parse et
        const currentTags = this.parseTags(value);
        const lastTag = currentTags[currentTags.length - 1] || '';
        
        if (!value || value.endsWith(' ')) {
            // Boşsa veya son karakter boşluksa tüm tag'ları göster
            if (this.tags.length > 0) {
                const availableTags = this.tags.filter(tag => !currentTags.includes(tag));
                if (availableTags.length > 0) {
                    suggestionsContainer.innerHTML = availableTags.map(tag => 
                        `<div class="tag-suggestion" onclick="stockManager.selectEditTag('${id}', '${tag}')">${tag}</div>`
                    ).join('');
                    suggestionsContainer.classList.add('show');
                } else {
                    this.hideEditTagSuggestions(id);
                }
            } else {
                this.hideEditTagSuggestions(id);
            }
            return;
        }

        // Son tag'a göre eşleşen tag'ları filtrele
        const matchingTags = this.tags.filter(tag => 
            tag.toLowerCase().includes(lastTag.toLowerCase()) && 
            tag !== lastTag &&
            !currentTags.includes(tag)
        );

        if (matchingTags.length > 0) {
            suggestionsContainer.innerHTML = matchingTags.map(tag => 
                `<div class="tag-suggestion" onclick="stockManager.selectEditTag('${id}', '${tag}')">${tag}</div>`
            ).join('');
            suggestionsContainer.classList.add('show');
        } else {
            this.hideEditTagSuggestions(id);
        }
    }

    // Düzenleme modu için tag önerileri gizle
    hideEditTagSuggestions(id) {
        const suggestionsContainer = document.getElementById(`editTagSuggestions-${id}`);
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('show');
        }
        this.currentEditSuggestionIndex = -1;
    }

    // Suggestion highlight sistemi
    highlightSuggestion(suggestions, index) {
        // Tüm highlight'ları temizle
        suggestions.forEach(suggestion => {
            suggestion.classList.remove('highlighted');
        });

        // Seçili olanı highlight et
        if (index >= 0 && index < suggestions.length) {
            const selectedSuggestion = suggestions[index];
            selectedSuggestion.classList.add('highlighted');
            
            // Scroll edilebilir alanda görünür hale getir
            selectedSuggestion.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    // Düzenleme modu için tag seç
    selectEditTag(id, tag) {
        const editTagInput = document.getElementById(`edit-tag-${id}`);
        if (!editTagInput) return;
        
        const currentValue = editTagInput.value;
        const currentTags = this.parseTags(currentValue);
        
        if (currentValue.endsWith(' ') || currentTags.length === 0) {
            // Yeni tag ekle
            editTagInput.value = currentValue + tag + ' ';
        } else {
            // Son tag'ı değiştir
            currentTags[currentTags.length - 1] = tag;
            editTagInput.value = this.tagsToString(currentTags) + ' ';
        }
        
        this.hideEditTagSuggestions(id);
        editTagInput.focus();
    }

    // Product tag render et
    renderProductTag(tags) {
        // Eski format desteği (tag -> tags migration)
        if (typeof tags === 'string') {
            if (!tags) return '-';
            const tagClass = this.getTagClass(tags);
            return `<span class="product-tag ${tagClass}">${tags}</span>`;
        }
        
        // Yeni çoklu tag formatı
        if (!Array.isArray(tags) || tags.length === 0) return '-';
        
        return tags.map(tag => {
            const tagClass = this.getTagClass(tag);
            return `<span class="product-tag ${tagClass}">${tag}</span>`;
        }).join(' ');
    }

    // Tag class'ını belirle
    getTagClass(tag) {
        const lowerTag = tag.toLowerCase();
        if (lowerTag.includes('elektronik') || lowerTag.includes('electronic')) return 'electronics';
        if (lowerTag.includes('direnç') || lowerTag.includes('resistor')) return 'resistor';
        if (lowerTag.includes('kondansatör') || lowerTag.includes('capacitor')) return 'capacitor';
        if (lowerTag.includes('entegre') || lowerTag.includes('ic') || lowerTag.includes('integrated')) return 'integrated';
        if (lowerTag.includes('mekanik') || lowerTag.includes('mechanical')) return 'mechanical';
        return '';
    }

    // Ürün düzenle
    editProduct(id) {
        const product = this.products.find(p => p.id === id);
        if (!product) return;

        // Düzenleme modunda olan başka ürün varsa iptal et
        this.cancelEdit();

        // Ürün adını düzenlenebilir yap
        const nameCell = document.getElementById(`name-${id}`);
        nameCell.innerHTML = `
            <input type="text" class="edit-input" id="edit-name-${id}" value="${product.name}" autocomplete="off">
            <div class="edit-actions">
                <button class="save-btn" onclick="stockManager.saveEdit('${id}')">Kaydet</button>
                <button class="cancel-btn" onclick="stockManager.cancelEdit()">İptal</button>
            </div>
        `;

        // Ürün kodunu düzenlenebilir yap
        const partCell = document.getElementById(`part-${id}`);
        partCell.innerHTML = `
            <input type="text" class="edit-input" id="edit-part-${id}" value="${product.partNumber}" autocomplete="off">
        `;

        // Tag'ı düzenlenebilir yap
        const tagCell = document.getElementById(`tag-${id}`);
        const currentTags = product.tags ? this.tagsToString(product.tags) : (product.tag || '');
        tagCell.innerHTML = `
            <div class="tag-input-container">
                <input type="text" class="edit-input" id="edit-tag-${id}" value="${currentTags}" placeholder="Kategori (boşlukla ayırın)" autocomplete="off">
                <div id="editTagSuggestions-${id}" class="tag-suggestions"></div>
            </div>
        `;

        // Event listener'ları ekle
        const editNameInput = document.getElementById(`edit-name-${id}`);
        const editPartInput = document.getElementById(`edit-part-${id}`);
        const editTagInput = document.getElementById(`edit-tag-${id}`);

        // Büyük harf dönüşümü
        [editNameInput, editPartInput].forEach(input => {
            input.addEventListener('input', (e) => {
                const cursorPos = e.target.selectionStart;
                e.target.value = this.normalizeText(e.target.value);
                e.target.setSelectionRange(cursorPos, cursorPos);
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit(id);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            });
        });

        // Tag input için özel event'ler
        editTagInput.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const normalizedValue = this.normalizeText(oldValue);
            e.target.value = normalizedValue;
            
            // Cursor pozisyonunu ayarla
            const lengthDiff = normalizedValue.length - oldValue.length;
            e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
            
            this.showEditTagSuggestions(id, normalizedValue);
        });

        editTagInput.addEventListener('focus', (e) => {
            this.showEditTagSuggestions(id, e.target.value);
        });

        editTagInput.addEventListener('blur', (e) => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => this.hideEditTagSuggestions(id), 200);
        });

        editTagInput.addEventListener('keydown', (e) => {
            const suggestionsContainer = document.getElementById(`editTagSuggestions-${id}`);
            const suggestions = suggestionsContainer ? suggestionsContainer.querySelectorAll('.tag-suggestion') : [];
            
            if (suggestions.length > 0 && suggestionsContainer.classList.contains('show')) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.currentEditSuggestionIndex = Math.min(this.currentEditSuggestionIndex + 1, suggestions.length - 1);
                    this.highlightSuggestion(suggestions, this.currentEditSuggestionIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.currentEditSuggestionIndex = Math.max(this.currentEditSuggestionIndex - 1, 0);
                    this.highlightSuggestion(suggestions, this.currentEditSuggestionIndex);
                } else if (e.key === 'Enter' && this.currentEditSuggestionIndex >= 0) {
                    e.preventDefault();
                    const selectedSuggestion = suggestions[this.currentEditSuggestionIndex];
                    const tagText = selectedSuggestion.textContent;
                    this.selectEditTag(id, tagText);
                } else if (e.key === 'Escape') {
                    this.hideEditTagSuggestions(id);
                }
            } else {
                if (e.key === 'Enter') {
                    this.saveEdit(id);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            }
        });

        // İlk input'a focus ver
        editNameInput.focus();
        editNameInput.select();
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
            this.showNotification('Ürün adı ve ürün kodu zorunludur!', 'error');
            return;
        }

        // Ürünü güncelle
        const product = this.products.find(p => p.id === id);
        if (product) {
            product.name = this.normalizeText(newName);
            product.partNumber = this.normalizeText(newPart);
            const newTags = this.parseTags(newTag);
            
            // Eski format desteği - tag özelliğini kaldır
            delete product.tag;
            product.tags = newTags;

            // Yeni tag'ları listeye ekle (eğer daha önce yoksa)
            newTags.forEach(tag => {
                if (!this.tags.includes(tag)) {
                    this.tags.push(tag);
                }
            });

            this.saveToStorage();
            this.renderTable();
            this.showNotification('Ürün güncellendi!');
            
            // Tag suggestions'ları gizle
            this.hideEditTagSuggestions(id);
        }
    }

    // Düzenlemeyi iptal et
    cancelEdit() {
        // Tüm düzenleme alanlarını normale döndür
        const editableCells = document.querySelectorAll('.editable-cell');
        editableCells.forEach(cell => {
            if (cell.querySelector('.edit-input')) {
                // Orijinal değeri geri yükle
                const id = cell.id.split('-')[1];
                const fieldType = cell.id.split('-')[0];
                const product = this.products.find(p => p.id === id);
                
                if (product) {
                    if (fieldType === 'name') {
                        cell.innerHTML = product.name;
                    } else if (fieldType === 'part') {
                        cell.innerHTML = product.partNumber;
                    } else if (fieldType === 'tag') {
                        cell.innerHTML = this.renderProductTag(product.tags || product.tag);
                        // Tag suggestions'ları gizle
                        this.hideEditTagSuggestions(id);
                    }
                }
            }
        });
    }

    // Sekme kapatma uyarısını kur
    setupBeforeUnloadWarning() {
        // Sekme kapatılırken uyarı ver
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
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.toLowerCase().endsWith('.csv')) {
                    this.handleCSVFile(file);
                } else {
                    this.showNotification('Lütfen sadece CSV dosyası sürükleyin!', 'error');
                }
            }
        });
    }

    // CSV dosyası işleme (upload ve drag&drop için ortak)
    handleCSVFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSVData(e.target.result);
            } catch (error) {
                this.showNotification('CSV dosyası okunurken hata oluştu!', 'error');
                console.error('CSV parse error:', error);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    // Custom Modal Sistemi
    setupModal() {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const deleteBtn = document.getElementById('confirmDelete');

        // İptal butonu
        cancelBtn.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        // Modal dışına tıklama
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideConfirmModal();
            }
        });

        // ESC tuşu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.hideConfirmModal();
            }
        });
    }

    // Confirmation modal göster
    showConfirmModal(message, product, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const productInfoEl = document.getElementById('productInfo');
        const deleteBtn = document.getElementById('confirmDelete');

        // Mesajı ayarla
        messageEl.textContent = message;

        // Ürün bilgilerini göster
        const tags = product.tags ? this.tagsToString(product.tags) : (product.tag || '-');
        productInfoEl.innerHTML = `
            <div class="info-row">
                <span class="info-label">Ürün Adı:</span>
                <span class="info-value">${product.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ürün Kodu:</span>
                <span class="info-value">${product.partNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Kategori:</span>
                <span class="info-value">${tags}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Stok:</span>
                <span class="info-value">${product.stock}</span>
            </div>
        `;

        // Sil butonu event listener'ını temizle ve yenisini ekle
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        newDeleteBtn.addEventListener('click', () => {
            onConfirm();
            this.hideConfirmModal();
        });

        // Modal'ı göster
        modal.classList.add('show');
        
        // Focus yönetimi
        newDeleteBtn.focus();
    }

    // Confirmation modal gizle
    hideConfirmModal() {
        const modal = document.getElementById('confirmModal');
        modal.classList.remove('show');
    }

    // Kaydedilmemiş değişiklikleri işaretle
    markUnsavedChanges() {
        this.hasUnsavedChanges = true;
    }

    // CSV dosyası upload işlemi
    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showNotification('Lütfen sadece CSV dosyası yükleyin!', 'error');
            return;
        }

        this.handleCSVFile(file);
        
        // File input'u temizle (aynı dosyayı tekrar yükleyebilmek için)
        event.target.value = '';
    }

    // CSV verilerini parse et
    parseCSVData(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            this.showNotification('CSV dosyası geçersiz format!', 'error');
            return;
        }

        // Header kontrolü
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['ID', 'Ürün Adı', 'Ürün Kodu', 'Kategori', 'Stok'];
        
        const uploadedProducts = [];
        let successCount = 0;
        let errorCount = 0;

        // Veri satırlarını işle
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= 5) {
                    const product = {
                        id: values[0] || this.generateUniqueId(),
                        name: this.normalizeText(values[1] || ''),
                        partNumber: this.normalizeText(values[2] || ''),
                        tags: this.parseTags(values[3] || ''),
                        stock: this.validateStockInput(values[4] || '?')
                    };

                    // Geçerli ürün kontrolü
                    if (product.name && product.partNumber) {
                        uploadedProducts.push(product);
                        successCount++;

                        // Yeni tag'ları listeye ekle
                        product.tags.forEach(tag => {
                            if (!this.tags.includes(tag)) {
                                this.tags.push(tag);
                            }
                        });
                    } else {
                        errorCount++;
                    }
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
                console.warn(`Satır ${i + 1} işlenirken hata:`, error);
            }
        }

        // Verileri entegre et
        this.integrationDialog(uploadedProducts, successCount, errorCount);
    }

    // CSV satırını parse et (virgül ve tırnak işareti desteği)
    parseCSVLine(line) {
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

    // Veri entegrasyonu dialog
    integrationDialog(uploadedProducts, successCount, errorCount) {
        if (uploadedProducts.length === 0) {
            this.showNotification('Yüklenebilir geçerli veri bulunamadı!', 'error');
            return;
        }

        const message = `${successCount} ürün başarıyla yüklendi.${errorCount > 0 ? ` ${errorCount} satırda hata var.` : ''}\n\nMevcut verilerle nasıl birleştirmek istiyorsunuz?`;
        
        const choice = confirm(message + '\n\nTamam: Mevcut verilere ekle\nİptal: Mevcut verileri değiştir');
        
        if (choice) {
            // Mevcut verilere ekle
            this.addToExistingData(uploadedProducts);
        } else {
            // Mevcut verileri değiştir
            this.replaceExistingData(uploadedProducts);
        }
    }

    // Mevcut verilere ekleme
    addToExistingData(uploadedProducts) {
        const addedCount = uploadedProducts.length;
        this.products = [...this.products, ...uploadedProducts];
        this.saveToStorage();
        this.renderTable();
        this.showNotification(`${addedCount} ürün mevcut verilere eklendi!`, 'success');
    }

    // Mevcut verileri değiştirme
    replaceExistingData(uploadedProducts) {
        const replacedCount = uploadedProducts.length;
        this.products = uploadedProducts;
        this.saveToStorage();
        this.renderTable();
        this.showNotification(`${replacedCount} ürün ile veriler değiştirildi!`, 'success');
    }

    // LocalStorage'a kaydet
    saveToStorage() {
        localStorage.setItem('stockData', JSON.stringify(this.products));
        localStorage.setItem('stockTags', JSON.stringify(this.tags));
        localStorage.setItem('productCounter', this.productCounter.toString());
        this.markUnsavedChanges();
    }
}

// Uygulama başlangıcı
let stockManager;
document.addEventListener('DOMContentLoaded', () => {
    stockManager = new StockManager();
}); 