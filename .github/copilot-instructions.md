# FrontendCoop - AI Coding Instructions

## Project Overview
React-based banking web application for "Cooperativa Las Naves" (savings & credit cooperative) with comprehensive security features, encrypted communications, and differentiated user experiences for individuals vs. businesses.

**Tech Stack:** React 19 + Vite 7 + Tailwind CSS + crypto-js for AES-256-CBC encryption

## Critical Architecture Patterns

### 1. AES-256-CBC Encryption System
**All API communications with sensitive data MUST be encrypted.** The system uses a centralized encryption module that automatically handles encryption/decryption based on process codes.

**Key files:** `src/utils/crypto/` (constants.js, encryptionService.js, fieldMapper.js, index.js)

**Pattern to follow:**
```javascript
import { encryptRequest, decryptResponse } from '@/utils/crypto';

// Before sending to backend
const encryptedData = encryptRequest({
  prccode: "2351",  // Process code determines which fields to encrypt
  idecl: "0200594729",
  codctad: "420101004676"
});

// After receiving from backend
const decryptedResponse = decryptResponse(backendResponse, "2351");
```

**Critical rules:**
- Fields like `identificacion`, `idecl`, `clave`, `codigo`, `cuenta`, `valor`, `monto` are auto-encrypted based on `prccode`
- 25+ process codes mapped in `fieldMapper.js` - check `FIELD_MAPPING_BY_PROCESS` before adding new APIs
- Encryption credentials in `.env.local` MUST match backend PHP: `VITE_AES_KEY` (32 chars), `VITE_AES_IV` (16 chars)
- Use `encryptRequest()` and `decryptResponse()` in `apiService.js`, never encrypt manually

### 2. Unified API Service Pattern
**Single backend endpoint for ALL operations:** `/api-l/prctrans.php` (proxied via Vite to `http://192.168.200.102/wsVirtualCoopSrvP/ws_server/prctrans.php`)

**IMPORTANT:** Production server changed from `.25/wsVirtualCoopSrvL` to `.102/wsVirtualCoopSrvP`

**Location:** `src/services/apiService.js` (5989 lines - central orchestrator)

**Pattern:**
```javascript
const data = {
  tkn: '0999SolSTIC20220719',  // Fixed token for all requests
  prccode: '2351',              // Determines operation type
  // ... other params
};
const response = await apiService.makeRequest(data);
```

**Key constants:**
- `PROCESS_CODES` object maps operations: login='2100', transfers='2355', investments='2375', etc.
- Process codes auto-trigger encryption via `encryptRequest()` before sending
- Response auto-decrypted via `decryptResponse()` with process code mapping

**Critical:** Always add new process codes to both `PROCESS_CODES` in `apiService.js` AND `FIELD_MAPPING_BY_PROCESS` in `crypto/fieldMapper.js`

### 3. User Type Discrimination System
**Business (RUC) vs. Individual (Cédula) users get different menus and features.**

**Detection logic in `apiService.js`:**
- Cédula: 10 digits → `userType: 'persona_natural'`
- RUC: 13 digits ending in "001" → `userType: 'empresa'`
- Stored in `sessionStorage` after login

**Menu config:** `src/config/menuConfig.js` exports `PERSONA_NATURAL_MENU` and `EMPRESA_MENU`
- Individual users: Basic banking (savings, credits, transfers)
- Business users: Payroll, bulk transfers, user management, cash management, corporate reports

**Location:** `Sidebar.jsx` loads menu based on `sessionStorage.getItem('userType')`

### 4. Inactivity Detection & Auto-Logout
**System automatically logs out users after 4 minutes of inactivity** with 2-minute warning.

**Implementation:**
- Context: `src/context/InactivityContext.jsx` (global state)
- Hook: `src/hooks/useInactivityTimer.js` (timer logic)
- Modal: `src/components/InactivityWarningModal.jsx` (visual countdown)

**Configuration:**
- Warning at 2 minutes (120s)
- Auto-logout at 4 minutes (240s)
- Excluded views: login, register, forgot-password (see `DEFAULT_CONFIG.excludeViews`)
- Pausable during critical operations (transfers, investments)

**Usage pattern:**
```javascript
// Pause timer during critical operation
const { pauseTimer, resumeTimer } = useInactivityControl();
pauseTimer();
// ... perform transfer ...
resumeTimer();
```

### 5. Three-Strike OTP System
**All transfer types enforce 3-attempt limit for OTP codes** with automatic cancellation.

**Affected components:**
- `CodeSecurityInternalTransfer.jsx` (own accounts)
- `SecurityCodeCoopint.jsx` (cooperative members)
- `SecurityCodeExt.jsx` (external banks)

**Pattern:**
- Track `attemptCount` state (max 3)
- On 3rd failure: show `CancelComponent` for 5 seconds, then reset
- Clear error messages: "Código incorrecto. Te quedan X intentos"

### 6. Transfer System Architecture
**Centralized transfer manager** handles internal, cooperative, and external transfers with beneficiary account creation.

**Key files:**
- `TransferManager.jsx` - Main orchestrator
- `AddAccountToBeneficiary.jsx` - New beneficiary account creation
- `AccountCreatedSuccess.jsx` - Success screen with direct transfer option
- `TransferCoopint.jsx` - Cooperative transfers
- `TransferExt.jsx` - External bank transfers

