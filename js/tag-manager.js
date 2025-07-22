// Tag yönetimi ve autocomplete sistemi modülü
import { Utils } from './utils.js';

export class TagManager {
    constructor() {
        this.tags = [];
        this.currentSuggestionIndex = -1;
        this.currentEditSuggestionIndex = -1;
        this.activeSuggestionContainer = null;
    }

    // Mevcut ürünlerden tag listesini yeniden oluştur
    regenerateTagsFromProducts(products) {
        const allTags = new Set();
        
        products.forEach(product => {
            // Yeni format (tags array)
            if (Array.isArray(product.tags)) {
                product.tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        allTags.add(tag.trim());
                    }
                });
            }
            // Eski format desteği (tag string)
            else if (product.tag && typeof product.tag === 'string') {
                const oldTags = Utils.parseTags(product.tag);
                oldTags.forEach(tag => {
                    if (tag && tag.trim()) {
                        allTags.add(tag.trim());
                    }
                });
                
                // Eski formatı yeni formata çevir
                product.tags = oldTags;
                delete product.tag;
            }
        });
        
        // Tag listesini güncelle (alfabetik sıralama)
        this.tags = Array.from(allTags).sort();
        
        console.log(`Toplam ${this.tags.length} unique tag bulundu:`, this.tags);
        return this.tags;
    }

    // Yeni tag ekle
    addNewTag(tag) {
        if (tag && tag.trim() && !this.tags.includes(tag.trim())) {
            this.tags.push(tag.trim());
            this.tags.sort(); // Alfabetik sıralama koru
        }
    }

    // Birden fazla tag ekle
    addNewTags(tagArray) {
        tagArray.forEach(tag => this.addNewTag(tag));
    }

    // Tag önerileri göster
    showTagSuggestions(value, inputElement, suggestionsContainerId) {
        const suggestionsContainer = document.getElementById(suggestionsContainerId);
        if (!suggestionsContainer) return;
        
        // Index'i sıfırla
        this.currentSuggestionIndex = -1;
        this.activeSuggestionContainer = suggestionsContainer;
        
        // Mevcut tag'ları parse et
        const currentTags = Utils.parseTags(value);
        const lastTag = currentTags[currentTags.length - 1] || '';
        
        if (!value || value.endsWith(' ')) {
            // Boşsa veya son karakter boşluksa tüm tag'ları göster
            if (this.tags.length > 0) {
                const availableTags = this.tags.filter(tag => !currentTags.includes(tag));
                if (availableTags.length > 0) {
                    suggestionsContainer.innerHTML = availableTags.map(tag => 
                        `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`
                    ).join('');
                    
                    this.bindSuggestionEvents(suggestionsContainer, inputElement);
                    suggestionsContainer.classList.add('show');
                } else {
                    this.hideSuggestions(suggestionsContainer);
                }
            } else {
                this.hideSuggestions(suggestionsContainer);
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
                `<div class="tag-suggestion" data-tag="${tag}">${tag}</div>`
            ).join('');
            
            this.bindSuggestionEvents(suggestionsContainer, inputElement);
            suggestionsContainer.classList.add('show');
        } else {
            this.hideSuggestions(suggestionsContainer);
        }
    }

    // Suggestion eventlerini bağla
    bindSuggestionEvents(container, inputElement) {
        const suggestions = container.querySelectorAll('.tag-suggestion');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                const tag = suggestion.getAttribute('data-tag');
                this.selectTag(tag, inputElement);
                this.hideSuggestions(container);
            });
        });
    }

    // Tag önerileri gizle
    hideSuggestions(container) {
        if (container) {
            container.classList.remove('show');
        }
        this.currentSuggestionIndex = -1;
        this.activeSuggestionContainer = null;
    }

    // Tag seç
    selectTag(tag, inputElement) {
        const currentValue = inputElement.value;
        const currentTags = Utils.parseTags(currentValue);
        
        if (currentValue.endsWith(' ') || currentTags.length === 0) {
            // Yeni tag ekle
            inputElement.value = currentValue + tag + ' ';
        } else {
            // Son tag'ı değiştir
            currentTags[currentTags.length - 1] = tag;
            inputElement.value = Utils.tagsToString(currentTags) + ' ';
        }
        
        inputElement.focus();
    }

    // Keyboard navigation
    handleKeyNavigation(e, containerId) {
        const suggestionsContainer = document.getElementById(containerId);
        if (!suggestionsContainer) return false;
        
        const suggestions = suggestionsContainer.querySelectorAll('.tag-suggestion');
        
        if (suggestions.length > 0 && suggestionsContainer.classList.contains('show')) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.currentSuggestionIndex = Math.min(this.currentSuggestionIndex + 1, suggestions.length - 1);
                this.highlightSuggestion(suggestions, this.currentSuggestionIndex);
                return true;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.currentSuggestionIndex = Math.max(this.currentSuggestionIndex - 1, 0);
                this.highlightSuggestion(suggestions, this.currentSuggestionIndex);
                return true;
            } else if (e.key === 'Enter' && this.currentSuggestionIndex >= 0) {
                e.preventDefault();
                const selectedSuggestion = suggestions[this.currentSuggestionIndex];
                const tagText = selectedSuggestion.getAttribute('data-tag');
                return { action: 'select', tag: tagText };
            } else if (e.key === 'Escape') {
                this.hideSuggestions(suggestionsContainer);
                return true;
            }
        }
        
        return false;
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

    // Product tag render et
    renderProductTag(tags) {
        // Eski format desteği (tag -> tags migration)
        if (typeof tags === 'string') {
            if (!tags) return '-';
            const tagClass = Utils.getTagClass(tags);
            return `<span class="product-tag ${tagClass}">${tags}</span>`;
        }
        
        // Yeni çoklu tag formatı
        if (!Array.isArray(tags) || tags.length === 0) return '-';
        
        return tags.map(tag => {
            const tagClass = Utils.getTagClass(tag);
            return `<span class="product-tag ${tagClass}">${tag}</span>`;
        }).join(' ');
    }

    // Tag input için event listener'ları kur
    setupTagInput(inputElement, suggestionsContainerId) {
        // Input event
        inputElement.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const normalizedValue = Utils.normalizeText(oldValue);
            e.target.value = normalizedValue;
            
            // Cursor pozisyonunu ayarla
            const lengthDiff = normalizedValue.length - oldValue.length;
            e.target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
            
            this.showTagSuggestions(normalizedValue, inputElement, suggestionsContainerId);
        });

        // Focus event
        inputElement.addEventListener('focus', (e) => {
            this.showTagSuggestions(e.target.value, inputElement, suggestionsContainerId);
        });

        // Blur event
        inputElement.addEventListener('blur', (e) => {
            // Delay hiding to allow click on suggestions
            setTimeout(() => {
                const container = document.getElementById(suggestionsContainerId);
                this.hideSuggestions(container);
            }, 200);
        });

        // Keydown event
        inputElement.addEventListener('keydown', (e) => {
            const result = this.handleKeyNavigation(e, suggestionsContainerId);
            
            if (result && typeof result === 'object' && result.action === 'select') {
                this.selectTag(result.tag, inputElement);
                const container = document.getElementById(suggestionsContainerId);
                this.hideSuggestions(container);
            }
        });
    }

    // Tüm tag'ları al
    getAllTags() {
        return [...this.tags];
    }

    // Tag sayısını al
    getTagCount() {
        return this.tags.length;
    }
} 