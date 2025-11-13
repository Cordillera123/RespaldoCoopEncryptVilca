# 🔧 Correcciones de Producción - Las Naves Cooperativa

## ✅ Problemas Corregidos

### 1. ❌ Error: X-Frame-Options en `<meta>` tag
**Problema:** Los headers de seguridad HTTP no pueden configurarse mediante meta tags en HTML.
```html
<!-- ❌ INCORRECTO (causaba warning) -->
<meta http-equiv="X-Frame-Options" content="DENY" />
```

**Solución:** Removidos los meta tags de seguridad del `index.html`. Ahora deben configurarse en el servidor web.

### 2. ❌ Error: 404 en rutas de assets
**Problema:** Las rutas con `/public/` no funcionan en producción porque Vite maneja automáticamente la carpeta `public/`.
```javascript
// ❌ INCORRECTO
import backgroundImage from "/public/assets/images/onu.jpg";

// ✅ CORRECTO
import backgroundImage from "/assets/images/onu.jpg";
```

**Archivos corregidos:**
- ✅ `index.html` - Logo en loading screen
- ✅ `LoginPage.jsx` - Background + Logo
- ✅ `App.jsx` - Logo en pantalla de carga
- ✅ `BlockUser.jsx` - Background
- ✅ `CodigoPage.jsx` - Background
- ✅ `ForgotPassword.jsx` - Background
- ✅ `IdentityValidationPage.jsx` - Background
- ✅ `SecurityQuestionsPage.jsx` - Background
- ✅ `SecurityCodeValidationPage.jsx` - Background
- ✅ `RegisterPage.jsx` - Background
- ✅ `UserCredentialsPage.jsx` - Background
- ✅ `SecurityQuestionsPage1.jsx` - Background
- ✅ `SecurityCodeValidationPage1.jsx` - Background
- ✅ `TwoFactorAuthPage.jsx` - Background

---

## 🚀 Configuración del Servidor (NGINX)

### Paso 1: Copiar archivo de headers de seguridad

El archivo `nginx-security-headers.conf` contiene todos los headers de seguridad necesarios.

**Ubicación en el servidor:**
```bash
sudo cp nginx-security-headers.conf /etc/nginx/conf.d/security-headers.conf
```

### Paso 2: Incluir headers en tu configuración de Nginx

Edita tu archivo de configuración del sitio (ejemplo: `/etc/nginx/sites-available/lasnaves`):

```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    # Incluir headers de seguridad
    include /etc/nginx/conf.d/security-headers.conf;
    
    root /var/www/lasnaves/dist;
    index index.html;
    
    # Proxy para API backend
    location /api {
        proxy_pass http://192.168.0.59/wsVirtualCoopSrvL/ws_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api-l {
        proxy_pass http://192.168.0.59/wsVirtualCoopSrvL/ws_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SPA routing - todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Paso 3: Verificar y recargar Nginx

```bash
# Verificar configuración
sudo nginx -t

# Si todo está OK, recargar
sudo systemctl reload nginx
```

---

## 📦 Proceso de Build y Deploy

### 1. Build de producción
```bash
npm run build
```

Esto genera la carpeta `dist/` con:
- ✅ Assets optimizados en `/dist/assets/`
- ✅ Console.logs eliminados
- ✅ Código minificado
- ✅ Chunks optimizados (vendor, crypto)

### 2. Verificar estructura de `dist/`
```
dist/
├── index.html
├── assets/
│   ├── images/
│   │   ├── onu.jpg
│   │   └── logolasnaves_c.png
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── vendor-[hash].js
└── vite.svg
```

### 3. Subir al servidor
```bash
# Ejemplo con rsync
rsync -avz --delete dist/ usuario@servidor:/var/www/lasnaves/dist/

# O con SCP
scp -r dist/* usuario@servidor:/var/www/lasnaves/dist/
```

### 4. Verificar permisos
```bash
ssh usuario@servidor
cd /var/www/lasnaves
sudo chown -R www-data:www-data dist/
sudo chmod -R 755 dist/
```

---

## ✅ Verificación Post-Deploy

### Headers de Seguridad
Verifica que los headers estén configurados correctamente:

```bash
curl -I https://tudominio.com
```

Deberías ver:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: ...
Referrer-Policy: strict-origin-when-cross-origin
```

### Assets
Verifica que las imágenes carguen correctamente:
- Logo: `https://tudominio.com/assets/images/logolasnaves_c.png`
- Background: `https://tudominio.com/assets/images/onu.jpg`

### Consola del Navegador
- ❌ No debe aparecer: "X-Frame-Options may only be set via an HTTP header"
- ❌ No debe aparecer: "404 /public/assets/images/..."
- ✅ No debe haber errores en rojo

---

## 🔐 Seguridad Adicional (Opcional)

### SSL/TLS con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

### Habilitar HSTS
Una vez que tengas SSL activo, descomenta en `nginx-security-headers.conf`:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

---

## 📝 Notas Importantes

1. **Vite maneja automáticamente `/public/`**: Los archivos en la carpeta `public/` se copian a la raíz de `dist/` durante el build. Las rutas deben empezar con `/assets/`, NO con `/public/assets/`.

2. **Headers de seguridad**: Nunca uses `<meta http-equiv>` para headers de seguridad. Siempre configúralos en el servidor web.

3. **Console.logs eliminados**: En producción, todos los `console.log()` se eliminan automáticamente gracias a la configuración de Terser en `vite.config.js`.

4. **Cache de assets**: Los archivos estáticos tienen hash en el nombre (`index-abc123.js`), lo que permite cache agresivo sin problemas de versiones.

---

## 🆘 Troubleshooting

### Problema: "404 Not Found" en assets
**Causa:** Ruta incorrecta o permisos
**Solución:**
```bash
# Verificar que existan los archivos
ls -la /var/www/lasnaves/dist/assets/images/

# Verificar permisos
sudo chown -R www-data:www-data /var/www/lasnaves/dist/
```

### Problema: "CORS error" en API calls
**Causa:** Headers de proxy mal configurados
**Solución:** Asegúrate de tener en tu config de Nginx:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

### Problema: La página se ve en blanco
**Causa:** Error de JavaScript no capturado
**Solución:**
1. Abre DevTools (F12)
2. Revisa la pestaña Console
3. Busca errores en rojo
4. Si es un error de import, verifica las rutas de assets

---

## ✨ Resultado Final

Después de aplicar estas correcciones:
- ✅ No warnings de X-Frame-Options
- ✅ Todas las imágenes cargan correctamente
- ✅ Headers de seguridad configurados en el servidor
- ✅ Build optimizado para producción
- ✅ Console.logs eliminados
- ✅ Código minificado y con chunks optimizados

---

**Fecha:** 13 de Noviembre, 2025  
**Proyecto:** Las Naves Cooperativa - Sistema de Banca Web  
**Versión:** 2.0 (Con correcciones de producción)
