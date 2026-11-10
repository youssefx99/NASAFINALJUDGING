const { createApp } = require('../dist/main');

let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = createApp()
      .then(async (app) => {
        await app.init();
        return app;
      })
      .catch((error) => {
        appPromise = undefined;
        throw error;
      });
  }
  return appPromise;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    const handler = app.getHttpAdapter().getInstance();
    return handler(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};
