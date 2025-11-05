# 🔴 PROBLEMA CRÍTICO: Eliminación de Beneficiarios No Funciona

## 📋 Diagnóstico del Problema

### Situación Actual:
1. ✅ El frontend muestra el mensaje "Se eliminó el beneficiario correctamente"
2. ❌ Al recargar la página, el beneficiario SIGUE APARECIENDO
3. 🔍 El registro NO se elimina de la base de datos

### Causa Raíz Identificada:
**DOBLE ENCRIPTACIÓN** en el campo `codctac` (número de cuenta del beneficiario)

## 🔍 Análisis Técnico

### Flujo Actual (INCORRECTO):

```
Base de Datos almacena:
└─> codctac = "GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=" (DOBLEMENTE ENCRIPTADO)

Proceso 2330 (Listar Beneficiarios):
├─> Backend devuelve: "GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA="
├─> Frontend desencripta 1 vez: "HzuXEgx9yOmQEIAENk2n3A=="
└─> Frontend desencripta 2 veces para mostrar: "420201007429" ✅ Se ve bien en UI

Proceso 2370 (Eliminar Beneficiario):
├─> Frontend envía: "GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=" (valor original de DB)
├─> Backend ENCRIPTA de nuevo ❌: Se convierte en un TERCER nivel de encriptación
├─> Backend busca en DB con cuenta TRIPLEMENTE encriptada
└─> NO ENCUENTRA coincidencia → NO ELIMINA ❌
```

## ✅ SOLUCIÓN REQUERIDA EN EL BACKEND

### Cambio Necesario en PHP (Proceso 2370):

**Ubicación:** `ws_server/prctrans.php` o archivo donde se procesa el código `2370`

#### ANTES (INCORRECTO):
```php
// Proceso 2370 - Eliminar beneficiario
function eliminarBeneficiario($datos) {
    $idecl = desencriptar($datos['ideclE']);     // ✅ OK - Cédula cliente
    $ideclr = desencriptar($datos['ideclrE']);   // ✅ OK - Cédula receptor
    $codctac = desencriptar($datos['codctacE']); // ❌ ERROR - No debe desencriptar
    
    // Query DELETE con $codctac ya desencriptado
    $sql = "DELETE FROM beneficiarios 
            WHERE idecl = ? 
            AND codctac = ?"; // ❌ Busca con cuenta desencriptada
    
    // NO ENCUENTRA porque en DB está doblemente encriptado
}
```

#### DESPUÉS (CORRECTO - OPCIÓN 1 RECOMENDADA):
```php
// Proceso 2370 - Eliminar beneficiario
function eliminarBeneficiario($datos) {
    $idecl = desencriptar($datos['ideclE']);     // ✅ OK - Cédula cliente
    $ideclr = desencriptar($datos['ideclrE']);   // ✅ OK - Cédula receptor
    
    // ⚠️ CAMBIO CRÍTICO: NO desencriptar codctac
    // Ya viene con el valor exacto que está en la DB
    $codctac = $datos['codctacE']; // ✅ USAR VALOR ENCRIPTADO DIRECTO
    
    // Query DELETE con $codctac encriptado (igual que en DB)
    $sql = "DELETE FROM beneficiarios 
            WHERE idecl = ? 
            AND codctac = ?"; // ✅ Ahora SÍ coincide con DB
    
    // Ejecutar con $codctac SIN modificar
    $stmt->bind_param("ss", $idecl, $codctac);
    $stmt->execute();
    
    if ($stmt->affected_rows > 0) {
        return ["estado" => "000", "msg" => "Beneficiario eliminado correctamente"];
    } else {
        return ["estado" => "001", "msg" => "No se encontró el beneficiario"];
    }
}
```

### O bien (OPCIÓN 2 - Si prefieren mantener consistencia):

