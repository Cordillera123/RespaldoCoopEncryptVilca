# Sistema de 3 Intentos para Código OTP en Transferencias

## 📋 Descripción General

Se ha implementado el sistema de control de **3 intentos** para el ingreso del código OTP en todos los tipos de transferencias de la cooperativa. Este sistema proporciona una capa adicional de seguridad y mejora la experiencia del usuario con feedback claro y tiempos de espera optimizados.

## 🎯 Tipos de Transferencias Implementadas

### 1. **Transferencias Internas** (`CodeSecurityInternalTransfer.jsx`)
- Entre cuentas propias del mismo usuario
- Sin comisiones

### 2. **Transferencias Cooperativas** (`SecurityCodeCoopint.jsx`)
- A cuentas de otros miembros de Las Naves
- Sin comisiones entre miembros

### 3. **Transferencias Externas** (`SecurityCodeExt.jsx`)
- A cuentas de otros bancos (interbancarias)
- Con comisiones según tarifario del banco receptor

## 🎯 Características Implementadas

### 1. **Sistema de 3 Intentos**
- El usuario tiene **3 intentos** para ingresar correctamente el código OTP
- Cada intento fallido muestra un mensaje claro con los intentos restantes
- Después de 3 intentos fallidos, se cancela automáticamente la transferencia

### 2. **Retroalimentación Visual**
- **Sin badge amarillo**: Solo mensaje rojo de error
- **Mensajes claros**: Cada error muestra exactamente cuántos intentos quedan
- **Colores intuitivos**: Rojo para errores de código OTP

### 3. **Pantalla de Cancelación**
- Después de 3 intentos fallidos, se muestra el `CancelComponent` por **5 segundos** (optimizado)
- El componente muestra:
  - Animación de error
  - Mensaje personalizado según el tipo de transferencia
  - Countdown de 5 segundos
- Después de 5 segundos, regresa automáticamente a la ventana de transferencias correspondiente

### 4. **Gestión de Tiempo Optimizada**
- El `CancelComponent` acepta un prop `countdown` (en segundos)
- Para intentos fallidos: **5 segundos** (tiempo optimizado para mejor UX)
- Muestra el tiempo restante en formato legible: "Regresando en 5 seg..."

## 🔧 Componentes Modificados

### **1. CodeSecurityInternalTransfer.jsx** (Transferencias Internas)

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

**Sin badge amarillo:**
```javascript
// ❌ NO SE MUESTRA:
// <div className="bg-amber-50 border border-amber-200">
//   <span>2 intentos restantes</span>
// </div>

// ✅ SOLO SE MUESTRA:
// {error && (
//   <div className="bg-red-50 border border-red-200">
//     <p>{error}</p> // "Código incorrecto. Te quedan 2 intentos"
//   </div>
// )}
```

**Regreso automático después de 5 segundos:**
```javascript
const handleErrorAnimationComplete = () => {
  if (attempts >= MAX_ATTEMPTS) {
    setTimeout(() => {
      onTransferError({ 
        message: 'Máximo de intentos alcanzado', 
        code: 'MAX_ATTEMPTS_REACHED' 
      });
    }, 5000); // 5 segundos
  }
};
```

### **2. SecurityCodeCoopint.jsx** (Transferencias Cooperativas)

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
    // Mostrar CancelComponent por 5 segundos
    setShowErrorAnimation(true);
  } else {
    // Mostrar intentos restantes
    const remainingAttempts = MAX_ATTEMPTS - newAttempts;
    setError(`Código incorrecto. Te quedan ${remainingAttempts} intento(s)`);
  }
}
```

**Componente padre - TransferCoopint.jsx:**
```javascript
const handleTransferError = (error) => {
  if (error.code === 'MAX_ATTEMPTS_REACHED') {
    onBack(); // Regresar a InternaTransferWindow
  } else {
    setError(error.message);
    setCurrentStep('form');
  }
};
```

### **3. SecurityCodeExt.jsx** (Transferencias Externas)

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
    // Mostrar CancelComponent por 5 segundos
    setShowErrorAnimation(true);
  } else {
    // Mostrar intentos restantes
    const remainingAttempts = MAX_ATTEMPTS - newAttempts;
    setError(`Código incorrecto. Te quedan ${remainingAttempts} intento(s)`);
  }
}
```

