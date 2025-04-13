/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// Reset harian setiap jam 00:00
exports.resetDailyViews = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Jakarta")
  .onRun(async (context) => {
    const comicsSnapshot = await db.collection("comics").get();

    const batch = db.batch();

    comicsSnapshot.forEach((doc) => {
      const ref = db.collection("comics").doc(doc.id);
      batch.update(ref, { dailyViews: 0 });
    });

    await batch.commit();
    console.log("✅ dailyViews reset!");
    return null;
  });

// Reset mingguan setiap hari Minggu jam 00:00
exports.resetWeeklyViews = functions.pubsub
  .schedule("0 0 * * 0")
  .timeZone("Asia/Jakarta")
  .onRun(async (context) => {
    const comicsSnapshot = await db.collection("comics").get();

    const batch = db.batch();

    comicsSnapshot.forEach((doc) => {
      const ref = db.collection("comics").doc(doc.id);
      batch.update(ref, { weeklyViews: 0 });
    });

    await batch.commit();
    console.log("✅ weeklyViews reset!");
    return null;
  });
