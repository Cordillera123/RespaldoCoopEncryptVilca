# Implementación: Personalización de Cupos

## 📋 Resumen
Se ha creado el nuevo módulo de **Personalización de Cupos** que permite a los usuarios configurar límites máximos diarios de transferencia por cuenta individual.

## 🎨 Componente Creado

### `CupoComponent.jsx`
Ubicación: `src/components/dashboard/CupoComponent.jsx`

#### Características Principales:
- ✅ **4 Vistas Completas**: Select → Configure → Verify → Success
- ✅ **Diseño Coherente**: Sigue el patrón visual de InternaTransferWindow y CertificadosForm
- ✅ **Validación OTP**: Sistema de verificación con código de 6 dígitos
- ✅ **Sistema de Intentos**: Máximo 3 intentos con bloqueo automático
- ✅ **Cooldown de Reenvío**: 60 segundos entre solicitudes de código
- ✅ **Responsive**: Adaptable a diferentes tamaños de pantalla
- ✅ **Animaciones**: Transiciones suaves y feedback visual

## 🔄 Flujo de Usuario

### Vista 1: Selección de Cuenta
```
┌─────────────────────────────────────┐
│  Personaliza tus cupos              │
│  Configura el monto máximo diario   │
├─────────────────────────────────────┤
│  [i] Información sobre cupos        │
├─────────────────────────────────────┤
│  Cuenta a configurar:               │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏦 Cuenta De Ahorros Nacional│ │
│  │ Nro. 12009333652             │ │
│  │ Saldo: $115.75               │ │
│  │                Cupo: Sin cupo│ │
│  │                           ✏️ │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Más cuentas...]                   │
└─────────────────────────────────────┘
```

### Vista 2: Configuración de Monto
```
┌─────────────────────────────────────┐
│  ← Regresar                         │
├─────────────────────────────────────┤
│  🏦 Cuenta De Ahorros Nacional      │
│     Nro. 12009333652 | Saldo $115.75│
├─────────────────────────────────────┤
│  Monto máximo diario                │
│                                     │
│  $ [________]                       │
│                                     │
│  [i] Tu cupo actual es...           │
│      Esta configuración se          │
│      realizará de forma inmediata.  │
├─────────────────────────────────────┤
│  [Cancelar]      [Continuar]        │
└─────────────────────────────────────┘
```

### Vista 3: Verificación OTP
```
┌─────────────────────────────────────┐
│  ← Regresar                         │
├─────────────────────────────────────┤
│         🔒                          │
│    Confirmar identidad              │
│    Para tu seguridad...             │
├─────────────────────────────────────┤
│  Resumen de configuración           │
│  Cuenta: 12009333652                │
│  Cupo anterior: Sin cupo            │
│  Nuevo cupo: $100.00                │
├─────────────────────────────────────┤
│  [Enviar código de verificación]    │
│                                     │
│  O después de enviar:               │
│                                     │
│  [_] [_] [_] [_] [_] [_]           │
│                                     │
│  Reenviar código en 60s             │
├─────────────────────────────────────┤
│  [Confirmar configuración]          │
└─────────────────────────────────────┘
```

### Vista 4: Éxito
```
┌─────────────────────────────────────┐
│         ✅                          │
│  ¡Configuración exitosa!            │
│  El cupo diario ha sido actualizado │
├─────────────────────────────────────┤
│  Cuenta configurada: 12009333652    │
│  Nuevo cupo diario: $100.00         │
├─────────────────────────────────────┤
│  [i] Esta configuración estará      │
│      activa de inmediato            │
├─────────────────────────────────────┤
│  [Volver a mis cuentas]             │
└─────────────────────────────────────┘
```

## 🎨 Elementos de Diseño

### Colores Utilizados:
- **Gradientes primarios**: `from-blue-500 to-sky-600`
- **Gradientes de acción**: `from-green-600 to-green-700`
- **Fondos**: `from-blue-50 via-white to-sky-50`
- **Alertas informativas**: `bg-blue-50 border-blue-200`
- **Alertas de advertencia**: `bg-yellow-50 border-yellow-200`
- **Alertas de error**: `bg-red-50 border-red-200`

### Iconos (react-icons/md):
- `MdAccountBalance` - Icono de cuenta bancaria
- `MdEdit` - Icono de editar
- `MdCheckCircle` - Icono de éxito
- `MdArrowBack` - Botón regresar
- `MdInfo` - Información
- `MdSecurity` - Seguridad/OTP
- `MdAttachMoney` - Dinero/Cupos

### Animaciones:
- Hover effects en tarjetas de cuenta
- Scale en iconos al hover
- Bounce animation en éxito
- Spin loader para carga
- Transiciones suaves en cambios de vista

## 🔧 Integración al Sistema

### 1. Archivo de Menú (`menuConfig.js`)
```javascript
{
  id: 'cupos-personalizados',
  label: 'Personalización de Cupos',
  component: 'CupoComponent',
  iconType: 'custom',
  customIcon: '💰',
  description: 'Configura límites diarios de transferencia',
  color: 'gold'
}
```

### 2. Dashboard (`Dashboard.jsx`)
- ✅ Importación del componente
- ✅ Registro en componentMap
- ✅ Título corto en taskbar

### 3. Exportación (`index.js`)
- ✅ Exportado desde `dashboard/index.js`

