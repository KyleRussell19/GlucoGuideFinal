const admin = require("firebase-admin");
const fs = require("fs");

// Path to the service account key JSON file
const serviceAccount = require("./glucoguide-21821-firebase-adminsdk-fbsvc-58b82fa643.json");

// Initialize Firebase Admin SDK with credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load the food data from JSON file
const foodItems = JSON.parse(fs.readFileSync("food_data.json", "utf8"));

async function uploadFoodData() {
  const batch = db.batch();
  const foodCollection = db.collection("food_options");

  foodItems.forEach((food, index) => {
    const docRef = foodCollection.doc(`food_${index + 1}`);
    batch.set(docRef, food);
  });

  await batch.commit();
  console.log("✅ Food options uploaded successfully!");
}

uploadFoodData();
