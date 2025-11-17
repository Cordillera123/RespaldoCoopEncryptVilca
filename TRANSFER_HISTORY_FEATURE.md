# Transfer History Feature - Implementation Summary

## Overview
New "Historial de Movimientos" submenu added to the Transfers section for both PERSONA_NATURAL and EMPRESA user types. Allows users to view their transfer history filtered by date range.

## API Integration
- **Process Code:** 2357 (TRANSFER_HISTORY)
- **Endpoint:** Single backend endpoint with process code routing
- **Request Parameters:**
  - `idecl` (cedula) - **ENCRYPTED** - Retrieved from session storage
  - `fecdes` (fecha desde) - Format: DD/MM/YYYY - **NOT ENCRYPTED**
  - `fechas` (fecha hasta) - Format: DD/MM/YYYY - **NOT ENCRYPTED**

## Response Structure
```json
{
  "estado": "000",
  "msg": "CORRECTO",
  "listado": [
    {
      "fhotif": "2025/01/11 14:30:25",
      "numref": "REF123456",
      "valtrn": "150.00",
      "bceipo": "1234567890",
      "ifiipo": "Banco XYZ",
      "tculpo": "AH"
    }
  ]
}
```

**Note:** All response fields come encrypted with `E` suffix (e.g., `numrefE`, `valtrnE`) and are automatically decrypted by the component.

## Files Created/Modified

### 1. TransferHistoryWindow.jsx (NEW - 558 lines)
**Location:** `src/components/dashboard/TransferHistoryWindow.jsx`

**Key Features:**
- Full-screen modal window with gradient header (sky-600)
- Date range filters (default: last 30 days, max: 365 days)
- Transfer history table with 7 columns:
  - Fecha (Date)
  - Referencia (Reference number)
  - Monto (Amount)
  - Cuenta Destino (Destination account)
  - Institución (Financial institution)
  - Tipo (Account type)
- Pagination (15 items per page)
- Automatic cedula retrieval from session storage
- Automatic response decryption

**Date Handling:**
- **Internal Storage:** YYYY/MM/DD
- **API Format:** DD/MM/YYYY
- **HTML Input:** YYYY-MM-DD
- Three conversion functions for seamless transformation

**State Management:**
```javascript
- loading: boolean
- error: string
- transfers: array
- userCedula: string (encrypted)
- dateFilters: { from: string, to: string } (YYYY/MM/DD)
- currentPage: number
```

**Key Methods:**
- `initializeComponent()` - Get cedula, set default 30-day range, load data
- `loadTransferHistory()` - Call API 2357, decrypt response, populate table
- `tryDecrypt()` - Detect Base64 encrypted values and decrypt
- `applyDateFilters()` - Validate date range (max 365 days), reload data
- `clearFilters()` - Reset to 30-day default range

### 2. apiService.js (MODIFIED)
**Location:** `src/services/apiService.js`

**Changes:**
- **Line 103:** Added `TRANSFER_HISTORY: '2357'` to PROCESS_CODES
- **Lines 6535-6672:** Added `getTransferHistory(cedula, fechaDesde, fechaHasta)` method
  - Validates cedula presence
  - Validates date format (DD/MM/YYYY with regex)
  - Validates date range (max 365 days)
  - Calls API with process code 2357
  - Returns formatted response with listado array
- **Lines 6674-6686:** Added `getCurrentUserTransferHistory(fechaDesde, fechaHasta)` convenience method
  - Auto-retrieves cedula from `getUserCedula()`
  - Calls `getTransferHistory()` with retrieved cedula

### 3. fieldMapper.js (MODIFIED)
**Location:** `src/utils/crypto/fieldMapper.js`

**Changes (Lines 329-343):**
```javascript
'2357': {
  description: 'Historial de transferencias por fechas',
  encryptFields: ['idecl'],  // Only cedula
  decryptFields: ['numref', 'valtrn', 'bceipo', 'ifiipo', 'tculpo']  // All response fields
}
```

**Encryption Rules:**
- **Request:** Only `idecl` (cedula) is encrypted
- **Response:** All fields come encrypted with `E` suffix, automatically decrypted
- **Dates:** NOT encrypted (sent/received as plain text)

### 4. menuConfig.js (MODIFIED)
**Location:** `src/config/menuConfig.js`

**Changes:**
- **Lines 47-77:** Added submenu to PERSONA_NATURAL_MENU transfers section
- **Lines 172-182:** Added submenu to EMPRESA_MENU transfers section

```javascript
{
  id: 'transfer-history',
  label: 'Historial de Movimientos',
  component: 'TransferHistoryWindow',
  iconType: 'custom',
  customIcon: '📜',
  description: 'Consulta tu historial de transferencias',
  color: 'copper'
}
```

**Position:** Between 'external' and 'international' transfers in both menus

### 5. Dashboard.jsx (MODIFIED)
**Location:** `src/components/dashboard/Dashboard.jsx`

**Changes:**
- **Line 23:** Added import `import TransferHistoryWindow from './TransferHistoryWindow';`
- **Line 69:** Added to FormComponents mapping `TransferHistoryWindow: TransferHistoryWindow,`

## Security Features

