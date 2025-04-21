// functions/index.js

// 1) Load dependencies & env
require("dotenv").config();
const functions = require("firebase-functions");
const admin     = require("firebase-admin");
const sgMail    = require("@sendgrid/mail");
const express   = require("express");
const cors      = require("cors");
const { onRequest } = require("firebase-functions/v2/https");
const logger    = require("firebase-functions/logger");

// 2) Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// 3) Configure SendGrid
const SENDGRID_KEY    = functions.config().sendgrid.key;
const SENDGRID_SENDER = functions.config().sendgrid.sender;
if (!SENDGRID_KEY || !SENDGRID_SENDER) {
  logger.error("⚠️ Missing SENDGRID_API_KEY or SENDER_EMAIL in environment");
}
sgMail.setApiKey(SENDGRID_KEY);

const fhirApp = express();
fhirApp.use(cors({ origin: true }));
fhirApp.use(express.json());

// GET /fhir/Patient
fhirApp.get("/fhir/Patient", async (req, res) => {
  try {
    const count = parseInt(req.query._count, 10) || 50;
    const snap  = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(count)
      .get();

    const entries = snap.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        resource: {
          resourceType: "Patient",
          id: docSnap.id,
          name: [{ text: data.email || "(no email)" }],
          telecom: data.email ? [{ system: "email", value: data.email }] : [],
          gender: (data.gender || "").toLowerCase(),
          ...(data.birthDate && { birthDate: data.birthDate }),
          extension: [
            { url: "http://example.org/fhir/age",          valueString: data.age },
            { url: "http://example.org/fhir/height",       valueString: data.height },
            { url: "http://example.org/fhir/weight",       valueString: data.weight },
            { url: "http://example.org/fhir/diabetesType", valueString: data.diabetesType },
            { url: "http://example.org/fhir/targetMin",    valueInteger: data.targetMin },
            { url: "http://example.org/fhir/targetMax",    valueInteger: data.targetMax },
            { url: "http://example.org/fhir/createdAt",    valueDateTime: data.createdAt.toDate().toISOString() }
          ]
        }
      };
    });

    res.json({ resourceType: "Bundle", type: "searchset", entry: entries });
  } catch (err) {
    logger.error("FHIR search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /fhir/Condition
fhirApp.get("/fhir/Condition", (_req, res) => {
  res.json({ resourceType: "Bundle", type: "searchset", entry: [] });
});

// Export FHIR proxy as public HTTPS function
exports.fhirProxy = onRequest(
  { invoker: ["public"] },
  fhirApp
);

// Trigger for glucose alerts (only when above targetMax)
exports.sendGlucoseAlertOnLog = functions
  .runWith({ memory: "256MB", timeoutSeconds: 30 })
  .firestore
  .document("users/{userId}/food_logs/{logId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const glucoseValue = data.glucose_value;
    const chosenDate   = data.chosen_date; // Firestore Timestamp

    const userId = context.params.userId;
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found; skipping alert.`);
      return null;
    }

    const user = userDoc.data();
    const email     = user.email;
    const targetMax = parseInt(user.targetMax, 10);

    // Only send if glucose_value > targetMax
    if (glucoseValue <= targetMax) {
      return null;
    }
    if (!email) {
      logger.warn(`User ${userId} has no email; cannot send glucose alert.`);
      return null;
    }

    // Compose and send the email
    const msg = {
      to: email,
      from: SENDGRID_SENDER,
      subject: "GlucoGuide Alert: High Glucose 🚨",
      text: `Your glucose reading of ${glucoseValue} mg/dL on ${chosenDate.toDate().toLocaleString()} exceeds your maximum target of ${targetMax} mg/dL.`,
      html: `
        <p>🚨 <strong>High Glucose Alert</strong></p>
        <p>Your reading of <strong>${glucoseValue} mg/dL</strong> on <strong>${chosenDate.toDate().toLocaleString()}</strong> exceeds your maximum target of <strong>${targetMax} mg/dL</strong>.</p>
        <p>Please take appropriate action.</p>
        <hr/>
        <p style="font-size:12px;color:gray;">Automated message from GlucoGuide. Do not reply.</p>
      `
    };

    try {
      await sgMail.send(msg);
      logger.log(`✅ High-glucose alert sent to ${email} for user ${userId}`);
    } catch (err) {
      logger.error("Error sending glucose alert:", err.response?.body || err.message);
    }

    return null;
  });
