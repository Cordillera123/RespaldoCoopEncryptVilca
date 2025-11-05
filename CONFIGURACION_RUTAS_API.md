# 🎯 Configuración Final - Sistema de Rutas API

## 📋 Resumen de Cambios

### ✅ Implementado: Sistema de Rutas Relativas

El proyecto ahora usa **rutas relativas** que Nginx resuelve automáticamente al backend PHP.

---

## 🔧 Configuración en `apiService.js`

```javascript
const API_CONFIG = {
  baseUrl: '/api/prctrans.php',         // API principal
  baseUrlWithL: '/api-l/prctrans.php',  // API con 'L' (procesos específicos)
  token: '0999SolSTIC20220719',
  timeout: 30000
};
```

### 🎯 Lógica de Selección de Ruta

```javascript
// Procesos que requieren /api-l/
const CODES_REQUIRING_L_URL = [
  '2180', // Financial summary
  '2148', // Validate username
  '2151', // Validate password
  '2371', // Investment types/terms
  '2213', // Investment detail
  '2374', // Accounts for investment
  '2369', // Investment parameters
  '2372', // Interest payment types
  '2373', // Investment calculation
  '2310', // Financial institutions
  '2375'  // Register investment
];

// Función que selecciona automáticamente
function getUrlForProcess(processCode) {
  return CODES_REQUIRING_L_URL.includes(String(processCode)) 
    ? '/api-l/prctrans.php' 
    : '/api/prctrans.php';
}
```

---

## 🌐 Cómo Funciona con Nginx

### En Desarrollo (`npm run dev`):
```
React App (localhost:3000)
    ↓
Vite Proxy (vite.config.js)
    ↓
Backend PHP (192.168.200.102)
```

### En Producción (192.168.0.59):
```
React App (http://192.168.0.59)
    ↓ Request: /api/prctrans.php
Nginx (192.168.0.59)
    ↓ Proxy to: /var/www/wsVirtualCoopSrvP/ws_server/prctrans.php
Backend PHP
```

---

## 📝 Configuración de Nginx (Ya está hecha)

```nginx
# /api/ → Backend principal
location /api/ {
    rewrite ^/api/(.*)$ /$1 break;
    root /var/www/wsVirtualCoopSrvP/ws_server;
    
    location ~ \.php$ {
        root /var/www/wsVirtualCoopSrvP/ws_server;
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
}

# /api-l/ → Backend con 'L'
location /api-l/ {
    rewrite ^/api-l/(.*)$ /$1 break;
    root /var/www/wsVirtualCoopSrvP/ws_server;
    
    location ~ \.php$ {
        root /var/www/wsVirtualCoopSrvP/ws_server;
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
}
```

---

## 🔍 Ejemplo de Request

### Desde React:
```javascript
// Proceso 2100 (login) → usa /api/
const response = await apiService.makeRequest({
  prccode: '2100',
  usr: 'usuario123',
  pwd: 'password'
});

// URL real: http://192.168.0.59/api/prctrans.php
```

```javascript
// Proceso 2213 (investment detail) → usa /api-l/
const response = await apiService.makeRequest({
  prccode: '2213',
  idecl: '0200594729',
  codinv: '12345'
});

// URL real: http://192.168.0.59/api-l/prctrans.php
```

---

## ✅ Ventajas de Esta Configuración

1. **✅ Sin hardcoding de IPs** - Todo relativo
2. **✅ Funciona en dev y prod** - Sin cambios
3. **✅ Nginx maneja el proxy** - Centralizado
4. **✅ Fácil de mantener** - Un solo lugar para cambios
5. **✅ No necesita .env** - Las claves están en `constants.js`

---

## 🚀 Deployment

```bash
# 1. Build
npm run build

# 2. Copiar al servidor
sudo cp -r dist/* /var/www/webApp/

# 3. Permisos
sudo chown -R www-data:www-data /var/www/webApp

# 4. Recargar Nginx
sudo systemctl reload nginx
```

---

## 🧪 Testing

### Verificar que funciona:

1. **Abrir navegador:** http://192.168.0.59
2. **Login:** Usar credenciales reales
3. **DevTools (F12) → Network:**
   - Login (`2100`) debe ir a `/api/prctrans.php`
   - Inversiones (`2213`) debe ir a `/api-l/prctrans.php`

### Verificar encriptación:
```javascript
// En consola del navegador
// Request debe mostrar campos encriptados
// Response debe desencriptarse automáticamente
```

---

## 📊 Mapeo Completo de Rutas

| Proceso | Descripción | Ruta |
|---------|-------------|------|
| 2100 | Login | `/api/` |
| 2180 | Financial summary | `/api-l/` |
| 2201 | Productos (ahorros/créditos) | `/api/` |
| 2213 | Investment detail | `/api-l/` |
| 2310 | Instituciones financieras | `/api-l/` |
| 2355 | Transferencias | `/api/` |
| 2369 | Investment parameters | `/api-l/` |
| 2371 | Investment types | `/api-l/` |
| 2372 | Interest payment types | `/api-l/` |
| 2373 | Investment calculation | `/api-l/` |
| 2374 | Accounts for investment | `/api-l/` |
| 2375 | Register investment | `/api-l/` |

**Todos los demás procesos** usan `/api/`

---

## 🔧 Agregar Nuevos Procesos

Si necesitas que un nuevo proceso use `/api-l/`:

```javascript
// En apiService.js, agregar a CODES_REQUIRING_L_URL:
const CODES_REQUIRING_L_URL = [
  '2180', '2148', '2151', '2371', '2213', 
  '2374', '2369', '2372', '2373', '2310', '2375',
  '2XXX'  // ← Tu nuevo código aquí
];
```

---

## 📚 Archivos Relevantes

```
src/
├── services/
│   └── apiService.js       ← Configuración de rutas
├── utils/
│   └── crypto/
│       └── constants.js    ← Claves AES
vite.config.js              ← Proxy para desarrollo
```

---

**Última actualización:** 2025-11-05  
**Estado:** ✅ Listo para producción
