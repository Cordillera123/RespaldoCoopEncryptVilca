// src/components/IdentityValidationPage.jsx - DISEÑO CENTRADO CON TÉRMINOS DESPUÉS DE VALIDACIÓN
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService.js';
import { decrypt } from '../utils/crypto/encryptionService.js'; // ✅ Importar decrypt
import backgroundImage from "/assets/images/onu.jpg";

const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const IdentityValidationPage = ({ onNext, onCancel }) => {
  const [currentStep, setCurrentStep] = useState('validation'); // 'validation' | 'terms'
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    cedula: ''
  });
  const [clientData, setClientData] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const cedulaRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    if (cedulaRef.current) {
      cedulaRef.current.focus();
    }
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Si es el campo de cédula, solo permitir números y máximo 13 dígitos
    if (name === 'cedula') {
      const numericValue = value.replace(/\D/g, ''); // Eliminar todo lo que no sea número
      if (numericValue.length <= 13) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (alert) {
      setAlert(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cedula.trim()) {
      newErrors.cedula = 'La cédula es requerida';
    } else if (formData.cedula.trim().length < 10) {
      newErrors.cedula = 'La cédula debe tener al menos 10 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateIdentity = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.cedula.trim()) {
      setAlert({ message: 'Por favor, ingrese su cédula o RUC', type: 'error' });
      return;
    }

    if (formData.cedula.length !== 10 && formData.cedula.length !== 13) {
      setAlert({ message: 'La cédula debe tener 10 dígitos o el RUC 13 dígitos', type: 'error' });
      return;
    }

    // Prevenir múltiples clicks
    if (isLoading) {
      console.log('⚠️ [IDENTITY] Click bloqueado - Ya hay una petición en proceso');
      return;
    }

    console.log('🔒 [IDENTITY] Validando identidad para cambio de preguntas:', formData.cedula);
    setIsLoading(true);

    try {
      const result = await apiService.validateIdentityForSecurityQuestions(formData.cedula);
      console.log('📊 [IDENTITY] Resultado de validación:', result);

      if (result.success) {
        console.log('✅ [IDENTITY] Identidad validada correctamente');
        console.log('👤 [IDENTITY] Usuario encontrado:', result.data.usuario);
        console.log('👤 [IDENTITY] Cliente:', result.data.cliente);
        
        // 🔓 Desencriptar idecli si viene encriptado (está dentro de cliente[])
        let clienteData = result.data.cliente;
        if (clienteData && clienteData.idecli) {
          const idecli = clienteData.idecli;
          // Detectar si es Base64 encriptado
          if (idecli.length > 15 && (idecli.includes('==') || idecli.includes('/') || idecli.includes('+'))) {
            try {
              console.log('🔓 [IDENTITY] Desencriptando idecli:', idecli);
              clienteData = {
                ...clienteData,
                idecli: decrypt(idecli)
              };
              console.log('✅ [IDENTITY] idecli desencriptado:', clienteData.idecli);
            } catch (error) {
              console.warn('⚠️ [IDENTITY] Error desencriptando idecli:', error);
            }
          }
        }
        
        // Guardar datos
        setClientData(clienteData);
        setUsuario(result.data.usuario);
        
        // NO mostrar alert aquí - se mostrará en el siguiente paso
        console.log('✅ [IDENTITY] Datos guardados, iniciando transición...');
        
        // Mantener isLoading=true y hacer transición después de delay
        setTimeout(() => {
          console.log('🔄 [IDENTITY] Cambiando a paso de términos...');
          setCurrentStep('terms');
          
          // Mostrar alert DESPUÉS de cambiar de paso
          setAlert({ 
            message: `Cliente validado: ${clienteData?.nomcli || 'Usuario'} ${clienteData?.apecli || ''} - Usuario: ${result.data.usuario}. Ahora debe aceptar los términos y condiciones.`, 
            type: 'success' 
          });
          
          // Liberar isLoading solo después de completar transición
          setIsLoading(false);
        }, 1500); // Reducido a 1.5 segundos como en ForgotPassword
        
      } else {
        console.log('❌ [IDENTITY] Error en validación:', result.error);
        
        // Liberar isLoading inmediatamente en caso de error
        setIsLoading(false);
        
        if (result.error.code === 'NO_USER_REGISTERED') {
          setAlert({ 
            message: 'Este cliente no tiene un usuario registrado. Debe registrarse primero en el sistema antes de configurar preguntas de seguridad.', 
            type: 'error' 
          });
        } else if (result.error.code === 'CLIENT_NOT_FOUND') {
          setAlert({ 
            message: 'No se encontró ningún cliente con esta cédula en nuestros registros.', 
            type: 'error' 
          });
        } else {
          setAlert({ 
            message: result.error.message || 'Error al validar la identidad', 
            type: 'error' 
          });
        }
      }
    } catch (error) {
      console.error('💥 [IDENTITY] Error inesperado:', error);
      setIsLoading(false);
      setAlert({ 
        message: 'Error de conexión. Intente nuevamente.', 
        type: 'error' 
      });
    }
    // ⚠️ NO usar finally - queremos controlar isLoading manualmente
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleValidateIdentity(e);
  };

  const handleTermsSubmit = () => {
    if (!acceptedTerms) {
      setAlert({ message: 'Debe aceptar los términos y condiciones para continuar', type: 'error' });
      return;
    }
    
    // Prevenir múltiples clicks
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('✅ [TERMS] Términos aceptados, procediendo con el flujo');
    // ⚠️ No mostrar alert para evitar interferencias - el botón muestra el estado
    
    setTimeout(() => {
      if (onNext) {
        onNext({
          cedula: formData.cedula,
          clientData: clientData,
          usuario: usuario,
          acceptedTerms: acceptedTerms
        });
      }
    }, 1500);
  };

  // STEP 1: VALIDACIÓN DE IDENTIDAD
  if (currentStep === 'validation') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-16 w-24 h-24 bg-cyan-400/5 rounded-lg rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-cyan-500/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        <div className="min-h-screen flex items-center justify-center p-8 relative z-10">
          <div className={`w-full max-w-md transition-all duration-1000 ${
            isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
          }`}>
            
            {/* Back button */}
            <div className="mb-6">
              <button
                onClick={onCancel}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
                </svg>
                <span>Volver al login</span>
              </button>
            </div>

            {/* Progress indicator - Migajas de pan */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {['Validar Identidad', 'Preguntas de Seguridad', 'Código de Seguridad'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index === 0
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-300 text-slate-700'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 2 && (
                      <div className={`w-12 h-0.5 mx-2 transition-all duration-300 bg-slate-300`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <p className="text-slate-800 text-sm font-bold">
                  Paso 1 de 3: Validar Identidad
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
                  Validar Identidad
                </h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
                <p className="text-slate-600 text-xs font-medium">
                  Paso 1 de 2: Ingrese su número de cédula para verificar que es cliente de la cooperativa
                </p>
              </div>

              {/* Alert - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              {alert && (
                <div className="mb-4 relative z-10">
                  <div className={`p-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${
                    alert.type === "success"
                      ? "bg-cyan-50/80 border-cyan-200/60 text-cyan-800"
                      : "bg-red-50/80 border-red-200/60 text-red-800"
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                        alert.type === "success" ? "bg-cyan-100/80" : "bg-red-100/80"
                      }`}>
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          {alert.type === "success" ? (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          )}
                        </svg>
                      </div>
                      <span className="text-xs font-semibold">{alert.message}</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Input del número de cédula */}
                <div className="space-y-2">
                  <label htmlFor="cedula" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Número de Cédula
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                      </svg>
                    </div>
                    <input
                      ref={cedulaRef}
                      id="cedula"
                      name="cedula"
                      type="text"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      placeholder="Ej: 1712345678"
                      disabled={isLoading}
                      className={`block w-full pl-10 pr-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                        errors.cedula ? 'border-red-400 ring-2 ring-red-200' : 'border-slate-300 hover:border-slate-400'
                      }`}
                    />
                  </div>
                  {errors.cedula && (
                    <p className="text-red-700 text-xs mt-1 font-medium">{errors.cedula}</p>
                  )}
                </div>

                

                {/* Botones */}
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={
                      isLoading || 
                      !formData.cedula.trim() || 
                      (formData.cedula.length !== 10 && formData.cedula.length !== 13)
                    }
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed ${
                      (isLoading || 
                      !formData.cedula.trim() || 
                      (formData.cedula.length !== 10 && formData.cedula.length !== 13))
                        ? 'bg-slate-400'
                        : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando identidad...
                      </>
                    ) : !formData.cedula.trim() ? (
                      'Ingrese cédula o RUC'
                    ) : (formData.cedula.length !== 10 && formData.cedula.length !== 13) ? (
                      'Cédula o RUC incompleto'
                    ) : (
                      'VALIDAR IDENTIDAD'
                    )}
                  </button>

                  
                </div>
              </form>
            </div>

            {/* Security notice - ESTILO ACTUALIZADO COMO LOGINPAGE */}
        
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: TÉRMINOS Y CONDICIONES (después de validación exitosa)
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-xl transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('validation')}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
              <span>Regresar</span>
            </button>
          </div>

          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            <div className="text-center mb-6 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4"><img src="/assets/images/isocoaclasnaves.png" alt="Logo" className="w-full h-full object-contain" /></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Términos y Condiciones</h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">Paso 2 de 2: Aceptar términos para cambio de preguntas de seguridad</p>
              {clientData && (
                <div className="mt-4 bg-cyan-50/90 border border-cyan-200/70 rounded-xl p-3">
                  <p className="text-cyan-900 text-sm font-bold">
                    <span className="font-bold">{clientData.nomcli} {clientData.apecli}</span> • Cédula: {clientData.idecli} • Usuario: {usuario}
                  </p>
                </div>
              )}
            </div>

            {alert && (
              <div className="mb-4 relative z-10">
                <div className={`p-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${
                  alert.type === "success" ? "bg-cyan-50/80 border-cyan-200/60 text-cyan-800" : "bg-red-50/80 border-red-200/60 text-red-800"
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                      alert.type === "success" ? "bg-cyan-100/80" : "bg-red-100/80"
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        {alert.type === "success" ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /> : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/70 mb-6">
              <h3 className="text-slate-900 font-bold text-sm mb-3 flex items-center">
                <svg className="w-5 h-5 text-slate-600 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9z" /><path d="M4 12a2 2 0 012-2h10a2 2 0 012 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" /></svg>
                Términos y Condiciones - Preguntas de Seguridad
              </h3>
              
              <div className="bg-white max-h-96 overflow-y-auto rounded-lg border border-slate-200 shadow-inner p-4">
                <div className="prose prose-sm max-w-none">
                  <h4 className="font-bold text-slate-900 mb-3">TÉRMINOS Y CONDICIONES - CAMBIO DE PREGUNTAS DE SEGURIDAD</h4>
                  
                  <div className="space-y-4 text-slate-700">
                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">1. PROPÓSITO Y ALCANCE</h5>
                      <p className="text-sm leading-relaxed">
                        Estos términos y condiciones regulan el proceso de cambio de preguntas de seguridad para usuarios 
                        registrados en el sistema de banca digital de Cooperativa de Ahorro y Crédito Vilcabamba.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">2. VALIDACIÓN DE IDENTIDAD REQUERIDA</h5>
                      <p className="text-sm leading-relaxed">
                        Para proceder con el cambio de preguntas de seguridad, es obligatorio verificar la identidad 
                        mediante número de cédula válido y confirmar que existe un usuario registrado asociado.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">3. RESPONSABILIDADES DEL USUARIO</h5>
                      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
                        <li>Seleccionar preguntas cuyas respuestas solo usted conoce</li>
                        <li>Proporcionar respuestas que pueda recordar fácilmente</li>
                        <li>No compartir las preguntas ni respuestas con terceros</li>
                        <li>Mantener actualizada su información de contacto</li>
                        <li>Notificar inmediatamente cualquier uso no autorizado</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">4. SEGURIDAD Y CONFIDENCIALIDAD</h5>
                      <p className="text-sm leading-relaxed">
                        Las preguntas de seguridad constituyen un mecanismo adicional de protección. La cooperativa 
                        recomienda evitar información fácilmente accesible en redes sociales o documentos públicos.
                      </p>
                    </section>

                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">5. FRECUENCIA Y LIMITACIONES</h5>
                      <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
                        <li>Máximo un cambio cada 30 días calendario</li>
                        <li>Requiere validación exitosa de identidad en cada ocasión</li>
                        <li>No se pueden reutilizar preguntas de los últimos 6 meses</li>
                        <li>Proceso disponible únicamente para usuarios activos</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="font-semibold text-slate-800 mb-2">6. PROTECCIÓN DE DATOS</h5>
                      <p className="text-sm leading-relaxed">
                        La cooperativa garantiza el cumplimiento de la Ley Orgánica de Protección de Datos Personales 
                        del Ecuador. Los datos son tratados con estricta confidencialidad.
                      </p>
                    </section>

                    <div className="mt-6 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <p className="text-xs text-cyan-800">
                        <strong>Última actualización:</strong> Octubre 2025<br/>
                        <strong>Contacto:</strong> info@lasnaves.coop
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50/80 transition-colors duration-200">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-5 w-5 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded-md shadow-sm"
                />
                <span className="text-slate-800 text-sm font-medium">
                  He leído y acepto los <strong>términos y condiciones</strong> para el cambio de preguntas de seguridad de Cooperativa de Ahorro y Crédito Vilcabamba.
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTermsSubmit}
                disabled={!acceptedTerms || isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed ${
                  (!acceptedTerms || isLoading)
                    ? 'bg-slate-400'
                    : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  'CONTINUAR CON PREGUNTAS DE SEGURIDAD'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityValidationPage;