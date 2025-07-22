// Utils modülü testleri
import { testRunner } from '../js/test-runner.js';
import { Utils } from '../js/utils.js';

// Utils testleri
testRunner.describe('Utils Modülü Testleri', () => {
    
    // Türkçe karakter dönüşümü testleri
    testRunner.test('convertTurkishChars - Türkçe karakterleri dönüştürür', async (assert) => {
        assert.equals(Utils.convertTurkishChars('çıkış'), 'CIKIS', 'Türkçe karakterler dönüştürülmeli');
        assert.equals(Utils.convertTurkishChars('ğüzel'), 'GUZEL', 'ğ ve ü dönüştürülmeli');
        assert.equals(Utils.convertTurkishChars('İSTANBUL'), 'ISTANBUL', 'İ dönüştürülmeli');
        assert.equals(Utils.convertTurkishChars('ŞEHİR'), 'SEHIR', 'Ş ve İ dönüştürülmeli');
        assert.equals(Utils.convertTurkishChars('hello'), 'hello', 'İngilizce karakterler değişmemeli');
    });

    testRunner.test('normalizeText - Metni büyük harfe çevirir ve Türkçe karakterleri dönüştürür', async (assert) => {
        assert.equals(Utils.normalizeText('çıkış'), 'CIKIS', 'Hem büyük harfe çevirmeli hem Türkçe karakterleri dönüştürmeli');
        assert.equals(Utils.normalizeText('test'), 'TEST', 'Büyük harfe çevirmeli');
        assert.equals(Utils.normalizeText(''), '', 'Boş string ile çalışmalı');
        assert.equals(Utils.normalizeText('123'), '123', 'Sayılarla çalışmalı');
    });

    // Stok validasyonu testleri
    testRunner.test('validateStockInput - Geçerli stok değerlerini doğrular', async (assert) => {
        assert.equals(Utils.validateStockInput('10'), 10, 'Geçerli sayı parse edilmeli');
        assert.equals(Utils.validateStockInput('0'), 0, 'Sıfır geçerli olmalı');
        assert.equals(Utils.validateStockInput('?'), '?', 'Soru işareti korunmalı');
        assert.equals(Utils.validateStockInput(''), '?', 'Boş değer soru işareti olmalı');
        assert.equals(Utils.validateStockInput('abc'), '?', 'Geçersiz değer soru işareti olmalı');
        assert.equals(Utils.validateStockInput('10abc'), 10, 'Sayı kısmı alınmalı');
        assert.equals(Utils.validateStockInput('-5'), '?', 'Negatif değer soru işareti olmalı');
    });

    // Tag parsing testleri
    testRunner.test('parseTags - Tag string\'ini array\'e çevirir', async (assert) => {
        assert.arrayEquals(Utils.parseTags('ELEKTRONIK RELAY'), ['ELEKTRONIK', 'RELAY'], 'Boşlukla ayrılmış tag\'ler parse edilmeli');
        assert.arrayEquals(Utils.parseTags('tek'), ['TEK'], 'Tek tag parse edilmeli');
        assert.arrayEquals(Utils.parseTags(''), [], 'Boş string boş array dönemli');
        assert.arrayEquals(Utils.parseTags('  çoklu   boşluk  '), ['COKLU', 'BOSLUK'], 'Fazla boşluklar temizlenmeli');
        assert.arrayEquals(Utils.parseTags('büyük harf TEST'), ['BUYUK', 'HARF', 'TEST'], 'Tüm tag\'ler büyük harfe çevrilmeli');
    });

    testRunner.test('tagsToString - Tag array\'ini string\'e çevirir', async (assert) => {
        assert.equals(Utils.tagsToString(['ELEKTRONIK', 'RELAY']), 'ELEKTRONIK RELAY', 'Array string\'e çevrilmeli');
        assert.equals(Utils.tagsToString(['TEK']), 'TEK', 'Tek element çevrilmeli');
        assert.equals(Utils.tagsToString([]), '', 'Boş array boş string dönemli');
        assert.equals(Utils.tagsToString(null), '', 'Null değer boş string dönemli');
        assert.equals(Utils.tagsToString(undefined), '', 'Undefined değer boş string dönemli');
    });

    // CSV parsing testleri
    testRunner.test('parseCSVLine - CSV satırını parse eder', async (assert) => {
        assert.arrayEquals(Utils.parseCSVLine('a,b,c'), ['a', 'b', 'c'], 'Basit CSV parse edilmeli');
        assert.arrayEquals(Utils.parseCSVLine('"quoted value",normal,123'), ['quoted value', 'normal', '123'], 'Tırnak içi değerler parse edilmeli');
        assert.arrayEquals(Utils.parseCSVLine('a,"b,c",d'), ['a', 'b,c', 'd'], 'Tırnak içindeki virgül korunmalı');
        assert.arrayEquals(Utils.parseCSVLine(''), [''], 'Boş satır tek boş element dönemli');
    });

    // ID oluşturma testleri
    testRunner.test('generateUniqueId - Benzersiz ID oluşturur', async (assert) => {
        const id1 = Utils.generateUniqueId(1);
        const id2 = Utils.generateUniqueId(2);
        
        assert.equals(id1.length, 5, 'ID uzunluğu 5 karakter olmalı');
        assert.truthy(/^[A-Z]{2}[0-9]{3}$/.test(id1), 'ID formatı: 2 harf + 3 sayı olmalı');
        assert.notEquals(id1, id2, 'Farklı counter\'lar farklı ID üretmeli');
        assert.truthy(id1.endsWith('001'), 'İlk ID 001 ile bitmeli');
        assert.truthy(id2.endsWith('002'), 'İkinci ID 002 ile bitmeli');
    });

    // Tag class testleri
    testRunner.test('getTagClass - Tag tipine göre CSS class döner', async (assert) => {
        assert.equals(Utils.getTagClass('ELEKTRONIK'), 'electronics', 'Elektronik tag\'i için doğru class');
        assert.equals(Utils.getTagClass('ELECTRONIC'), 'electronics', 'İngilizce elektronik için doğru class');
        assert.equals(Utils.getTagClass('DIRENÇ'), 'resistor', 'Direnç için doğru class');
        assert.equals(Utils.getTagClass('RESISTOR'), 'resistor', 'İngilizce resistor için doğru class');
        assert.equals(Utils.getTagClass('KONDANSATÖR'), 'capacitor', 'Kondansatör için doğru class');
        assert.equals(Utils.getTagClass('ENTEGRE'), 'integrated', 'Entegre için doğru class');
        assert.equals(Utils.getTagClass('IC'), 'integrated', 'IC için doğru class');
        assert.equals(Utils.getTagClass('MEKANIK'), 'mechanical', 'Mekanik için doğru class');
        assert.equals(Utils.getTagClass('UNKNOWN'), '', 'Bilinmeyen tag için boş class');
    });

    // Edge case testleri
    testRunner.test('Edge Cases - Sınır durumlar', async (assert) => {
        // Null/undefined handling
        assert.equals(Utils.normalizeText(null), 'NULL', 'Null değer string\'e çevrilmeli');
        assert.equals(Utils.convertTurkishChars(undefined), 'UNDEFINED', 'Undefined değer string\'e çevrilmeli');
        
        // Çok uzun değerler
        const longText = 'a'.repeat(1000);
        assert.equals(Utils.normalizeText(longText).length, 1000, 'Uzun metinler işlenmeli');
        
        // Özel karakterler
        assert.equals(Utils.normalizeText('test@#$%'), 'TEST@#$%', 'Özel karakterler korunmalı');
    });
}); 