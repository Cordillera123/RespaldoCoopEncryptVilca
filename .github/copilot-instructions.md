# FrontendCoop - AI Coding Instructions

## Project Overview
React 19 + Vite 7 banking web app for "Cooperativa Las Naves" (savings & credit cooperative) with **mandatory AES-256-CBC encryption** for all API communication, centralized through a single backend endpoint using process codes.

**Tech Stack:** React 19 + Vite 7 + Tailwind CSS + crypto-js + React Context API + Custom Hooks  
**Repository:** RespaldoCoopEncryptVilca (Branch: main, Owner: Cordillera123)

## Critical Architecture: Encryption-First API Design

### Single Endpoint Pattern
**ALL backend operations go through ONE endpoint** (`/api/prctrans.php` or `/api-l/prctrans.php`) differentiated by `prccode`. The system automatically routes to `/api-l/` for specific process codes listed in `CODES_REQUIRING_L_URL` in `src/services/apiService.js`.

```javascript
// Example: Investment types uses /api-l/, login uses /api/
CODES_REQUIRING_L_URL = ['2180', '2148', '2151', '2371', '2213', ...];
```

### Encryption System (`src/utils/crypto/`)
**Process-code-based automatic encryption.** The system knows which fields to encrypt/decrypt based on `FIELD_MAPPING_BY_PROCESS` in `fieldMapper.js`.

**Core pattern:**
```javascript
import { encryptRequest, decryptResponse } from '@/utils/crypto';

// Request encryption (automatic based on prccode)
const encryptedData = encryptRequest({
  prccode: '2100',
  usr: 'user123',      // ← Will be encrypted
  pwd: 'password'      // ← Will be encrypted
});

// Response decryption (automatic)
const decrypted = decryptResponse(rawResponse, '2100');
```

**Critical rules:**
- Backend responds with encrypted fields suffixed with `E` (e.g., `idecliE`, `saldoE`)
- Backend expects certain fields encrypted in requests (defined per process code)
- Field order matters for some processes (2155, 2156, 2100) - see `buildOrderedBody()` in `apiService.js`
- Some responses come encrypted without suffix (e.g., `idemsg` in 2155) - check `decryptFields` in `fieldMapper.js`

### Adding a New API Endpoint

**Step-by-step (CRITICAL ORDER):**

1. **Add process code to `PROCESS_CODES`** in `src/services/apiService.js`:
```javascript
const PROCESS_CODES = {
  MY_NEW_OPERATION: '2999',
  // ...
};
```

2. **Map encryption fields** in `src/utils/crypto/fieldMapper.js`:
```javascript
export const FIELD_MAPPING_BY_PROCESS = {
  '2999': {
    description: 'My new operation',
    encryptFields: ['idecl', 'amount'],           // What to encrypt in request
    decryptFields: ['balance', 'accountNumber']   // What to decrypt in response
  }
};
```

3. **Add service method** in `apiService.js`:
```javascript
async myNewOperation(clientId, amount) {
  return await this.makeRequest({
    prccode: PROCESS_CODES.MY_NEW_OPERATION,
    idecl: clientId,
    amount: amount
  });
}
```

4. **Test encryption roundtrip** in browser console:
```javascript
window.cryptoTests.testProcessCode('2999');
```

## Session & State Management

### Session Storage Keys
```javascript
// Critical session data (check before modifications)
sessionStorage.getItem('userSession')    // Full user data
sessionStorage.getItem('userType')       // 'N' = individual, 'J' = business
sessionStorage.getItem('cedula')         // Client ID
sessionStorage.getItem('loginTime')      // For inactivity calculation
```

### Singleton Services Pattern
All services export **instances, not classes**:
```javascript
// src/services/apiService.js
class ApiService { /* ... */ }
export default new ApiService(); // ← Export instance

// Usage
import apiService from '@/services/apiService';
apiService.login(usr, pwd); // Direct use
```

## Inactivity System (Pause/Resume Pattern)

**Context-based global inactivity timer** with route-based exclusions:

```javascript
// src/context/InactivityContext.jsx - Excluded views
const excludeViews = ['login', 'register', 'forgot-password', ...];

// Usage in components
import { useInactivity } from '@/context/InactivityContext';
const { pauseTimer, resumeTimer } = useInactivity();

// Pause during critical operations (modals, transfers)
pauseTimer();
// ... user interaction ...
resumeTimer();
```

**Timer config** (`src/hooks/useInactivityTimer.js`):
- WARNING_TIME: 2 minutes
- LOGOUT_TIME: 4 minutes
- Shows modal at 2min, auto-logout at 4min

## Security Patterns

