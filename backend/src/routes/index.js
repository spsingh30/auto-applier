// Mount all routes in one place.
const express = require('express');
const upload = require('../middleware/upload');

const resumeController = require('../controllers/resumeController');
const profileController = require('../controllers/profileController');
const applicationController = require('../controllers/applicationController');
const discoverController = require('../controllers/discoverController');
const applyController = require('../controllers/applyController');
const preferencesController = require('../controllers/preferencesController');

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
router.delete('/applications', discoverController.clearAll); // clear all jobs
router.patch('/applications/:id/status', applicationController.updateStatus);

// Preferences (common application answers — questionnaire)
router.get('/preferences', preferencesController.get);
router.put('/preferences', preferencesController.save);

// Apply / fill (Puppeteer) — fill the form on a discovered job (default review mode, no submit)
router.get('/apply/info', applyController.info);
router.post('/applications/:id/apply', applyController.apply);
router.get('/applications/:id/screenshot', applyController.screenshot);

// Discovery (crawler — open jobs from verified ATS boards)
router.get('/discover/boards', discoverController.boards);
router.get('/discover/keywords', discoverController.keywords);
router.post('/discover', discoverController.run);

// Auto-fill (AI + Puppeteer) — fills the form, does not submit
router.post('/autofill', autofillController.run);

module.exports = router;
