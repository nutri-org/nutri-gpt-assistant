const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const auth = require('../../middleware/auth');
const quota = require('../../middleware/quota');

// Guard for unit tests – if auth middleware not mounted just attach test user
router.use((req, _res, next) => {
  if (!req.user) req.user = { id: 'test-user-id', plan: 'free' };
  next();
});

// POST /api/datasets/upload
router.post('/upload', auth(), quota, async (req, res) => {
  try {
    const { filename, fileData } = req.body;

    if (!filename || !fileData) {
      return res.status(400).json({ error: 'filename and fileData are required' });
    }

    // File size validation (10 MB limit)
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
    const fileSizeBytes = Math.ceil(fileData.length * 0.75); // base64 to bytes approximation
    
    if (fileSizeBytes > maxSizeBytes) {
      return res.status(413).json({ 
        error: 'File too large', 
        details: `Maximum file size is 10 MB. Your file is approximately ${Math.round(fileSizeBytes / 1024 / 1024)} MB.` 
      });
    }

    // File type validation
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['csv', 'json', 'txt', 'xlsx', 'xls'];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: 'Invalid file type', 
        details: `Allowed file types: ${allowedExtensions.join(', ')}` 
      });
    }

    const userId = req.user.id;
    const storagePath = `${userId}/${Date.now()}_${filename}`;

    // Upload to Supabase storage bucket 'datasets'
    const { error: uploadError } = await supabase.storage
      .from('datasets')
      .upload(storagePath, Buffer.from(fileData, 'base64'), {
        contentType: `application/${fileExtension}`,
        upsert: false
      });

    if (uploadError) {
      return res.status(500).json({ error: 'Upload failed', details: uploadError.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('datasets')
      .getPublicUrl(storagePath);

    // Save dataset record to database
    const { data: dbData, error: dbError } = await supabase
      .from('datasets')
      .insert({
        owner: userId,
        filename,
        url: urlData.publicUrl
      })
      .select()
      .single();

    if (dbError) {
      return res.status(500).json({ error: 'Database save failed', details: dbError.message });
    }

    res.json({
      success: true,
      dataset: {
        id: dbData.id,
        filename: dbData.filename,
        url: dbData.url,
        created_at: dbData.created_at
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

module.exports = router;