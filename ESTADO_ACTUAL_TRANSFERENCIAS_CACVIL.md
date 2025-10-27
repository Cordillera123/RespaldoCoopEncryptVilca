# Estado Actual - Transferencias CACVIL (Cooperativa Vilcabamba)

**Fecha:** 27 de Octubre, 2025  
**Última actualización:** Sprint de corrección de bugs en transferencias locales

---

## 🎯 PROBLEMA ACTUAL EN RESOLUCIÓN

### Error: "CUENTA NO EXISTE" en transferencias cooperativa

**Estado:** 🔴 **BLOQUEANTE** - Transferencias locales CACVIL no funcionan

**Descripción:**
Cuando un usuario de la Cooperativa Vilcabamba (CACVIL) intenta realizar una transferencia a otro miembro de la cooperativa:
1. ✅ El contacto se selecciona correctamente desde `InternaTransferWindow`
2. ✅ Los datos del beneficiario pasan correctamente a `TransferCoopint`
3. ✅ El formulario se autocompleta con nombre, cuenta, banco
4. ✅ La validación de fondos (proceso 2350) pasa exitosamente
5. ✅ Se genera el OTP y se recibe en el correo
6. ❌ **Al ejecutar la transferencia (proceso 2355), el backend responde: `estado: '001', msg: 'CUENTA NO EXISTE'`**

**Log del error:**
```javascript
[COOP-TRANSFER] Error en transferencia cooperativa: {
  estado: '001', 
  msg: 'CUENTA NO EXISTE'
}

Error ejecutando transferencia cooperativa: {
  message: 'CUENTA NO EXISTE',
  code: 'COOP_TRANSFER_EXECUTION_ERROR',
  serverState: '001',
  originalMessage: 'CUENTA NO EXISTE'
}
```

**Datos del contacto CACVIL (ejemplo):**
```json
{
  "id": "1515125211177",
  "name": "hola",
  "cedula": "1720021201",
  "email": "jorge@gmail.com",
  "phone": "0962697686",
  "bank": "COAC VILCABAMBA",
  "bankCode": "99",
  "accountNumber": "1515125211177",
  "accountType": "CUENTA DE AHORRO",
  "accountTypeCode": "1",
  "documentType": "1",
  "isCoopMember": true,
  "isInternal": true,
  "_original": {
    "codifi": "99",
    "nomifi": "COAC VILCABAMBA",
    "codtid": "1",
    "idebnf": "1720021201",
    "codtcu": "1",
    "destcu": "CUENTA DE AHORRO",
    "codcta": "1515125211177",
    "nombnf": "hola",
    "bnfema": "jorge@gmail.com",
    "bnfcel": "0962697686"
  }
}
```

**Hipótesis del problema:**
- El `accountNumber` que estamos enviando como `cuentaDestino` puede no ser el formato correcto para transferencias internas CACVIL
- Posiblemente el backend espera el `cedula` (identificación) del beneficiario en lugar del número de cuenta
- O puede que necesite otro campo del objeto `_original` (por ejemplo, un código diferente de cuenta)

---

## 📋 ARCHIVOS CLAVE INVOLUCRADOS

### 1. `src/components/dashboard/TransferCoopint.jsx`
**Propósito:** Formulario de transferencia cooperativa (CACVIL)

**Estado actual:**
- ✅ Recibe correctamente `preselectedContact` desde `InternaTransferWindow`
- ✅ Agrega el beneficiario a la lista aunque no haya beneficiarios previos (corregido recientemente)
- ✅ Construye `transferData` con estructura completa:
  ```javascript
  const selectedBeneficiary = {
    name: selectedBeneficiaryGroup?.name,
    cedula: selectedBeneficiaryGroup?.cedula,
    identificationNumber: selectedBeneficiaryGroup?.identificationNumber,
    email: selectedBeneficiaryGroup?.email,
    phone: selectedBeneficiaryGroup?.phone,
    avatar: selectedBeneficiaryGroup?.avatar,
    accountNumber: selectedAccount?.accountNumber,
    bank: selectedAccount?.bank,
    bankCode: selectedAccount?.bankCode,
    accountType: selectedAccount?.accountType,
    accountTypeCode: selectedAccount?.accountTypeCode,
    id: selectedAccount?.id
  };

  setTransferData({
    cuentaOrigen: formData.fromAccount,
    cuentaDestino: selectedBeneficiary.accountNumber, // ⚠️ POSIBLE PROBLEMA AQUÍ
    monto: parseFloat(formData.amount),
    descripcion: formData.description.trim(),
    beneficiario: selectedBeneficiary
  });
  ```

