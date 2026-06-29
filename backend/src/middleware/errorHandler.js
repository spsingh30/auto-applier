// Central error handler — har controller `next(err)` yahin bhejta hai.
const multer = require('multer');

function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
