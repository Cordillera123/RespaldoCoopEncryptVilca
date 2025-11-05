#!/bin/bash
# Script simple de deployment

echo "🚀 Iniciando deployment..."

# Build
echo "📦 Construyendo aplicación..."
npm run build

# Copiar al servidor
echo "📤 Copiando archivos..."
sudo rm -rf /var/www/webApp/*
sudo cp -r dist/* /var/www/webApp/

# Permisos
echo "🔐 Configurando permisos..."
sudo chown -R www-data:www-data /var/www/webApp
sudo find /var/www/webApp -type d -exec chmod 755 {} \;
sudo find /var/www/webApp -type f -exec chmod 644 {} \;

# Recargar Nginx
echo "🔄 Recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completado!"
echo "🌐 Aplicación disponible en: http://192.168.0.59"