### OTP 3-Attempt Rule
**Enforced across all security components** (`SecurityCodeValidationPage1.jsx`, `TwoFactorAuthPage.jsx`):
```javascript
const maxAttempts = 3;
const [attemptCount, setAttemptCount] = useState(0);

if (attemptCount >= maxAttempts) {
  // Block user, redirect to login
}
```

**Never modify this logic** without updating all security components.

### `idemsg` Decryption Helper
Backend sometimes sends `idemsg` encrypted. Use the helper:
```javascript
const decryptedIdemsg = apiService.decryptIdemsgIfNeeded(idemsg, 'CONTEXT');
```

## Development Workflow

### Quick Start
```powershell
npm install              # Install dependencies
npm run dev              # Dev server on :3000 (dev backend: 192.168.200.102)
npm run build            # Production build (prod backend: 173.31.30.180)
npm run preview          # Preview production build
```

### Environment Configuration (`.env.local`)
```bash
VITE_DEBUG_MODE=true                          # Enable verbose logging
VITE_AES_KEY=C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca  # MUST match backend (32 chars)
VITE_AES_IV=PTk6KaVZxN04SXz0                  # MUST match backend (16 chars)
```
**⚠️ NEVER commit `.env.local`** - keys are sensitive and backend-synchronized.

### Debugging Encryption
1. **Browser console tests:**
```javascript
// Quick encrypt/decrypt test
window.cryptoTests.quickTest('0200594729');

// Test specific process code
window.cryptoTests.testProcessCode('2100');

// View diagnostics
window.cryptoTests.getDiagnostics();
```

2. **CryptoTestPage UI:** Purple lock icon in app (dev mode only)

3. **Enable verbose logs:** Check `src/utils/crypto/encryptionService.js` - logs every encrypt/decrypt operation

### Vite Multi-Environment Config
`vite.config.js` switches backends based on build mode:
```javascript
// npm run dev          → http://192.168.200.102 (Development)
// npm run build        → http://173.31.30.180 (Production)
```

Proxy routes:
- `/api/` → standard operations
- `/api-l/` → specific processes (see `CODES_REQUIRING_L_URL`)

## Deployment (Production Server)

```bash
# 1. Build production assets
npm run build

# 2. Copy to server (requires SSH access to 173.31.30.180)
sudo cp -r dist/* /var/www/webApp/

# 3. Set permissions
sudo chown -R www-data:www-data /var/www/webApp
sudo find /var/www/webApp -type d -exec chmod 755 {} \;
sudo find /var/www/webApp -type f -exec chmod 644 {} \;

# 4. Reload Nginx
sudo systemctl reload nginx
```

**Production URL:** http://173.31.30.180  
**Backend API:** Nginx proxies `/api-l/` → `/var/www/wsVirtualCoopSrvL/ws_server`

## Common Gotchas

1. **Field order matters:** Processes 2155/2156 (OTP) require exact JSON key order - see `buildOrderedBody()` in `apiService.js`
2. **Don't over-encrypt:** Only add fields to `encryptFields` if backend **explicitly expects them encrypted** - extras cause "NO EXISTE" errors
3. **`idemsg` is special:** Sometimes encrypted in responses (2155), use `decryptIdemsgIfNeeded()`
4. **Process code routing:** Check `CODES_REQUIRING_L_URL` before assuming `/api/` - some operations need `/api-l/`
5. **Console logs stripped in production:** Build process removes all `console.log` via terser
6. **Inactivity excludes auth flows:** Timer doesn't run on login/register/forgot-password views

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/services/apiService.js` | Central API orchestrator, process codes, URL routing |
| `src/utils/crypto/fieldMapper.js` | Encryption mappings per process code |
| `src/utils/crypto/encryptionService.js` | AES-256-CBC encrypt/decrypt logic |
| `src/utils/crypto/constants.js` | Encryption config, env validation |
| `src/context/InactivityContext.jsx` | Global inactivity timer context |
| `src/hooks/useInactivityTimer.js` | Timer logic with pause/resume |
| `src/hooks/useInvestment.js` | Complex hook pattern example (1279 lines) |
| `vite.config.js` | Multi-environment routing config |

## Large Hook Pattern Example

See `src/hooks/useInvestment.js` for standard pattern:
- Multiple API integrations (2369, 2371, 2372, 2373, 2375)
- Phase-based state management
- Loading/error handling per operation
- Calculator with real-time API validation
- Security question flow integration

## Questions?

Reference specific documentation:
- Encryption details: `ENCRYPTION_IMPLEMENTATION_SPRINT*.md`
- Transfer system: `TRANSFER_SYSTEM_DOCUMENTATION.md`
- Deployment: `DEPLOYMENT_SIMPLE.md`
- Multi-environment: `MULTI_AMBIENTE.md`
