# FrontendCoop - AI Coding Instructions

## Project Overview
React-based banking web application for "Cooperativa Las Naves" (savings & credit cooperative) with comprehensive security features, encrypted communications, and differentiated user experiences for individuals vs. businesses.

**Tech Stack:** React 19 + Vite 7 + Tailwind CSS + crypto-js (AES-256-CBC encryption) + React Context API + Custom Hooks

**Repository:** RespaldoCoopEncryptVilca (Branch: main, Owner: Cordillera123)

## Critical Architecture Patterns

### 1. AES-256-CBC Encryption System
**All API communications with sensitive data MUST be encrypted.** The system uses a centralized encryption module that automatically handles encryption/decryption based on process codes.

**Key files:** `src/utils/crypto/` (constants.js, encryptionService.js, fieldMapper.js, index.js)

**Pattern to follow:**
```javascript
import { encryptRequest, decryptResponse } from '@/utils/crypto';

// Before sending to backend
const encryptedData = encryptRequest({
  ## Copilot instructions — FrontendCoop (concise)

  This repo is a Vite + React banking frontend that centralizes all backend calls through a single orchestrator and a process-code-based AES-256-CBC encryption layer.

  Key responsibilities for an AI assistant:
  - Use the crypto helpers in `src/utils/crypto/` (exported helpers: `encryptRequest`, `decryptResponse`, `FIELD_MAPPING_BY_PROCESS`).
  - All sensitive fields are encrypted automatically by process code—never manually change encryption logic without updating `FIELD_MAPPING_BY_PROCESS`.
  - Central API entry: `src/services/apiService.js`. Every new endpoint must add an entry to `PROCESS_CODES` and use the singleton `apiService.makeRequest` pattern.

  Essential files to check before edits:
  - `src/utils/crypto/*` (constants, fieldMapper, encryptionService) — encryption mappings and env validation
  - `src/services/apiService.js` — token, process codes, request/response wiring
  - `src/context/InactivityContext.jsx` and `src/hooks/useInactivityTimer.js` / `useInactivityControl.js` — inactivity pause/resume pattern
  - `src/hooks/useInvestment.js` and `src/hooks/useBeneficiaryAccounts.js` — examples of large hook patterns

  Dev & debug shortcuts:
  - Start dev server: `npm run dev` (Vite auto-loads `src/utils/test-crypto.js` for encryption roundtrips).
  - Crypto test UI: open the purple lock (CryptoTestPage) in the app or run `window.cryptoTests.quickTest('0200594729')` in browser console.
  - Enable verbose logs with `.env.local`: set `VITE_DEBUG_MODE=true`. AES keys must match backend: `VITE_AES_KEY` (32 chars), `VITE_AES_IV` (16 chars).

  How to add a new API (concrete):
  1. Add code to `PROCESS_CODES` in `src/services/apiService.js`.
  2. Add a mapping to `FIELD_MAPPING_BY_PROCESS` in `src/utils/crypto/fieldMapper.js` listing `encryptFields` and `decryptFields` (backend suffixes encrypted response fields with `E`).
  3. Add a wrapper method in `apiService.js` that sets `prccode` and calls `makeRequest`.
  4. Verify roundtrip with `window.cryptoTests.testProcessCode('<your_code>')`.

  Gotchas & conventions:
  - Single backend endpoint: all operations use `prccode` to distinguish actions. Changing that flow is high-impact.
  - Services are singletons: export instances (see `apiService.js`).
  - Session data lives in `sessionStorage` (keys: `userType`, `cedula`, `userData`).
  - OTP: 3-attempt rule implemented across security components (`SecurityCode*.jsx`) — preserve attempt-count logic.

  Safety/security:
  - Do NOT commit `.env.local` or reveal AES keys. In production the build strips console logs.

  If anything above is unclear or you want small additions (e.g., quick code examples for adding a specific process code), tell me which area to expand and I'll iterate.
