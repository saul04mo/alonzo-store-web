/**
 * Seed announcements collection in Firestore
 * 
 * Run: node scripts/seed-announcements.js
 * 
 * Requires: FIREBASE_SERVICE_ACCOUNT_KEY env var or serviceAccountKey.json
 */
const admin = require('firebase-admin');

// Initialize if not already
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch {
    admin.initializeApp();
  }
}

const db = admin.firestore();

const announcements = [
  {
    text: 'ENVÍO GRATIS EN PEDIDOS MAYORES A €50',
    link: '',
    active: true,
    order: 1,
  },
  {
    text: '20% OFF EN TU PRIMERA COMPRA — USA EL CÓDIGO: ALONZO20',
    link: '',
    active: true,
    order: 2,
  },
];

async function seed() {
  console.log('Seeding announcements...');
  
  for (const ann of announcements) {
    const ref = await db.collection('announcements').add(ann);
    console.log(`  ✓ Created: "${ann.text}" (${ref.id})`);
  }

  console.log('\nDone! You can edit these from the Firebase Console:');
  console.log('  Firestore → announcements');
  console.log('\nFields:');
  console.log('  text   (string)  — Mensaje que se muestra');
  console.log('  link   (string)  — URL opcional al hacer click');
  console.log('  active (boolean) — true/false para activar/desactivar');
  console.log('  order  (number)  — Orden de aparición (1, 2, ...)');
}

seed().catch(console.error);