### Encryption
- **Cedula:** Retrieved from session storage (already encrypted), sent to API as-is
- **Response Fields:** All data fields come encrypted from backend, automatically decrypted
- **Encryption Service:** Uses centralized `encryptionService.js` with AES-256-CBC

### Session Management
- Cedula retrieved using `apiService.getUserCedula()`
- If cedula not found, shows error: "No se pudo obtener la cédula del usuario"
- Session data stored in `sessionStorage` with keys: `userType`, `cedula`, `userData`

### Data Validation
- Date format validation (DD/MM/YYYY regex)
- Date range validation (max 365 days)
- Cedula presence validation
- Response structure validation

## User Experience

### Default Behavior
- Opens with last 30 days of transfers
- Automatically loads data on component mount
- Shows loading state during API call
- Displays error messages if API call fails

### Filters
- **Fecha Desde:** Start date picker (YYYY-MM-DD format in HTML)
- **Fecha Hasta:** End date picker (YYYY-MM-DD format in HTML)
- **Aplicar Filtros:** Button to reload data with selected dates
- **Limpiar Filtros:** Button to reset to default 30-day range

### Table Display
- **Columns:** Fecha | Referencia | Monto | Cuenta Destino | Institución | Tipo
- **Pagination:** 15 items per page
- **Empty State:** "No se encontraron transferencias en el periodo selecado" message
- **Styling:** Alternating row colors (gray-50/white), hover effect

### Modal Window
- **Header:** Gradient sky-600 background with "Historial de Movimientos" title
- **Close Button:** X button in top-right corner
- **Responsive:** Full-screen overlay with centered content
- **Footer:** Sky-500 background with close button

## Testing Checklist

### Functional Testing
- [ ] Component opens from both PERSONA_NATURAL and EMPRESA menus
- [ ] Default 30-day range loads correctly
- [ ] Date filters work with various ranges
- [ ] Max 365-day validation shows error
- [ ] Invalid date format shows error
- [ ] Pagination works with multiple pages
- [ ] Empty state displays when no transfers found
- [ ] Close button closes modal

### API Testing
- [ ] API 2357 receives correct parameters (tkn, prccode, idecl, fecdes, fechas)
- [ ] Cedula sent encrypted (verify in network tab)
- [ ] Dates sent in DD/MM/YYYY format
- [ ] Response fields properly decrypted
- [ ] Error responses handled gracefully

### Encryption Testing
- [ ] Cedula retrieved from session storage
- [ ] Response fields auto-decrypted (numref, valtrn, etc.)
- [ ] Dates NOT encrypted (sent as plain text)
- [ ] Encryption logs show correct process code (2357)

### Edge Cases
- [ ] Test with 0 transfers in date range
- [ ] Test with large dataset (100+ transfers, multiple pages)
- [ ] Test with expired session (cedula retrieval fails)
- [ ] Test with invalid date ranges (from > to)
- [ ] Test with future dates
- [ ] Test with very old dates (> 1 year ago)

## Browser Console Tests

### Quick Test
```javascript
// Test API 2357 with current user cedula
window.cryptoTests.testProcessCode('2357')
```

### Manual Test
```javascript
// Test transfer history API call
const fechaDesde = '01/01/2025';
const fechaHasta = '14/01/2025';

apiService.getCurrentUserTransferHistory(fechaDesde, fechaHasta)
  .then(response => {
    console.log('✅ Transfer History Response:', response);
    console.log('📊 Total Transfers:', response.data.totalTransferencias);
    console.log('📋 Transfers:', response.data.listado);
  })
  .catch(error => {
    console.error('❌ Transfer History Error:', error);
  });
```

### Verify Encryption
```javascript
// Check encryption mapping
console.log('🔐 Process 2357 Mapping:', FIELD_MAPPING_BY_PROCESS['2357']);
```

## Development Notes

### Pattern Reference
- Component follows `SavingsProductForm` pattern (modal window, filters, table, pagination)
- Date handling follows exact pattern from SavingsProductForm
- API integration follows existing apiService patterns
- Encryption mapping follows existing fieldMapper patterns

### Future Enhancements
- [ ] Add export to PDF/Excel functionality
- [ ] Add transfer type filter (internal/external/international)
- [ ] Add amount range filter
- [ ] Add sort by column functionality
- [ ] Add transfer detail modal (click row to see full details)
- [ ] Add print functionality
- [ ] Add email transfer history functionality

## Troubleshooting

### Issue: "No se pudo obtener la cédula del usuario"
**Solution:** Verify user is logged in and cedula exists in sessionStorage

### Issue: "Formato de fecha inválido"
**Solution:** Ensure dates are in DD/MM/YYYY format when calling API

### Issue: "El rango de fechas no puede superar los 365 días"
**Solution:** Select a smaller date range

### Issue: Component doesn't open from menu
**Solution:** Verify component is registered in Dashboard.jsx FormComponents mapping

### Issue: Response fields show encrypted data (Base64)
**Solution:** Verify process 2357 mapping exists in fieldMapper.js and includes all response fields

## Contact
For issues or questions, check:
- `BACKEND_ENCRYPTION_GUIDE.md` - Backend encryption documentation
- `GUIA_PRUEBAS_ENCRIPTACION.md` - Encryption testing guide
- `src/utils/crypto/README.md` - Crypto utilities documentation
