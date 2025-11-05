# ✅ IMPLEMENTACIÓN DÉBITO DE CERTIFICADOS BANCARIOS

**Fecha:** 5 de noviembre de 2025  
**Proceso:** 2401 - Generar certificado con débito automático

---

## 🎯 OBJETIVO

Integrar el proceso 2401 del backend para registrar automáticamente el débito del costo de emisión de certificados bancarios cuando el usuario solicita un certificado.

---

## 📊 DATOS DEL BACKEND (Proceso 2401)

### **Request esperado por el backend:**
```json
{
  "tkn": "0999SolSTIC20220719",
  "prccode": "2401",
  "idecl": "d6K9pfl+xSR12pHXSv1PLw==",     // Cédula (ENCRIPTADA)
  "codctad": "3HZLjRhds8P/M6n3SPwyIw==",   // Cuenta a debitar (ENCRIPTADA)
  "valtrnf": "hIWaLMRiVpluX83ic7apLg==",   // Valor/costo (ENCRIPTADO)
  "tcrvalor": "1"                          // Tipo transacción (texto plano)
}
```

### **Response del backend:**
```json
{
  "estado": "000",
  "msg": "TRANSACCION REGISTRADA",
  "nomempre": "COOPERATIVA LAS NAVES LTDA",
  "numcompr": "0000000000",              // Número de comprobante
  "fectrans": "2025-10-31",              // Fecha transacción
  "ideclien": "1711495000",              // Cédula cliente
  "nomclien": "MORALES TINGO ALEJANDRO FERNANDO",
  "cuentas": "...",
  "comprobante": {
    "numcompr": "0000000000",
    "fectrans": "2025-10-31",
    "nomempre": "COOPERATIVA LAS NAVES LTDA"
  }
}
```

---

## 🔧 CAMBIOS REALIZADOS

### **1. Actualización de `CertificadosForm.jsx`**

#### **Antes (incompleto):**
```javascript
const dataParaServicio = {
  prccode: '2401',
  codcta: formData.cuentaPago,  // ❌ Faltaban campos
  tpvisu: formData.tipoVisualizacion === 'cifras' ? '2' : '1'
};
```

#### **Ahora (completo):**
```javascript
const dataParaServicio = {
  prccode: '2401',                      // Proceso de generación
  idecl: userInfo.cedula,               // ✅ Cédula del usuario
  codctad: formData.cuentaPago,         // ✅ Cuenta a debitar
  valtrnf: costoCertificado?.toString() || '0.00', // ✅ Costo del certificado
  tcrvalor: '1'                         // ✅ Tipo de transacción
};
```

### **2. Actualización de `fieldMapper.js`**

```javascript
'2401': {
  description: 'Generar certificado bancario con débito',
  encryptFields: [
    'identificacion',
    'idecl',        // Cédula del cliente (SENSIBLE)
    'codctad',      // Cuenta a debitar el costo (SENSIBLE)
    'valtrnf'       // Valor del certificado/costo (SENSIBLE)
    // ❌ NO ENCRIPTAR: tcrvalor (código de catálogo)
  ],
  decryptFields: ['codctaE', 'valorE', 'valtrnfE', 'saldoE']
}
```

### **3. Validación mejorada de respuesta**

Ahora se valida específicamente el mensaje "TRANSACCION REGISTRADA" y se registran todos los datos del comprobante:

```javascript
if (result.success && result.data.estado === '000') {
  console.log('✅ [CERT-FORM] Certificado generado exitosamente');
  console.log('📄 [CERT-FORM] Número de comprobante:', result.data.numcompr);
  console.log('📅 [CERT-FORM] Fecha de transacción:', result.data.fectrans);
  
  if (result.data.msg === 'TRANSACCION REGISTRADA') {
    console.log('✅ [CERT-FORM] DÉBITO REGISTRADO EXITOSAMENTE');
  }
  
  console.log('💰 [CERT-FORM] INFORMACIÓN DEL DÉBITO:');
  console.log('   - Comprobante Nº:', result.data.numcompr);
  console.log('   - Fecha transacción:', result.data.fectrans);
  console.log('   - Monto debitado: $', costoCertificado?.toFixed(2));
  console.log('   - Cuenta debitada:', formData.cuentaPago);
}
```

### **4. Inclusión de datos del comprobante en el PDF**

```javascript
const certificateInfo = {
  ...result.data,
  tipoCertificado: activeTab,
  cliente: {
    nombre: result.data.nomclien || userInfo.nombre,
    cedula: result.data.ideclien || userInfo.cedula,
    codigo: result.data.ideclien || userInfo.cedula
  },
  // ✅ Información del comprobante de débito
  comprobante: result.data.comprobante || {
    numcompr: result.data.numcompr || 'N/A',
    fectrans: result.data.fectrans || new Date().toISOString().split('T')[0],
    nomempre: result.data.nomempre || 'COOPERATIVA LAS NAVES LTDA'
  },
  cuentaPago: cuentaPago,
  costo: costoCertificado,
  // ... resto de datos
};
```

