const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const File = require('../models/File');
const authenticateToken = require('../middleware/auth');
const { upload } = require('../config/multer');
const fs = require('fs');
const mongoose = require('mongoose');

// GET all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log(`GET /api/events - Fetching events for user ${req.userId}`);
    const folderId = req.query.folderId;
    let query = { userId: req.userId };
    if (folderId) query.folderId = folderId;

    const events = await Event.find(query).sort({ date: 1 });
    console.log(`Found ${events.length} events`);

    events.forEach(event => {
      if (!Array.isArray(event.plannerFiles)) event.plannerFiles = [];
      else event.plannerFiles = event.plannerFiles.filter(f => typeof f === 'string' && f.trim() !== '');
    });

    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST new event
router.post('/', authenticateToken, async (req, res) => {
  try {
    const eventData = req.body;
    console.log(`POST /api/events - Creating event: ${eventData.title} for user ${req.userId}`);

    if (!eventData.date || !eventData.title) {
      return res.status(400).json({ error: 'Date and title are required' });
    }

    const newEvent = new Event({ ...eventData, userId: req.userId });
    await newEvent.save();
    console.log(`Event created with ID: ${newEvent._id}`);
    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update event and handle new files
router.put('/:id', authenticateToken, upload.array('files'), async (req, res) => {
  const id = req.params.id;
  const newFiles = req.files || [];
  let eventData;

  try {
    eventData = req.body.data ? JSON.parse(req.body.data) : req.body;
  } catch (e) {
    newFiles.forEach(file => fs.unlinkSync(file.path));
    return res.status(400).json({ error: 'Invalid data format.' });
  }

  try {
    console.log(`PUT /api/events/${id} - Updating event (new files: ${newFiles.length}) for user ${req.userId}`);

    // Prepare new file URLs for planner
    const newFileUrls = newFiles.map(file => `/uploads/${file.filename}`);

    // Combine retained and new files
    let retainedFiles = Array.isArray(eventData.plannerFiles) 
      ? eventData.plannerFiles.filter(f => typeof f === 'string' && f.trim() !== '')
      : [];
    const finalPlannerFiles = [...retainedFiles, ...newFileUrls];

    // Construct update object
    const updateObject = { ...eventData, plannerFiles: finalPlannerFiles };
    delete updateObject.id;
    delete updateObject._id;

    // Update the event
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: id, userId: req.userId },
      updateObject,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      newFiles.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ error: 'Event not found' });
    }

    // ✅ Save new uploaded files into File collection
    if (newFiles.length > 0) {
      const fileDocs = newFiles.map(file => ({
        name: file.originalname,
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size,
        userId: new mongoose.Types.ObjectId(req.userId) // cast to ObjectId
      }));

      await File.insertMany(fileDocs);
      console.log(`Saved ${fileDocs.length} files to File collection`);
    }

    console.log(`Event updated: ${updatedEvent._id}. Total files: ${finalPlannerFiles.length}`);
    res.json(updatedEvent);

  } catch (err) {
    console.error('Error updating event:', err.message);
    newFiles.forEach(file => fs.unlinkSync(file.path));
    res.status(500).json({ error: err.message });
  }
});

// DELETE an event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/events/${id} - Deleting event for user ${req.userId}`);
    const deletedEvent = await Event.findOneAndDelete({ _id: id, userId: req.userId });
    if (!deletedEvent) return res.status(404).json({ error: 'Event not found' });

    console.log(`Event deleted: ${id}`);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
