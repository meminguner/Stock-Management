// Tablo render işlemleri modülü
import { Utils } from './utils.js';

export class TableRenderer {
    constructor(tagManager) {
        this.tagManager = tagManager;
        this.currentEditingId = null;
    }

    // Ana tabloyu render et
    renderTable(products, container = null) {
        const tbody = container || document.getElementById('stockTableBody');
        if (!tbody) {
            console.error('Tablo container bulunamadı!');
            return;
        }

        if (products.length === 0) {
            tbody.innerHTML = this.renderEmptyState();
            return;
        }

        tbody.innerHTML = products.map(product => this.renderProductRow(product)).join('');
    }

    // Tek ürün satırı render et
    renderProductRow(product) {
        const tagsDisplay = this.tagManager.renderProductTag(product.tags || product.tag);
        
        return `
            <tr data-product-id="${product.id}">
                <td>${product.id}</td>
                <td class="editable-cell" id="name-${product.id}">${product.name}</td>
                <td class="editable-cell" id="part-${product.id}">${product.partNumber}</td>
                <td class="editable-cell" id="tag-${product.id}">${tagsDisplay}</td>
                <td class="stock-cell">
                    ${this.renderStockInput(product)}
                </td>
                <td class="stock-actions">
                    ${this.renderActionButtons(product.id)}
                </td>
            </tr>
        `;
    }

    // Stok input alanını render et
    renderStockInput(product) {
        return `
            <input type="text" 
                   class="stock-input" 
                   value="${product.stock}" 
                   data-product-id="${product.id}"
                   autocomplete="off"
                   placeholder="Stok">
        `;
    }

    // Aksiyon butonlarını render et
    renderActionButtons(productId) {
        return `
            <button class="stock-btn increase-btn" data-action="increase" data-product-id="${productId}" title="Stok Artır">+</button>
            <button class="stock-btn decrease-btn" data-action="decrease" data-product-id="${productId}" title="Stok Azalt">-</button>
            <button class="stock-btn edit-btn" data-action="edit" data-product-id="${productId}" title="Düzenle">✏️</button>
            <button class="stock-btn delete-btn" data-action="delete" data-product-id="${productId}" title="Sil">🗑️</button>
        `;
    }

