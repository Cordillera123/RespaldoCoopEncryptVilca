# 🏦 Cooperativa Las Naves - Frontend

Sistema de banca web para cooperativa de ahorro y crédito con seguridad AES-256-CBC.

## 🚀 Tecnologías

- **React 19** + **Vite 7**
- **Tailwind CSS**
- **crypto-js** (AES-256-CBC)
- **React Context API**

## 📋 Pre-requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0

## 🛠️ Instalación

```bash
git clone https://github.com/Cordillera123/RespaldoCoopEncryptVilca.git
cd RespaldoCoopEncryptVilca
npm install
```

## 💻 Desarrollo Local

```bash
npm run dev          # Puerto 3000
npm run lint         # Verificar código
npm run format       # Formatear código
```

## 🏗️ Build de Producción

```bash
npm run build
```

Esto genera la carpeta `dist/` con todos los archivos optimizados.

## 🚢 Deployment al Servidor (192.168.0.59)

```bash
# 1. Build
npm run build

# 2. Copiar al servidor
sudo cp -r dist/* /var/www/webApp/

# 3. Configurar permisos
sudo chown -R www-data:www-data /var/www/webApp
sudo find /var/www/webApp -type d -exec chmod 755 {} \;
sudo find /var/www/webApp -type f -exec chmod 644 {} \;

# 4. Recargar Nginx
sudo systemctl reload nginx
```

**Listo!** App disponible en: http://192.168.0.59

## 🔐 Configuración de Encriptación

Las claves AES están configuradas en:
```
src/utils/crypto/constants.js
```

```javascript
KEY: import.meta.env.VITE_AES_KEY || 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca',
IV: import.meta.env.VITE_AES_IV || 'PTk6KaVZxN04SXz0'
```

**⚠️ IMPORTANTE:** Estas claves DEBEN coincidir con el backend PHP.

## 🌐 Servidor de Producción

- **URL:** http://192.168.0.59
- **Ruta Frontend:** `/var/www/webApp`
- **Backend API:** `/api-l/prctrans.php` (proxy Nginx → `/var/www/wsVirtualCoopSrvP/ws_server`)

## 📊 Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run clean` | Limpiar dist/ |

## � Documentación Técnica

- [Sistema de Encriptación](./ENCRYPTION_IMPLEMENTATION_SPRINT1.md)
- [Sistema de Transferencias](./TRANSFER_SYSTEM_DOCUMENTATION.md)
- [Deployment Simple](./DEPLOYMENT_SIMPLE.md)
- [Instrucciones AI](./.github/copilot-instructions.md)

## 📄 Licencia

MIT License

---

**Versión:** 1.0.0
