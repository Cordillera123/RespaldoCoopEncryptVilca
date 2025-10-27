# 🔐 GUÍA DE IMPLEMENTACIÓN DE ENCRIPTACIÓN - BACKEND PHP

**Fecha:** 24 de octubre, 2025  
**Destinatario:** Equipo Backend PHP  
**Estado:** ✅ Frontend listo - Esperando implementación backend

---

## 🎯 OBJETIVO

Implementar desencriptación en el backend PHP para trabajar con el frontend React que ya está enviando datos encriptados usando **AES-256-CBC**.

---

## 🔑 CREDENCIALES DE ENCRIPTACIÓN

```php
// ⚠️ IMPORTANTE: Estos valores son FIJOS y deben coincidir exactamente

define('ENCRYPTION_KEY', 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca'); // 32 caracteres
define('ENCRYPTION_IV', 'PTk6KaVZxN04SXz0');                  // 16 caracteres
```

**Características:**
- **Algoritmo:** AES-256-CBC
- **Modo:** CBC (Cipher Block Chaining)
- **Padding:** PKCS7
- **Formato de salida:** Base64
- **KEY:** 32 caracteres (256 bits)
- **IV:** 16 caracteres (128 bits)

---

## 📋 CAMPOS QUE EL FRONTEND ENCRIPTA

El frontend encripta automáticamente los siguientes campos antes de enviar al backend:

### 🔐 Campos SIEMPRE Encriptados
```javascript
- identificacion  // Cédula o RUC
- idecl          // Alias de identificacion
- clave          // Contraseñas
- claveActual
- claveNueva
- codigo         // Códigos de seguridad/OTP
```

### 💰 Campos Financieros (según API)
```javascript
- cuenta, codcta, codctad, codctao, codctab
- valor, vlr, vlrtrn
- monto, montoinv
```

### 👤 Datos Personales (según API)
```javascript
- cedula, ruc
- telefono, celular
- email, correo
```

---

## 🔧 CÓDIGO PHP PARA IMPLEMENTAR

### Archivo: `seguridad.php` (ya existe)

```php
<?php
if(defined("seguridad_included"))return;
define("seguridad_included","true");

// ============================================================================
// CONFIGURACIÓN DE ENCRIPTACIÓN
// ============================================================================
// ⚠️ DEBE COINCIDIR CON FRONTEND REACT
define('ENCRYPTION_KEY', 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca');
define('ENCRYPTION_IV', 'PTk6KaVZxN04SXz0');

/**
 * 🔐 FUNCIÓN PARA ENCRIPTAR
 * Compatible con crypto-js del frontend React
 * 
 * @param string $data - Datos a encriptar
 * @param string $key - Llave (opcional, usa constante por defecto)
 * @param string $iv - IV (opcional, usa constante por defecto)
 * @return string - String encriptado en Base64
 */
function fncencrypt($data, $key = ENCRYPTION_KEY, $iv = ENCRYPTION_IV)
{
    if (strlen($key) !== 32) {
        error_log("ERROR: La KEY debe tener 32 caracteres");
        return false;
    }
    
    if (strlen($iv) !== 16) {
        error_log("ERROR: El IV debe tener 16 caracteres");
        return false;
    }
    
    $encrypted = openssl_encrypt(
        $data,
        "aes-256-cbc",
        $key,
        0,  // Options = 0 significa que el resultado es base64
        $iv
    );
    
    return $encrypted;
}

/**
 * 🔓 FUNCIÓN PARA DESENCRIPTAR
 * Compatible con crypto-js del frontend React
 * 
 * @param string $data - String encriptado en Base64
 * @param string $key - Llave (opcional, usa constante por defecto)
 * @param string $iv - IV (opcional, usa constante por defecto)
 * @return string|false - Datos desencriptados o false si falla
 */
function fncdecrypt($data, $key = ENCRYPTION_KEY, $iv = ENCRYPTION_IV)
{
    if (strlen($key) !== 32) {
        error_log("ERROR: La KEY debe tener 32 caracteres");
        return false;
    }
    
    if (strlen($iv) !== 16) {
        error_log("ERROR: El IV debe tener 16 caracteres");
        return false;
    }
    
    if (empty($data)) {
        error_log("ERROR: No hay datos para desencriptar");
        return false;
    }
    
    $decrypted = openssl_decrypt(
        $data,
        'aes-256-cbc',
        $key,
        0,  // Options = 0 significa que el input está en base64
        $iv
    );
    
    return $decrypted;
}

/**
 * 🧪 FUNCIÓN DE TEST
 * Ejecutar desde CLI o browser para verificar que funciona
 */
function test_encryption() {
    echo "\n=== TEST DE ENCRIPTACIÓN ===\n";
    
    $test_cases = [
        "0200594729",           // Identificación
        "12345",                // Código
        "100.50",               // Valor
        "securePassword123"     // Contraseña
    ];
    
    foreach ($test_cases as $original) {
        echo "\n📝 Original: $original\n";
        
        $encrypted = fncencrypt($original);
        echo "🔐 Encriptado: $encrypted\n";
        
        $decrypted = fncdecrypt($encrypted);
        echo "🔓 Desencriptado: $decrypted\n";
        
        if ($original === $decrypted) {
            echo "✅ OK\n";
        } else {
            echo "❌ ERROR: No coincide\n";
        }
    }
}

// ... resto del código de seguridad.php ...
?>
```

