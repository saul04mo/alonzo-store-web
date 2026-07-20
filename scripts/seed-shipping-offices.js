/**
 * Seed shipping_offices collection in Firestore
 *
 * Cada documento es UNA oficina de una agencia de envío nacional, con:
 *   agency  – 'Zoom' | 'MRW' | 'Tealca' | ...
 *   state   – estado de Venezuela (ej. 'Zulia')
 *   city    – ciudad (ej. 'Maracaibo')
 *   name    – nombre de la oficina (ej. 'ZOOM 18 DE OCTUBRE')
 *   address – dirección
 *   phone   – teléfono
 *   active  – true/false (para ocultar sin borrar)
 *
 * Los datos vienen de scripts/data/shipping-offices.json (generado desde el
 * localizador oficial de cada agencia). El id del doc es determinístico
 * (agency+state+city+name) para que re-correr el seed ACTUALICE en vez de
 * duplicar.
 *
 * Ejecutar:
 *   node scripts/seed-shipping-offices.js
 *
 * Requiere: .env.local con FIREBASE_SERVICE_ACCOUNT_KEY
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const crypto = require('crypto');

// ── Credenciales ──────────────────────────────────────────
let serviceAccount;
try {
  const envContent = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=(.+)/);
  if (match) serviceAccount = JSON.parse(match[1]);
} catch {}
if (!serviceAccount) {
  try {
    serviceAccount = JSON.parse(
      readFileSync(resolve(__dirname, '..', 'service-account.json'), 'utf-8')
    );
  } catch {}
}
if (!serviceAccount) {
  console.error('❌ No se encontró la service account key.');
  console.error('   Necesitas FIREBASE_SERVICE_ACCOUNT_KEY en .env.local');
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ── Datos ─────────────────────────────────────────────────
const offices = JSON.parse(
  readFileSync(resolve(__dirname, 'data', 'shipping-offices.json'), 'utf-8')
);

// Id determinístico para poder re-seedear sin duplicar.
function officeId(o) {
  const key = `${o.agency}|${o.state}|${o.city}|${o.name}`.toLowerCase();
  return crypto.createHash('sha1').update(key).digest('hex').slice(0, 20);
}

// ── Seed ──────────────────────────────────────────────────
async function seed() {
  console.log('\n🚚 ALONZO Store — Seed shipping_offices');
  console.log('═══════════════════════════════════════\n');

  // Firestore limita cada batch a 500 escrituras.
  const CHUNK = 400;
  const byAgency = {};
  let written = 0;

  for (let i = 0; i < offices.length; i += CHUNK) {
    const slice = offices.slice(i, i + CHUNK);
    const batch = db.batch();
    for (const o of slice) {
      const ref = db.collection('shipping_offices').doc(officeId(o));
      batch.set(ref, {
        agency: o.agency,
        state: o.state,
        city: o.city,
        name: o.name,
        address: o.address || '',
        phone: o.phone || '',
        mapUrl: o.mapUrl || '',
        active: true,
      });
      byAgency[o.agency] = (byAgency[o.agency] || 0) + 1;
    }
    await batch.commit();
    written += slice.length;
    console.log(`  … ${written}/${offices.length}`);
  }

  console.log('');
  for (const [agency, n] of Object.entries(byAgency)) {
    console.log(`  ✅ ${agency}: ${n} oficinas`);
  }
  console.log(`\n  🎉 ${written} oficinas en la colección shipping_offices\n`);
  console.log('  • Edita/desactiva oficinas desde Firebase Console (campo active)');
  console.log('  • Re-correr este seed actualiza, no duplica\n');
}

seed().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