**Flow:** User selects beneficiary → Can add new account → Success screen → Option to transfer immediately

**APIs:** 2310 (banks), 2320 (account types), 2365 (create beneficiary), 2355 (execute transfer)

### 7. Investment System with Hook Pattern
**Complex investment logic isolated in custom hook** for reusability.

**Location:** `src/hooks/useInvestment.js` (1250 lines)

**Pattern:**
```javascript
const {
  investments, loading, error,
  investmentTypes, plazos,
  calculatorData, investmentParams,
  // ... 20+ state values and methods
} = useInvestment();
```

**APIs:** 2369 (params), 2371 (types/terms), 2372 (payment types), 2373 (calculation), 2374 (accounts), 2375 (register)

**Related hooks:** `useBeneficiaryAccounts.js`, `useServiciosFacilito.js`, `useWindows.js` - follow same pattern for complex features

## Development Workflows

### Running the App
```powershell
npm run dev          # Starts Vite dev server on port 3000
npm run build        # Production build with Terser (strips console.*)
npm run preview      # Preview production build
```

### Testing Encryption
1. Start dev server: `npm run dev`
2. Open browser to http://localhost:3000
3. Click purple 🔐 floating button (bottom-right) for visual test page
4. Or use browser console: `window.cryptoTests.quickTest("0200594729")`

**Test files:** `src/utils/test-crypto.js` (auto-runs in dev mode via `main.jsx`)

### Debugging API Calls
All requests logged with 🔐 prefix. Check console for:
- `[ENCRYPT_REQUEST]` - Shows which fields are encrypted
- `[DECRYPT_RESPONSE]` - Shows decrypted data
- `[API]` - Generic API request/response logs

**Enable debug mode:** Set `VITE_DEBUG_MODE=true` in `.env.local`

### Adding New APIs
1. Add process code to `PROCESS_CODES` in `apiService.js`
2. Add field mapping to `FIELD_MAPPING_BY_PROCESS` in `crypto/fieldMapper.js`:
   ```javascript
   '2XXX': {
     description: 'Your API description',
     encrypt: ['sensitive_field1', 'sensitive_field2'],
     decrypt: ['response_field1E', 'response_field2E']  // Backend adds 'E' suffix
   }
   ```
3. Create method in `apiService.js` following existing patterns
4. Fields in `encrypt` array will auto-encrypt on request; `decrypt` array will auto-decrypt on response

## Project Conventions

### File Organization
- **Services:** `src/services/` - API communication only
- **Hooks:** `src/hooks/` - Reusable stateful logic (investments, transfers, etc.)
- **Context:** `src/context/` - Global state (inactivity, user session)
- **Components/dashboard:** Main dashboard components (forms, transfers, products)
- **Components/dashboard/empresa:** Business-only components (payroll, bulk transfers)
- **Components/dashboard/investment:** Investment-specific components
- **Utils/crypto:** Encryption system (never modify without understanding backend implications)

### Import Aliases
```javascript
import x from '@/components/...'     // → src/
import x from '@services/...'        // → services/
import x from '@assets/...'          // → src/assets/
```

### Component Naming
- Dashboard components: `XxxxxForm.jsx` (e.g., `SavingsProductForm.jsx`)
- Transfer windows: `XxxxxWindow.jsx` (e.g., `InternaTransferWindow.jsx`)
- Security components: `SecurityCodeXxxx.jsx` or `CodeSecurityXxxx.jsx`

### State Management
- **Global:** Context API (InactivityContext) for cross-cutting concerns
- **Complex features:** Custom hooks (useInvestment, useBeneficiaryAccounts)
- **Component-local:** useState for form state and UI toggles
- **Session data:** sessionStorage for user type, auth tokens, user data

### Error Handling
- API responses include `estcod` (status code) and `msjcod` (message)
- Mapping in `ERROR_CODES_MAP` (apiService.js): '000' = success, '001' = invalid credentials, etc.
- Display user-friendly messages from `ERROR_CODES_MAP.message`

## Documentation Reference
Comprehensive documentation in root `.md` files:
- `ENCRYPTION_IMPLEMENTATION_SPRINT1.md` - Encryption system deep-dive
- `BACKEND_ENCRYPTION_GUIDE.md` - PHP backend compatibility requirements
- `TRANSFER_SYSTEM_DOCUMENTATION.md` - Transfer flows and APIs
- `IMPLEMENTACION_COMPLETADA.md` - User type discrimination details
- `SISTEMA_INACTIVIDAD_IMPLEMENTADO.md` - Inactivity system reference
- `SISTEMA_3_INTENTOS_*.md` - OTP retry logic for different contexts

## Security Reminders
- NEVER commit `.env.local` (contains AES keys)
- NEVER log decrypted sensitive data in production (Terser strips console.* in builds)
- ALWAYS use `encryptRequest()` / `decryptResponse()` for sensitive fields
- ALWAYS validate encryption config on init: `validateEncryptionConfig()` in crypto/constants.js
- Session timeout enforced at 4 minutes - adjust `InactivityContext.jsx` if requirements change