---

## 🧪 FLUJO COMPLETO

### **Paso 1: Usuario solicita certificado**
- Selecciona tipo (consolidado o individual)
- Selecciona cuenta para pagar
- Click en "Continuar"

### **Paso 2: Vista de confirmación**
- Muestra resumen:
  - Tipo de certificado
  - Cuenta a debitar
  - Costo: $X.XX
  - Cuentas incluidas
- Click en "Confirmar"

### **Paso 3: Proceso 2401 - Backend**
```
Frontend envía:
  - idecl (cédula encriptada)
  - codctad (cuenta encriptada)
  - valtrnf (costo encriptado)
  - tcrvalor (tipo transacción)

Backend procesa:
  ✅ Desencripta datos
  ✅ Valida cuenta y saldo
  ✅ Genera certificado
  ✅ REGISTRA DÉBITO en la cuenta
  ✅ Retorna comprobante

Backend responde:
  - estado: "000"
  - msg: "TRANSACCION REGISTRADA"
  - numcompr: "0000000000"
  - fectrans: "2025-10-31"
  - nomclien, ideclien, etc.
```

### **Paso 4: Frontend confirma**
- Valida respuesta exitosa
- Registra datos del comprobante en logs
- Genera PDF con todos los datos (incluyendo comprobante)
- Muestra vista de éxito

### **Paso 5: Usuario descarga PDF**
- PDF incluye:
  - Datos del cliente
  - Cuentas certificadas
  - Comprobante de débito
  - Fecha y número de transacción

---

## 📋 CAMPOS ENCRIPTADOS vs NO ENCRIPTADOS

### **✅ Se encriptan (campos sensibles):**
- `idecl`: Cédula del usuario
- `codctad`: Número de cuenta a debitar
- `valtrnf`: Valor/monto del débito

### **❌ NO se encriptan (códigos de catálogo):**
- `prccode`: Código de proceso (2401)
- `tkn`: Token de autenticación
- `tcrvalor`: Tipo de transacción (código 1, 2, etc.)

---

## ✅ RESULTADO ESPERADO

Cuando el usuario genera un certificado bancario:

1. ✅ Se envían todos los campos requeridos al backend
2. ✅ El backend registra el débito del costo en la cuenta seleccionada
3. ✅ Se obtiene un comprobante con número y fecha
4. ✅ El PDF incluye los datos del comprobante
5. ✅ El usuario puede ver en consola todos los detalles del débito
6. ✅ El saldo de la cuenta se reduce automáticamente

---

## 🔍 LOGS ESPERADOS EN CONSOLA

```
📤 [CERT-FORM] Datos para proceso 2401 (antes de encriptar):
   prccode: "2401"
   idecl: "***5000"
   codctad: "***7445"
   valtrnf: "$2.59"
   tcrvalor: "1"

✅ [CERT-FORM] Certificado generado exitosamente
📄 [CERT-FORM] Número de comprobante: 0000000000
📅 [CERT-FORM] Fecha de transacción: 2025-10-31
✅ [CERT-FORM] DÉBITO REGISTRADO EXITOSAMENTE

💰 [CERT-FORM] INFORMACIÓN DEL DÉBITO:
   - Tipo certificado: consolidado
   - Cuenta certificado: TODAS (Consolidado)
   - Total cuentas incluidas: 2
   - Cuenta debitada: 420201007445
   - Monto debitado: $2.59
   - Comprobante Nº: 0000000000
   - Fecha transacción: 2025-10-31
   - Cliente: MORALES TINGO ALEJANDRO FERNANDO
   - Cédula: 1711495000
```

---

## 🎓 NOTAS IMPORTANTES

1. **Encriptación automática:** Los campos `idecl`, `codctad` y `valtrnf` se encriptan automáticamente gracias al sistema centralizado de encriptación (`encryptRequest()`).

2. **No requiere OTP:** A diferencia de las transferencias, la generación de certificados **NO requiere código OTP** según la implementación actual (versión simplificada).

3. **Tipo de transacción:** El campo `tcrvalor` se mantiene como código de catálogo (1, 2, etc.) y NO se encripta.

4. **Comprobante:** El backend retorna un objeto `comprobante` con el número de comprobante, fecha y nombre de la empresa.

5. **Visualización:** El tipo de visualización (saldo vs cifras) podría manejarse en un proceso posterior o internamente por el backend. Por ahora no se envía en el proceso 2401.

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

Si el ingeniero lo requiere en el futuro:

1. **Agregar OTP:** Implementar validación OTP antes de generar certificado (similar a transferencias)
2. **Tipo de visualización:** Si el backend lo requiere, agregar el campo `tpvisu` al proceso 2401
3. **Múltiples tipos de certificados:** Expandir `tcrvalor` para diferentes tipos de certificados con diferentes costos
4. **Histórico de certificados:** Crear proceso para consultar certificados generados previamente

---

**FIN DE LA IMPLEMENTACIÓN** ✅
