# Fix: Facilito - URL Dinámica desde Base de Datos

## 🎯 Problema Identificado

El sistema tenía URLs quemadas (hardcoded) para el servicio Facilito:
```javascript
// ❌ ANTES: URL quemada
urlFacilito: 'https://pagos.facilito.com.ec/aplicacion/coac_las_naves'
```

**Impacto:** Si el ingeniero cambiaba la URL en la base de datos (campo `urlpgfcl`), el frontend seguía usando la URL antigua hardcoded.

## ✅ Solución Implementada

### 1. **Servicio API (`apiService.js`)**

**Cambios realizados:**
- ✅ Eliminadas **TODAS** las URLs quemadas de Facilito
- ✅ Ahora usa **SOLO** el campo `urlpgfcl` de la base de datos (proceso 2000)
- ✅ Implementado flag `urlDisponible` para controlar visibilidad del botón

**Lógica implementada:**

```javascript
async getServiciosFacilito(cedula) {
  // 1. Consultar API proceso 2000
  const result = await this.makeRequest({ prccode: '2000', idecl: cedula });
  
  if (result.success) {
    const urlpgfcl = result.data.urlpgfcl;
    
    // 2. VALIDAR si urlpgfcl está vacío
    if (!urlpgfcl || urlpgfcl.trim() === '') {
      // ❌ URL NO DISPONIBLE
      return {
        success: true,
        data: {
          urlFacilito: null,
          urlOriginal: null,
          urlDisponible: false,  // ← Flag para ocultar botón
          serviciosInfo: result.data
        }
      };
    }
    
    // ✅ URL EXISTE - Procesarla
    const proxyUrl = this.getFacilitoProxyUrl(urlpgfcl);
    
    return {
      success: true,
      data: {
        urlFacilito: proxyUrl,       // URL con proxy (desarrollo)
        urlOriginal: urlpgfcl,        // URL original de BD
        urlDisponible: true,          // ← Flag para mostrar botón
        serviciosInfo: result.data
      }
    };
  }
}
```

### 2. **Componente UI (`ServiciosFacilitoForm.jsx`)**

**Cambios realizados:**
- ✅ Ahora verifica `urlDisponible` en lugar de `urlFacilito` o `urlOriginal`
- ✅ Renderizado condicional del botón basado en flag booleano
- ✅ Mensaje claro cuando servicio no está disponible

**Renderizado condicional:**

```jsx
{serviciosInfo?.urlDisponible ? (
  // ✅ MOSTRAR BOTÓN si urlDisponible === true
  <button onClick={openFacilito} className="...">
    Acceder a Facilito
  </button>
) : (
  // ❌ MOSTRAR ADVERTENCIA si urlDisponible === false
  <div className="bg-amber-50 border border-amber-200">
    <strong>Servicio no disponible:</strong> 
    La plataforma de pagos no está configurada...
  </div>
)}
```

## 🔄 Flujo de Trabajo

```
┌─────────────────────────────────────────────────┐
│ 1. Usuario accede a Servicios Facilito         │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 2. API consulta proceso 2000 con cédula        │
│    Request: { prccode: "2000", idecl: "..." }  │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 3. Backend responde con serviciosInfo          │
│    Response: {                                  │
│      urlpgfcl: "..." ← Campo clave             │
│      nommatri: "...",                          │
│      tlfconve: "...",                          │
│      ...                                       │
│    }                                           │
└────────────┬────────────────────────────────────┘
             │
             ▼
        ┌────┴────┐
        │ ¿Vacío? │
        └────┬────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ SÍ            NO ▼
┌─────────┐      ┌─────────┐
│ urlpgfcl│      │ urlpgfcl│
│ = ""    │      │ = URL   │
└────┬────┘      └────┬────┘
     │                │
     ▼                ▼
┌─────────┐      ┌─────────┐
│ return: │      │ return: │
│ {       │      │ {       │
│  url    │      │  url    │
│  Disp.  │      │  Disp.  │
│  = false│      │  = true │
│ }       │      │ }       │
└────┬────┘      └────┬────┘
     │                │
     └────────┬───────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ 4. UI verifica urlDisponible                   │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ true        false ▼
┌─────────┐      ┌─────────┐
│ Mostrar │      │ Mostrar │
│ BOTÓN   │      │ MENSAJE │
│ "Acceder│      │ "Servic.│
│ Facilito│      │ no disp"│
└─────────┘      └─────────┘
```

