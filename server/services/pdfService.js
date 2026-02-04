const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

/**
 * Función auxiliar para generar PDF usando Puppeteer.
 * Configurada específicamente para funcionar en entornos Docker/Railway.
 */
async function generatePdfWithPuppeteer(htmlContent, options) {
    let browser;
    try {
        console.log('🚀 [PDF SERVICE] Iniciando navegador...');
        
        // Configuración robusta para la nube
        browser = await puppeteer.launch({
            // Si definimos la variable en Dockerfile, usa ese Chrome. Si no, intenta buscarlo.
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // [IMPORTANTE] Evita crashes por memoria compartida en Docker
                '--disable-gpu',           // Ahorra recursos en servidores sin gráfica
                '--font-render-hinting=none' // Mejora la lectura de fuentes en Linux
            ]
        });

        const page = await browser.newPage();
        
        // Asignamos el contenido y esperamos hasta que no haya conexiones activas (imágenes cargadas)
        // Timeout de 60s para evitar errores si el servidor es lento
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 60000 
        });

        const pdfBuffer = await page.pdf(options);
        return pdfBuffer;

    } catch (error) {
        console.error("❌ Error CRÍTICO generando PDF con Puppeteer:", error);
        throw error; // Re-lanzamos el error para que el controlador lo maneje
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// --- 1. CREAR PDF DE FOLIO INDIVIDUAL ---
exports.createPdf = async (folioData) => {
    try {
        console.log('📄 [PDF SERVICE] Generando PDF para folio:', folioData.folioNumber);
        
        const templatePath = path.join(__dirname, '../templates/folioTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { folio: folioData });

        // Texto del pie de página
        const footerText = `Pedido capturado por: ${folioData.responsibleUser?.username || 'Sistema'} el ${new Date(folioData.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

        const options = {
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true,
            margin: {
                top: '25px',
                right: '25px',
                bottom: '40px', // Espacio para el footer
                left: '25px'
            },
            // Plantilla HTML del footer (requiere estilos inline explícitos)
            footerTemplate: `
                <div style="width: 100%; font-size: 9pt; font-family: Arial, sans-serif; text-align: center; color: #555; padding-top: 5px; border-top: 1px solid #ddd; margin-left: 25px; margin-right: 25px;">
                    ${footerText}
                </div>
            `,
            headerTemplate: '<div></div>' // Necesario para activar el footer
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
        // Pasamos datos como 'folios' y 'commissions' para compatibilidad con distintos templates
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

// --- 2. ETIQUETAS DE PRODUCCIÓN ---
exports.createLabelsPdf = async (folios) => {
    return generateBulkPdf('labelsTemplate', folios);
};

// --- 3. COMANDAS DE ENVÍO ---
exports.createOrdersPdf = async (folios) => {
    return generateBulkPdf('ordersTemplate', folios);
};

// --- 4. REPORTE DE COMISIONES ---
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