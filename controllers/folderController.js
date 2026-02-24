// controllers/folderController.js

const Folder = require('../models/Folder');
const Event = require('../models/Event'); // 🔑 CRITICAL: Make sure you import the Event model

exports.deleteFolder = async (req, res) => {
    try {
        const folderId = req.params.id;
        
        // 1. CRITICAL STEP: Delete all associated Events first.
        // This is safe because it uses the specific folderId as the filter.
        const eventResult = await Event.deleteMany({ folderId: folderId });
        console.log(`[Manual Cascade] Deleted ${eventResult.deletedCount} associated events.`);
        
        // 2. Delete the Folder itself.
        const folderResult = await Folder.findByIdAndDelete(folderId); 

        if (!folderResult) {
            // If the folder wasn't found, we already deleted the events (if any)
            return res.status(404).json({ message: 'Planner not found.' });
        }

        // 3. Success! Return 204 No Content.
        return res.status(204).send(); 

    } catch (err) {
        // If anything fails (database connection, query error), log it and return 500.
        console.error(`FATAL SERVER ERROR during delete of folder ${req.params.id}:`, err);
        return res.status(500).json({ message: 'Server failed to delete the planner and its contents.' });
    }
};