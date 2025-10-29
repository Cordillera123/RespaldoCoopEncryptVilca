/**
 * TEST: Verificar configuración de eliminación de beneficiarios (Proceso 2370)
 * 
 * Este script verifica que el proceso 2370 esté correctamente configurado
 * para encriptar solo los campos sensibles y NO los códigos de catálogo.
 */

import { FIELD_MAPPING_BY_PROCESS } from './src/utils/crypto/fieldMapper.js';
import { encryptRequest } from './src/utils/crypto/index.js';

console.log('🧪 TEST: Eliminación de Beneficiario (Proceso 2370)\n');

// ============================================================================
// 1. VERIFICAR CONFIGURACIÓN EN FIELDMAPPER
// ============================================================================

console.log('1️⃣ Verificando configuración en fieldMapper.js...\n');

const process2370 = FIELD_MAPPING_BY_PROCESS['2370'];

if (!process2370) {
  console.error('❌ ERROR: Proceso 2370 NO está configurado en fieldMapper.js');
  process.exit(1);
}

console.log('✅ Proceso 2370 encontrado:', process2370.description);
console.log('\n📋 Campos a encriptar:');
process2370.encryptFields.forEach(field => {
  console.log(`   - ${field}`);
});

// Verificar campos esperados
const expectedEncryptFields = ['idecl', 'ideclr', 'codctac'];
const unexpectedEncryptFields = ['codifi', 'codtidr', 'codtcur'];

console.log('\n🔍 Verificando campos SENSIBLES (deben encriptarse):');
expectedEncryptFields.forEach(field => {
  if (process2370.encryptFields.includes(field)) {
    console.log(`   ✅ ${field} - Configurado para encriptarse`);
  } else {
    console.log(`   ❌ ${field} - NO está configurado (PROBLEMA)`);
  }
});

console.log('\n🔍 Verificando CÓDIGOS DE CATÁLOGO (NO deben encriptarse):');
unexpectedEncryptFields.forEach(field => {
  if (process2370.encryptFields.includes(field)) {
    console.log(`   ❌ ${field} - Está configurado para encriptarse (PROBLEMA)`);
  } else {
    console.log(`   ✅ ${field} - NO se encripta (CORRECTO)`);
  }
});

// ============================================================================
// 2. SIMULAR PETICIÓN DE ELIMINACIÓN
// ============================================================================

console.log('\n\n2️⃣ Simulando petición de eliminación...\n');

const testData = {
  tkn: '0999SolSTIC20220719',
  prccode: '2370',
  idecl: '1711495000',        // Cédula cliente (DEBE encriptarse)
  codifi: '2',                // Código banco (NO debe encriptarse)
  codtidr: '1',               // Tipo doc (NO debe encriptarse)
  ideclr: '1711655640',       // Cédula beneficiario (DEBE encriptarse)
  codtcur: '2',               // Tipo cuenta (NO debe encriptarse)
  codctac: '100280312'        // Número cuenta (DEBE encriptarse)
};

console.log('📤 Datos ANTES de encriptar:');
console.log(JSON.stringify(testData, null, 2));

try {
  const encryptedData = encryptRequest(testData);
  
  console.log('\n🔐 Datos DESPUÉS de encriptar:');
  console.log(JSON.stringify(encryptedData, null, 2));
  
  // Verificar que los campos correctos fueron encriptados
  console.log('\n🔍 Verificación de encriptación:');
  
  // Campos que DEBEN estar encriptados (Base64)
  const shouldBeEncrypted = ['idecl', 'ideclr', 'codctac'];
  shouldBeEncrypted.forEach(field => {
    const value = encryptedData[field];
    const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length > 20;
    if (isEncrypted) {
      console.log(`   ✅ ${field}: "${value.substring(0, 20)}..." (ENCRIPTADO)`);
    } else {
      console.log(`   ❌ ${field}: "${value}" (NO ENCRIPTADO - PROBLEMA)`);
    }
  });
  
  // Campos que NO deben estar encriptados
  const shouldNotBeEncrypted = ['codifi', 'codtidr', 'codtcur'];
  shouldNotBeEncrypted.forEach(field => {
    const value = encryptedData[field];
    const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(value) && value.length > 20;
    if (!isEncrypted) {
      console.log(`   ✅ ${field}: "${value}" (NO ENCRIPTADO - CORRECTO)`);
    } else {
      console.log(`   ❌ ${field}: "${value}" (ENCRIPTADO - PROBLEMA)`);
    }
  });
  
  console.log('\n✅ TEST COMPLETADO\n');
  
} catch (error) {
  console.error('\n❌ ERROR durante la encriptación:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// ============================================================================
// 3. COMPARACIÓN CON JSON ESPERADO
// ============================================================================

console.log('3️⃣ Comparación con estructura esperada:\n');

console.log('📋 JSON que el backend espera recibir:');
console.log(`{
  "tkn": "0999SolSTIC20220719",
  "prccode": "2370",
  "idecl": "ZYVv/0KCgTWsd5prbEWAJg==",          ← Encriptado
  "codifi": "2",                                  ← NO encriptado
  "codtidr": "1",                                 ← NO encriptado
  "ideclr": "ABC123xyz789/def456==",              ← Encriptado
  "codtcur": "2",                                 ← NO encriptado
  "codctac": "XYZ789abc123/ghi456=="              ← Encriptado
}`);

console.log('\n✅ La configuración es correcta si:');
console.log('   - idecl, ideclr, codctac están en Base64');
console.log('   - codifi, codtidr, codtcur mantienen sus valores originales\n');