**Líneas críticas:** 315-350 (construcción de `transferData` en `handleSubmit`)

**Cambio reciente (27 Oct 2025):**
- Eliminada verificación que bloqueaba el flujo cuando `beneficiaries.length === 0`
- Ahora procesa `preselectedContact` incluso sin beneficiarios previos

---

### 2. `src/components/dashboard/SecurityCodeCoopint.jsx`
**Propósito:** Validación OTP para transferencias cooperativa

**Estado actual:**
- ✅ Recibe `transferData` correctamente con todos los campos del beneficiario
- ✅ Muestra nombre del beneficiario (`transferData.beneficiario.name`)
- ✅ Muestra cuenta destino formateada
- ✅ Sistema de 3 intentos OTP funcionando
- ✅ Envía payload a `apiServiceTransfer.executeCurrentUserCoopTransfer()`

**Payload enviado (líneas 171-178):**
```javascript
const transferPayload = {
  cuentaOrigen: transferData.cuentaOrigen,
  cuentaDestino: transferData.cuentaDestino, // ⚠️ Este es el accountNumber
  monto: transferData.monto,
  descripcion: transferData.descripcion,
  idemsg: idemsg,
  codigoOTP: fullOtpCode
};
```

---

### 3. `src/services/apiserviceTransfer.js`
**Propósito:** Servicio API para transferencias cooperativa

**Métodos clave:**

#### `executeCurrentUserCoopTransfer(transferData)` - Línea 689
Wrapper que obtiene el usuario actual y llama a `executeCoopTransfer()`

#### `executeCoopTransfer(coopTransferData)` - Línea 521
Ejecuta la transferencia cooperativa con **proceso 2355**

**Estructura de datos enviada al backend:**
```javascript
const data = {
  tkn: '0999SolSTIC20220719',
  prccode: '2355',
  idecl: cedula,              // Cédula del usuario que transfiere (encriptado)
  codctac: fromAccount,       // Cuenta origen (encriptado)
  codctad: toAccount,         // ⚠️ Cuenta destino (encriptado) - POSIBLE PROBLEMA
  valtrnf: amount,            // Monto (encriptado)
  dettrnf: description,       // Descripción (encriptado)
  idemsg: messageId,          // ID mensaje OTP (encriptado)
  codseg: otpCode             // Código OTP (encriptado)
};
```

**Campos encriptados (según `fieldMapper.js` proceso 2355):**
```javascript
'2355': {
  description: 'Ejecutar transferencia cooperativa',
  encryptFields: [
    'idecl',      // Cédula usuario
    'usr',        // Usuario (opcional)
    'pwd',        // Contraseña (opcional)
    'codctac',    // Cuenta origen
    'codctad',    // Cuenta destino ⚠️
    'valtrnf',    // Valor transferencia
    'dettrnf',    // Detalle transferencia
    'idemsg',     // ID mensaje
    'codseg',     // Código seguridad
    'codcta',     // Código cuenta (alternativo?)
    'codctao',    // Cuenta origen alternativa?
    'codctab',    // Cuenta beneficiario alternativa?
    'valor',      // Valor alternativo
    'monto',      // Monto alternativo
    'detrsp',     // Detalle respuesta
    'respuesta',  // Respuesta
    'codigo',     // Código alternativo
    'idemsg'      // ID mensaje (duplicado en array)
  ],
  decryptFields: []
}
```

---

## 🔍 SIGUIENTE PASO RECOMENDADO

### Debugging: Verificar qué espera el backend

1. **Agregar logs en `apiserviceTransfer.js`** antes de encriptar para ver valores exactos:
   ```javascript
   console.log('🔍 [DEBUG-COOP-2355] Datos SIN encriptar:', {
     idecl: cedula,
     codctac: fromAccount,
     codctad: toAccount,      // ⚠️ Ver si este es el valor correcto
     valtrnf: amount,
     dettrnf: description,
     idemsg: messageId,
     codseg: otpCode
   });
   ```

2. **Verificar en backend PHP** qué campo está buscando para la cuenta destino:
   - ¿Usa `codctad` (cuenta destino)?
   - ¿Usa `idebnf` (cédula beneficiario)?
   - ¿Usa otro campo como `codctab` (cuenta beneficiario)?

