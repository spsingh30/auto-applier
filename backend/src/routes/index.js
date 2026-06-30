// All routes mounted in one place.
const express = require('express');
const upload = require('../middleware/upload');

const resumeController = require('../controllers/resumeController');
const profileController = require('../controllers/profileController');
const applicationController = require('../controllers/applicationController');
const discoverController = require('../controllers/discoverController');
const autofillController = require('../controllers/autofillController');

const router = express.Router();

// Resume
router.post('/resume/upload', upload.single('resume'), resumeController.uploadResume);

// Profile
router.get('/profile', profileController.getLatest);
router.get('/profile/:id', profileController.getById);
router.patch('/profile/:id', profileController.update);

// Applications
router.get('/applications', applicationController.list);
router.post('/applications', applicationController.create);
router.patch('/applications/:id/status', applicationController.updateStatus);

// Discovery (crawler — open jobs from verified ATS boards)
router.get('/discover/boards', discoverController.boards);
router.get('/discover/keywords', discoverController.keywords);
router.post('/discover', discoverController.run);

// Auto-fill (AI + Puppeteer) — fills the form, does not submit
router.post('/autofill', autofillController.run);

module.exports = router;
