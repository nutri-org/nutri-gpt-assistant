const express = require('express');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Root route for health check
app.get('/', (_req, res) => res.send('Nutri-GPT assistant is running'));

// Routes
app.use('/api', healthRoutes);
app.use('/api', chatRoutes);

// In tests we only need the app; in production we also start a listener.
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}
module.exports = app;