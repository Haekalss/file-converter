const CloudConvert = require('cloudconvert');

const cloudconvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { inputFormat, outputFormat, fileBase64, fileName } = req.body;

    if (!fileBase64) {
      return res.status(400).json({ error: 'File tidak ditemukan.' });
    }

    let job = await cloudconvert.jobs.create({
      tasks: {
        'import-my-file': {
          operation: 'import/base64',
          file: fileBase64,
          filename: fileName || `document.${inputFormat}`
        },
        'convert-my-file': {
          operation: 'convert',
          input: 'import-my-file',
          input_format: inputFormat,
          output_format: outputFormat
        },
        'export-my-file': {
          operation: 'export/url',
          input: 'convert-my-file'
        }
      }
    });

    job = await cloudconvert.jobs.wait(job.id);

    const exportTask = job.tasks.find(task => task.operation === 'export/url' && task.status === 'finished');
    
    if (!exportTask || !exportTask.result.files.length) {
      throw new Error('Gagal mengekspor file hasil konversi.');
    }

    const fileUrl = exportTask.result.files[0].url;
    const outputFileName = exportTask.result.files[0].filename;

    return res.status(200).json({ 
      success: true, 
      fileUrl: fileUrl,
      fileName: outputFileName 
    });

  } catch (error) {
    console.error('CloudConvert Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Terjadi kesalahan saat memproses konversi file.' 
    });
  }
}