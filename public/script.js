const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const status = document.getElementById('status');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const formatSelector = document.getElementById('formatSelector');
const outputFormatSelect = document.getElementById('outputFormat');

let selectedFile = null;
let downloadUrl = null;
let outputFileName = null;

// Daftar opsi konversi umum berdasarkan ekstensi input
const conversionMap = {
  '.docx': ['pdf', '.doc', '.txt', '.odt'],
  '.doc': ['pdf', '.docx', '.txt'],
  '.pdf': ['docx', '.txt', '.png', '.jpg'],
  '.xlsx': ['csv', '.pdf', '.xls'],
  '.csv': ['xlsx', '.pdf', '.txt'],
  '.pptx': ['pdf', '.ppt'],
  '.txt': ['pdf', '.docx']
};

uploadArea.addEventListener('click', triggerFileInput);

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function triggerFileInput() {
  fileInput.click();
}

function handleFiles(files) {
  if (files.length === 0) return;

  selectedFile = files[0];
  
  if (selectedFile.size > 100 * 1024 * 1024) {
    showStatus('Gagal: Ukuran file melebihi batas maksimal 100MB.', 'error');
    selectedFile = null;
    return;
  }

  const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
  
  fileName.textContent = selectedFile.name;
  fileSize.textContent = `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`;
  fileInfo.classList.add('show');
  convertBtn.disabled = false;
  downloadBtn.style.display = 'none';
  status.classList.remove('show');

  loadFormats(ext);
}

function loadFormats(fileExt) {
  outputFormatSelect.innerHTML = '';
  
  const availableFormats = conversionMap[fileExt] || ['pdf', 'docx', 'txt'];

  availableFormats.forEach(format => {
    const cleanFormat = format.replace('.', '');
    const option = document.createElement('option');
    option.value = cleanFormat;
    option.textContent = `[ ${cleanFormat.toUpperCase()} ]`;
    outputFormatSelect.appendChild(option);
  });

  formatSelector.classList.add('show');
}

async function convertFile() {
  if (!selectedFile) {
    showStatus('Pilih file dokumen terlebih dahulu.', 'error');
    return;
  }

  const outputFormat = outputFormatSelect.value;
  if (!outputFormat) {
    showStatus('Pilih format target output.', 'error');
    return;
  }

  const inputFormat = selectedFile.name.split('.').pop().toLowerCase();

  convertBtn.disabled = true;
  downloadBtn.style.display = 'none';
  showStatus('<span class="spinner"></span>Mengunggah dan mengonversi via CloudConvert...', 'loading');

  const reader = new FileReader();
  reader.readAsDataURL(selectedFile);
  
  reader.onload = async () => {
    try {
      const base64Data = reader.result.split(',')[1];

      // Diperbaiki menggunakan path absolut /api/convert agar aman di Vercel
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputFormat,
          outputFormat,
          fileBase64: base64Data,
          fileName: selectedFile.name
        })
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Server tidak merespons dalam format JSON yang valid.');
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Proses konversi CloudConvert gagal');
      }

      downloadUrl = data.fileUrl;
      outputFileName = data.fileName;

      convertBtn.style.display = 'none';
      downloadBtn.style.display = 'flex';
      showStatus('✓ Konversi berhasil! File Anda siap diunduh.', 'success');

    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
      convertBtn.disabled = false;
    }
  };

  reader.onerror = () => {
    showStatus('Gagal membaca file.', 'error');
    convertBtn.disabled = false;
  };
}

function downloadFile() {
  if (!downloadUrl) return;

  window.open(downloadUrl, '_blank');

  setTimeout(() => {
    resetForm();
  }, 1000);
}

function resetForm() {
  selectedFile = null;
  downloadUrl = null;
  outputFileName = null;
  fileInput.value = '';
  fileInfo.classList.remove('show');
  formatSelector.classList.remove('show');
  downloadBtn.style.display = 'none';
  convertBtn.style.display = 'flex';
  status.classList.remove('show');
  convertBtn.disabled = true;
}

function showStatus(message, type) {
  status.innerHTML = message;
  status.className = `status show ${type}`;
}