3. **Revisar proceso 2325** (listar beneficiarios cooperativa) para ver estructura de respuesta:
   - Campo `codcta` en respuesta ¿es el mismo que debe ir en `codctad` de proceso 2355?

4. **Comparar con transferencias externas** (proceso 2360) que SÍ funcionan:
   - Ver qué campo usan para cuenta destino
   - `ApiServiceTransferExt.js` líneas de ejecución de transferencia

---

## 📊 ESTADO DE ENCRIPTACIÓN POR PROCESO

### Transferencias Cooperativa (CACVIL)

| Proceso | Descripción | Estado Encriptación | Campos Encriptados | Notas |
|---------|-------------|---------------------|-------------------|-------|
| **2325** | Listar beneficiarios cooperativa | ✅ Completo | `idecl` | Solo lista, no ejecuta |
| **2350** | Validar fondos disponibles | ✅ Completo | `idecl`, `codctac`, `codctad`, `valtrnf`, `dettrnf`, `codigo`, `codseg`, `idemsg`, `detrsp` | ✅ Funciona correctamente |
| **2355** | Ejecutar transferencia cooperativa | ⚠️ Configurado pero falla | 18 campos (ver arriba) | ❌ Backend responde "CUENTA NO EXISTE" |

### Transferencias Externas (Otros bancos)

| Proceso | Descripción | Estado Encriptación | Notas |
|---------|-------------|---------------------|-------|
| **2310** | Listar bancos | ✅ Completo | Solo códigos de catálogo (NO encriptar) |
| **2320** | Listar tipos de cuenta | ✅ Completo | Solo códigos de catálogo (NO encriptar) |
| **2360** | Ejecutar transferencia externa | ✅ Completo | ✅ Funciona correctamente |
| **2365** | Crear/actualizar beneficiario | ✅ Completo | Incluye contacto encriptado |
| **2370** | Listar beneficiarios externos | ✅ Completo | Desencripta email, teléfono |

---

## 🛠️ ARCHIVOS DE CONFIGURACIÓN DE ENCRIPTACIÓN

### `src/utils/crypto/fieldMapper.js` (675 líneas)
Contiene el mapeo completo de campos a encriptar/desencriptar por proceso.

**Procesos de transferencias:**
- Línea ~420: Proceso 2325 (listar beneficiarios coop)
- Línea ~430: Proceso 2350 (validar fondos coop)
- Línea ~445: Proceso 2355 (ejecutar transferencia coop) ⚠️
- Línea ~480: Proceso 2360 (ejecutar transferencia externa)

### `src/utils/crypto/index.js`
Funciones `encryptRequest()` y `decryptResponse()` que automáticamente procesan según `prccode`.

### `src/utils/crypto/constants.js`
Constantes de encriptación: `AES_KEY`, `AES_IV`, validación de configuración.

---

## 🔄 FLUJO COMPLETO DE TRANSFERENCIA CACVIL

```
1. InternaTransferWindow
   ├─ Usuario selecciona contacto CACVIL
   ├─ isCoopVilcabamba() detecta bankCode "99" o nombre "COAC VILCABAMBA"
   ├─ setSelectedContactForTransfer(contact)
   └─ setCurrentView('transferCoop')

2. TransferCoopint (preselectedContact)
   ├─ useEffect procesa preselectedContact
   ├─ Si no existe en groupedBeneficiaries → crea nuevo beneficiario
   ├─ Autocompleta formulario
   ├─ Usuario ingresa monto y descripción
   ├─ handleSubmit():
   │  ├─ Valida fondos (proceso 2350) ✅
   │  ├─ Construye transferData con beneficiario completo ✅
   │  └─ setCurrentStep('otp')
   
3. SecurityCodeCoopint (transferData)
   ├─ Muestra resumen de transferencia ✅
   ├─ Usuario ingresa OTP
   ├─ executeTransfer():
   │  ├─ Construye transferPayload
   │  ├─ apiServiceTransfer.executeCurrentUserCoopTransfer(transferPayload)
   │  └─ ❌ Backend responde "CUENTA NO EXISTE"
   
4. apiserviceTransfer.js
   ├─ executeCurrentUserCoopTransfer() wrapper
   ├─ executeCoopTransfer() - proceso 2355
   │  ├─ Construye data object:
   │  │  ├─ codctac: fromAccount (cuenta origen) ✅
   │  │  ├─ codctad: toAccount (cuenta destino) ⚠️ POSIBLE PROBLEMA
   │  │  ├─ valtrnf: amount ✅
   │  │  └─ codseg: otpCode ✅
   │  ├─ encryptRequest(data, '2355') - encripta 18 campos
   │  └─ makeRequest() → Backend PHP
   
5. Backend PHP (192.168.200.102/wsVirtualCoopSrvP)
   ├─ Recibe proceso 2355 encriptado
   ├─ Desencripta campos
   ├─ Busca cuenta destino con codctad
   └─ ❌ Responde: estado '001', msg 'CUENTA NO EXISTE'
```

