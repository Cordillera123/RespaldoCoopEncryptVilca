/**
 * @fileoverview Script de prueba para el sistema de encriptación
 * Ejecutar con: npm run dev y abrir la consola del navegador
 */

import { 
  initCryptoSystem,
  encryptRequest,
  decryptResponse,
  testEncryption,
  getDiagnostics,
  encrypt,
  decrypt
} from './crypto/index.js';

// ============================================================================
// TEST 1: Inicialización del sistema
// ============================================================================
console.log('🧪 ========== TEST 1: INICIALIZACIÓN ==========');
const initResult = initCryptoSystem();
console.log('Resultado de inicialización:', initResult);

// ============================================================================
// TEST 2: Encriptación/Desencriptación básica
// ============================================================================
console.log('\n🧪 ========== TEST 2: ENCRIPTACIÓN BÁSICA ==========');
const testData = '0200594729';
console.log('Datos originales:', testData);

const encrypted = encrypt(testData);
console.log('Datos encriptados:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Datos desencriptados:', decrypted);

console.log('¿Coinciden?', testData === decrypted ? '✅ SÍ' : '❌ NO');

// ============================================================================
// TEST 3: Encriptar request del ejemplo real (API 2351)
// ============================================================================
console.log('\n🧪 ========== TEST 3: ENCRIPTAR REQUEST (API 2351) ==========');
const mockRequest = {
  tkn: "0999SolSTIC20220719",
  prccode: "2351",
  idecl: "0200594729",
  codctad: "420101004676"
};

console.log('Request original:', mockRequest);

const encryptedRequest = encryptRequest(mockRequest);
console.log('Request encriptada:', encryptedRequest);

// Verificar que los campos sensibles fueron encriptados
console.log('¿idecl encriptado?', encryptedRequest.idecl !== mockRequest.idecl ? '✅ SÍ' : '❌ NO');
console.log('¿codctad encriptado?', encryptedRequest.codctad !== mockRequest.codctad ? '✅ SÍ' : '❌ NO');

// ============================================================================
// TEST 4: Desencriptar response del ejemplo real (API 2351)
// ============================================================================
console.log('\n🧪 ========== TEST 4: DESENCRIPTAR RESPONSE (API 2351) ==========');

// Simular respuesta del backend con campo encriptado
// NOTA: Este es un ejemplo simulado. En producción, el backend enviará el valor real encriptado
const mockResponse = {
  estado: "000",
  msg: "CORRECTO",
  cuenta: {
    codcta: "420101004676",
    codemp: "42",
    codofi: "1",
    codcli: "4676",
    codtid: "2",
    idecli: "0291515320001",
    apecli: "COMPANIA DE TAXI RIO NAVES",
    nomcli: "CTRION S A",
    direma: "nomail@gmail.com",
    tlfcel: "0962697686",
    codest: "1",
    desect: "ACTIVA",
    salcnt: "5063.99",
    saldis: "5058.99",
    codifi: "136"
  },
  codctaE: encrypt("420101004676"), // Simulamos el valor encriptado
  codctaD: "420101004676"
};

console.log('Response del backend (simulada):', mockResponse);

const decryptedResponse = decryptResponse(mockResponse, "2351");
console.log('Response desencriptada:', decryptedResponse);

// Verificar que se agregó el campo desencriptado
console.log('¿Se desencriptó codctaE?', decryptedResponse.codcta ? '✅ SÍ' : '❌ NO');
console.log('Valor desencriptado de codcta:', decryptedResponse.codcta);

// ============================================================================
// TEST 5: Roundtrip completo (encrypt → decrypt)
// ============================================================================
console.log('\n🧪 ========== TEST 5: ROUNDTRIP COMPLETO ==========');
const testValues = [
  '0200594729',           // Identificación
  '420101004676',         // Cuenta
  '1234567890',           // Otro valor
  'Mi Contraseña 123',    // Contraseña con espacios
  '5063.99'               // Valor decimal
];

testValues.forEach(value => {
  const enc = encrypt(value);
  const dec = decrypt(enc);
  const match = value === dec;
  console.log(`${match ? '✅' : '❌'} "${value}" → [encrypted] → "${dec}"`);
});

// ============================================================================
// TEST 6: Diagnóstico del sistema
// ============================================================================
console.log('\n🧪 ========== TEST 6: DIAGNÓSTICO DEL SISTEMA ==========');
const diagnostics = getDiagnostics();
console.table(diagnostics);

// ============================================================================
// TEST 7: Compatibilidad con PHP (ejemplo real del backend)
// ============================================================================
console.log('\n🧪 ========== TEST 7: COMPATIBILIDAD PHP ==========');
console.log('⚠️ Para validar compatibilidad con PHP:');
console.log('1. Toma el valor encriptado de este test');
console.log('2. Envíalo al backend PHP');
console.log('3. Verifica que PHP pueda desencriptarlo correctamente');
console.log('4. El backend debe devolver el valor original: "0200594729"');
console.log('');
console.log('Valor a probar con PHP:', encrypt('0200594729'));

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('✅ TESTS COMPLETADOS');
console.log('='.repeat(60));
console.log('Si todos los tests pasaron, el sistema está listo para integración.');
console.log('Siguiente paso: Integrar con apiService.js');
console.log('='.repeat(60));

// Exportar funciones de test para uso en consola
window.cryptoTests = {
  initCryptoSystem,
  encryptRequest,
  decryptResponse,
  testEncryption,
  getDiagnostics,
  encrypt,
  decrypt,
  // Helper para pruebas rápidas en consola
  quickTest: (value) => {
    const enc = encrypt(value);
    const dec = decrypt(enc);
    console.log('Original:', value);
    console.log('Encriptado:', enc);
    console.log('Desencriptado:', dec);
    console.log('Match:', value === dec ? '✅' : '❌');
  }
};

console.log('\n💡 TIP: Puedes usar window.cryptoTests en la consola para pruebas manuales');
console.log('Ejemplo: window.cryptoTests.quickTest("0200594729")');
