# Sistema de 3 Intentos para Código OTP

## 📋 Descripción General

Se ha implementado un sistema de control de intentos para el ingreso del código OTP en las transferencias internas. Este sistema mejora la seguridad y la experiencia del usuario al proporcionar retroalimentación clara sobre los intentos restantes.

## 🎯 Características Implementadas

### 1. **Sistema de 3 Intentos**
- El usuario tiene **3 intentos** para ingresar correctamente el código OTP
- Cada intento fallido muestra un mensaje claro con los intentos restantes
- Después de 3 intentos fallidos, se cancela automáticamente la transferencia

### 2. **Retroalimentación Visual**
- **Indicador de intentos restantes**: Se muestra un badge amarillo con el número de intentos disponibles
- **Mensajes claros**: Cada error muestra exactamente cuántos intentos quedan
- **Colores intuitivos**: 
  - Amarillo (amber) para advertencias de intentos restantes
  - Rojo para errores críticos

### 3. **Pantalla de Cancelación Mejorada**
- Después de 3 intentos fallidos, se muestra el `CancelComponent` por **20 segundos**
- El componente muestra:
  - Animación de error
  - Mensaje personalizado: "Has superado el número máximo de intentos (3). La transferencia será cancelada."
  - Countdown de 20 segundos
- Después de 20 segundos, regresa automáticamente a `InternaTransferWindow`

### 4. **Gestión de Tiempo Flexible**
- El `CancelComponent` ahora acepta un prop `countdown` (en segundos)
- Por defecto: 300 segundos (5 minutos)
- Para intentos fallidos: 20 segundos
- Muestra el tiempo restante en formato legible (minutos o segundos)

## 🔧 Componentes Modificados

### **CodeSecurityInternalTransfer.jsx**

**Estados añadidos:**
```javascript
const [attempts, setAttempts] = useState(0);
const MAX_ATTEMPTS = 3;
const cancelTimerRef = useRef(null);
```

**Lógica de intentos:**
```javascript
if (result.error.code === 'INVALID_OTP_CODE') {
  const newAttempts = attempts + 1;
  setAttempts(newAttempts);
  
  if (newAttempts >= MAX_ATTEMPTS) {
    // Mostrar CancelComponent por 20 segundos
    setShowErrorAnimation(true);
  } else {
    // Mostrar intentos restantes
    const remainingAttempts = MAX_ATTEMPTS - newAttempts;
    setError(`Código incorrecto. Te quedan ${remainingAttempts} intento(s)`);
  }
}
```

**Indicador visual en la UI:**
```jsx
{attempts > 0 && (
  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
    <svg>⚠️</svg>
    <span>{MAX_ATTEMPTS - attempts} intento(s) restante(s)</span>
  </div>
)}
```

**Regreso automático después de 20 segundos:**
```javascript
const handleErrorAnimationComplete = () => {
  if (attempts >= MAX_ATTEMPTS) {
    setTimeout(() => {
      if (openWindow) {
        openWindow('transfers'); // Regresar a InternaTransferWindow
      }
    }, 20000); // 20 segundos
  }
};
```

### **CancelComponent.jsx**

**Nueva prop `countdown`:**
```javascript
const CancelComponent = ({ 
  onComplete, 
  errorMessage = 'Error en la transferencia', 
  transferType = 'internal',
  countdown = 300 // ✅ NUEVO: configurable en segundos
}) => {
  // ...
  const countdownMs = countdown * 1000;
  // ...
}
```

**Mensaje dinámico:**
```jsx
<span className="text-gray-500 text-sm ml-3">
  {countdown >= 60 
    ? `Regresando en ${Math.ceil(countdown / 60)} min...`
    : `Regresando en ${countdown} seg...`
  }
</span>
```

## � **Flujo de Usuario**

```
1. Usuario ingresa código OTP
   ↓
2. Código incorrecto (Intento 1)
   → Mensaje rojo: "Código incorrecto. Te quedan 2 intentos"
   ↓
3. Código incorrecto (Intento 2)
   → Mensaje rojo: "Código incorrecto. Te queda 1 intento"
   ↓
4. Código incorrecto (Intento 3)
   → Se muestra CancelComponent
   → Mensaje: "Has superado el número máximo de intentos (3)..."
   → Countdown: 20 segundos
   ↓
5. Después de 20 segundos
   → Regresa automáticamente a InternaTransferWindow (Lista de beneficiarios)
   → Usuario puede reiniciar el proceso de transferencia
```

## 🎨 Mejoras de UX

1. **Claridad**: El usuario siempre sabe cuántos intentos le quedan mediante el mensaje de error rojo
2. **Seguridad**: Límite de 3 intentos previene ataques de fuerza bruta
3. **Feedback inmediato**: Mensajes claros y visibles en rojo
4. **Recuperación rápida**: Solo 20 segundos de espera después de fallar
5. **Consistencia visual**: Colores y estilos coherentes con el resto del sistema
6. **Navegación clara**: Regresa directamente a la lista de beneficiarios para reiniciar fácilmente

## 🔒 Seguridad

- **Límite de intentos**: Previene intentos ilimitados de adivinar el código
- **Timeout automático**: Después de 3 intentos, se cancela la operación
- **Logs detallados**: Cada intento y error se registra en la consola
- **Limpieza de estado**: Se resetea el código OTP después de cada intento fallido

## 📝 Próximos Pasos (Opcional)

Si quieres aplicar este sistema a los otros dos componentes de transferencia:

1. **SecurityCodeCoopint.jsx**: Transferencias cooperativas
2. **SecurityCodeExt.jsx**: Transferencias externas

El mismo patrón se puede replicar en estos componentes siguiendo la misma estructura implementada en `CodeSecurityInternalTransfer.jsx`.

## 🧪 Testing

Para probar el sistema:

1. Iniciar una transferencia interna
2. Ingresar un código OTP incorrecto (ejemplo: 000000)
3. Verificar que aparezca el mensaje "Te quedan 2 intentos"
4. Verificar el badge amarillo con intentos restantes
5. Repetir 2 veces más
6. Verificar que aparezca el CancelComponent
7. Esperar 20 segundos
8. Verificar que regrese a InternaTransferWindow

---

**Autor**: Sistema implementado para VilcabambaCoop  
**Fecha**: Octubre 2025  
**Versión**: 1.0