## 🔌 APIs a Implementar (Pendiente)

### 1. Cargar Cuentas del Usuario
```javascript
// TODO: Reemplazar mockAccounts con API real
const loadAccounts = async () => {
  // API para obtener cuentas con sus cupos actuales
  // Debería retornar: id, name, number, balance, currentLimit, defaultLimit
};
```

### 2. Solicitar Código OTP
```javascript
// TODO: Implementar llamada a API
const handleRequestOTP = async () => {
  // API: requestSecurityCodeForRegistration(cedula)
  // Similar al usado en NewContact.jsx
};
```

### 3. Validar Código OTP
```javascript
// TODO: Implementar validación con API
const handleValidateOTP = async () => {
  // API: validateSecurityCodeForRegistration(cedula, idemsg, code)
};
```

### 4. Actualizar Cupo de Cuenta
```javascript
// TODO: Implementar después de validación exitosa
// Nuevo proceso de API para actualizar el cupo diario
// Debería recibir: accountId, newLimit
// Debería retornar: success, message
```

## 📍 Ubicación en el Menú

```
Dashboard
└── Servicios
    ├── Pago de Servicios Facilito 💡
    ├── Certificados 📜
    └── Personalización de Cupos 💰 ← NUEVO
```

## 🎯 Estados del Componente

### Estados Principales:
- `currentView`: 'select' | 'configure' | 'verify' | 'success'
- `selectedAccount`: Cuenta seleccionada para configurar
- `customLimit`: Monto del nuevo cupo
- `accounts`: Array de cuentas disponibles

### Estados OTP:
- `otpCode`: Array de 6 dígitos [string]
- `otpSent`: Boolean - si ya se envió el código
- `otpError`: Mensaje de error en validación
- `attempts`: Contador de intentos (max 3)
- `canResend`: Boolean - si puede reenviar código
- `countdown`: Segundos restantes para reenvío

## 🎨 Guía de Estilos Aplicada

### Estructura de Card:
```jsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
  {/* Contenido */}
</div>
```

### Botones Principales:
```jsx
// Botón de acción (verde)
className="bg-gradient-to-r from-green-600 to-green-700 text-white 
           font-semibold rounded-xl hover:from-green-700 
           hover:to-green-800 transition-all shadow-lg"

// Botón secundario (azul)
className="bg-gradient-to-r from-blue-600 to-sky-700 text-white 
           font-semibold rounded-xl hover:from-blue-700 
           hover:to-sky-800 transition-all shadow-lg"

// Botón cancelar
className="border-2 border-gray-300 text-gray-700 font-semibold 
           rounded-xl hover:bg-gray-50 transition-colors"
```

### Input de Monto:
```jsx
<input 
  type="text"
  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 
             rounded-xl focus:border-blue-500 focus:ring-4 
             focus:ring-blue-100 transition-all text-lg font-medium"
/>
```

### Input OTP:
```jsx
<input 
  type="text"
  maxLength="1"
  className="w-14 h-14 text-center text-2xl font-bold 
             border-2 border-gray-300 rounded-xl 
             focus:border-blue-500 focus:ring-4 
             focus:ring-blue-100 transition-all"
/>
```

## ✅ Funcionalidades Implementadas (Solo UI)

- ✅ Navegación entre vistas
- ✅ Selección de cuenta
- ✅ Validación de monto (básica)
- ✅ Input de 6 dígitos OTP con auto-focus
- ✅ Sistema de intentos (3 máximo)
- ✅ Countdown de 60 segundos
- ✅ Mensajes de error dinámicos
- ✅ Vista de éxito con resumen
- ✅ Botones de navegación (regresar)
- ✅ Loading states
- ✅ Responsive design
- ✅ Animaciones y transiciones

## 🚀 Próximos Pasos

1. **Integrar APIs reales** (Mañana con el otro AI)
   - Cargar cuentas del usuario
   - Solicitar OTP
   - Validar OTP
   - Actualizar cupo

2. **Agregar validaciones adicionales**
   - Validar que el monto no exceda límites del sistema
   - Validar saldo disponible vs cupo solicitado

3. **Mejorar UX**
   - Agregar tooltips informativos
   - Agregar confirmación antes de cancelar
   - Agregar historial de cambios de cupo

4. **Testing**
   - Probar flujo completo
   - Validar estados de error
   - Verificar responsive en móviles

## 📝 Notas Importantes

- Los datos de cuentas actualmente son **mock data**
- Las APIs de OTP están **simuladas con timeouts**
- La actualización del cupo NO se persiste aún
- El diseño sigue exactamente el patrón de los otros componentes
- Todos los colores y estilos son consistentes con el sistema

## 🎨 Capturas de Diseño

El componente tiene 4 vistas principales que coinciden exactamente con las imágenes proporcionadas por el usuario, manteniendo:
- ✅ Layout de dos columnas en selección
- ✅ Información de cuenta con icono y saldo
- ✅ Input de monto con símbolo de dólar
- ✅ Resumen antes de confirmar
- ✅ Código OTP de 6 dígitos
- ✅ Mensaje de éxito con animación

---

**Estado**: ✅ Vistas completadas - Listo para integración de APIs
**Fecha**: Noviembre 12, 2025
**Desarrollador**: AI Assistant
