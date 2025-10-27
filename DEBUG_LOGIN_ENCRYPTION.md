# 🔍 Sistema de Debugging para Login con Encriptación

## Objetivo
Identificar por qué el login funciona en **Postman** pero falla en el **frontend** con "credenciales incorrectas", a pesar de usar las mismas credenciales.

## Valores de Referencia (Postman - FUNCIONANDO)
```
Usuario: Josu1234
Password: Solstic2025-

Encriptados (Base64):
usr: "qRym2o7g3LG5tHnPWTgYQw=="
pwd: "z1fKJltbT3aDeHhLgCjQ0A=="

Respuesta Backend: estado "000" (éxito)
```

## Logs Implementados

### 1. `encryptionService.js` - Función `encrypt()`
**Ubicación**: `src/utils/crypto/encryptionService.js`

**Logs agregados**:
- ✅ Input (texto plano a encriptar)
- ✅ KEY y IV (longitud y primeros caracteres)
- ✅ ENCRYPTION_ENABLED status
- ✅ Proceso de conversión a WordArray
- ✅ Output Base64 generado
- ✅ Validación de formato Base64

**Formato de salida**:
```
🔐 [ENCRYPT] ===== INICIO DE ENCRIPTACIÓN =====
🔐 [ENCRYPT] Input: Josu1234
🔐 [ENCRYPT] KEY length: 32
🔐 [ENCRYPT] IV length: 16
🔐 [ENCRYPT] Output Base64: qRym2o7g3LG5tHnPWTgYQw==
🔐 [ENCRYPT] ===== FIN DE ENCRIPTACIÓN =====
```

### 2. `apiService.js` - Función `login()`
**Ubicación**: `src/services/apiService.js` (línea ~840)

**Logs agregados**:
- ✅ Credenciales recibidas (usuario y password en claro)
- ✅ Datos ANTES de encriptación
- ✅ Comparación con valores esperados de Postman

**Formato de salida**:
```
🔐 [AUTH] ========== INICIO LOGIN DEBUG ==========
👤 [AUTH] Usuario: Josu1234
🔑 [AUTH] Contraseña: Solstic2025-
📝 [AUTH] Datos ANTES de encriptación:
   prccode: "2100"
   usr: "Josu1234"
   pwd: "Solstic2025-"
🎯 [AUTH] Postman usr esperado: "qRym2o7g3LG5tHnPWTgYQw=="
🎯 [AUTH] Postman pwd esperado: "z1fKJltbT3aDeHhLgCjQ0A=="
```

### 3. `index.js` - Función `encryptRequest()`
**Ubicación**: `src/utils/crypto/index.js`

**Logs agregados**:
- ✅ Process code y verificación de encriptación
- ✅ Campos a encriptar según mapping
- ✅ Valores ANTES de encriptación
- ✅ Valores DESPUÉS de encriptación
- ✅ **COMPARACIÓN DIRECTA** con valores de Postman
- ✅ Indicador de coincidencia (true/false)

**Formato de salida**:
```
🔐 [ENCRYPT_REQUEST] ===== INICIO =====
🔐 [ENCRYPT_REQUEST] Process code: 2100
🔐 [ENCRYPT_REQUEST] Campos a encriptar: ["usr", "pwd", "usuario", "password"]
🔐 [ENCRYPT_REQUEST] Valores ANTES:
   - usr: "Josu1234"
   - pwd: "Solstic2025-"
🔐 [ENCRYPT_REQUEST] Valores DESPUÉS:
   - usr: "qRym2o7g3LG5tHnPWTgYQw=="
   - pwd: "z1fKJltbT3aDeHhLgCjQ0A=="
🔐 [ENCRYPT_REQUEST] ===== COMPARACIÓN POSTMAN =====
🎯 usr actual: qRym2o7g3LG5tHnPWTgYQw==
🎯 pwd actual: z1fKJltbT3aDeHhLgCjQ0A==
🎯 ¿usr coincide?: true
🎯 ¿pwd coincide?: true
🔐 [ENCRYPT_REQUEST] ===== FIN =====
```

## Configuración Verificada

### .env.local
```bash
VITE_AES_KEY=C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca  # 32 chars ✅
VITE_AES_IV=PTk6KaVZxN04SXz0                # 16 chars ✅
VITE_ENCRYPTION_ENABLED=true                # Habilitado ✅
```