    // Boş state render et
    renderEmptyState() {
        return `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-content">
                        <h3>Henüz ürün eklenmemiş</h3>
                        <p>Yukarıdaki formdan yeni ürün ekleyebilirsiniz</p>
                        <div class="empty-actions">
                            <button class="btn btn-primary" onclick="document.getElementById('productName').focus()">
                                Ürün Ekle
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    // Düzenleme modu render et
    renderEditMode(product) {
        if (!product) return;

        const productId = product.id;
        this.currentEditingId = productId;

        // Ürün adını düzenlenebilir yap
        const nameCell = document.getElementById(`name-${productId}`);
        if (nameCell) {
            nameCell.innerHTML = `
                <input type="text" 
                       class="edit-input" 
                       id="edit-name-${productId}" 
                       value="${product.name}" 
                       autocomplete="off"
                       placeholder="Ürün Adı">
            `;
        }

        // Ürün kodunu düzenlenebilir yap
        const partCell = document.getElementById(`part-${productId}`);
        if (partCell) {
            partCell.innerHTML = `
                <input type="text" 
                       class="edit-input" 
                       id="edit-part-${productId}" 
                       value="${product.partNumber}" 
                       autocomplete="off"
                       placeholder="Ürün Kodu">
            `;
        }

        // Tag'ı düzenlenebilir yap
        const tagCell = document.getElementById(`tag-${productId}`);
        if (tagCell) {
            const currentTags = product.tags ? Utils.tagsToString(product.tags) : (product.tag || '');
            tagCell.innerHTML = `
                <div class="tag-input-container">
                    <input type="text" 
                           class="edit-input" 
                           id="edit-tag-${productId}" 
                           value="${currentTags}" 
                           placeholder="Kategori (boşlukla ayırın)" 
                           autocomplete="off">
                    <div id="editTagSuggestions-${productId}" class="tag-suggestions"></div>
                </div>
            `;
        }

        // Edit actions ekle
        this.renderEditActions(productId);

        return {
            nameInput: document.getElementById(`edit-name-${productId}`),
            partInput: document.getElementById(`edit-part-${productId}`),
            tagInput: document.getElementById(`edit-tag-${productId}`)
        };
    }

    // Düzenleme aksiyonlarını render et
    renderEditActions(productId) {
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (!row) return;

        const actionsCell = row.querySelector('.stock-actions');
        if (actionsCell) {
            actionsCell.innerHTML = `
                <button class="stock-btn save-btn" data-action="save" data-product-id="${productId}" title="Kaydet">💾</button>
                <button class="stock-btn cancel-btn" data-action="cancel" data-product-id="${productId}" title="İptal">❌</button>
            `;
        }
    }

    // Düzenleme modunu iptal et
    cancelEditMode(product) {
        if (!product) return;

        const productId = product.id;
        
        // Normal görünüme geri döndür
        const nameCell = document.getElementById(`name-${productId}`);
        if (nameCell) {
            nameCell.innerHTML = product.name;
        }

        const partCell = document.getElementById(`part-${productId}`);
        if (partCell) {
            partCell.innerHTML = product.partNumber;
        }

        const tagCell = document.getElementById(`tag-${productId}`);
        if (tagCell) {
            tagCell.innerHTML = this.tagManager.renderProductTag(product.tags || product.tag);
        }

        const actionsCell = document.querySelector(`tr[data-product-id="${productId}"] .stock-actions`);
        if (actionsCell) {
            actionsCell.innerHTML = this.renderActionButtons(productId);
        }

        this.currentEditingId = null;
    }

    // Satır güncelle (tek satır için)
    updateRow(product) {
        const row = document.querySelector(`tr[data-product-id="${product.id}"]`);
        if (!row) return;

        const newRowHTML = this.renderProductRow(product);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newRowHTML;
        const newRow = tempDiv.firstElementChild;

        row.replaceWith(newRow);
    }

    // Satır ekle (yeni ürün için)
    addRow(product, position = 'append') {
        const tbody = document.getElementById('stockTableBody');
        if (!tbody) return;

        // Boş state varsa kaldır
        const emptyState = tbody.querySelector('.empty-state');
        if (emptyState) {
            emptyState.parentElement.remove();
        }

        const newRowHTML = this.renderProductRow(product);
        
        if (position === 'prepend') {
            tbody.insertAdjacentHTML('afterbegin', newRowHTML);
        } else {
            tbody.insertAdjacentHTML('beforeend', newRowHTML);
        }

        // Yeni eklenen satırı highlight et
        const newRow = tbody.querySelector(`tr[data-product-id="${product.id}"]`);
        if (newRow) {
            newRow.classList.add('row-highlight');
            setTimeout(() => {
                newRow.classList.remove('row-highlight');
            }, 2000);
        }
    }

    // Satır sil
    removeRow(productId) {
        const row = document.querySelector(`tr[data-product-id="${productId}"]`);
        if (row) {
            row.classList.add('row-removing');
            setTimeout(() => {
                row.remove();
                
                // Eğer tablo boşsa empty state göster
                const tbody = document.getElementById('stockTableBody');
                if (tbody && tbody.children.length === 0) {
                    tbody.innerHTML = this.renderEmptyState();
                }
            }, 300);
        }
    }

    // Stok hücresi güncelle
    updateStockCell(productId, newStock) {
        const stockInput = document.querySelector(`input[data-product-id="${productId}"]`);
        if (stockInput) {
            stockInput.value = newStock;
            
            // Visual feedback
            stockInput.classList.add('updated');
            setTimeout(() => {
                stockInput.classList.remove('updated');
            }, 1000);
        }
    }

    // Sıralama durumunu göster
    updateSortIndicator(column, direction) {
        // Tüm sıralama göstergelerini temizle
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.classList.remove('asc', 'desc');
        });

        // Aktif sıralama göstergesini güncelle
        const indicator = document.querySelector(`[data-sort="${column}"] .sort-indicator`);
        if (indicator) {
            indicator.classList.add(direction);
        }
    }

    // Filtreleme sonucu mesajı göster
    renderFilterMessage(totalCount, filteredCount, searchTerm = '') {
        const messageContainer = document.getElementById('filterMessage');
        if (!messageContainer) return;

        if (searchTerm && filteredCount !== totalCount) {
            messageContainer.innerHTML = `
                <div class="filter-info">
                    <span class="filter-count">${filteredCount}</span> / ${totalCount} ürün 
                    <strong>"${searchTerm}"</strong> araması için gösteriliyor
                    <button class="clear-filter-btn" onclick="document.getElementById('searchInput').value=''; stockManager.searchProducts('')">
                        Filtreyi Temizle
                    </button>
                </div>
            `;
            messageContainer.style.display = 'block';
        } else {
            messageContainer.style.display = 'none';
        }
    }

    // Aktif düzenleme var mı kontrol et
    hasActiveEdit() {
        return this.currentEditingId !== null;
    }

    // Aktif düzenleme ID'sini al
    getActiveEditId() {
        return this.currentEditingId;
    }

    // Tablo event'lerini kur
    setupTableEvents(eventHandlers) {
        const tbody = document.getElementById('stockTableBody');
        if (!tbody) return;

        // Event delegation kullan
        tbody.addEventListener('click', (e) => {
            const target = e.target;
            const action = target.getAttribute('data-action');
            const productId = target.getAttribute('data-product-id');

            if (action && productId && eventHandlers[action]) {
                eventHandlers[action](productId, target);
            }
        });

        // Input events
        tbody.addEventListener('input', (e) => {
            if (e.target.classList.contains('stock-input')) {
                const productId = e.target.getAttribute('data-product-id');
                if (productId && eventHandlers.stockChange) {
                    eventHandlers.stockChange(productId, e.target.value);
                }
            }
        });

        // Keyboard events
        tbody.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('stock-input')) {
                if (eventHandlers.stockKeydown) {
                    eventHandlers.stockKeydown(e);
                }
            } else if (e.target.classList.contains('edit-input')) {
                if (e.key === 'Enter' && eventHandlers.save) {
                    const productId = this.currentEditingId;
                    if (productId) {
                        eventHandlers.save(productId);
                    }
                } else if (e.key === 'Escape' && eventHandlers.cancel) {
                    const productId = this.currentEditingId;
                    if (productId) {
                        eventHandlers.cancel(productId);
                    }
                }
            }
        });
    }
} 