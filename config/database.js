const mongoose = require('mongoose');

// MongoDB connection - uses Atlas in production, local for development
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/domoredb';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// Log which database we're connecting to (mask password for security)
const displayUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@');
console.log(`Connecting to MongoDB: ${displayUri}`);

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});
db.once('open', () => {
  console.log('Connected to MongoDB successfully');
});

module.exports = db;
