const CloudConvert = require('cloudconvert');

const cloudconvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

module.exports = async (req, res) => {
  // Atur CORS agar aman diakses frontend
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
    const { inputFormat, outputFormat, fileName } = req.body;

    if (!inputFormat || !outputFormat) {
      return res.status(400).json({ success: false, error: 'Format input dan output wajib diisi.' });
    }

    // Buat job di CloudConvert dengan tasks: import (upload), convert, dan export (url)
    const job = await cloudconvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/upload'
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          input_format: inputFormat,
          output_format: outputFormat,
          engine: 'default'
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    // Ambil task upload untuk diberikan ke frontend
    const uploadTask = job.tasks.find(task => task.name === 'import-my-file');

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        uploadUrl: uploadTask.result.form.url,
        uploadParameters: uploadTask.result.form.parameters
      }
    });

  } catch (error) {
    console.error('CloudConvert API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Terjadi kesalahan pada server.' 
    });
  }
};