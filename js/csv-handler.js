// CSV işlemleri modülü
import { Utils } from './utils.js';

export class CSVHandler {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
    }

    // CSV'ye export et
    exportToCSV(products) {
        if (products.length === 0) {
            this.notificationManager.warning('Export edilecek veri bulunamadı!');
            return false;
        }

        const headers = ['ID', 'Ürün Adı', 'Ürün Kodu', 'Kategori', 'Stok'];
        const csvContent = [
            headers.join(','),
            ...products.map(product => [
                product.id,
                `"${product.name}"`,
                `"${product.partNumber}"`,
                `"${product.tags ? Utils.tagsToString(product.tags) : (product.tag || '')}"`,
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

        this.notificationManager.success('Veriler CSV dosyasına aktarıldı!');
        return true;
    }

    // CSV dosyası işleme (upload ve drag&drop için ortak)
    handleCSVFile(file, callback) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.notificationManager.error('Lütfen sadece CSV dosyası yükleyin!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = this.parseCSVData(e.target.result);
                if (callback && typeof callback === 'function') {
                    callback(result);
                }
            } catch (error) {
                this.notificationManager.error('CSV dosyası okunurken hata oluştu!');
                console.error('CSV parse error:', error);
            }
        };
        reader.readAsText(file, 'UTF-8');
    }

    // CSV verilerini parse et
    parseCSVData(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            this.notificationManager.error('CSV dosyası geçersiz format!');
            return null;
        }

        // Header kontrolü
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const uploadedProducts = [];
        let successCount = 0;
        let errorCount = 0;

        // Veri satırlarını işle
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = Utils.parseCSVLine(lines[i]);
                if (values.length >= 5) {
                    const product = {
                        id: values[0] || this.generateUniqueId(),
                        name: Utils.normalizeText(values[1] || ''),
                        partNumber: Utils.normalizeText(values[2] || ''),
                        tags: Utils.parseTags(values[3] || ''),
                        stock: Utils.validateStockInput(values[4] || '?')
                    };

                    // Geçerli ürün kontrolü
                    if (product.name && product.partNumber) {
                        uploadedProducts.push(product);
                        successCount++;
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

        return {
            products: uploadedProducts,
            successCount,
            errorCount,
            isValid: uploadedProducts.length > 0
        };
    }

    // Veri entegrasyonu dialog
    showIntegrationDialog(parseResult, onAdd, onReplace) {
        if (!parseResult || !parseResult.isValid) {
            this.notificationManager.error('Yüklenebilir geçerli veri bulunamadı!');
            return;
        }

        const { successCount, errorCount } = parseResult;
        const message = `${successCount} ürün başarıyla yüklendi.${errorCount > 0 ? ` ${errorCount} satırda hata var.` : ''}\n\nMevcut verilerle nasıl birleştirmek istiyorsunuz?`;
        
        const choice = confirm(message + '\n\nTamam: Mevcut verilere ekle\nİptal: Mevcut verileri değiştir');
        
        if (choice && onAdd) {
            onAdd(parseResult.products);
        } else if (!choice && onReplace) {
            onReplace(parseResult.products);
        }
    }

    // Drag and drop sistemi kurulumu
    setupDragAndDrop(dropZoneElement, onFileProcessed) {
        if (!dropZoneElement) return;

        dropZoneElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZoneElement.classList.add('drag-over');
        });

        dropZoneElement.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZoneElement.classList.remove('drag-over');
        });

        dropZoneElement.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZoneElement.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.toLowerCase().endsWith('.csv')) {
                    this.handleCSVFile(file, onFileProcessed);
                } else {
                    this.notificationManager.error('Lütfen sadece CSV dosyası sürükleyin!');
                }
            }
        });
    }

    // File input sistemi kurulumu
    setupFileInput(fileInputElement, onFileProcessed) {
        if (!fileInputElement) return;

        fileInputElement.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.handleCSVFile(file, onFileProcessed);
            
            // File input'u temizle (aynı dosyayı tekrar yükleyebilmek için)
            e.target.value = '';
        });
    }

    // CSV template oluştur (örnek dosya indirme için)
    downloadTemplate() {
        const headers = ['ID', 'Ürün Adı', 'Ürün Kodu', 'Kategori', 'Stok'];
        const exampleData = [
            ['AB001', 'ÖRNEK ÜRÜN 1', 'PRD001', 'ELEKTRONIK TEST', '10'],
            ['CD002', 'ÖRNEK ÜRÜN 2', 'PRD002', 'MEKANIK DIŞLI', '5'],
            ['EF003', 'ÖRNEK ÜRÜN 3', 'PRD003', 'ELEKTRONIK IC', '?']
        ];

        const csvContent = [
            headers.join(','),
            ...exampleData.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'stock_template.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.notificationManager.info('Örnek CSV şablonu indirildi!');
    }

    // CSV format validasyonu
    validateCSVFormat(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            return {
                isValid: false,
                error: 'CSV dosyası en az 2 satır içermelidir (başlık + veri)'
            };
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedHeaders = ['ID', 'Ürün Adı', 'Ürün Kodu', 'Kategori', 'Stok'];
        
        // Header kontrolü (esnek)
        const hasRequiredColumns = expectedHeaders.some(expected => 
            headers.some(header => header.toLowerCase().includes(expected.toLowerCase()))
        );

        if (!hasRequiredColumns) {
            return {
                isValid: false,
                error: 'CSV dosyasında gerekli sütunlar bulunamadı. Beklenen: ' + expectedHeaders.join(', ')
            };
        }

        return {
            isValid: true,
            headers,
            rowCount: lines.length - 1
        };
    }
} 