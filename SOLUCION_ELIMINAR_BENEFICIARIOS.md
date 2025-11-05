# 🔴 RESUMEN EJECUTIVO - Problema Eliminación Beneficiarios

## ❌ Problema
Los beneficiarios NO se eliminan de la base de datos aunque el sistema muestre mensaje de éxito.

## 🎯 Causa Raíz
**TRIPLE ENCRIPTACIÓN** del campo `codctac` (número de cuenta):
1. DB almacena cuenta DOBLEMENTE encriptada: `GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=`
2. Frontend la enviaba al backend tal cual
3. Backend la ENCRIPTABA UNA TERCERA VEZ antes del DELETE
4. Query buscaba con cuenta triplemente encriptada → NO encontraba → NO eliminaba

## ✅ Solución Aplicada en Frontend

### Cambio 1: Removido `codctac` de lista de encriptación
**Archivo:** `src/utils/crypto/fieldMapper.js`
```javascript
'2370': {
  encryptFields: [
    'idecl',        // ✅ Se encripta
    'ideclr'        // ✅ Se encripta
    // ⚠️ REMOVIDO 'codctac' - Ya viene encriptado desde DB
  ]
}
```

### Cambio 2: Comentada desencriptación en apiService
**Archivo:** `src/services/apiService.js` línea ~4878
- Se comentó el código que desencriptaba `codctac` antes de enviarlo
- Ahora se envía TAL CUAL viene de la DB (doblemente encriptado)

### Cambio 3: Logs de debugging mejorados
- Ahora muestra claramente que `codctac` va encriptado sin modificar
- Advierte que el backend NO debe encriptarlo

## 🔴 CAMBIOS REQUERIDOS EN EL BACKEND (URGENTE)

### Ubicación
Archivo PHP que maneja el proceso `2370` (Eliminar beneficiario)

### Cambio Crítico - UNA LÍNEA
```php
// ❌ ANTES (INCORRECTO):
$codctac = desencriptar($datos['codctac']);

// ✅ DESPUÉS (CORRECTO):
$codctac = $datos['codctac']; // Usar valor SIN modificar
```

### Cambio en fncrevisa_encrypt()
```php
// Remover 'codctac' de la lista de campos a encriptar en proceso 2370
$encryptFields = [
    '2370' => ['idecl', 'ideclr'] // ⚠️ NO incluir 'codctac'
];
```

### Query DELETE
```php
// Usar $codctac sin desencriptar en la query
$sql = "DELETE FROM beneficiarios 
        WHERE idecl = ? 
        AND codctac = ?"; // Comparar con valor encriptado

$stmt->bind_param("ss", $idecl, $codctac);
```

## 🧪 Prueba de Validación

1. Intentar eliminar un beneficiario desde el frontend
2. Verificar logs del backend:
   ```
   codctac recibido: GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=
   codctac en DB:    GlHKhWv0W4QiPY8LjqBy7x6oTfdz8AFz8ByBSB69PcA=
   ¿COINCIDEN?: SI ✅
   affected_rows: 1
   ```
3. Recargar frontend → Beneficiario debe DESAPARECER

## 📋 Checklist para el Backend

- [ ] Localizar función que maneja proceso 2370
- [ ] Cambiar `$codctac = desencriptar(...)` por `$codctac = $datos['codctac']`
- [ ] Remover 'codctac' de array de campos a encriptar
- [ ] Agregar logs temporales para verificar coincidencia
- [ ] Probar eliminación
- [ ] Confirmar que `affected_rows > 0`

## 📁 Documentación Completa
Ver: `INSTRUCCIONES_BACKEND_ELIMINAR_BENEFICIARIOS.md` para explicación detallada con ejemplos de código PHP.

---
**Fecha:** 31 de Octubre 2025
**Prioridad:** 🔴 CRÍTICA - Funcionalidad bloqueada
