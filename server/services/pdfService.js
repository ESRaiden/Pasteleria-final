const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

/**
 * Función auxiliar para generar PDF usando Puppeteer.
 * Incluye configuración robusta para entornos Docker/Railway.
 */
async function generatePdfWithPuppeteer(htmlContent, options) {
    let browser;
    try {
        console.log('🚀 [PDF SERVICE] Iniciando navegador Puppeteer...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // CRÍTICO: Evita crashes de memoria en Docker/Railway
                '--disable-gpu',           // Recomendado para servidores sin tarjeta gráfica
                '--font-render-hinting=none' // Mejora la renderización de fuentes
            ]
        });

        const page = await browser.newPage();
        
        // Asignamos el contenido y esperamos a que carguen las imágenes
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 60000 // Timeout de 60s por seguridad
        });

        const pdfBuffer = await page.pdf(options);
        return pdfBuffer;

    } catch (error) {
        console.error("❌ Error crítico generando PDF:", error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// --- CREAR PDF DE FOLIO INDIVIDUAL ---
exports.createPdf = async (folioData) => {
    try {
        console.log('📄 [PDF SERVICE] Generando PDF para folio:', folioData.folioNumber);
        
        const templatePath = path.join(__dirname, '../templates/folioTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { folio: folioData });

        const footerText = `Pedido capturado por: ${folioData.responsibleUser?.username || 'Sistema'} el ${new Date(folioData.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

        const options = {
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            margin: {
                top: '25px',
                right: '25px',
                bottom: '40px',
                left: '25px'
            },
            footerTemplate: `
                <div style="width: 100%; font-size: 9pt; font-family: Arial, sans-serif; text-align: center; color: #555; padding-top: 5px; border-top: 1px solid #ddd; margin-left: 25px; margin-right: 25px;">
                    ${footerText}
                </div>
            `,
            headerTemplate: '<div></div>'
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log('✅ PDF de folio generado correctamente.');
        return pdfBuffer;

    } catch (error) {
        console.error('❌ Error en createPdf:', error);
        throw error;
    }
};

// --- FUNCIÓN GENÉRICA PARA REPORTES MASIVOS ---
async function generateBulkPdf(templateName, data, date = null) {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
        const html = await ejs.renderFile(templatePath, { folios: data, date: date, commissions: data });

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log(`✅ PDF masivo (${templateName}) generado.`);
        return pdfBuffer;

    } catch (error) {
        console.error(`❌ Error en generateBulkPdf (${templateName}):`, error);
        throw error;
    }
}

exports.createLabelsPdf = async (folios) => {
    return generateBulkPdf('labelsTemplate', folios);
};

exports.createOrdersPdf = async (folios) => {
    return generateBulkPdf('ordersTemplate', folios);
};

exports.createCommissionReportPdf = async (commissions, date) => {
    try {
        const templatePath = path.join(__dirname, '../templates/commissionReportTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { commissions, date });

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log(`✅ Reporte de comisiones generado.`);
        return pdfBuffer;
    } catch (error) {
        console.error(`❌ Error en createCommissionReportPdf:`, error);
        throw error;
    }
};