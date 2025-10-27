// Script de prueba para el servicio de detalle de inversión
// Ejecutar desde la consola del navegador después de login

// Datos de prueba basados en el JSON proporcionado
const testData = {
  tkn: "0999SolSTIC20220719",
  prccode: "2213",
  idecl: "0200414662",
  codinv: "420102000010",
  fecdes: "01/01/2005",
  fechas: "05/18/2005"
};

console.log('🧪 [TEST] Datos de prueba:', testData);

// Función para probar el servicio
async function testInvestmentDetail() {
  try {
    console.log('🔄 [TEST] Iniciando prueba del servicio de detalle de inversión...');
    
    // Importar el servicio (si está disponible globalmente)
    if (typeof apiService === 'undefined') {
      console.error('❌ [TEST] apiService no está disponible. Asegúrate de estar en la página correcta.');
      return;
    }
    
    // Probar el método con datos de prueba
    const result = await apiService.getInvestmentDetail(
      testData.idecl,
      testData.codinv,
      testData.fecdes,
      testData.fechas
    );
    
    console.log('📊 [TEST] Resultado del servicio:', result);
    
    if (result.success) {
      console.log('✅ [TEST] ¡Servicio funcionando correctamente!');
      console.log('🏢 [TEST] Empresa:', result.data.cliente.nombreEmpresa);
      console.log('👤 [TEST] Cliente:', result.data.cliente.nombreCompleto);
      console.log('💰 [TEST] Inversión:', result.data.inversion.tipoInversion);
      console.log('📊 [TEST] Movimientos encontrados:', result.data.movimientos.length);
      console.log('💵 [TEST] Saldo actual:', result.data.estadisticas.saldoActual);
      
      // Mostrar algunos movimientos de ejemplo
      if (result.data.movimientos.length > 0) {
        console.log('📝 [TEST] Ejemplo de movimientos:');
        result.data.movimientos.slice(0, 3).forEach((mov, index) => {
          console.log(`  ${index + 1}. ${mov.fechaFormateada} - ${mov.descripcion} - Crédito: $${mov.valorCredito} - Saldo: $${mov.saldo}`);
        });
      }
    } else {
      console.error('❌ [TEST] Error en el servicio:', result.error);
    }
    
  } catch (error) {
    console.error('💥 [TEST] Error inesperado:', error);
  }
}

// Función para probar desde el componente React
function testFromComponent() {
  console.log('🧪 [TEST] Para probar desde el componente React:');
  console.log('1. Asegúrate de estar logueado');
  console.log('2. Ve a la página de inversiones');
  console.log('3. Haz clic en una inversión para ver el detalle');
  console.log('4. Los filtros de fecha y búsqueda deberían funcionar');
  console.log('5. Revisa la consola para ver los logs detallados');
}

// Datos de respuesta esperada (ejemplo)
const expectedResponse = {
  "estado": "000",
  "msg": "CORRECTO",
  "cliente": {
    "nomemp": "COOPERATIVA LAS NAVES LTDA",
    "nomofi": "LAS NAVES - BOLIVAR",
    "codcli": "1362",
    "idecli": "0200414662",
    "apecli": "VASCONEZ IBARRA",
    "nomcli": "ARTURO ARNULFO",
    "inversion": {
      "codinv": "420102000010",
      "desein": "VIGENTE",
      "destin": "DEPOSITO DE PLAZO FIJO",
      "salcnt": "900.0000",
      "saldis": "900.0000",
      "tasinv": "5.00",
      "fecini": "2004-12-19",
      "diaplz": "150",
      "fecven": "2005-05-18"
    },
    "detalle": [
      {
        "fectrn": "2005-04-28",
        "codcaj": "000",
        "docnum": "PRINT-00000006",
        "tiptrn": "Efect",
        "valcre": "3.5000",
        "valdeb": "0.00",
        "saldos": "16.25",
        "dettrn": "Realizado por el Titular",
        "fecstr": "Abril 28"
      }
    ]
  }
};

console.log('🧪 [TEST] Respuesta esperada del servidor:', expectedResponse);
console.log('🧪 [TEST] Ejecuta testInvestmentDetail() para probar el servicio');
console.log('🧪 [TEST] Ejecuta testFromComponent() para instrucciones del componente');

// Exportar funciones para uso global
window.testInvestmentDetail = testInvestmentDetail;
window.testFromComponent = testFromComponent;
