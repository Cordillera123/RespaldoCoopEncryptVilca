// src/components/UserCredentialsPage.jsx - PASO 2: TÉRMINOS Y CREDENCIALES
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService.js';
import backgroundImage from "/public/assets/images/onu.jpg";

const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const UserCredentialsPage = ({ registrationData, onNext, onBack }) => {
  const [currentStep, setCurrentStep] = useState('terms'); // 'terms' | 'credentials'
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [validationStatus, setValidationStatus] = useState({
    username: { valid: null, message: '', checking: false },
    password: { valid: null, message: '', checking: false }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Estados para mostrar/ocultar contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Función para validar disponibilidad de usuario en tiempo real
  const validateUsernameAvailability = async (username) => {
    if (username.length < 6) return;

    setValidationStatus(prev => ({
      ...prev,
      username: { ...prev.username, checking: true }
    }));

    try {
      const result = await apiService.validateUsernameAvailability(username);
      
      if (result.success) {
        setValidationStatus(prev => ({
          ...prev,
          username: { 
            valid: true, 
            message: '✓ Nombre de usuario disponible', 
            checking: false 
          }
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          username: { 
            valid: false, 
            message: result.error.message, 
            checking: false 
          }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        username: { 
          valid: false, 
          message: 'Error verificando disponibilidad', 
          checking: false 
        }
      }));
    }
  };

  // Función para validar fortaleza de contraseña en tiempo real
  const validatePasswordStrength = async (username, password) => {
    if (!username || password.length < 8) return;

    setValidationStatus(prev => ({
      ...prev,
      password: { ...prev.password, checking: true }
    }));

    try {
      const result = await apiService.validatePasswordStrength(username, password);
      
      if (result.success) {
        setValidationStatus(prev => ({
          ...prev,
          password: { 
            valid: true, 
            message: '✓ Contraseña válida', 
            checking: false 
          }
        }));
      } else {
        setValidationStatus(prev => ({
          ...prev,
          password: { 
            valid: false, 
            message: result.error.message, 
            checking: false 
          }
        }));
      }
    } catch (error) {
      setValidationStatus(prev => ({
        ...prev,
        password: { 
          valid: false, 
          message: 'Error validando contraseña', 
          checking: false 
        }
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validación en tiempo real con debounce
    if (field === 'username') {
      setValidationStatus(prev => ({
        ...prev,
        username: { valid: null, message: '', checking: false }
      }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      if (value.length >= 6) {
        debounceRef.current = setTimeout(() => {
          validateUsernameAvailability(value);
        }, 800);
      }
    }

    if (field === 'password' && formData.username) {
      setValidationStatus(prev => ({
        ...prev,
        password: { valid: null, message: '', checking: false }
      }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      
      if (value.length >= 8) {
        debounceRef.current = setTimeout(() => {
          validatePasswordStrength(formData.username, value);
        }, 800);
      }
    }
  };

  const validateCredentials = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 6) {
      newErrors.username = 'El nombre de usuario debe tener al menos 6 caracteres';
    } else if (validationStatus.username.valid !== true) {
      newErrors.username = 'Debe verificar la disponibilidad del nombre de usuario';
    }

    // Validar password
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (validationStatus.password.valid !== true) {
      newErrors.password = 'La contraseña no cumple con los requisitos de seguridad';
    }

    // Validar confirmación
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debe confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTermsSubmit = () => {
    if (!acceptedTerms) {
      setAlert({ message: 'Debe aceptar los términos y condiciones para continuar', type: 'error' });
      return;
    }
    
    setCurrentStep('credentials');
    setAlert({ message: 'Ahora configure sus credenciales de acceso', type: 'success' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    
    console.log('👤 [CREDENTIALS] Validando credenciales antes de continuar');
    
    if (!validateCredentials()) {
      setAlert({ message: 'Por favor, complete todos los campos correctamente', type: 'error' });
      return;
    }

    setIsLoading(true);
    setAlert({ message: 'Validando credenciales finales...', type: 'info' });

    try {
      // Validación final de usuario y contraseña
      const [userResult, passwordResult] = await Promise.all([
        apiService.validateUsernameAvailability(formData.username),
        apiService.validatePasswordStrength(formData.username, formData.password)
      ]);

      if (userResult.success && passwordResult.success) {
        console.log('✅ [CREDENTIALS] Credenciales validadas exitosamente');
        setAlert({ message: 'Credenciales válidas. Continuando...', type: 'success' });
        
        setTimeout(() => {
          if (onNext) {
            onNext({
              username: formData.username,
              password: formData.password
            });
          }
        }, 1500);
      } else {
        const error = !userResult.success ? userResult.error : passwordResult.error;
        setAlert({ message: error.message, type: 'error' });
      }
    } catch (error) {
      console.error('💥 [CREDENTIALS] Error inesperado:', error);
      setAlert({ message: 'Error al validar las credenciales. Intente nuevamente.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1: TÉRMINOS Y CONDICIONES
  if (currentStep === 'terms') {
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
                onClick={onBack}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
                <span>Regresar</span>
              </button>
            </div>

            {/* Progress indicator - Migajas de pan */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-2">
                {['Identidad', 'Credenciales', 'Preguntas', 'Código'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index === 0
                        ? 'bg-green-500 text-white'
                        : index === 1
                          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-300 text-slate-700'
                    }`}>
                      {index === 0 ? (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 3 && (
                      <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
                        index < 1
                          ? 'bg-green-500'
                          : 'bg-slate-300'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <p className="text-slate-800 text-sm font-bold">
                  Paso 2 de 4: Términos y Credenciales
                </p>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
              
              <div className="text-center mb-6 relative z-10">
                <div className="w-24 h-24 mx-auto mb-4"><img src="/assets/images/isocoaclasnaves.png" alt="Logo" className="w-full h-full object-contain" /></div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">Términos y Condiciones</h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
                <p className="text-slate-600 text-xs font-medium">Paso 2 de 4: Aceptar términos del servicio</p>
                {registrationData.clienteData && (
                  <div className="mt-4 bg-cyan-50/90 border border-cyan-200/70 rounded-xl p-3">
                    <p className="text-cyan-900 text-sm font-bold">
                      <span className="font-bold">{registrationData.clienteData.nomcli} {registrationData.clienteData.apecli}</span> • Cédula: {registrationData.cedula}
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
                  Términos y Condiciones de Uso
                </h3>
                
                <div className="bg-white max-h-96 overflow-y-auto rounded-lg border border-slate-200 shadow-inner p-4">
                  <div className="prose prose-sm max-w-none">
                    <h4 className="font-bold text-slate-900 mb-3">TÉRMINOS Y CONDICIONES DE USO - LAS NAVES COOPERATIVA</h4>
                    
                    <div className="space-y-4 text-slate-700">
                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">1. ACEPTACIÓN DE TÉRMINOS</h5>
                        <p className="text-sm leading-relaxed">
                          Al acceder y utilizar los servicios digitales de Las Naves Cooperativa de Ahorro y Crédito, 
                          usted acepta cumplir con estos términos y condiciones en su totalidad.
                        </p>
                      </section>

                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">2. USO DE LA PLATAFORMA</h5>
                        <p className="text-sm leading-relaxed">
                          La plataforma está destinada exclusivamente para el uso de socios y clientes autorizados 
                          de la cooperativa. El acceso no autorizado está prohibido y puede resultar en acciones legales.
                        </p>
                      </section>

                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">3. SEGURIDAD Y PRIVACIDAD</h5>
                        <p className="text-sm leading-relaxed">
                          Nos comprometemos a proteger su información personal y financiera mediante tecnologías 
                          de seguridad avanzadas. Usted es responsable de mantener la confidencialidad de sus credenciales.
                        </p>
                      </section>

                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">4. RESPONSABILIDADES DEL USUARIO</h5>
                        <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
                          <li>Proporcionar información veraz y actualizada</li>
                          <li>Mantener la seguridad de sus credenciales de acceso</li>
                          <li>Notificar inmediatamente cualquier actividad sospechosa</li>
                          <li>Usar la plataforma de manera responsable y legal</li>
                        </ul>
                      </section>

                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">5. LIMITACIONES</h5>
                        <p className="text-sm leading-relaxed">
                          La cooperativa se reserva el derecho de suspender o terminar el acceso a usuarios 
                          que violen estos términos o utilicen la plataforma de manera inapropiada.
                        </p>
                      </section>

                      <section>
                        <h5 className="font-semibold text-slate-800 mb-2">6. MODIFICACIONES</h5>
                        <p className="text-sm leading-relaxed">
                          Estos términos pueden ser modificados en cualquier momento. Los cambios serán 
                          notificados a través de la plataforma y entrarán en vigor inmediatamente.
                        </p>
                      </section>

                      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-800">
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
                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-md shadow-sm"
                  />
                  <span className="text-slate-800 text-sm font-medium">
                    He leído y acepto los <strong>términos y condiciones</strong> de uso de los servicios digitales de Las Naves Cooperativa de Ahorro y Crédito.
                  </span>
                </label>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTermsSubmit}
                  disabled={!acceptedTerms}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  CONTINUAR CON CREDENCIALES
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: CREDENCIALES
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          
          <div className="mb-6">
            <button
              onClick={() => setCurrentStep('terms')}
              disabled={isLoading}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 disabled:opacity-50 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
              <span>Regresar a términos</span>
            </button>
          </div>

          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              {['Identidad', 'Credenciales', 'Preguntas', 'Código'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index === 0
                      ? 'bg-green-500 text-white'
                      : index === 1
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index === 0 ? (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
                      index < 1
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-slate-800 text-sm font-bold">
                Paso 2 de 4: Términos y Credenciales
              </p>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            <div className="text-center mb-6 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4">
                <img src="/assets/images/isocoaclasnaves.png" alt="Logo Cooperativa" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Crear Credenciales
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                Paso 2 de 4: Configure su usuario y contraseña
              </p>
              {registrationData.clienteData && (
                <div className="mt-4 bg-cyan-50/90 border border-cyan-200/70 rounded-xl p-3">
                  <p className="text-cyan-900 text-sm font-bold">
                    <span className="font-bold">{registrationData.clienteData.nomcli} {registrationData.clienteData.apecli}</span> • Cédula: {registrationData.cedula}
                  </p>
                </div>
              )}
            </div>

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

            <form onSubmit={handleCredentialsSubmit} className="space-y-4 relative z-10">
              {/* Username */}
              <div className="space-y-1">
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Nombre de Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                      validationStatus.username.valid === false ? 'border-red-400 ring-2 ring-red-200' :
                      validationStatus.username.valid === true ? 'border-cyan-400 ring-2 ring-cyan-200' :
                      'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                  
                  {/* Indicador de validación */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {validationStatus.username.checking ? (
                      <svg className="animate-spin h-4 w-4 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : validationStatus.username.valid === true ? (
                      <svg className="h-4 w-4 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    ) : validationStatus.username.valid === false ? (
                      <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                    ) : null}
                  </div>
                </div>
                
                {/* Validation message */}
                {validationStatus.username.message && (
                  <p className={`text-xs mt-1 font-medium ${
                    validationStatus.username.valid === false ? 'text-red-600' :
                    validationStatus.username.valid === true ? 'text-cyan-600' :
                    'text-yellow-600'
                  }`}>
                    {validationStatus.username.message}
                  </p>
                )}
                {formData.username && (
                  <p className="text-slate-600 text-xs mt-1">
                    Longitud: {formData.username.length} caracteres (mínimo 6)
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres con mayúscula, minúscula y número"
                    disabled={isLoading || !formData.username}
                    className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                      validationStatus.password.valid === false ? 'border-red-400 ring-2 ring-red-200' :
                      validationStatus.password.valid === true ? 'border-cyan-400 ring-2 ring-cyan-200' :
                      'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                  
                  {/* Indicador de validación y botón de ojo */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    {validationStatus.password.checking ? (
                      <svg className="animate-spin h-4 w-4 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : validationStatus.password.valid === true ? (
                      <svg className="h-4 w-4 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    ) : validationStatus.password.valid === false ? (
                      <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                    ) : null}
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!formData.password}
                      className="text-slate-500 hover:text-slate-700 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      tabIndex={-1}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        {showPassword ? (
                          <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                        ) : (
                          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Validation message */}
                {validationStatus.password.message && (
                  <p className={`text-xs mt-1 font-medium ${
                    validationStatus.password.valid === false ? 'text-red-600' :
                    validationStatus.password.valid === true ? 'text-cyan-600' :
                    'text-yellow-600'
                  }`}>
                    {validationStatus.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirme su contraseña"
                    disabled={isLoading || !formData.password}
                    className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                      errors.confirmPassword ? 'border-red-400 ring-2 ring-red-200' : 
                      formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'border-cyan-400 ring-2 ring-cyan-200' :
                      'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                  
                  {/* Botón de ojo para mostrar/ocultar contraseña */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={!formData.confirmPassword}
                      className="text-slate-500 hover:text-slate-700 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      tabIndex={-1}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        {showConfirmPassword ? (
                          <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                        ) : (
                          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-xs mt-1 font-medium">{errors.confirmPassword}</p>
                )}
                
                {/* Password match indicator */}
                {formData.password && formData.confirmPassword && (
                  <div className={`text-xs mt-1 font-medium ${
                    formData.password === formData.confirmPassword ? 'text-cyan-600' : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword ? 
                      '✓ Las contraseñas coinciden' : 
                      '✗ Las contraseñas no coinciden'
                    }
                  </div>
                )}
              </div>

              {/* Password requirements */}
              <div className="bg-cyan-50/80 border-cyan-200/60 text-cyan-800 rounded-lg p-3 border backdrop-blur-sm">
                <p className="text-cyan-800 text-sm font-bold mb-2">Requisitos de la contraseña:</p>
                <ul className="text-cyan-700 text-xs space-y-1 font-medium">
                  <li>• Al menos 8 caracteres</li>
                  <li>• Una letra mayúscula</li>
                  <li>• Una letra minúscula</li>
                  <li>• Un número</li>
                  <li>• Un carácter especial</li>
                </ul>
              </div>

              {/* Submit button */}
              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !formData.username || !formData.password || !formData.confirmPassword}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10 tracking-wide text-xs">VALIDANDO...</span>
                    </>
                  ) : (
                    <span className="relative z-10 tracking-wide font-bold uppercase text-sm">Continuar con Preguntas</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep('terms')}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200 font-medium"
                >
                  Regresar a términos
                </button>
              </div>
            </form>
          </div>

          {/* Security notice */}
          <div className="mt-6 backdrop-blur-xl bg-white/95 rounded-xl p-4 border border-white/50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-cyan-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
              </div>
              <div className="text-sm text-slate-800">
                <p className="font-bold">Próximo Paso</p>
                <p className="text-slate-700 font-medium">
                  Configure 3 preguntas de seguridad para proteger su cuenta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCredentialsPage;