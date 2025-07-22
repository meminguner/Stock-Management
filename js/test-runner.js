// Basit Test Runner Sistemi
export class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    // Test ekleme
    test(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    // Test grubı ekleme
    describe(groupName, testsFunction) {
        console.log(`\n📝 Test Grubu: ${groupName}`);
        testsFunction();
    }

    // Assertion fonksiyonları
    assert = {
        equals: (actual, expected, message = '') => {
            if (actual !== expected) {
                throw new Error(`${message}\n   Beklenen: ${expected}\n   Gerçek: ${actual}`);
            }
        },

        notEquals: (actual, expected, message = '') => {
            if (actual === expected) {
                throw new Error(`${message}\n   Değerler eşit olmamalıydı: ${actual}`);
            }
        },

        truthy: (value, message = '') => {
            if (!value) {
                throw new Error(`${message}\n   Değer truthy olmalıydı: ${value}`);
            }
        },

        falsy: (value, message = '') => {
            if (value) {
                throw new Error(`${message}\n   Değer falsy olmalıydı: ${value}`);
            }
        },

        arrayEquals: (actual, expected, message = '') => {
            if (!Array.isArray(actual) || !Array.isArray(expected)) {
                throw new Error(`${message}\n   Her iki değer de array olmalı`);
            }
            if (actual.length !== expected.length) {
                throw new Error(`${message}\n   Array uzunlukları farklı: ${actual.length} vs ${expected.length}`);
            }
            for (let i = 0; i < actual.length; i++) {
                if (actual[i] !== expected[i]) {
                    throw new Error(`${message}\n   Index ${i}'de fark: ${actual[i]} vs ${expected[i]}`);
                }
            }
        },

        throws: async (fn, message = '') => {
            try {
                await fn();
                throw new Error(`${message}\n   Fonksiyon hata fırlatmalıydı`);
            } catch (error) {
                // Beklenen durum - hata fırlatıldı
                return error;
            }
        },

        async: async (asyncFn, message = '') => {
            try {
                const result = await asyncFn();
                return result;
            } catch (error) {
                throw new Error(`${message}\n   Async fonksiyon başarısız: ${error.message}`);
            }
        }
    };

    // Tüm testleri çalıştır
    async runAll() {
        console.log('🚀 Testler başlatılıyor...\n');
        this.results = { total: 0, passed: 0, failed: 0, errors: [] };

        for (const test of this.tests) {
            await this.runSingleTest(test);
        }

        this.printResults();
        return this.results;
    }

    // Tek test çalıştır
    async runSingleTest(test) {
        this.results.total++;
        
        try {
            console.log(`⏳ ${test.name}`);
            await test.testFunction(this.assert);
            console.log(`✅ ${test.name}`);
            this.results.passed++;
        } catch (error) {
            console.error(`❌ ${test.name}\n   ${error.message}`);
            this.results.failed++;
            this.results.errors.push({
                testName: test.name,
                error: error.message
            });
        }
    }

    // Test sonuçlarını yazdır
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SONUÇLARI');
        console.log('='.repeat(50));
        console.log(`Toplam Test: ${this.results.total}`);
        console.log(`✅ Başarılı: ${this.results.passed}`);
        console.log(`❌ Başarısız: ${this.results.failed}`);
        
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        console.log(`📈 Başarı Oranı: ${successRate}%`);

        if (this.results.failed > 0) {
            console.log('\n🔥 BAŞARISIZ TESTLER:');
            this.results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.testName}`);
                console.log(`   ${error.error}\n`);
            });
        }

        console.log('='.repeat(50));
        
        if (this.results.failed === 0) {
            console.log('🎉 TÜM TESTLER BAŞARILI!');
        } else {
            console.log('⚠️  BAZI TESTLER BAŞARISIZ!');
        }
    }

    // DOM için test sonuçları
    getHTMLResults() {
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        const statusClass = this.results.failed === 0 ? 'success' : 'failure';
        
        let html = `
            <div class="test-results ${statusClass}">
                <h3>📊 Test Sonuçları</h3>
                <div class="test-summary">
                    <div class="stat">
                        <span class="label">Toplam:</span>
                        <span class="value">${this.results.total}</span>
                    </div>
                    <div class="stat success">
                        <span class="label">✅ Başarılı:</span>
                        <span class="value">${this.results.passed}</span>
                    </div>
                    <div class="stat failure">
                        <span class="label">❌ Başarısız:</span>
                        <span class="value">${this.results.failed}</span>
                    </div>
                    <div class="stat">
                        <span class="label">📈 Başarı Oranı:</span>
                        <span class="value">${successRate}%</span>
                    </div>
                </div>
        `;

        if (this.results.failed > 0) {
            html += '<div class="test-errors"><h4>🔥 Başarısız Testler:</h4><ul>';
            this.results.errors.forEach(error => {
                html += `<li><strong>${error.testName}</strong><br><code>${error.error}</code></li>`;
            });
            html += '</ul></div>';
        }

        html += '</div>';
        return html;
    }
}

// Global test runner instance
export const testRunner = new TestRunner(); 