---

## 🔄 MODIFICAR PUNTO DE ENTRADA DEL API

### Archivo: `prctrans.php` (o tu archivo principal de API)

```php
<?php
require_once('seguridad.php');

// Obtener datos del POST
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// ============================================================================
// 🔓 PASO 1: DESENCRIPTAR DATOS RECIBIDOS
// ============================================================================

// Helper function para desencriptar campos si existen
function decrypt_if_exists(&$data, $field) {
    if (isset($data[$field]) && !empty($data[$field])) {
        $decrypted = fncdecrypt($data[$field]);
        if ($decrypted !== false) {
            $data[$field] = $decrypted;
            error_log("✅ Campo '$field' desencriptado correctamente");
        } else {
            error_log("⚠️ No se pudo desencriptar '$field', usando valor original");
        }
    }
}

// Desencriptar campos comunes en TODAS las peticiones
decrypt_if_exists($data, 'identificacion');
decrypt_if_exists($data, 'idecl');
decrypt_if_exists($data, 'clave');
decrypt_if_exists($data, 'codigo');

// Desencriptar campos financieros
decrypt_if_exists($data, 'cuenta');
decrypt_if_exists($data, 'codcta');
decrypt_if_exists($data, 'codctad');
decrypt_if_exists($data, 'codctao');
decrypt_if_exists($data, 'codctab');
decrypt_if_exists($data, 'valor');
decrypt_if_exists($data, 'vlr');
decrypt_if_exists($data, 'monto');

// ============================================================================
// 🔧 PASO 2: PROCESAR LÓGICA NORMAL
// ============================================================================

// Ahora $data contiene valores desencriptados
// Continuar con la lógica normal del API

$prccode = $data['prccode'];
$identificacion = $data['identificacion'] ?? $data['idecl'] ?? '';

// ... tu lógica normal aquí ...

// Ejemplo para API 2180 (Login)
if ($prccode == '2180') {
    $identificacion = $data['identificacion'];
    $clave = $data['clave'];
    
    // Ya están desencriptados, usar normalmente
    $query = "SELECT * FROM usuarios WHERE identificacion = '$identificacion'";
    // ... resto de la lógica ...
}

// ============================================================================
// 🔐 PASO 3: ENCRIPTAR RESPUESTA (OPCIONAL)
// ============================================================================

// Si quieres enviar datos encriptados de vuelta al frontend:
$response = [
    'estado' => '000',
    'mensaje' => 'Login exitoso',
    'identificacionE' => fncencrypt($identificacion),  // ← Campo encriptado
    'identificacionD' => $identificacion,               // ← Campo desencriptado
    'codctaE' => fncencrypt($cuenta),
    'codctaD' => $cuenta
];

// El frontend automáticamente detectará campos terminados en 'E' y los desencriptará

echo json_encode($response);
?>
```

---

## 🧪 PROCESO DE TESTING

### 1️⃣ Test Básico de Encriptación/Desencriptación

Crear archivo: `test_encryption.php`

```php
<?php
require_once('seguridad.php');

// Test con valor conocido del frontend
$encrypted_from_frontend = "jpUmKex7E9/r6p/P1FNc1Q==";

echo "=== TEST DE COMPATIBILIDAD CON FRONTEND ===\n\n";
echo "Valor encriptado recibido del frontend:\n";
echo "$encrypted_from_frontend\n\n";

$decrypted = fncdecrypt($encrypted_from_frontend);

echo "Valor desencriptado:\n";
echo "$decrypted\n\n";

echo "Valor esperado: 0200594729\n\n";

if ($decrypted === "0200594729") {
    echo "✅ ¡ÉXITO! La desencriptación funciona correctamente\n";
} else {
    echo "❌ ERROR: El valor no coincide\n";
    echo "Longitud: " . strlen($decrypted) . "\n";
    echo "Hex: " . bin2hex($decrypted) . "\n";
}

// Test de roundtrip completo
echo "\n=== TEST DE ROUNDTRIP ===\n\n";
$original = "0200594729";
$encrypted = fncencrypt($original);
$decrypted2 = fncdecrypt($encrypted);

echo "Original: $original\n";
echo "Encriptado: $encrypted\n";
echo "Desencriptado: $decrypted2\n";
echo ($original === $decrypted2 ? "✅ OK" : "❌ ERROR") . "\n";
?>
```

