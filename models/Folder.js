const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, default: 'bg-indigo-500' },
});

const Folder = mongoose.model('Folder', folderSchema);

module.exports = Folder;
