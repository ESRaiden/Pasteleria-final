const puppeteer = require('puppeteer');
const ejs = require('ejs');
const path = require('path');

/**
 * Función auxiliar para generar PDF usando Puppeteer de forma nativa.
 * Maneja el ciclo de vida del navegador y optimiza la carga de recursos.
 */
async function generatePdfWithPuppeteer(htmlContent, options) {
    let browser;
    try {
        // Lanzamos el navegador con argumentos necesarios para servidores (Docker/Linux)
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Asignamos el contenido HTML y esperamos a que la red esté inactiva (para cargar imágenes)
        await page.setContent(htmlContent, { 
            waitUntil: 'networkidle0',
            timeout: 30000 // 30 segundos de timeout máximo
        });

        // Generamos el buffer del PDF
        const pdfBuffer = await page.pdf(options);
        return pdfBuffer;

    } catch (error) {
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// --- FUNCIÓN PARA PDF INDIVIDUAL (CON PIE DE PÁGINA) ---
exports.createPdf = async (folioData) => {
    try {
        console.log('📄 [PDF SERVICE] Generando PDF para folio:', folioData.folioNumber);
        
        const templatePath = path.join(__dirname, '../templates/folioTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { folio: folioData });

        // 1. Creamos el texto del pie de página dinámicamente
        const footerText = `Pedido capturado por: ${folioData.responsibleUser.username} el ${new Date(folioData.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`;

        // 2. Definimos las opciones compatibles con Puppeteer
        const options = {
            format: 'Letter',
            printBackground: true,
            displayHeaderFooter: true, // <-- Necesario para mostrar el pie de página
            margin: {
                top: '25px',
                right: '25px',
                bottom: '40px', // <-- Espacio reservado para el pie de página
                left: '25px'
            },
            // NOTA: Puppeteer requiere estilos explícitos (font-size) dentro del template del footer
            footerTemplate: `
                <div style="width: 100%; font-size: 9pt; font-family: sans-serif; text-align: center; color: #555; padding-top: 5px; border-top: 1px solid #ddd; margin-left: 25px; margin-right: 25px;">
                    ${footerText}
                </div>
            `,
            headerTemplate: '<div></div>' // Header vacío pero necesario para que funcione displayHeaderFooter
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log('✅ PDF de folio individual generado con pie de página.');
        return pdfBuffer;

    } catch (error) {
        console.error('❌ Error durante la creación del PDF individual:', error);
        throw error;
    }
};

/**
 * Función genérica para crear PDFs masivos (etiquetas y comandas).
 */
async function generateBulkPdf(templateName, data, date = null) {
    try {
        const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);
        // Pasamos los datos como 'folios' y también como 'commissions' para compatibilidad entre plantillas
        const html = await ejs.renderFile(templatePath, { folios: data, date: date, commissions: data });

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            }
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log(`✅ PDF masivo de ${templateName} generado.`);
        return pdfBuffer;

    } catch (error) {
        console.error(`❌ Error durante la creación del PDF de ${templateName}:`, error);
        throw error;
    }
}

/**
 * Crea un PDF con las etiquetas de producción para un conjunto de folios.
 */
exports.createLabelsPdf = async (folios) => {
    return generateBulkPdf('labelsTemplate', folios);
};

/**
 * Crea un PDF con las comandas de envío para un conjunto de folios.
 */
exports.createOrdersPdf = async (folios) => {
    return generateBulkPdf('ordersTemplate', folios);
};

// ==================== INICIO DE LA MODIFICACIÓN ====================
/**
 * Crea un PDF con el reporte de comisiones para una fecha específica.
 */
exports.createCommissionReportPdf = async (commissions, date) => {
    try {
        // Reutilizamos la lógica de generateBulkPdf o lo hacemos explícito si requiere opciones diferentes
        // Aquí lo haré explícito para mantener tu estructura original
        const templatePath = path.join(__dirname, '../templates/commissionReportTemplate.ejs');
        const html = await ejs.renderFile(templatePath, { commissions, date });

        const options = {
            format: 'Letter',
            printBackground: true,
            margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' }
        };

        const pdfBuffer = await generatePdfWithPuppeteer(html, options);
        console.log(`✅ PDF de reporte de comisiones generado para la fecha ${date}.`);
        return pdfBuffer;

    } catch (error) {
        console.error(`❌ Error durante la creación del PDF de comisiones:`, error);
        throw error;
    }
};
// ===================== FIN DE LA MODIFICACIÓN ======================