**Ejecutar desde terminal:**
```bash
php test_encryption.php
```

**Resultado esperado:**
```
✅ ¡ÉXITO! La desencriptación funciona correctamente
✅ OK
```

### 2️⃣ Test con Petición Real del Frontend

```php
<?php
require_once('seguridad.php');

// Simular petición del frontend
$json_from_frontend = '{
    "tkn": "0999SolSTIC20220719",
    "prccode": "2180",
    "identificacion": "jpUmKex7E9/r6p/P1FNc1Q==",
    "clave": "U2FsdGVkX1+9yLk4nOwQ3R9gL..."
}';

echo "=== SIMULACIÓN DE PETICIÓN FRONTEND ===\n\n";

$data = json_decode($json_from_frontend, true);

echo "Datos recibidos:\n";
print_r($data);

// Desencriptar
$identificacion_desencriptada = fncdecrypt($data['identificacion']);
$clave_desencriptada = fncdecrypt($data['clave']);

echo "\nDatos desencriptados:\n";
echo "Identificación: $identificacion_desencriptada\n";
echo "Clave: $clave_desencriptada\n";

// Ahora puedes usar estos valores en tu query
$query = "SELECT * FROM usuarios WHERE identificacion = '$identificacion_desencriptada'";
echo "\nQuery SQL: $query\n";
?>
```

---

## 📊 APIS QUE RECIBIRÁN DATOS ENCRIPTADOS

### Alta Prioridad (Implementar Primero)
```
✅ 2180 - Login
   - Campos: identificacion, clave
   - Crítico para autenticación

✅ 2300 - Listar cuentas
   - Campos: identificacion
   - Usado constantemente en dashboard

✅ 2350 - Validar fondos
   - Campos: identificacion, cuenta, valor
   - Crítico para transferencias

✅ 2355 - Transferencia interna
   - Campos: identificacion, codctao, codctad, valor, codigo
   - Operación financiera crítica
```

### Prioridad Media
```
⚠️ 2301 - Detalle de cuenta
⚠️ 2351 - Consultar cuenta específica
⚠️ 2360-2362 - Transferencias externas
⚠️ 2365 - Crear beneficiario
⚠️ 2371-2375 - Sistema de inversiones
```

### Prioridad Baja (Implementar Después)
```
📋 2190-2195 - Proceso de registro
📋 2155 - Validar código de seguridad
📋 2213 - Detalle de inversión
📋 Otros endpoints
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Manejo de Errores**
```php
// SIEMPRE validar si la desencriptación fue exitosa
$decrypted = fncdecrypt($data['identificacion']);
if ($decrypted === false) {
    // Log del error
    error_log("Error al desencriptar identificación");
    
    // Decidir: ¿usar valor original o rechazar petición?
    // Opción A: Usar valor original (compatibilidad hacia atrás)
    $identificacion = $data['identificacion'];
    
    // Opción B: Rechazar petición (más seguro)
    echo json_encode(['estado' => '999', 'mensaje' => 'Error de encriptación']);
    exit;
}
```

### 2. **Logs de Debugging**
```php
// Habilitar logs temporalmente para debugging
function log_decrypt($field, $encrypted, $decrypted) {
    error_log("DECRYPT: $field");
    error_log("  Encriptado: $encrypted");
    error_log("  Desencriptado: $decrypted");
    error_log("  Longitud: " . strlen($decrypted));
}

// Usar durante implementación
$decrypted = fncdecrypt($data['identificacion']);
log_decrypt('identificacion', $data['identificacion'], $decrypted);
```

### 3. **Compatibilidad hacia atrás**
```php
// Si necesitas soportar clientes antiguos SIN encriptación
function smart_decrypt($value) {
    // Detectar si es Base64 válido
    if (base64_decode($value, true) !== false) {
        $decrypted = fncdecrypt($value);
        return $decrypted !== false ? $decrypted : $value;
    }
    // No es Base64, es texto plano
    return $value;
}

