/**
 * Vercel server entry. Every request that is not a static file in dist/client is
 * rewritten here (see vercel.json) and delegated to the Expo Router server bundle.
 *
 * This is what makes app.json's `web.output: "server"` work on Vercel: certificate
 * permalinks get real server-rendered HTML with correct OG tags, and API routes run
 * as Vercel Functions.
 */
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: require('path').join(__dirname, '../dist/server'),
});
