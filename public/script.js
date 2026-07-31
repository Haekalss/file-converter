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
    showStatus('Failed: File size exceeds the maximum limit of 100MB.', 'error');
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
    showStatus('Please select a document file first.', 'error');
    return;
  }

  const outputFormat = outputFormatSelect.value;
  if (!outputFormat) {
    showStatus('Please select a target output format.', 'error');
    return;
  }

  const inputFormat = selectedFile.name.split('.').pop().toLowerCase();

  convertBtn.disabled = true;
  downloadBtn.style.display = 'none';
  showStatus('<span class="spinner"></span>Preparing conversion process...', 'loading');

  try {
    // 1. Minta URL upload ke backend Vercel (Aman dari limit 4.5MB karena payload kecil)
    const initResponse = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputFormat,
        outputFormat,
        fileName: selectedFile.name
      })
    });

    const responseText = await initResponse.text();
    let initData;
    
    try {
      initData = JSON.parse(responseText);
    } catch (e) {
      throw new Error('Server did not respond with a valid JSON format.');
    }

    if (!initResponse.ok || !initData.success) {
      throw new Error(initData.error || 'Failed to initialize conversion.');
    }

    const { uploadUrl, uploadParameters, jobId } = initData.data;

    // 2. Unggah file secara langsung dari browser ke CloudConvert
    showStatus('<span class="spinner"></span>Uploading file to CloudConvert...', 'loading');
    
    const formData = new FormData();
    Object.keys(uploadParameters).forEach(key => {
      formData.append(key, uploadParameters[key]);
    });
    formData.append('file', selectedFile);

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload file to CloudConvert storage server.');
    }

    // 3. Polling status konversi melalui backend Vercel (/api/status) agar aman dari 401
    showStatus('<span class="spinner"></span>Converting file...', 'loading');
    
    let fileResultUrl = null;
    let outputFileNameResult = null;
    let attempts = 0;
    
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Cek tiap 3 detik
      
      const statusRes = await fetch(`/api/status?jobId=${jobId}`);
      const statusData = await statusRes.json();

      if (!statusRes.ok || !statusData.success) {
        throw new Error(statusData.error || 'Failed to check conversion status.');
      }

      if (statusData.status === 'finished') {
        fileResultUrl = statusData.fileUrl;
        outputFileNameResult = statusData.fileName;
        break;
      }

      if (statusData.status === 'error') {
        throw new Error('Conversion process failed on CloudConvert.');
      }

      attempts++;
    }

    if (!fileResultUrl) {
      throw new Error('Conversion timeout. Please try again.');
    }

    downloadUrl = fileResultUrl;
    outputFileName = outputFileNameResult;

    convertBtn.style.display = 'none';
    downloadBtn.style.display = 'flex';
    showStatus('✓ Conversion successful! Your file is ready for download.', 'success');

  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    convertBtn.disabled = false;
  }
}

function downloadFile() {
  if (!downloadUrl) return;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = outputFileName || 'converted-file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    resetForm();
  }, 3000);
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