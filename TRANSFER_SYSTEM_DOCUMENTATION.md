# Sistema de Transferencias con Agregación de Cuentas

## Resumen de Funcionalidades

Este sistema permite realizar transferencias internas (cooperativa Las Naves) y externas (otros bancos) con la funcionalidad de agregar nuevas cuentas bancarias a beneficiarios existentes.

## Componentes Principales

### 1. `TransferManager.jsx`
**Componente principal que gestiona todo el flujo**

```jsx
import { TransferManager } from './components/dashboard';

// Para transferencias internas
<TransferManager 
  transferType="internal"
  onBack={() => navigateBack()}
  preselectedContact={contactData} // Opcional
/>

// Para transferencias externas  
<TransferManager 
  transferType="external"
  onBack={() => navigateBack()}
  preselectedContact={contactData} // Opcional
/>
```

### 2. `AddAccountToBeneficiary.jsx`
**Formulario para agregar nuevas cuentas bancarias**

- Carga instituciones financieras desde API 2310
- Carga tipos de cuenta desde API 2320
- Crea beneficiario con nueva cuenta usando API 2365
- Valida formularios y maneja errores

### 3. `AccountCreatedSuccess.jsx`
**Vista de éxito después de crear una cuenta**

Características:
- ✅ Muestra detalles de la cuenta creada
- 🏦 Identifica si es cuenta interna (Las Naves) o externa
- 🚀 Botón para transferir directamente a la nueva cuenta
- 📝 Información sobre tipos de transferencia y comisiones
- 🔙 Opción para regresar a contactos

### 4. `TransferCoopint.jsx` (Actualizado)
**Transferencias internas de la cooperativa**

Nuevas funcionalidades:
- Botón "Agregar cuenta de destino"
- Integración con flujo de creación de cuentas
- Preselección automática de cuentas recién creadas

### 5. `TransferExt.jsx` (Actualizado)
**Transferencias externas a otros bancos**

Nuevas funcionalidades:
- Botón "Agregar cuenta de destino"
- Integración con flujo de creación de cuentas
- Preselección automática de cuentas recién creadas

## Flujo de Usuario

### Escenario 1: Agregar cuenta desde transferencia
1. Usuario selecciona beneficiario en formulario de transferencia
2. Hace clic en "Agregar cuenta de destino"
3. Se abre `AddAccountToBeneficiary` con datos del beneficiario
4. Usuario completa formulario (institución, tipo de cuenta, número)
5. Se crea la cuenta exitosamente
6. Se muestra `AccountCreatedSuccess` con detalles de la cuenta
7. Usuario puede transferir directamente o regresar

### Escenario 2: Transferencia directa después de crear cuenta
1. Desde `AccountCreatedSuccess`, usuario hace clic en "Transferir a esta cuenta"
2. El sistema determina automáticamente:
   - Si es cuenta interna → Redirige a `TransferCoopint`
   - Si es cuenta externa → Redirige a `TransferExt`
3. La nueva cuenta se preselecciona automáticamente
4. Usuario completa el resto del formulario de transferencia

## Identificación de Cuentas Internas vs Externas

El sistema identifica cuentas internas mediante:
```javascript
const isInternalAccount = beneficiaryData.bankCode === '1' || 
  beneficiaryData.bank?.toLowerCase().includes('las naves') || 
  beneficiaryData.bank?.toLowerCase().includes('cooperativa');
```

## APIs Utilizadas

### Para Agregar Cuentas:
- **API 2310**: Obtener instituciones financieras
- **API 2320**: Obtener tipos de cuenta
- **API 2365**: Crear beneficiario con nueva cuenta

### Para Transferencias:
- **API 2300**: Cuentas origen del usuario
- **API 2325**: Beneficiarios de la cooperativa
- **API 2350**: Validar fondos
- **API 2355**: Ejecutar transferencia cooperativa
- **API 2155**: Solicitar código OTP

## Estilos y Diseño

Todos los componentes siguen el sistema de diseño existente:
- 🎨 Tailwind CSS para estilos
- 🎯 Paleta de colores coherente (azul, verde, gris)
- 📱 Diseño responsive
- ✨ Transiciones suaves
- 🔔 Feedback visual claro (éxito, error, cargando)

## Ejemplo de Integración Completa

```jsx
import React, { useState } from 'react';
import { TransferManager } from './components/dashboard';

const TransferPage = () => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferType, setTransferType] = useState('internal');

  const handleStartTransfer = (type) => {
    setTransferType(type);
    setShowTransfer(true);
  };

  if (showTransfer) {
    return (
      <TransferManager
        transferType={transferType}
        onBack={() => setShowTransfer(false)}
      />
    );
  }

  return (
    <div>
      <button onClick={() => handleStartTransfer('internal')}>
        Transferencia Interna Las Naves
      </button>
      <button onClick={() => handleStartTransfer('external')}>
        Transferencia Externa
      </button>
    </div>
  );
};
```

## Características Técnicas

### Estados Gestionados:
- `currentView`: 'transfer', 'addAccount', 'transferInternal', 'transferExternal'
- `selectedBeneficiary`: Datos del beneficiario seleccionado
- `preselectedContactForTransfer`: Contacto para preseleccionar en transferencia

### Manejo de Errores:
- Validación de formularios en tiempo real
- Mensajes de error contextuales
- Recuperación elegante de errores de API

### Experiencia de Usuario:
- Navegación intuitiva entre vistas
- Preselección automática de datos
- Feedback visual constante
- Información clara sobre tipos de transferencia

Este sistema proporciona una experiencia completa y fluida para la gestión de transferencias y cuentas bancarias.