## 📊 Respuesta API Ejemplo

### Caso 1: URL Disponible (urlpgfcl con valor)
```json
{
  "tlfconve": "(03)2996730",
  "tlfcelul": "0IfyL3amaX+1lOUtOZYlQA==",
  "nommatri": "Oficina Matriz",
  "urlpgfcl": "https://pagos.facilito.com.ec/aplicacion/coac_las_naves",
  "dirmatri": "Matriz Calle 12 de Octubre...",
  "infemail": "info@coopcacvil.fin.ec",
  "urlcoope": "www.coopcacvil.fin.ec"
}
```
**Resultado:** `urlDisponible = true` → Botón visible ✅

### Caso 2: URL No Disponible (urlpgfcl vacío)
```json
{
  "tlfconve": "(03)2996730",
  "tlfcelul": "0IfyL3amaX+1lOUtOZYlQA==",
  "nommatri": "Oficina Matriz",
  "urlpgfcl": "",
  "dirmatri": "Matriz Calle 12 de Octubre...",
  "infemail": "info@coopcacvil.fin.ec",
  "urlcoope": "www.coopcacvil.fin.ec"
}
```
**Resultado:** `urlDisponible = false` → Mensaje de advertencia ⚠️

## 🧪 Testing

### Probar Caso 1: URL Disponible
1. Verificar en BD que `urlpgfcl` tenga valor
2. Acceder a Servicios Facilito
3. **Resultado esperado:** Botón "Acceder a Facilito" visible y funcional

### Probar Caso 2: URL No Disponible
1. Actualizar BD para que `urlpgfcl` esté vacío (`""`)
2. Acceder a Servicios Facilito
3. **Resultado esperado:** Mensaje amarillo "Servicio no disponible"

### Verificar Logs en Consola
```javascript
// Logs que deberías ver:
🏪 [FACILITO] Obteniendo servicios Facilito para cédula: ***1234
📤 [FACILITO] Solicitando información de servicios
🔍 [FACILITO] Respuesta completa del servidor
🔍 [FACILITO] Campo urlpgfcl: [valor o vacío]
🔍 [FACILITO] ¿urlpgfcl está vacío?: true/false

// Si URL disponible:
✅ [FACILITO] URL encontrada en BD: https://...
🎯 [FACILITO] URL procesada: [URL con proxy o original]

// Si URL NO disponible:
⚠️ [FACILITO] URL no disponible en la base de datos (campo vacío)
```

## ✅ Checklist de Validación

- [x] Eliminadas todas las URLs quemadas de `apiService.js`
- [x] Implementado flag `urlDisponible` en respuesta del servicio
- [x] Componente UI usa `urlDisponible` para renderizado condicional
- [x] Mensaje claro cuando servicio no disponible
- [x] Logs de debugging implementados
- [x] URL se obtiene 100% desde base de datos (campo `urlpgfcl`)
- [x] Botón solo aparece cuando URL existe en BD
- [x] Sistema funciona con proxy en desarrollo y URL directa en producción

## 🎯 Beneficios

1. **✅ Flexibilidad:** Ingeniero puede cambiar URL en BD sin tocar código
2. **✅ Seguridad:** No hay URLs hardcoded en el código fuente
3. **✅ UX Mejorado:** Usuario ve mensaje claro si servicio no disponible
4. **✅ Mantenibilidad:** Un solo punto de verdad (base de datos)
5. **✅ Debugging:** Logs detallados para troubleshooting

## 📝 Notas Importantes

- El campo `urlpgfcl` viene del proceso **2000** (servicio de información cooperativa)
- Si `urlpgfcl` está vacío (`""`), el servicio **NO** muestra el botón
- El proxy (`getFacilitoProxyUrl`) solo se usa en **desarrollo** (evita CORS)
- En **producción**, se usa la URL directamente de la BD

---

**Fecha:** 2025-12-01  
**Archivo modificado:** `src/services/apiService.js`, `src/components/dashboard/ServiciosFacilitoForm.jsx`  
**Proceso API:** 2000  
**Campo clave:** `urlpgfcl`
