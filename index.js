const express = require('express');
const multer = require('multer');
const { pdfToPng } = require('pdf-to-png-converter');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/convert-pdf', upload.array('pdfs', 10), async (req, res) => {
    // Comprueba si hay archivos enviados
    if (req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let conversionResults = [];
    for (const file of req.files) {
        const pdfPath = file.path;
        let opts = {
            disableFontFace: false,
            useSystemFonts: false,
            enableXfa: false,
            viewportScale: 2.0,
            outputFolder: path.resolve(process.cwd(), 'temp_images'),
            outputFileMask: 'page_{pageNumber}',
            pagesToProcess: [1],
            strictPagesToProcess: false,
            verbosityLevel: 0,
        };

        try {
            const output = await pdfToPng(pdfPath, opts);
            conversionResults.push({ originalName: file.originalname, images: output.map(page => page.path) });
            await fs.remove(pdfPath); // Eliminar el archivo PDF subido después de la conversión
        } catch (err) {
            console.error(`Error converting PDF to images for ${file.originalname}:`, err);
            // Agregar resultados parciales con errores
            conversionResults.push({ originalName: file.originalname, error: 'Failed to convert PDF to images' });
            // Continuar con el siguiente archivo en lugar de terminar todo el proceso
        }
    }

    res.json({ results: conversionResults });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

