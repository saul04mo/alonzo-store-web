/**
 * Seed payment_methods collection in Firestore
 * 
 * Ejecutar:
 *   node scripts/seed-payment-methods.js
 * 
 * Requiere: .env.local con FIREBASE_SERVICE_ACCOUNT_KEY
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// ─────────────────────────────────────────────
// Cargar credenciales
// ─────────────────────────────────────────────
let serviceAccount;

// Opción 1: leer del .env.local
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
  if (match) {
    serviceAccount = JSON.parse(match[1]);
  }
} catch {}

// Opción 2: leer el JSON directo si existe en la carpeta
if (!serviceAccount) {
  try {
    serviceAccount = JSON.parse(
      readFileSync(resolve(__dirname, '..', 'service-account.json'), 'utf-8')
    );
  } catch {}
}

if (!serviceAccount) {
  console.error('❌ No se encontró la service account key.');
  console.error('   Asegúrate de tener FIREBASE_SERVICE_ACCOUNT_KEY en .env.local');
  console.error('   o un archivo service-account.json en la raíz del proyecto.');
  process.exit(1);
}

// ─────────────────────────────────────────────
// Inicializar Firebase Admin
// ─────────────────────────────────────────────
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ─────────────────────────────────────────────
// Datos de métodos de pago
// ─────────────────────────────────────────────
const paymentMethods = [
  {
    id: 'pago_movil',
    name: 'Pago Móvil',
    currency: 'ves',
    icon: 'Smartphone',
    order: 1,
    active: true,
    accountInfo: {
      bank: 'BANESCO',
      name: 'ALONZO C.A',
      ci: 'J506071266',
      phone: '04242487297',
    },
  },
  {
    id: 'zelle',
    name: 'Zelle',
    currency: 'usd',
    icon: 'Building2',
    order: 2,
    active: true,
    accountInfo: {
      name: 'YACKSON MONTERO',
      email: 'yamdlr@gmail.com',
    },
  },
  {
    id: 'efectivo_usd',
    name: 'Efectivo ($)',
    currency: 'usd',
    icon: 'Banknote',
    order: 3,
    active: true,
    accountInfo: {},
  },
  {
    id: 'binance',
    name: 'Binance',
    currency: 'usd',
    icon: 'Bitcoin',
    order: 4,
    active: true,
    accountInfo: {
      email: 'alonzoadm@outlook.com',
      user: 'maichanx',
    },
  },
  {
    id: 'zinli',
    name: 'Zinli',
    currency: 'usd',
    icon: 'Wallet',
    order: 5,
    active: true,
    accountInfo: {
      email: 'maykalonzzo@gmail.com',
      user: 'Maikel Alonzo',
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    currency: 'usd',
    icon: 'CreditCard',
    order: 6,
    active: true,
    accountInfo: {
      email: 'maikel-alonzo@hotmail.com',
      user: 'Maikel Alonzo',
    },
  },
];

// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────
async function seed() {
  console.log('');
  console.log('🏪 ALONZO Store — Seed payment_methods');
  console.log('═══════════════════════════════════════');
  console.log('');

  const batch = db.batch();

  for (const method of paymentMethods) {
    const ref = db.collection('payment_methods').doc(method.id);
    batch.set(ref, method);
    console.log(`  ✅ ${method.id} → ${method.name} (${method.currency})`);
  }

  await batch.commit();

  console.log('');
  console.log(`  🎉 ${paymentMethods.length} métodos de pago creados en Firestore`);
  console.log('');
  console.log('  Ahora puedes:');
  console.log('  • Editar datos desde Firebase Console');
  console.log('  • Activar/desactivar métodos con el campo "active"');
  console.log('  • Cambiar el orden con el campo "order"');
  console.log('  • Los cambios se reflejan en la tienda sin redeploy');
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