---

## 💡 POSIBLES SOLUCIONES

### Opción 1: Usar cédula del beneficiario en lugar de número de cuenta
Si el backend para transferencias internas usa `idebnf` (cédula beneficiario):

**Cambio en `TransferCoopint.jsx` línea ~332:**
```javascript
setTransferData({
  cuentaOrigen: formData.fromAccount,
  cuentaDestino: selectedBeneficiary.cedula, // ✅ Usar cédula en lugar de accountNumber
  monto: parseFloat(formData.amount),
  descripcion: formData.description.trim(),
  beneficiario: selectedBeneficiary
});
```

**Cambio en `apiserviceTransfer.js` executeCoopTransfer():**
```javascript
const data = {
  tkn: '0999SolSTIC20220719',
  prccode: '2355',
  idecl: cedula,
  codctac: fromAccount,
  idebnf: toAccount,          // ✅ Cambiar nombre del campo
  valtrnf: amount,
  dettrnf: description,
  idemsg: messageId,
  codseg: otpCode
};
```

**Y actualizar `fieldMapper.js` proceso 2355:**
```javascript
'2355': {
  description: 'Ejecutar transferencia cooperativa',
  encryptFields: [
    'idecl', 'codctac', 'idebnf', 'valtrnf', 'dettrnf', 'idemsg', 'codseg'
    // Agregar 'idebnf' y verificar si 'codctad' debe removerse
  ],
  decryptFields: []
}
```

### Opción 2: Verificar formato de cuenta
El `accountNumber` "1515125211177" puede necesitar formato especial o prefijo.

### Opción 3: Usar campo alternativo del objeto _original
Revisar si `_original.codcta` tiene formato diferente que debe usarse.

---

## 📝 HISTORIAL DE CAMBIOS RECIENTES

### 27 Oct 2025 - Sprint Transferencias CACVIL

1. **Problema:** Campos no encriptados en proceso 2350 (validar fondos)
   - **Solución:** Agregados `codctad` y `valtrnf` a campos encriptados
   - **Estado:** ✅ Resuelto

2. **Problema:** Campos no encriptados en proceso 2360 (transferencia externa)
   - **Solución:** Expandidos de 12 a 24 campos encriptados
   - **Estado:** ✅ Resuelto

3. **Problema:** Proceso 2355 (transferencia coop) faltaban campos
   - **Solución:** Agregados `codctac`, `valtrnf`, `dettrnf`
   - **Estado:** ✅ Configuración completa, pero transferencia falla

4. **UI:** Botón "Nueva Transferencia" confunde en comprobantes
   - **Solución:** Eliminado de TransferExt, TransferCoopint, SameAccounts
   - **Estado:** ✅ Resuelto

5. **Problema:** Beneficiario no pasaba desde InternaTransferWindow a TransferCoopint
   - **Solución:** Construcción explícita de objeto `beneficiario` con todos los campos
   - **Estado:** ✅ Datos ahora pasan correctamente

6. **Problema:** useEffect bloqueaba flujo si `beneficiaries.length === 0`
   - **Solución:** Eliminada verificación que causaba return early
   - **Estado:** ✅ Contacto CACVIL ahora se agrega incluso sin beneficiarios previos

7. **Problema ACTUAL:** Backend responde "CUENTA NO EXISTE" en proceso 2355
   - **Estado:** 🔴 **EN INVESTIGACIÓN**

---

## 🎓 CONCEPTOS CLAVE DEL SISTEMA

### Tipos de transferencias
1. **Entre cuentas propias:** Mismo usuario, diferentes cuentas
2. **Cooperativa (CACVIL):** Usuario CACVIL → otro usuario CACVIL (bankCode "99")
3. **Externa:** Usuario CACVIL → usuario otro banco

