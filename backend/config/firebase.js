// Optional: Firebase Admin SDK for server-side verification
// Uncomment and configure if you want to verify Firebase tokens in the backend

// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json');
//
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }
//
// const verifyFirebaseToken = async (idToken) => {
//   const decodedToken = await admin.auth().verifyIdToken(idToken);
//   return decodedToken;
// };
//
// module.exports = { admin, verifyFirebaseToken };

module.exports = {};
