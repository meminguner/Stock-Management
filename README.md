# 📦 Atölye Stok Takip Uygulaması

Modern, modüler JavaScript ES6 modülleri ile geliştirilmiş stok takip uygulaması.

## 🗂️ Modüler Yapı

Uygulama artık daha organize ve sürdürülebilir bir modüler yapıya sahip:

### 📁 `/js` Klasör Yapısı

```
js/
├── app.js              # 🚀 Ana uygulama başlatıcı
├── stock-manager.js    # 📋 Ana koordinatör sınıfı
├── utils.js           # 🔧 Yardımcı fonksiyonlar
├── storage.js         # 💾 LocalStorage yönetimi
├── notification.js    # 📢 Bildirim sistemi
├── tag-manager.js     # 🏷️  Tag yönetimi & autocomplete
├── csv-handler.js     # 📄 CSV import/export işlemleri
├── modal-manager.js   # 🪟 Modal yönetimi
└── table-renderer.js  # 📊 Tablo render işlemleri
```

## 🏗️ Modül Açıklamaları

### 🚀 `app.js` - Ana Başlatıcı
- Uygulamayı başlatır
- Hata yönetimi yapar
- Debug bilgileri sağlar

### 📋 `stock-manager.js` - Ana Koordinatör
- Tüm modülleri entegre eder
- İş mantığını yönetir
- Event koordinasyonu yapar

### 🔧 `utils.js` - Yardımcı Fonksiyonlar
- Türkçe karakter dönüşümü
- Stok validasyonu
- Tag parsing işlemleri
- CSV parsing yardımcıları

### 💾 `storage.js` - Depolama Yönetimi
- LocalStorage CRUD işlemleri
- Veri migration desteği
- Storage durumu kontrolü

### 📢 `notification.js` - Bildirim Sistemi
- Başarı/hata/uyarı bildirimleri
- Çoklu bildirim yönetimi
- Otomatik kapanma sistemi

### 🏷️ `tag-manager.js` - Tag Sistemi
- Tag autocomplete
- Keyboard navigation
- Tag önerisi sistemi
- Çoklu tag desteği

### 📄 `csv-handler.js` - CSV İşlemleri
- Import/Export fonksiyonları
- Drag & drop desteği
- Veri validasyonu
- Integration dialogs

### 🪟 `modal-manager.js` - Modal Sistemi
- Onay modalları
- Generic modal sistemi
- Loading modalları
- ESC tuşu desteği

### 📊 `table-renderer.js` - Tablo Render
- Performanslı tablo render
- Edit mode yönetimi
- Row işlemleri
- Filter mesajları

## ✨ Yeni Özellikler

- **ES6 Modüller**: Modern JavaScript modül sistemi
- **Import/Export**: Clean kod organizasyonu
- **Separation of Concerns**: Her modül kendi sorumluluğuna odaklanır
- **Reusability**: Modüller birbirinden bağımsız
- **Maintainability**: Kolay bakım ve geliştirme
- **Type Safety**: Better IntelliSense desteği

## 🚀 Kullanım

1. **Tarayıcı Uyumluluğu**: Modern tarayıcılar (ES6 modül desteği gerekli)
2. **Çalıştırma**: `index.html` dosyasını açın
3. **Development**: Local server kullanın (CORS politikaları için)

## 📈 Performans İyileştirmeleri

- **Lazy Loading**: İhtiyaç duyulan modüller yüklenir
- **Memory Management**: Better garbage collection
- **Event Delegation**: Efficient event handling
- **Code Splitting**: Modüler kod yapısı

## 🛠️ Development

### Local Server Başlatma
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server
# VS Code > Live Server extension
```

### Debug
- Browser DevTools Console'da `window.stockManager` erişilebilir
- Her modül kendi namespace'inde çalışır
- Error tracking geliştirildi

## 🔧 Eski Versiyondan Farklar

| Özellik | Eski (script.js) | Yeni (Modüler) |
|---------|------------------|----------------|
| **Dosya Boyutu** | ~1200+ satır | 8 dosya, ~200-300 satır/dosya |
| **Organizasyon** | Monolitik | Modüler |
| **Bakım** | Zor | Kolay |
| **Test** | Zor | Modül bazında |
| **Reusability** | Düşük | Yüksek |
| **Performance** | OK | İyileştirildi |

## 🧪 Test Sistemi

Uygulama artık **kapsamlı test sistemi** ile geliyor:

### Otomatik Testler
- **Unit Tests**: Her modülün ayrı ayrı testi
- **Integration Tests**: Modüller arası etkileşim testleri
- **Performance Tests**: Büyük veri setleri ile test
- **Error Handling Tests**: Hata durumları testi

### Test Çalıştırma
```bash
# Browser'da test çalıştır
open test.html

# Veya local server ile
python -m http.server 8000
# http://localhost:8000/test.html
```

### Manual Test Checklist
`MANUAL_TESTS.md` dosyasında detaylı manuel test senaryoları bulunur.

### Test Kapsamı
- 🔧 **Utils**: 10+ test (Türkçe karakter, validasyon)
- 💾 **Storage**: 8+ test (LocalStorage, error handling)
- 🔗 **Integration**: 7+ test (Modül etkileşimleri)
- ⚡ **Performance**: Büyük veri setleri
- 🛡️ **Security**: Input validation, XSS koruması

## 📝 Güncellemeler

- ✅ Modüler yapıya geçiş tamamlandı
- ✅ ES6 import/export desteği
- ✅ Better error handling
- ✅ Improved code organization
- ✅ Enhanced maintainability
- ✅ Kapsamlı test sistemi eklendi
- ✅ Browser-based test runner

## 🤝 Katkıda Bulunma

1. Her modülün kendi sorumluluğu var
2. Yeni özellikler için uygun modülü seçin
3. Cross-module dependencies'den kaçının
4. ES6+ syntax kullanın

---

**🔄 Migration Tamamlandı**: Eski script.js dosyası kaldırıldı, yeni modüler yapı aktif! 