### Detección de tipo de transferencia
```javascript
const isCoopVilcabamba = (contact) => {
  const bankCode = contact.bankCode || contact._original?.codifi;
  const bankName = (contact.bank || contact._original?.nomifi || '').toUpperCase();
  
  return bankCode === '99' || 
         bankCode === 'CACVIL' ||
         bankName.includes('CACVIL') ||
         bankName.includes('VILCABAMBA') ||
         bankName.includes('COOPERATIVA VILCABAMBA');
};
```

### Sistema de encriptación
- **AES-256-CBC** con crypto-js
- Claves en `.env.local`: `VITE_AES_KEY` (32 chars), `VITE_AES_IV` (16 chars)
- Automático según `prccode` en `fieldMapper.js`
- Backend PHP usa `openssl_encrypt/decrypt`

### Códigos de catálogo NUNCA encriptar
- `codifi` (código institución financiera)
- `codtcur` (tipo de cuenta)
- `codtidr` (tipo de identificación)
- Cualquier campo `codXXX` que sea catálogo

---

## 🚨 PUNTOS CRÍTICOS PARA CONTINUAR

1. **URGENTE:** Determinar formato correcto de cuenta destino para proceso 2355
   - Agregar logs extensivos antes de encriptar
   - Comparar con estructura de proceso 2360 (transferencias externas que funcionan)
   - Consultar documentación backend o revisar código PHP

2. **Verificar:** ¿El proceso 2355 usa cédula o cuenta para identificar beneficiario?
   - Si usa cédula (`idebnf`), cambiar `cuentaDestino` por `cedula` en transferData
   - Actualizar `fieldMapper.js` para incluir `idebnf` en lugar de `codctad`

3. **Revisar:** Proceso 2325 (listar beneficiarios coop) - campo `codcta` en respuesta
   - Ver si ese valor es diferente al `accountNumber` que tenemos
   - Posiblemente necesite normalización o formato especial

4. **Comparar:** Implementación de transferencias entre cuentas propias (SameAccounts)
   - Ver qué campos usan para origen y destino
   - Puede dar pistas sobre formato correcto

---

## 📞 CONTACTO Y RECURSOS

**Servidor Backend:** `http://192.168.200.102/wsVirtualCoopSrvP/ws_server/prctrans.php`  
**Endpoint único:** `/api-l/prctrans.php` (proxy Vite)  
**Token fijo:** `0999SolSTIC20220719`

**Documentación relacionada:**
- `ENCRYPTION_IMPLEMENTATION_SPRINT1.md` - Guía inicial de encriptación
- `BACKEND_ENCRYPTION_GUIDE.md` - Compatibilidad con PHP backend
- `TRANSFER_SYSTEM_DOCUMENTATION.md` - Flujos de transferencias completos
- `SISTEMA_3_INTENTOS_COOPERATIVA.md` - Sistema OTP para transferencias coop

**Archivos para revisar primero:**
1. `src/services/apiserviceTransfer.js` (línea 521 - executeCoopTransfer)
2. `src/utils/crypto/fieldMapper.js` (línea ~445 - proceso 2355)
3. `src/components/dashboard/TransferCoopint.jsx` (línea 315 - construcción transferData)

---

## ✅ CHECKLIST PARA DEBUGGING

- [ ] Agregar logs en `apiserviceTransfer.js` antes de encriptar (proceso 2355)
- [ ] Verificar valor exacto de `codctad` (cuenta destino) enviado
- [ ] Comparar con proceso 2360 (transferencias externas que funcionan)
- [ ] Revisar respuesta de proceso 2325 para ver estructura de `codcta`
- [ ] Consultar backend PHP sobre campo esperado para cuenta destino
- [ ] Probar enviar `idebnf` (cédula) en lugar de `codctad` (cuenta)
- [ ] Verificar si necesita prefijo/sufijo en número de cuenta
- [ ] Revisar si campo `codctab` (cuenta beneficiario) es el correcto
- [ ] Testear con usuario real CACVIL que tenga beneficiarios guardados
- [ ] Validar que encriptación/desencriptación funciona correctamente

---

**Última línea de código modificada:**  
`TransferCoopint.jsx` línea 54 - Eliminado bloqueo por `beneficiaries.length === 0`

**Próximo archivo a modificar:**  
`apiserviceTransfer.js` línea 521+ - Agregar logs y verificar campo correcto para cuenta destino
