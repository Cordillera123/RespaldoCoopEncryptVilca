# 🧪 GUÍA RÁPIDA: CÓMO PROBAR EL SISTEMA DE ENCRIPTACIÓN

## 🚀 Método 1: Página Visual de Pruebas (RECOMENDADO)

### Paso 1: Iniciar el servidor
```powershell
npm run dev
```

### Paso 2: Abrir el navegador
- Ve a: **http://localhost:3001**

### Paso 3: Acceder a la página de pruebas
- Busca el **botón flotante morado con el emoji 🔐** en la esquina inferior derecha
- Haz clic en él

### Paso 4: Realizar pruebas

**Test 1: Encriptación Básica**
1. Escribe un texto en el campo (ejemplo: `0200594729`)
2. Click en **🔒 Encriptar** → verás el texto encriptado en Base64
3. Click en **🔓 Desencriptar** → verás el texto original
4. Click en **🔄 Roundtrip Test** → valida que encriptar + desencriptar = original

**Test 2: Encriptación de Request (API 2351)**
1. Ve a la sección "Test 2"
2. Click en **🔒 Encriptar Campos Sensibles**
3. Verás cómo los campos `idecl` y `codctad` se encriptan automáticamente
4. Los campos `tkn` y `prccode` permanecen sin encriptar

**Test 3: Diagnóstico del Sistema**
- Verifica que aparezcan ✅ en:
  - Encriptación: Habilitada
  - KEY Configurada: Sí
  - IV Configurado: Sí
  - APIs Mapeadas: 25+ procesos

---

## 🧪 Método 2: Consola del Navegador

### Paso 1: Abrir DevTools
- Presiona **F12** o **Ctrl+Shift+I**
- Ve a la pestaña **Console**

### Paso 2: Ver tests automáticos
Al cargar la página, deberías ver:
```
🧪 ========== TEST 1: INICIALIZACIÓN ==========
✅ Configuración de encriptación validada correctamente
🧪 ========== TEST 2: ENCRIPTACIÓN BÁSICA ==========
📤 Texto original: 0200594729
🔒 Texto encriptado: U2FsdGVkX1...
🔓 Texto desencriptado: 0200594729
✅ ¿Coinciden? ✅ SÍ
...
```

### Paso 3: Ejecutar pruebas manuales
```javascript
// Test rápido
window.cryptoTests.quickTest("0200594729")

// Encriptar un valor
window.cryptoTests.encrypt("mi dato sensible")

// Desencriptar un valor
window.cryptoTests.decrypt("U2FsdGVkX1...")

// Ver diagnóstico completo
window.cryptoTests.getDiagnostics()

// Probar encriptación de request
window.cryptoTests.encryptRequest({
  prccode: "2351",
  idecl: "0200594729",
  codctad: "420101004676"
})
```

---

## 📊 Qué Verificar

### ✅ Checklist de Validación

- [ ] **Test de inicialización pasa** (estado: success)
- [ ] **KEY e IV configurados** (keyConfigured: true, ivConfigured: true)
- [ ] **Roundtrip funciona** (encriptar + desencriptar = original)
- [ ] **Campos sensibles se encriptan** (idecl, codctad cambian)
- [ ] **Campos no sensibles permanecen** (tkn, prccode no cambian)
- [ ] **25+ APIs mapeadas** (mappedProcesses >= 25)

### 🔍 Logs Esperados en Consola

```
[CRYPTO-INFO] ✅ Configuración de encriptación validada correctamente
[CRYPTO-ENCRYPT] ✅ Texto encriptado correctamente (10 chars)
[CRYPTO-DECRYPT] ✅ Texto desencriptado correctamente (10 chars)
[CRYPTO-INFO] Campos a encriptar para 2351: idecl, codctad
```

---

## 🐛 Solución de Problemas

### Problema: No aparece el botón flotante 🔐

**Solución:** El botón solo aparece en modo desarrollo.
```powershell
# Asegúrate de usar:
npm run dev
# NO usar:
npm run build && npm run preview
```

### Problema: Error "KEY not configured"

**Solución:** Verifica que exista el archivo `.env.local`:
```env
VITE_AES_KEY=C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca
VITE_AES_IV=PTk6KaVZxN04SXz0
VITE_ENCRYPTION_ENABLED=true
```

Reinicia el servidor después de crear/modificar el archivo.

### Problema: Tests no aparecen en consola

**Solución:** 
1. Refresca la página (Ctrl+R o F5)
2. Verifica que `src/main.jsx` tenga el import de `test-crypto.js`
3. Limpia la caché del navegador (Ctrl+Shift+Delete)

### Problema: Encriptación falla

**Solución:**
1. Ejecuta en consola: `window.cryptoTests.getDiagnostics()`
2. Verifica que `keyConfigured` y `ivConfigured` sean `true`
3. Si son `false`, revisa el archivo `.env.local`

---

## 🎯 Prueba de Compatibilidad con PHP

Para validar que la encriptación es compatible con el backend PHP:

### Paso 1: Obtener valor encriptado
```javascript
window.cryptoTests.encrypt("0200594729")
// Copia el resultado, ejemplo: "U2FsdGVkX1..."
```

### Paso 2: Enviarlo al backend
```javascript
fetch('http://192.168.200.25/wsVirtualCoopSrvL/ws_server/prctrans.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tkn: "0999SolSTIC20220719",
    prccode: "2351",
    idecl: "U2FsdGVkX1...", // ← Valor encriptado
    codctad: "420101004676"
  })
})
```

### Paso 3: Verificar respuesta
El backend PHP debe poder desencriptar el valor y procesarlo correctamente.

---

## 📝 Próximos Pasos

Una vez validado que el sistema funciona:

1. ✅ **Sprint 1 completado** - Módulo core funcionando
2. ⏭️ **Sprint 2 pendiente** - Integrar con `apiService.js`
3. ⏭️ **Sprint 3 pendiente** - Testing end-to-end con APIs reales

---

## 💡 Tips Útiles

- **Los logs solo aparecen en desarrollo** - En producción están desactivados
- **Puedes desactivar encriptación** - Cambia `VITE_ENCRYPTION_ENABLED=false` en `.env.local`
- **El botón 🔐 no aparece en login** - Es normal, solo en modo desarrollo
- **Los tests se ejecutan automáticamente** - Al cargar la página en desarrollo
- **Usa la página visual** - Es más fácil que la consola para pruebas rápidas

---

**¿Tienes dudas?** Revisa:
- `ENCRYPTION_IMPLEMENTATION_SPRINT1.md` - Documentación completa
- `src/utils/crypto/` - Código fuente con ejemplos
- Consola del navegador - Logs detallados en desarrollo
