# ✅ Proyecto Simplificado - Listo para Producción

## 📦 Lo que quedó (esencial)

### Archivos de configuración:
- ✅ `vite.config.js` - Configuración simplificada de Vite
- ✅ `package.json` - Scripts básicos (dev, build, lint)
- ✅ `.gitignore` - Limpio y simple

### Código fuente:
- ✅ `src/` - Todo el código React
- ✅ `src/utils/crypto/constants.js` - **Claves AES aquí**
- ✅ `src/services/apiService.js` - **API con rutas relativas (Nginx hace proxy)**

### Documentación:
- ✅ `README.md` - Guía simplificada
- ✅ `DEPLOYMENT_SIMPLE.md` - Proceso de deployment
- ✅ `deploy-simple.sh` - Script opcional (si quieres automatizar)

---

## 🚀 Deployment (4 pasos)

```bash
# 1. Build
npm run build

# 2. Copiar
sudo cp -r dist/* /var/www/webApp/

# 3. Permisos
sudo chown -R www-data:www-data /var/www/webApp

# 4. Recargar
sudo systemctl reload nginx
```

**¡Eso es todo!** 🎉

---

## 🔐 Claves de Encriptación

Están en: `src/utils/crypto/constants.js`

```javascript
KEY: 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca'  // 32 caracteres
IV: 'PTk6KaVZxN04SXz0'                   // 16 caracteres
```

**⚠️ IMPORTANTE:** Deben coincidir con el backend PHP.

---

## 🌐 Rutas de API (Nginx Proxy)

El sistema usa **rutas relativas** y Nginx hace el proxy al backend PHP:

```javascript
// src/services/apiService.js
const API_CONFIG = {
  baseUrl: '/api/prctrans.php',         // → Nginx proxy a backend
  baseUrlWithL: '/api-l/prctrans.php',  // → Nginx proxy a backend
};
```

### Procesos que usan `/api-l/`:
- `2180`, `2148`, `2151` - Autenticación y validaciones
- `2213`, `2369`, `2371`, `2372`, `2373`, `2374`, `2375` - Inversiones
- `2310` - Instituciones financieras

**Todos los demás** usan `/api/`

**Configuración Nginx:** Ya está configurada en el servidor (192.168.0.59)

---

## 🗑️ Lo que se eliminó (innecesario)

- ❌ `.env.production` (no lo necesitas)
- ❌ `.env.example` (no lo necesitas)
- ❌ `deploy.sh` (muy complejo)
- ❌ `verify-deployment.sh` (innecesario)
- ❌ `DEPLOYMENT_GUIDE.md` (demasiado)
- ❌ `ENV_VARIABLES_DOCS.md` (no usas .env)
- ❌ `PRODUCTION_CHECKLIST.md` (overkill)
- ❌ `QUICK_START.md` (redundante)

---

## 📊 Comandos Disponibles

```bash
npm run dev       # Desarrollo (puerto 3000)
npm run build     # Build producción → dist/
npm run preview   # Preview del build
npm run lint      # Verificar código
npm run format    # Formatear código
npm run clean     # Limpiar dist/
```

---

## 🌐 URLs

- **Desarrollo:** http://localhost:3000
- **Producción:** http://192.168.0.59
- **API Backend:** http://192.168.0.59/api-l/prctrans.php

---

## ✅ Checklist Final

Antes de hacer deployment:

- [ ] `npm run build` se completa sin errores
- [ ] Carpeta `dist/` generada correctamente
- [ ] Claves en `constants.js` coinciden con backend PHP
- [ ] Servidor 192.168.0.59 accesible
- [ ] Nginx configurado (ya está)

---

**Todo listo para producción!** 🚀

Solo haz `npm run build` y copia `dist/` al servidor.
