// Modal yönetimi modülü
import { Utils } from './utils.js';

export class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.setupGlobalEvents();
    }

    // Global event'leri kur (ESC tuşu vs.)
    setupGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
    }

    // En üstteki modal'ı kapat
    closeTopModal() {
        const modals = Array.from(this.activeModals.keys());
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            this.hideModal(topModal);
        }
    }

    // Onay modal'ı göster
    showConfirmModal(message, product, onConfirm, onCancel = null) {
        const modalId = 'confirmModal';
        const modal = document.getElementById(modalId);
        
        if (!modal) {
            console.error('Confirm modal element bulunamadı!');
            return;
        }

        const messageEl = document.getElementById('confirmMessage');
        const productInfoEl = document.getElementById('productInfo');
        const deleteBtn = document.getElementById('confirmDelete');
        const cancelBtn = document.getElementById('confirmCancel');

        // Mesajı ayarla
        if (messageEl) {
            messageEl.textContent = message;
        }

        // Ürün bilgilerini göster
        if (productInfoEl && product) {
            const tags = product.tags ? Utils.tagsToString(product.tags) : (product.tag || '-');
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
        }

        // Event listener'ları temizle ve yenilerini ekle
        this.clearModalEvents(modalId);

        // Onay butonu event'i
        if (deleteBtn) {
            const confirmHandler = () => {
                if (onConfirm && typeof onConfirm === 'function') {
                    onConfirm();
                }
                this.hideModal(modalId);
            };
            deleteBtn.addEventListener('click', confirmHandler);
            this.activeModals.set(modalId, { confirmHandler });
        }

        // İptal butonu event'i
        if (cancelBtn) {
            const cancelHandler = () => {
                if (onCancel && typeof onCancel === 'function') {
                    onCancel();
                }
                this.hideModal(modalId);
            };
            cancelBtn.addEventListener('click', cancelHandler);
        }

        // Modal dışına tıklama
        const outsideClickHandler = (e) => {
            if (e.target === modal) {
                if (onCancel && typeof onCancel === 'function') {
                    onCancel();
                }
                this.hideModal(modalId);
            }
        };
        modal.addEventListener('click', outsideClickHandler);

        // Modal'ı göster
        modal.classList.add('show');
        
        // Focus yönetimi
        if (deleteBtn) {
            deleteBtn.focus();
        }

        return modalId;
    }

    // Generic modal göster
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal '${modalId}' bulunamadı!`);
            return false;
        }

        // Modal'ı kaydet
        this.activeModals.set(modalId, options);

        // Modal'ı göster
        modal.classList.add('show');

        // Auto focus
        if (options.autoFocus) {
            const focusElement = modal.querySelector(options.autoFocus);
            if (focusElement) {
                focusElement.focus();
            }
        }

        // Outside click handler
        if (options.closeOnOutsideClick !== false) {
            const outsideClickHandler = (e) => {
                if (e.target === modal) {
                    this.hideModal(modalId);
                    if (options.onOutsideClick) {
                        options.onOutsideClick();
                    }
                }
            };
            modal.addEventListener('click', outsideClickHandler);
        }

        return modalId;
    }

    // Modal gizle
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return false;

        // Event'leri temizle
        this.clearModalEvents(modalId);

        // Modal'ı gizle
        modal.classList.remove('show');

        // Kayıttan kaldır
        this.activeModals.delete(modalId);

        return true;
    }

    // Modal event'lerini temizle
    clearModalEvents(modalId) {
        const modalData = this.activeModals.get(modalId);
        if (modalData && modalData.confirmHandler) {
            const deleteBtn = document.getElementById('confirmDelete');
            if (deleteBtn) {
                // Event listener'ı kaldırmak için yeni element oluştur
                const newDeleteBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            }
        }
    }

    // Dinamik modal oluştur
    createModal(modalId, content, options = {}) {
        // Varolan modal'ı kaldır
        this.removeModal(modalId);

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = content;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // İsteğe bağlı close butonu ekle
        if (options.showCloseButton !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', () => this.hideModal(modalId));
            modalContent.appendChild(closeBtn);
        }

        return modal;
    }

    // Modal'ı DOM'dan kaldır
    removeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.hideModal(modalId);
            modal.remove();
        }
    }

    // Aktif modal sayısını al
    getActiveModalCount() {
        return this.activeModals.size;
    }

    // Tüm modal'ları kapat
    closeAllModals() {
        const modalIds = Array.from(this.activeModals.keys());
        modalIds.forEach(modalId => this.hideModal(modalId));
    }

    // Modal açık mı kontrol et
    isModalOpen(modalId) {
        return this.activeModals.has(modalId);
    }

    // Herhangi bir modal açık mı
    hasOpenModals() {
        return this.activeModals.size > 0;
    }

    // Loading modal göster
    showLoadingModal(message = 'Yükleniyor...') {
        const modalId = 'loadingModal';
        const content = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;

        this.createModal(modalId, content, { 
            showCloseButton: false,
            closeOnOutsideClick: false 
        });
        this.showModal(modalId);

        return modalId;
    }

    // Loading modal gizle
    hideLoadingModal() {
        this.hideModal('loadingModal');
    }

    // Bilgi modal'ı göster
    showInfoModal(title, content, onClose = null) {
        const modalId = 'infoModal';
        const modalContent = `
            <div class="info-modal-content">
                <h3>${title}</h3>
                <div class="info-body">${content}</div>
                <div class="info-actions">
                    <button class="btn btn-primary" onclick="modalManager.hideModal('${modalId}')">Tamam</button>
                </div>
            </div>
        `;

        this.createModal(modalId, modalContent);
        this.showModal(modalId, {
            autoFocus: '.btn-primary',
            onOutsideClick: onClose
        });

        return modalId;
    }
} 