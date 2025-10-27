// src/components/RegisterPage.jsx - PASO 1: VALIDACIÓN DE IDENTIDAD
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';
import backgroundImage from "/public/assets/images/onu.jpg";

const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const RegisterPage = ({ onNext, onBack }) => {
  const [cedula, setCedula] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const validateIdentificacion = (identificacion) => {
    if (!identificacion || identificacion.trim().length < 10) {
      return 'La identificación debe tener al menos 10 dígitos';
    }

    if (!/^\d+$/.test(identificacion)) {
      return 'La identificación solo puede contener números';
    }

    const id = identificacion.trim();
    
    // Validar según el tipo de identificación
    if (id.length === 10) {
      // Validación de cédula ecuatoriana
      return validateCedulaEcuatoriana(id);
    } else if (id.length === 13) {
      // Validación de RUC ecuatoriano
      return validateRucEcuatoriano(id);
    } else {
      return 'La identificación debe tener 10 dígitos (cédula) o 13 dígitos (RUC)';
    }
  };

  const validateCedulaEcuatoriana = (cedula) => {
    const digits = cedula.split('').map(Number);
    const province = parseInt(cedula.substring(0, 2));

    if (province < 1 || province > 24) {
      return 'Los dos primeros dígitos deben corresponder a una provincia válida (01-24)';
    }

    const thirdDigit = digits[2];
    if (thirdDigit > 6) {
      return 'El tercer dígito de la cédula debe ser menor o igual a 6';
    }

    // Algoritmo de verificación para cédula
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      let product = digits[i] * coefficients[i];
      if (product > 9) {
        product -= 9;
      }
      sum += product;
    }

    const verifier = (Math.ceil(sum / 10) * 10) - sum;
    const lastDigit = verifier === 10 ? 0 : verifier;

    if (digits[9] !== lastDigit) {
      return 'La cédula ingresada no es válida';
    }

    return null;
  };

  const validateRucEcuatoriano = (ruc) => {
    // VALIDACIÓN TEMPORAL DESHABILITADA PARA PRUEBAS
    // TODO: Implementar validación correcta de RUC ecuatoriano
    console.log('⚠️ [REGISTRO] Validación de RUC temporalmente deshabilitada para pruebas');
    return null; // Siempre válido por ahora
  };

  const handleIdentificacionChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 13) { // Permitir hasta 13 caracteres para RUC
      setCedula(value);
      
      // Limpiar errores cuando el usuario empiece a escribir
      if (errors.cedula) {
        setErrors(prev => ({ ...prev, cedula: '' }));
      }
      
      if (alert && alert.type === 'error') {
        setAlert(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🆔 [REGISTER] Validando identidad para registro');
    
    // Limpiar errores previos
    setErrors({});
    setAlert(null);

    // Validar identificación (cédula o RUC)
    const identificacionError = validateIdentificacion(cedula);
    if (identificacionError) {
      setErrors({ cedula: identificacionError });
      setAlert({ message: identificacionError, type: 'error' });
      return;
    }

    setIsLoading(true);
    setAlert({ message: 'Validando identidad...', type: 'info' });

    try {
      const result = await apiService.validateIdentityForUserRegistration(cedula);
      
      console.log('📊 [REGISTER] Resultado validación:', result);
      
      if (result.success) {
        // Cliente sin usuario registrado - puede proceder
        console.log('✅ [REGISTER] Cliente válido sin usuario, procediendo...');
        setAlert({ message: 'Identidad validada correctamente. Continuando...', type: 'success' });
        
        setTimeout(() => {
          if (onNext) {
            onNext({
              cedula: cedula,
              clienteData: result.data.cliente
            });
          }
        }, 1500);
        
      } else {
        // Manejar diferentes tipos de error
        let errorMessage = result.error.message;
        let errorType = 'error';
        
        if (result.error.code === 'USER_ALREADY_EXISTS') {
          errorMessage = `Ya existe un usuario registrado con esta cédula: "${result.error.existingUser}". Si olvidó su contraseña, use la opción "¿Olvidó su contraseña?" en el login.`;
          errorType = 'warning';
        } else if (result.error.code === 'CLIENT_NOT_FOUND') {
          const tipoId = cedula.length === 13 ? 'RUC' : 'cédula';
          errorMessage = `No se encontró un cliente registrado con este ${tipoId}. Verifique que esté correcto o contacte a la cooperativa.`;
        }
        
        console.error('❌ [REGISTER] Error:', errorMessage);
        setAlert({ message: errorMessage, type: errorType });
        setErrors({ cedula: result.error.message });
      }
    } catch (error) {
      console.error('💥 [REGISTER] Error inesperado:', error);
      setAlert({ 
        message: 'Error de conexión. Verifique su internet e intente nuevamente.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-16 w-24 h-24 bg-cyan-400/5 rounded-lg rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-cyan-500/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-md transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              disabled={isLoading}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 disabled:opacity-50 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Volver al login</span>
            </button>
          </div>

          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              {['Identidad', 'Credenciales', 'Preguntas', 'Código'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index === 0
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-1 transition-all duration-300 bg-slate-300`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-slate-800 text-sm font-bold">
                Paso 1 de 4: Validar Identidad
              </p>
            </div>
          </div>

          {/* Main card - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            
            {/* Efectos de brillo sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            {/* Header - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            <div className="text-center mb-6 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4">
                <img src="/assets/images/isocoaclasnaves.png" alt="Logo Cooperativa" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Registrar Nuevo Usuario
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                Paso 1 de 4: Validar tu identidad
              </p>
            </div>

            {/* Alert - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {alert && (
              <div className="mb-4 relative z-10">
                <div className={`p-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${
                  alert.type === 'success'
                    ? "bg-cyan-50/80 border-cyan-200/60 text-cyan-800"
                    : "bg-red-50/80 border-red-200/60 text-red-800"
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                      alert.type === 'success' ? "bg-cyan-100/80" : "bg-red-100/80"
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        {alert.type === 'success' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        )}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {/* Cédula input - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              <div className="space-y-1">
                <label htmlFor="cedula" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Número de Identificación
                </label>
                <input
                  id="cedula"
                  type="text"
                  value={cedula}
                  onChange={handleIdentificacionChange}
                  placeholder="Ingrese su cédula (10 dígitos) o RUC (13 dígitos)"
                  disabled={isLoading}
                  className={`block w-full px-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                    errors.cedula 
                      ? 'border-red-400 ring-2 ring-red-200' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                />
                {errors.cedula && (
                  <p className="text-red-600 text-xs mt-1">{errors.cedula}</p>
                )}
                {cedula && (
                  <div className="mt-2">
                    <p className="text-slate-600 text-xs">
                      Dígitos ingresados: {cedula.length}/13
                      {cedula.length === 10 && <span className="text-cyan-600 ml-2 font-medium">→ Cédula</span>}
                      {cedula.length === 13 && <span className="text-cyan-600 ml-2 font-medium">→ RUC</span>}
                    </p>
                    {(cedula.length === 10 || cedula.length === 13) && !errors.cedula && (
                      <p className="text-cyan-600 text-xs font-medium">✓ Formato válido</p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit button - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !cedula || (cedula.length !== 10 && cedula.length !== 13)}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10 tracking-wide text-xs">Validando...</span>
                    </>
                  ) : (
                    <span className="relative z-10 tracking-wide font-bold uppercase text-sm">Continuar</span>
                  )}
                </button>

                
              </div>
            </form>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;