const CloudConvert = require('cloudconvert');
const cloudconvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let { inputFormat, outputFormat, fileName } = req.body;

    if (!inputFormat || !outputFormat) {
      return res.status(400).json({ success: false, error: 'Format input dan output wajib diisi.' });
    }

    // Bersihkan titik di awal format jika ada (misal: '.pdf' jadi 'pdf')
    inputFormat = inputFormat.replace('.', '').toLowerCase();
    outputFormat = outputFormat.replace('.', '').toLowerCase();

    // Buat job dengan struktur yang divalidasi aman oleh CloudConvert API v2
    const job = await cloudconvert.jobs.create({
      tasks: {
        "upload-file": {
          operation: "import/upload"
        },
        "convert-file": {
          operation: "convert",
          input: "upload-file",
          input_format: inputFormat,
          output_format: outputFormat
        },
        "export-file": {
          operation: "export/url",
          input: "convert-file"
        }
      }
    });

    const uploadTask = job.tasks.find(task => task.name === 'upload-file');

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        uploadUrl: uploadTask.result.form.url,
        uploadParameters: uploadTask.result.form.parameters
      }
    });

  } catch (error) {
    // Tangkap detail error spesifik dari response CloudConvert jika ada
    const errorDetails = error.response && error.response.data ? error.response.data : error.message;
    console.error('CloudConvert API Error Detail:', errorDetails);
    
    return res.status(500).json({ 
      success: false, 
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails
    });
  }
};