```php
// Desencriptar codctac DOS VECES para llegar al valor original
$codctac = $datos['codctacE'];
$codctac = desencriptar($codctac); // Primera desencriptación
$codctac = desencriptar($codctac); // Segunda desencriptación (valor plano)

// Luego buscar en DB desencriptando también el campo almacenado
$sql = "SELECT * FROM beneficiarios WHERE idecl = ?";
// Luego comparar desencriptando el codctac de cada registro
```

⚠️ **PERO LA OPCIÓN 2 ES MENOS EFICIENTE** - Se recomienda OPCIÓN 1

## 🔧 Cambios Adicionales en el Backend

### 1. Verificar el Mapeo de Campos en `fncrevisa_encrypt()`

Asegurarse que `codctac` esté correctamente mapeado:

```php
function fncrevisa_encrypt($prccode, &$datos) {
    $encryptFields = [
        '2370' => ['idecl', 'ideclr'] // ⚠️ REMOVER 'codctac' de aquí
        // codctac NO debe estar en esta lista para el proceso 2370
    ];
    
    foreach ($encryptFields[$prccode] as $field) {
        if (isset($datos[$field])) {
            $datos[$field . 'E'] = encriptar($datos[$field]);
        }
    }
}
```

### 2. Log de Debugging Temporal

Agregar estos logs en el proceso 2370 para verificar:

```php
error_log("🗑️ [2370] DELETE - Datos recibidos:");
error_log("   idecl: " . $datos['idecl']);
error_log("   codctac ANTES: " . $datos['codctac']);
error_log("   codctac length: " . strlen($datos['codctac']));
error_log("   codctac contiene '=': " . (strpos($datos['codctac'], '=') !== false ? 'SI' : 'NO'));

// Verificar qué hay en la DB
$checkSQL = "SELECT codctac FROM beneficiarios WHERE idecl = ? LIMIT 1";
$checkStmt->execute();
$dbCodctac = $checkStmt->get_result()->fetch_assoc()['codctac'];
error_log("   codctac EN DB: " . $dbCodctac);
error_log("   ¿COINCIDEN?: " . ($datos['codctac'] === $dbCodctac ? 'SI ✅' : 'NO ❌'));
```

## 📊 Valores Reales Observados

### Ejemplo de cuenta doblemente encriptada:
```
Valor en DB:           GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=
1ra desencriptación:   HzuXEgx9yOmQEIAENk2n3A==
2da desencriptación:   420201007429
```

### Lo que debe llegar al backend en proceso 2370:
```
Dato: codctac = "GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA="
```

### Lo que el backend debe hacer:
```
✅ OPCIÓN 1 (RECOMENDADA): Usar el valor tal cual para el DELETE
❌ NO ENCRIPTAR de nuevo
❌ NO DESENCRIPTAR
```

## 🧪 Prueba de Validación

Después de implementar el cambio:

1. Desde el frontend, intentar eliminar un beneficiario
2. Verificar en los logs del backend:
   ```
   codctac recibido: GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=
   codctac en DB:    GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=
   ¿COINCIDEN?: SI ✅
   ```
3. Verificar que `affected_rows > 0`
4. Recargar lista en frontend - el beneficiario debe DESAPARECER

## 📝 Resumen para el Desarrollador Backend

**CAMBIO DE UNA LÍNEA:**
```php
// ANTES:
$codctac = desencriptar($datos['codctacE']); // ❌

// DESPUÉS:
$codctac = $datos['codctacE']; // ✅
```

**Y REMOVER** `'codctac'` de la lista de campos a encriptar en el proceso 2370.

---

## 🚨 Pregunta Adicional para el Backend

¿Por qué las cuentas están DOBLEMENTE encriptadas en la base de datos?

Opciones:
1. Se encriptan al insertar (proceso 2365) Y también el campo en la DB está encriptado?
2. El proceso de inserción encripta dos veces por error?

**Sugerencia:** Revisar el proceso 2365 (Crear Beneficiario) para evitar doble encriptación desde el origen.
