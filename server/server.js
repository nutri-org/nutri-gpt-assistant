
const app = require('./app');

const PORT = process.env.PORT || 5000;

// In tests we only need the app; in production we also start a listener.
let server;
if (require.main === module) {
  server = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

module.exports = { app, server };
