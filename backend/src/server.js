require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Backend chal raha hai: http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('⚠️  OPENROUTER_API_KEY set nahi hai — heuristic parser use hoga (kam accurate).');
  }
});
