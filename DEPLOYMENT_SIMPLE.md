# 🚀 Deployment Simple

## Proceso Manual (4 pasos)

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

## Proceso con Script (1 paso)

```bash
chmod +x deploy-simple.sh
./deploy-simple.sh
```

## Verificar

Abrir navegador: http://192.168.0.59

## Rollback (si algo falla)

Si deployaste una versión anterior con `deploy.sh` (que hace backups):
```bash
sudo tar -xzf /var/backups/webApp/backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www/webApp/
sudo systemctl reload nginx
```

Si no tienes backup, vuelve a deployar la versión anterior desde Git:
```bash
git checkout [commit-anterior]
npm run build
sudo cp -r dist/* /var/www/webApp/
sudo systemctl reload nginx
```

## Notas

- ✅ Las claves AES están en `src/utils/crypto/constants.js`
- ✅ No necesitas `.env.production` (claves hardcodeadas)
- ✅ Nginx ya está configurado
- ✅ Backend en la misma IP: 192.168.0.59
