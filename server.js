const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app =express();
const PORT = process.env.PORT || 3000;

// Konfigurasi path command LibreOffice secara dinamis (Windows vs Linux/Docker)
const sofficeCommand = process.platform === 'win32'
  ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
  : 'soffice';

// Setup folder uploads untuk penyimpanan file sementara
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mapping format yang didukung oleh LibreOffice berdasarkan ekstensi input
function getSupportedFormats(ext) {
  const e = ext.toLowerCase();
  switch (e) {
    case '.docx':
    case '.doc':
    case '.odt':
    case '.txt':
    case '.rtf':
    case '.html':
    case '.htm':
      return ['pdf', 'docx', 'odt', 'txt', 'html'];
    case '.xlsx':
    case '.xls':
    case '.ods':
    case '.csv':
      return ['pdf', 'xlsx', 'ods', 'csv', 'html'];
    case '.pptx':
    case '.ppt':
    case '.odp':
      return ['pdf', 'pptx', 'odp', 'html'];
    case '.pdf':
      // LibreOffice tidak bisa native PDF ke DOCX, tapi bisa extract ke txt/html
      return ['txt', 'html'];
    default:
      return ['pdf'];
  }
}

// Endpoint untuk mendapatkan daftar format target di frontend
app.get('/formats', (req, res) => {
  const ext = req.query.ext;
  if (!ext) {
    return res.status(400).json({ success: false, error: 'Ekstensi file tidak disertakan.' });
  }
  const formats = getSupportedFormats(ext);
  res.json({ success: true, formats });
});

// Endpoint Utama Proses Konversi
app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Tidak ada file yang diunggah.' });
  }

  const targetFormat = req.body.format;
  if (!targetFormat) {
    return res.status(400).json({ success: false, error: 'Format target belum dipilih.' });
  }

  const inputPath = req.file.path;
  const originalName = req.file.originalname;
  const extName = path.extname(originalName);
  const baseName = path.basename(originalName, extName);
  const outputDir = uploadDir;

  // Handler khusus PDF ke TXT menggunakan pdftotext (jika tersedia) atau metode fallback
  if (extName.toLowerCase() === '.pdf' && targetFormat === 'txt') {
    const outputFileName = `${baseName}.${targetFormat}`;
    const outputPath = path.join(outputDir, `${Date.now()}-${outputFileName}`);
    
    // Cek ketersediaan pdftotext di Linux (poppler-utils)
    const pdftotextCmd = process.platform === 'win32' 
      ? `pdftotext "${inputPath}" "${outputPath}"` 
      : `pdftotext "${inputPath}" "${outputPath}"`;

    exec(pdftotextCmd, (pdfErr) => {
      // Cleanup file input awal
      fs.unlink(inputPath, () => {});

      if (pdfErr) {
        // Fallback jika pdftotext gagal, coba gunakan LibreOffice
        runLibreOfficeConversion(inputPath, targetFormat, outputDir, baseName, originalName, req, res);
      } else {
        sendConvertedFile(outputPath, outputFileName, res);
      }
    });
    return;
  }

  runLibreOfficeConversion(inputPath, targetFormat, outputDir, baseName, originalName, req, res);
});

function runLibreOfficeConversion(inputPath, targetFormat, outputDir, baseName, originalName, req, res) {
  // Perintah CLI LibreOffice untuk headless conversion
  const cmd = `${sofficeCommand} --headless --convert-to ${targetFormat} "${inputPath}" --outdir "${outputDir}"`;

  exec(cmd, (error, stdout, stderr) => {
    // Hapus file upload asli dari server
    fs.unlink(inputPath, () => {});

    if (error) {
      console.error('LibreOffice Error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Gagal mengonversi dokumen melalui engine server.' 
      });
    }

    const outputFileName = `${baseName}.${targetFormat}`;
    // LibreOffice secara otomatis menamai file output sesuai nama asli dokumen
    const generatedFilePath = path.join(outputDir, `${baseName}.${targetFormat}`);

    if (!fs.existsSync(generatedFilePath)) {
      return res.status(500).json({ 
        success: false, 
        error: 'File hasil konversi tidak ditemukan di sistem.' 
      });
    }

    sendConvertedFile(generatedFilePath, outputFileName, res);
  });
}

function sendConvertedFile(filePath, outputFileName, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Gagal membaca file hasil konversi.' });
    }

    // Ubah ke base64 agar aman dikirim melalui JSON Response ke frontend
    const fileBase64 = data.toString('base64');

    res.json({
      success: true,
      fileName: outputFileName,
      fileData: fileBase64,
      tempFile: filePath
    });
  });
}

// Endpoint Cleanup untuk menghapus file sisa konversi setelah diunduh client
app.post('/cleanup', (req, res) => {
  const { tempFile } = req.body;
  if (tempFile && fs.existsSync(tempFile)) {
    fs.unlink(tempFile, (err) => {
      if (err) console.error('Gagal menghapus file temp:', err);
    });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});