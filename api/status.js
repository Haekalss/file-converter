const CloudConvert = require('cloudconvert');
const cloudconvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { jobId } = req.query;
  if (!jobId) {
    return res.status(400).json({ success: false, error: 'Job ID diperlukan.' });
  }

  try {
    const job = await cloudconvert.jobs.get(jobId);

    let fileUrl = null;
    let fileName = null;

    if (job.status === 'finished') {
      // Cari task export untuk mengambil link hasil download
      const exportTask = job.tasks.find(task => task.operation === 'export/url' && task.status === 'finished');
      if (exportTask && exportTask.result.files.length > 0) {
        fileUrl = exportTask.result.files[0].url;
        fileName = exportTask.result.files[0].filename;
      }
    }

    return res.status(200).json({
      success: true,
      status: job.status, // 'waiting', 'processing', 'finished', 'error'
      fileUrl,
      fileName
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};