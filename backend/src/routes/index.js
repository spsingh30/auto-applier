// Saare routes ek jagah mount.
const express = require('express');
const upload = require('../middleware/upload');

const resumeController = require('../controllers/resumeController');
const profileController = require('../controllers/profileController');
const applicationController = require('../controllers/applicationController');
const discoverController = require('../controllers/discoverController');

const router = express.Router();

// Resume
router.post('/resume/upload', upload.single('resume'), resumeController.uploadResume);

// Profile
router.get('/profile', profileController.getLatest);
router.get('/profile/:id', profileController.getById);

// Applications
router.get('/applications', applicationController.list);
router.post('/applications', applicationController.create);
router.patch('/applications/:id/status', applicationController.updateStatus);

// Discovery (crawler — verified ATS boards se open jobs)
router.get('/discover/boards', discoverController.boards);
router.get('/discover/keywords', discoverController.keywords);
router.post('/discover', discoverController.run);

module.exports = router;