$identificacion = smart_decrypt($data['identificacion']);
```

### 4. **Performance**
- La encriptación/desencriptación es muy rápida (< 1ms por campo)
- No hay impacto significativo en performance
- Considerar cachear valores desencriptados en la sesión si es necesario

---

## 🔍 TROUBLESHOOTING

### Problema: La desencriptación retorna `false`

**Posibles causas:**
1. KEY o IV incorrectos
2. Datos corruptos en transmisión
3. Encoding incorrecto (UTF-8 vs Latin1)

**Solución:**
```php
// Verificar configuración
if (ENCRYPTION_KEY !== 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca') {
    die("ERROR: KEY incorrecta");
}
if (ENCRYPTION_IV !== 'PTk6KaVZxN04SXz0') {
    die("ERROR: IV incorrecta");
}

// Log detallado
error_log("Intentando desencriptar: " . $data['identificacion']);
error_log("Longitud: " . strlen($data['identificacion']));
$decrypted = fncdecrypt($data['identificacion']);
error_log("Resultado: " . ($decrypted === false ? "FALSE" : $decrypted));
```

### Problema: Query SQL no encuentra registros

**Causa:** Estás buscando con el valor encriptado en lugar del desencriptado

**Solución:**
```php
// ❌ INCORRECTO
$identificacion = $data['identificacion']; // Aún encriptado
$query = "SELECT * FROM usuarios WHERE identificacion = '$identificacion'";

// ✅ CORRECTO
$identificacion = fncdecrypt($data['identificacion']); // Desencriptado
$query = "SELECT * FROM usuarios WHERE identificacion = '$identificacion'";
```

### Problema: Frontend no puede desencriptar respuestas

**Causa:** No estás usando el sufijo 'E' en campos encriptados

**Solución:**
```php
// ❌ INCORRECTO
$response = [
    'cuenta' => fncencrypt($cuenta)  // Frontend no sabrá que está encriptado
];

// ✅ CORRECTO
$response = [
    'cuentaE' => fncencrypt($cuenta),  // Frontend detecta 'E' y desencripta
    'cuentaD' => $cuenta               // Versión desencriptada también disponible
];
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Preparación
- [ ] Copiar funciones `fncencrypt()` y `fncdecrypt()` a `seguridad.php`
- [ ] Definir constantes `ENCRYPTION_KEY` e `ENCRYPTION_IV`
- [ ] Crear archivo `test_encryption.php`
- [ ] Ejecutar test y verificar que funciona

### Fase 2: Implementación API Login (2180)
- [ ] Modificar `prctrans.php` para desencriptar `identificacion` y `clave`
- [ ] Probar login desde frontend
- [ ] Verificar que la autenticación funciona
- [ ] Verificar logs del servidor

### Fase 3: Implementación APIs Críticas
- [ ] API 2300 - Cuentas (desencriptar `identificacion`)
- [ ] API 2350 - Validar fondos (desencriptar `identificacion`, `cuenta`, `valor`)
- [ ] API 2355 - Transferencia (desencriptar cuentas y valores)
- [ ] Probar flujo completo: Login → Ver cuentas → Transferencia

### Fase 4: Implementación Completa
- [ ] Implementar desencriptación en todos los endpoints (ver lista arriba)
- [ ] Agregar logs para monitoreo
- [ ] Testing end-to-end de todos los módulos
- [ ] Monitoreo en producción

### Fase 5: Optimización (Opcional)
- [ ] Agregar encriptación en respuestas (campos con sufijo 'E')
- [ ] Implementar caché de sesión para datos desencriptados
- [ ] Agregar métricas de performance
- [ ] Documentar cambios

---

## 📞 COORDINACIÓN CON FRONTEND

**Estado actual del frontend:**
- ✅ Encriptación activada (`VITE_ENCRYPTION_ENABLED=true`)
- ✅ Enviando todos los campos sensibles encriptados
- ✅ Esperando respuestas del backend

**Contacto:**
- Frontend está listo y esperando
- Una vez implementes el backend, las operaciones funcionarán inmediatamente
- No se requieren cambios adicionales en el frontend

---

## 🎯 RESULTADO ESPERADO

Después de implementar esto, deberías poder:

1. **Recibir peticiones del frontend** con campos encriptados
2. **Desencriptar automáticamente** usando las funciones proporcionadas
3. **Procesar normalmente** con los valores desencriptados
4. **Responder** (opcionalmente encriptando campos sensibles)
5. **Ver en logs** que todo funciona correctamente

**Ejemplo de log exitoso:**
```
✅ Campo 'identificacion' desencriptado correctamente
✅ Campo 'clave' desencriptado correctamente
✅ Login exitoso para usuario: 0200594729
```

---

**¿Necesitas más ayuda?**
- Este documento contiene todo lo necesario para implementar
- Las funciones están listas para copiar y pegar
- Los tests te ayudarán a validar que funciona

---

**Creado:** 24 de octubre, 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para implementar