**Componente padre - TransferExt.jsx:**
```javascript
const handleTransferError = (error) => {
  if (error.code === 'MAX_ATTEMPTS_REACHED') {
    onBack(); // Regresar a ExternaTransferWindow
  } else {
    setError(error.message);
    setCurrentStep('form');
  }
};
```

## 🔄 Flujos de Usuario

### **Transferencias Internas (Entre propias cuentas)**
```
SameAccounts (Formulario)
    ↓ [Usuario ingresa datos y confirma]
CodeSecurityInternalTransfer (Ingreso de OTP)
    ↓ [Usuario ingresa código incorrecto - Intento 1]
❌ Mensaje rojo: "Código incorrecto. Te quedan 2 intentos"
    ↓ [Usuario ingresa código incorrecto - Intento 2]
❌ Mensaje rojo: "Código incorrecto. Te queda 1 intento"
    ↓ [Usuario ingresa código incorrecto - Intento 3]
🚨 CancelComponent (5 segundos)
    ↓ [Después de 5 segundos]
InternaTransferWindow (Lista de beneficiarios) ← REGRESA AQUÍ
```

### **Transferencias Cooperativas (A otros miembros Las Naves)**
```
TransferCoopint (Formulario)
    ↓ [Usuario selecciona beneficiario cooperativo]
SecurityCodeCoopint (Ingreso de OTP)
    ↓ [Usuario ingresa código incorrecto - Intento 1]
❌ Mensaje rojo: "Código incorrecto. Te quedan 2 intentos"
    ↓ [Usuario ingresa código incorrecto - Intento 2]
❌ Mensaje rojo: "Código incorrecto. Te queda 1 intento"
    ↓ [Usuario ingresa código incorrecto - Intento 3]
🚨 CancelComponent (5 segundos)
    ↓ [Después de 5 segundos]
InternaTransferWindow (Lista de beneficiarios) ← REGRESA AQUÍ
```

### **Transferencias Externas (Interbancarias)**
```
TransferExt (Formulario)
    ↓ [Usuario selecciona beneficiario externo]
SecurityCodeExt (Ingreso de OTP)
    ↓ [Usuario ingresa código incorrecto - Intento 1]
❌ Mensaje rojo: "Código incorrecto. Te quedan 2 intentos"
    ↓ [Usuario ingresa código incorrecto - Intento 2]
❌ Mensaje rojo: "Código incorrecto. Te queda 1 intento"
    ↓ [Usuario ingresa código incorrecto - Intento 3]
🚨 CancelComponent (5 segundos)
    ↓ [Después de 5 segundos]
ExternaTransferWindow (Lista de beneficiarios externos) ← REGRESA AQUÍ
```

## 🎨 Mejoras de UX

1. **Claridad**: El usuario siempre sabe cuántos intentos le quedan mediante mensajes rojos claros
2. **Seguridad**: Límite de 3 intentos previene ataques de fuerza bruta en todos los tipos de transferencias
3. **Feedback inmediato**: Mensajes claros y visibles en rojo (sin distracciones amarillas)
4. **Recuperación rápida**: Solo **5 segundos** de espera después de fallar (optimizado para mejor UX)
5. **Consistencia**: Mismo comportamiento en transferencias internas, cooperativas y externas
6. **Navegación clara**: Regresa directamente a la lista de beneficiarios correspondiente para reiniciar fácilmente

## 🔒 Seguridad

- **Límite de intentos**: Previene intentos ilimitados de adivinar el código OTP en todos los tipos de transferencias
- **Timeout automático**: Después de 3 intentos, se cancela la operación automáticamente
- **Logs detallados**: Cada intento y error se registra en la consola con prefijos específicos
  - `[INTERNAL-OTP]` - Transferencias internas
  - `[COOP-OTP]` - Transferencias cooperativas
  - `[EXT-OTP]` - Transferencias externas
- **Limpieza de estado**: Se resetea el código OTP después de cada intento fallido
- **Timers controlados**: Limpieza automática de timers al desmontar componentes

## 📊 Comparación entre Tipos de Transferencias

