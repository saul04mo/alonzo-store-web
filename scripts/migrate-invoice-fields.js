/**
 * ══════════════════════════════════════════════════════════
 * MIGRACIÓN: Estandarizar campos de items en facturas
 * ══════════════════════════════════════════════════════════
 * 
 * Ejecutar:
 *   node scripts/migrate-invoice-fields.js
 * 
 * ¿Qué hace?
 * - Recorre TODAS las facturas en la colección 'invoices'
 * - Por cada item, agrega los campos estándar del POS si no existen:
 *     productName, priceAtSale, quantity, variantLabel
 * - NO borra ni modifica campos existentes
 * - Muestra un reporte ANTES de ejecutar y pide confirmación
 * 
 * Es SEGURO: solo agrega campos nuevos al lado de los viejos.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');
const { resolve } = require('path');
const readline = require('readline');

// ── Load credentials ──
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
  console.error('❌ No se encontró FIREBASE_SERVICE_ACCOUNT_KEY en .env.local ni service-account.json');
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// ── Helper: ask for confirmation ──
function askConfirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('s') || answer.toLowerCase().startsWith('y'));
    });
  });
}

// ── Standardize a single item ──
function standardizeItem(item) {
  const changes = {};
  let needsUpdate = false;

  // productName
  if (!item.productName) {
    const name = item.titulo || item.name || null;
    if (name) {
      changes.productName = name;
      needsUpdate = true;
    }
  }

  // priceAtSale
  if (item.priceAtSale == null || item.priceAtSale === undefined) {
    const price = parseFloat(item.price) || parseFloat(item.precio) || null;
    if (price !== null) {
      changes.priceAtSale = price;
      needsUpdate = true;
    }
  }

  // quantity
  if (item.quantity == null || item.quantity === undefined) {
    const qty = item.qty || null;
    if (qty !== null) {
      changes.quantity = qty;
      needsUpdate = true;
    }
  }

  // variantLabel
  if (!item.variantLabel) {
    const size = item.size || 'N/A';
    const color = item.color || 'N/A';
    if (item.size || item.color) {
      changes.variantLabel = `${size} / ${color}`;
      needsUpdate = true;
    }
  }

  return { changes, needsUpdate };
}

// ── Main ──
async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('  MIGRACIÓN: Estandarizar campos de items en facturas');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // Phase 1: ANALYSIS (read-only)
  console.log('📊 Fase 1: Analizando facturas (sin modificar nada)...');
  console.log('');

  const snapshot = await db.collection('invoices').get();
  const totalInvoices = snapshot.size;

  let invoicesNeedingUpdate = 0;
  let totalItemsToUpdate = 0;
  let totalItemsAlreadyOk = 0;
  const invoicesToUpdate = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const items = data.items || [];
    let docNeedsUpdate = false;
    const updatedItems = [];

    items.forEach((item, idx) => {
      const { changes, needsUpdate } = standardizeItem(item);
      if (needsUpdate) {
        docNeedsUpdate = true;
        totalItemsToUpdate++;
        updatedItems.push({ idx, changes, original: item });
      } else {
        totalItemsAlreadyOk++;
      }
    });

    if (docNeedsUpdate) {
      invoicesNeedingUpdate++;
      invoicesToUpdate.push({ docId: doc.id, data, updatedItems });
    }
  });

  // Report
  console.log('┌─────────────────────────────────────────┐');
  console.log(`│  Total facturas en Firestore:    ${String(totalInvoices).padStart(6)} │`);
  console.log(`│  Facturas que necesitan cambios: ${String(invoicesNeedingUpdate).padStart(6)} │`);
  console.log(`│  Items a actualizar:             ${String(totalItemsToUpdate).padStart(6)} │`);
  console.log(`│  Items ya estándar (sin cambio): ${String(totalItemsAlreadyOk).padStart(6)} │`);
  console.log('└─────────────────────────────────────────┘');
  console.log('');

  if (invoicesNeedingUpdate === 0) {
    console.log('✅ ¡Todas las facturas ya están estandarizadas! No hay nada que hacer.');
    process.exit(0);
  }

  // Show some examples
  console.log('📋 Ejemplos de cambios que se harán:');
  console.log('');
  const examples = invoicesToUpdate.slice(0, 3);
  examples.forEach((inv) => {
    const numId = inv.data.numericId || '?';
    console.log(`  FACT-${String(numId).padStart(4, '0')} (${inv.updatedItems.length} items a actualizar):`);
    inv.updatedItems.slice(0, 2).forEach((u) => {
      const name = u.original.titulo || u.original.name || u.original.productName || '?';
      console.log(`    → "${name}": se agregan campos ${Object.keys(u.changes).join(', ')}`);
    });
    console.log('');
  });

  // Phase 2: CONFIRMATION
  const confirmed = await askConfirm('¿Deseas ejecutar la migración? (s/n): ');
  if (!confirmed) {
    console.log('❌ Migración cancelada. No se modificó nada.');
    process.exit(0);
  }

  // Phase 3: EXECUTE
  console.log('');
  console.log('🚀 Fase 2: Ejecutando migración...');
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  // Process in batches of 500 (Firestore batch limit)
  const BATCH_SIZE = 400;
  for (let i = 0; i < invoicesToUpdate.length; i += BATCH_SIZE) {
    const chunk = invoicesToUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach((inv) => {
      const items = [...(inv.data.items || [])];
      inv.updatedItems.forEach((u) => {
        items[u.idx] = { ...items[u.idx], ...u.changes };
      });
      batch.update(db.collection('invoices').doc(inv.docId), { items });
    });

    try {
      await batch.commit();
      successCount += chunk.length;
      const progress = Math.round(((i + chunk.length) / invoicesToUpdate.length) * 100);
      console.log(`  ✅ Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} facturas actualizadas (${progress}%)`);
    } catch (err) {
      errorCount += chunk.length;
      console.error(`  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1}:`, err.message);
    }
  }

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  ✅ Migración completada`);
  console.log(`  Facturas actualizadas: ${successCount}`);
  if (errorCount > 0) console.log(`  ⚠️  Errores: ${errorCount}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
