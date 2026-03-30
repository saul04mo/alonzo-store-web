/**
 * Seed inicial: orderCounter + verificar admins
 * 
 * Ejecutar:
 *   node scripts/seed-config.js
 * 
 * Esto:
 * 1. Busca el último numericId en invoices y crea config/orderCounter
 * 2. Te muestra tu UID para que crees el doc de admins
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Cargar credenciales
let serviceAccount;
const envPath = resolve(__dirname, '..', '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
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
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log('');
  console.log('🏪 ALONZO Store — Seed config');
  console.log('═══════════════════════════════');
  console.log('');

  // ── 1. Order Counter ──
  console.log('  📋 Buscando último numericId en invoices...');
  const lastInv = await db.collection('invoices').orderBy('numericId', 'desc').limit(1).get();

  let lastId = 0;
  if (!lastInv.empty) {
    lastId = lastInv.docs[0].data().numericId || 0;
    console.log(`  ✅ Último numericId encontrado: #${lastId}`);
  } else {
    console.log('  ℹ️  No hay invoices aún. Counter empezará en 0.');
  }

  const counterRef = db.collection('config').doc('orderCounter');
  const counterSnap = await counterRef.get();

  if (counterSnap.exists) {
    const current = counterSnap.data().current || 0;
    console.log(`  ⚠️  orderCounter ya existe con valor: ${current}`);
    if (current < lastId) {
      await counterRef.set({ current: lastId });
      console.log(`  ✅ Actualizado a ${lastId}`);
    } else {
      console.log(`  ✅ Ya está al día, no se modifica.`);
    }
  } else {
    await counterRef.set({ current: lastId });
    console.log(`  ✅ config/orderCounter creado con valor: ${lastId}`);
  }

  // ── 2. Listar usuarios para admins ──
  console.log('');
  console.log('  👤 Usuarios registrados en Auth:');
  console.log('  ─────────────────────────────────');

  const listResult = await auth.listUsers(20);
  if (listResult.users.length === 0) {
    console.log('  ℹ️  No hay usuarios aún.');
  } else {
    for (const user of listResult.users) {
      const adminDoc = await db.collection('admins').doc(user.uid).get();
      const isAdmin = adminDoc.exists ? '  ← ADMIN ✅' : '';
      console.log(`  ${user.email || user.displayName || 'Sin email'}  →  UID: ${user.uid}${isAdmin}`);
    }
  }

  // ── 3. Verificar si hay admin ──
  const adminsSnap = await db.collection('admins').get();
  console.log('');

  if (adminsSnap.empty) {
    console.log('  ⚠️  No hay admins configurados.');
    console.log('');
    console.log('  Para hacer admin a un usuario, ejecuta:');
    console.log('    node scripts/seed-config.js --make-admin <UID>');
    console.log('');
  } else {
    console.log(`  ✅ ${adminsSnap.size} admin(s) configurado(s).`);
  }

  // ── 4. Crear admin si se pasa --make-admin ──
  const makeAdminIdx = process.argv.indexOf('--make-admin');
  if (makeAdminIdx !== -1 && process.argv[makeAdminIdx + 1]) {
    const uid = process.argv[makeAdminIdx + 1];
    try {
      const userRecord = await auth.getUser(uid);
      await db.collection('admins').doc(uid).set({
        role: 'admin',
        name: userRecord.displayName || userRecord.email || 'Admin',
        email: userRecord.email || '',
        createdAt: new Date().toISOString(),
      });
      console.log('');
      console.log(`  🎉 ${userRecord.email || uid} ahora es ADMIN`);
    } catch (err) {
      console.error(`  ❌ No se encontró usuario con UID: ${uid}`);
    }
  }

  console.log('');
  console.log('  ✅ Seed completado');
  console.log('');
}

seed().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