### Backend PHP (prctrans.php)
```php
$KEY = "C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca";  # 32 chars ✅
$IV = "PTk6KaVZxN04SXz0";                  # 16 chars ✅
```

**✅ KEY e IV coinciden entre frontend y backend**

## Procedimiento de Testing

### Paso 1: Reiniciar Servidor
```powershell
npm run dev
```

### Paso 2: Abrir DevTools
1. Abrir la aplicación en el navegador
2. Presionar F12 para abrir DevTools
3. Ir a la pestaña **Console**

### Paso 3: Intentar Login
Usar las credenciales de prueba:
- **Usuario**: `Josu1234`
- **Password**: `Solstic2025-`

### Paso 4: Analizar Logs

#### ✅ CASO EXITOSO (Encriptación correcta)
Si los logs muestran:
```
🎯 ¿usr coincide?: true
🎯 ¿pwd coincide?: true
```
**→ Problema está en el backend PHP** (función `verifUsuar()` o comparación de contraseñas)

#### ❌ CASO FALLIDO (Encriptación incorrecta)
Si los logs muestran:
```
🎯 ¿usr coincide?: false
🎯 ¿pwd coincide?: false
```
**→ Problema está en la configuración del frontend** (KEY/IV no coinciden o CryptoJS mal configurado)

#### ⚠️ CASO PARCIAL
Si un campo coincide pero otro no:
```
🎯 ¿usr coincide?: true
🎯 ¿pwd coincide?: false
```
**→ Problema específico con el campo `pwd`** (posible issue con caracteres especiales o encoding)

## Diagnóstico Esperado

### Hipótesis Más Probable
Dado que Postman funciona correctamente:
1. **Backend desencripta correctamente** ✅
2. **Backend verifica credenciales correctamente** ✅
3. **Frontend debería generar mismo Base64** 🤔

**Si los valores coinciden** → Problema en verifUsuar() o base de datos
**Si los valores NO coinciden** → Problema en CryptoJS o KEY/IV

## Siguientes Pasos

### Si coinciden los valores encriptados:
1. **Backend debe agregar logs en `verifUsuar()`**:
   ```php
   error_log("verifUsuar - usr recibido: " . $usr);
   error_log("verifUsuar - pwd recibido: " . $pwd);
   error_log("verifUsuar - comparando con BD...");
   ```

2. **Verificar que `verifUsuar()` no desencripte de nuevo** (ya viene desencriptado)

3. **Revisar comparación de contraseña en BD**

### Si NO coinciden los valores encriptados:
1. **Verificar que .env.local se esté cargando**:
   ```javascript
   console.log('KEY desde env:', import.meta.env.VITE_AES_KEY);
   console.log('IV desde env:', import.meta.env.VITE_AES_IV);
   ```

2. **Verificar versión de crypto-js**:
   ```powershell
   npm list crypto-js
   ```

3. **Probar encriptación manual en consola**:
   ```javascript
   import CryptoJS from 'crypto-js';
   const key = CryptoJS.enc.Utf8.parse('C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca');
   const iv = CryptoJS.enc.Utf8.parse('PTk6KaVZxN04SXz0');
   const encrypted = CryptoJS.AES.encrypt('Josu1234', key, { 
     iv: iv, 
     mode: CryptoJS.mode.CBC, 
     padding: CryptoJS.pad.Pkcs7 
   });
   console.log(encrypted.toString()); // Debe ser: qRym2o7g3LG5tHnPWTgYQw==
   ```

## Estado Actual
- ✅ Logs implementados en 3 archivos clave
- ✅ Configuración verificada (KEY/IV coinciden)
- ✅ Postman confirmado funcionando
- ⏳ Pendiente: Ejecutar test y analizar output

## Archivos Modificados
1. `src/utils/crypto/encryptionService.js` - Logs detallados en encrypt()
2. `src/services/apiService.js` - Logs en login() con comparación Postman
3. `src/utils/crypto/index.js` - Logs en encryptRequest() con verificación de coincidencia

---

**Última actualización**: Sistema de debugging completo implementado
**Próxima acción**: Reiniciar servidor y ejecutar login de prueba
