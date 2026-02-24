const express = require('express');
const mongoose = require('mongoose'); // for ObjectId
const router = express.Router();
const fs = require('fs');
const File = require('../models/File');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../config/multer');

// POST /api/files - upload files to library
router.post('/', authenticateToken, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      name: file.originalname,
      filename: file.filename,
      path: `/uploads/${file.filename}`,
      size: file.size,
      userId: new mongoose.Types.ObjectId(req.userId) // <-- use 'new'!
    }));

    const savedFiles = await File.insertMany(uploadedFiles);
    console.log(`Saved ${savedFiles.length} files for user ${req.userId}`);
    res.status(201).json(savedFiles);

  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/files - list all files for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const files = await File.find({ userId: new mongoose.Types.ObjectId(req.userId) })
                            .sort({ createdAt: -1 });
    console.log(`Found ${files.length} files for user ${req.userId}`);
    res.json(files);
  } catch (err) {
    console.error('Error fetching files:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:id - delete a file
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const file = await File.findOne({ _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(req.userId) });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Remove file from disk
    if (fs.existsSync(`.${file.path}`)) {
      fs.unlinkSync(`.${file.path}`);
    }

    // Remove from DB
    await File.deleteOne({ _id: file._id });
    console.log(`File deleted: ${file._id}`);
    res.json({ message: 'File deleted successfully' });

  } catch (err) {
    console.error('Error deleting file:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