| Característica | Internas | Cooperativas | Externas |
|----------------|----------|--------------|----------|
| Intentos máximos | 3 | 3 | 3 |
| Mensaje de error | Solo rojo | Solo rojo | Solo rojo |
| Badge amarillo | ❌ No | ❌ No | ❌ No |
| Tiempo en CancelComponent | 5 segundos | 5 segundos | 5 segundos |
| Destino después de fallar | InternaTransferWindow | InternaTransferWindow | ExternaTransferWindow |
| Código especial | MAX_ATTEMPTS_REACHED | MAX_ATTEMPTS_REACHED | MAX_ATTEMPTS_REACHED |
| Comisiones | Sin comisión | Sin comisión | Con comisión |

## 🧪 Testing

### **Transferencias Internas:**
1. Iniciar una transferencia entre cuentas propias
2. Ingresar un código OTP incorrecto (ejemplo: 000000)
3. Verificar que aparezca el mensaje "Te quedan 2 intentos"
4. Verificar que NO aparezca badge amarillo
5. Repetir 2 veces más
6. Verificar que aparezca el CancelComponent
7. Esperar 5 segundos
8. Verificar que regrese a InternaTransferWindow (SameAccounts)

### **Transferencias Cooperativas:**
1. Iniciar una transferencia cooperativa (a cuenta de Las Naves)
2. Ingresar un código OTP incorrecto (ejemplo: 000000)
3. Verificar que aparezca el mensaje "Te quedan 2 intentos"
4. Verificar que NO aparezca badge amarillo
5. Repetir 2 veces más
6. Verificar que aparezca el CancelComponent
7. Esperar 5 segundos
8. Verificar que regrese a InternaTransferWindow (lista de beneficiarios)

### **Transferencias Externas:**
1. Iniciar una transferencia externa (a otro banco)
2. Ingresar un código OTP incorrecto (ejemplo: 000000)
3. Verificar que aparezca el mensaje "Te quedan 2 intentos"
4. Verificar que NO aparezca badge amarillo
5. Repetir 2 veces más
6. Verificar que aparezca el CancelComponent
7. Esperar 5 segundos
8. Verificar que regrese a ExternaTransferWindow (lista de beneficiarios externos)

## 📝 Archivos Modificados

### **Componentes de Código OTP:**
1. ✅ `CodeSecurityInternalTransfer.jsx` - Sistema de 3 intentos completo (transferencias internas)
2. ✅ `SecurityCodeCoopint.jsx` - Sistema de 3 intentos completo (transferencias cooperativas)
3. ✅ `SecurityCodeExt.jsx` - Sistema de 3 intentos completo (transferencias externas)

### **Componentes Padre (Manejo de MAX_ATTEMPTS_REACHED):**
4. ✅ `SameAccounts.jsx` - Detecta MAX_ATTEMPTS_REACHED y regresa a InternaTransferWindow
5. ✅ `TransferCoopint.jsx` - Detecta MAX_ATTEMPTS_REACHED y regresa a InternaTransferWindow
6. ✅ `TransferExt.jsx` - Detecta MAX_ATTEMPTS_REACHED y regresa a ExternaTransferWindow

### **Componente Compartido:**
7. ✅ `CancelComponent.jsx` - Acepta prop `countdown` para personalizar tiempo de espera

## 🔗 Integración con Sistema General

Todos los componentes de código OTP ahora tienen comportamiento consistente:
- ✅ `CodeSecurityInternalTransfer.jsx` (transferencias entre propias cuentas)
- ✅ `SecurityCodeCoopint.jsx` (transferencias a miembros Las Naves)
- ✅ `SecurityCodeExt.jsx` (transferencias interbancarias)

**Patrón consistente implementado:**
- 3 intentos máximos
- Mensajes rojos claros sin badges amarillos
- CancelComponent por 5 segundos
- Regreso automático a la ventana correspondiente
- Código especial `MAX_ATTEMPTS_REACHED` para navegación

---

**Autor**: Sistema implementado para VilcabambaCoop  
**Fecha**: Octubre 2025  
**Versión**: 1.0  
**Tipo de Transferencia**: Cooperativa (Las Naves → Las Naves)
