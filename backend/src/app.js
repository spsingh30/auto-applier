// Express app setup (server start alag file me — testable rehta hai).
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
