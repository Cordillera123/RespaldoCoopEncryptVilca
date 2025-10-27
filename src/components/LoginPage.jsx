// src/components/LoginPage.jsx - SOLO MEJORA DEL TEXTO PRINCIPAL
import React, { useState, useEffect, useRef } from "react";
import apiService from "../services/apiService.js";
import backgroundImage from "/public/assets/images/onu.jpg";
import lasNaveslogo1 from "/public/assets/images/logolasnaves_c.png";

const backgroundStyle = {
  backgroundImage: `linear-gradient(135deg, rgba(25,47,71,0.25) 0%, rgba(40,70,102,0.20) 30%, rgba(55,93,133,0.15) 70%, rgba(70,116,164,0.10) 100%), url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const LoginPage = ({ 
  onLoginSuccess, 
  onForgotPassword, 
  onBlockUser, 
  onRegister,
  onSecurityQuestionsRegister
}) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    checkExistingSession();
    loadRememberedUser();
    return () => clearTimeout(timer);
  }, []);

  const checkExistingSession = () => {
    if (apiService.isAuthenticated()) {
      showAlert("Ya tienes una sesión activa. Redirigiendo...", "success");
      setTimeout(() => {
        const session = apiService.getUserSession();
        if (onLoginSuccess) {
          onLoginSuccess(session);
        } else {
          redirectToDashboard();
        }
      }, 2000);
    }
  };

  const loadRememberedUser = () => {
    try {
      const rememberedUser = localStorage.getItem("rememberedUser");
      if (rememberedUser) {
        setFormData(prev => ({
          ...prev,
          username: rememberedUser,
          rememberMe: true
        }));
      }
    } catch (error) {
      console.warn("Error al cargar usuario recordado:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (alert && alert.type === "error") {
      setAlert(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "El usuario es requerido";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "El usuario debe tener al menos 3 caracteres";
    }

    if (!formData.password.trim()) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.trim().length < 4) {
      newErrors.password = "La contraseña debe tener al menos 4 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🚀 [LOGIN] Iniciando proceso de login");

    if (!validateForm()) {
      console.log("❌ [LOGIN] Validación de formulario falló");
      showAlert("Por favor, complete todos los campos correctamente", "error");
      return;
    }

    setIsLoading(true);
    setAlert(null);
    setErrors({});

    try {
      console.log("🔐 [2FA-LOGIN] Llamando a apiService.loginWithTwoFactor...");

      const result = await apiService.loginWithTwoFactor(
        formData.username.trim(),
        formData.password.trim()
      );

      console.log("📊 [2FA-LOGIN] Respuesta completa del servidor:", result);

      if (result.success) {
        
        // ⭐ NUEVO: Verificar si requiere 2FA
        if (result.requiresTwoFactor) {
          console.log("🔐 [2FA-LOGIN] Requiere autenticación en dos pasos");
          showAlert("Credenciales válidas. Se ha enviado un código de seguridad a tu teléfono.", "success");

          // Guardar usuario recordado si está marcado
          if (formData.rememberMe) {
            try {
              localStorage.setItem("rememberedUser", formData.username.trim());
            } catch (error) {
              console.warn("Error guardando usuario recordado:", error);
            }
          } else {
            try {
              localStorage.removeItem("rememberedUser");
            } catch (error) {
              console.warn("Error eliminando usuario recordado:", error);
            }
          }

          setTimeout(() => {
            if (onLoginSuccess) {
              console.log("🔄 [2FA-LOGIN] Enviando datos 2FA al componente padre...");
              onLoginSuccess(result);
            }
          }, 1500);

        } else {
          // Login tradicional sin 2FA (para compatibilidad futura)
          console.log("🎉 [LOGIN] Login tradicional exitoso!");
          
        // Mostrar mensaje personalizado según tipo de usuario
        const tipoUsuario = result.tipoUsuario || 'unknown';
        const mensajeTipo = tipoUsuario === 'empresa' ? 'Empresa' : 
                           tipoUsuario === 'persona_natural' ? 'Personal' : 'Usuario';
        
        showAlert(`¡Inicio de sesión exitoso! Bienvenido - Panel ${mensajeTipo}.`, "success");

          if (formData.rememberMe) {
            try {
              localStorage.setItem("rememberedUser", formData.username.trim());
            } catch (error) {
              console.warn("Error guardando usuario recordado:", error);
            }
          } else {
            try {
              localStorage.removeItem("rememberedUser");
            } catch (error) {
              console.warn("Error eliminando usuario recordado:", error);
            }
          }

          setTimeout(() => {
            if (onLoginSuccess) {
              console.log("🔄 [LOGIN] Enviando datos al componente padre...");
              onLoginSuccess(result.data);
            } else {
              console.log("🔄 [REDIRECT] Redirigiendo al dashboard...");
              redirectToDashboard();
            }
          }, 1500);
        }

      } else {
        console.log("❌ [LOGIN] Login falló");
        handleLoginError(result.error);
      }

    } catch (error) {
      console.error("💥 [FATAL] Error inesperado en login:", error);
      showAlert("Error de conexión. Verifique su conexión a internet e intente nuevamente.", "error");
    } finally {
      console.log("🏁 [LOGIN] Proceso de login finalizado");
      setIsLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });

    if (type === "error") {
      setTimeout(() => {
        setAlert(null);
      }, 6000);
    } else if (type === "success") {
      setTimeout(() => {
        setAlert(null);
      }, 4000);
    }
  };

  const handleLoginError = (error) => {
    const errorCode = error.code;
    const errorMessage = error.message;

    console.log("🔍 [ERROR] Procesando error:", { code: errorCode, message: errorMessage });

    switch (errorCode) {
      case "INVALID_CREDENTIALS":
        setErrors({
          username: "Usuario o contraseña incorrectos",
          password: "Usuario o contraseña incorrectos",
        });
        showAlert("Las credenciales ingresadas son incorrectas. Verifique sus datos.", "error");
        setFormData(prev => ({ ...prev, password: "" }));
        setTimeout(() => {
          if (usernameRef.current) usernameRef.current.focus();
        }, 100);
        break;

      case "CONNECTION_ERROR":
        showAlert("Error de conexión. Verifique su conexión a internet e intente nuevamente.", "error");
        break;

      case "TIMEOUT_ERROR":
        showAlert("La conexión está tardando más de lo esperado. Intente nuevamente.", "error");
        break;

      case "SERVER_ERROR":
        showAlert("Error interno del servidor. Intente más tarde o contacte al administrador.", "error");
        break;

      case "USER_NOT_FOUND":
        setErrors({
          username: "Usuario no encontrado",
        });
        showAlert("El usuario ingresado no existe en el sistema.", "error");
        setTimeout(() => {
          if (usernameRef.current) usernameRef.current.focus();
        }, 100);
        break;

      case "ACCOUNT_LOCKED":
        showAlert("Su cuenta ha sido bloqueada. Contacte al administrador.", "error");
        break;

      case "ACCOUNT_EXPIRED":
        showAlert("Su cuenta ha expirado. Contacte al administrador.", "error");
        break;

      default:
        showAlert(errorMessage || "Error desconocido durante el inicio de sesión. Intente nuevamente.", "error");
        break;
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const redirectToDashboard = () => {
    const session = apiService.getUserSession();
    showAlert(
      `¡Bienvenido ${session?.username || "Usuario"}! Cargando sistema...`,
      "success"
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      
      {/* Elementos decorativos sutiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-400/12 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="min-h-screen flex relative z-10">
        
        {/* Left side - Company branding con mejora solo en texto principal */}
        <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center items-start p-8 transition-all duration-1000 ${
          isAnimated ? "transform translate-x-0 opacity-100" : "transform -translate-x-full opacity-0"
        }`}>
          <div className="max-w-lg space-y-6 relative">
            
            {/* Logo container transparente */}
            <div className="flex items-center space-x-4 relative z-10">
              <img
                src={lasNaveslogo1}
                alt="Las Naves - Cooperativa de Ahorro y Crédito"
                className="h-52 w-auto object-contain filter drop-shadow-2xl transition-all duration-500"
              />
            </div>

            {/* Título y Descripción Mejorados */}
            <div className="space-y-4 relative z-10 text-white">
              <h1 className="text-4xl font-extrabold leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                Tu futuro financiero,
                <br />
                <span className="text-cyan-300">a un clic de distancia.</span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full shadow-lg my-4"></div>
              <p className="text-lg leading-relaxed max-w-md" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
                Bienvenido a nuestra plataforma digital. Accede de forma segura y gestiona tus finanzas con total confianza y facilidad.
              </p>
            </div>

            {/* Features con nuevo estilo */}
            <div className="pt-6 space-y-4 relative z-10">
              {[
                { text: "Transferencias rápidas y seguras", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "text-green-400" },
                { text: "Consulta de saldos en tiempo real", icon: "M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm3-1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H6z", color: "text-cyan-300" },
                { text: "Atención y soporte 24/7", icon: "M18.364 5.636a9 9 0 010 12.728M12 18a6 6 0 010-12 6 6 0 010 12z", color: "text-slate-500" },
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20 shadow-lg">
                    <svg className={`w-5 h-5 ${feature.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} />
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm drop-shadow-md">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form compacto - ORIGINAL */}
        <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6">
          <div className={`w-full max-w-sm space-y-6 transition-all duration-1000 delay-300 ${
            isAnimated ? "transform translate-x-0 opacity-100" : "transform translate-x-full opacity-0"
          }`}>
            
            {/* Formulario compacto */}
            <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
              
              {/* Efectos de brillo sutiles */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>

              <div className="text-center mb-6 relative z-10">
                <h2 className="text-2xl font-bold text-slate-800 mb-1">
                  Acceder a su cuenta
                </h2>
                <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
                <p className="text-slate-600 text-xs font-medium">
                  Ingrese sus credenciales para continuar
                </p>
              </div>

              {/* Alert compacto */}
              {alert && (
                <div className="mb-4 relative z-10">
                  <div className={`p-3 rounded-lg border transition-all duration-500 ${
                    alert.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 ${
                        alert.type === "success" ? "bg-emerald-100" : "bg-red-100"
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

              {/* Form compacto */}
              <form onSubmit={handleSubmit} className="space-y-4 relative z-10" onKeyPress={handleKeyPress}>
                
                {/* Username field compacto */}
                <div className="space-y-1">
                  <label htmlFor="username" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Usuario
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                      </svg>
                    </div>
                    <input
                      ref={usernameRef}
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ingrese su usuario"
                      autoComplete="username"
                      disabled={isLoading}
                      className={`block w-full pl-10 pr-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                        errors.username ? "border-red-400 ring-2 ring-red-200" : "border-slate-300 hover:border-slate-400"
                      }`}
                    />
                  </div>
                  {errors.username && (
                    <div className="text-red-700 text-xs mt-1 flex items-center bg-red-50 rounded-lg p-2 border border-red-200">
                      <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{errors.username}</span>
                    </div>
                  )}

                  {/* Enlace "Bloqueo de usuario" compacto */}
                  <div className="text-xs">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLoading && onBlockUser) {
                          onBlockUser();
                        }
                      }}
                      className={`text-cyan-600 hover:text-cyan-800 transition-colors duration-300 font-semibold hover:underline decoration-2 underline-offset-2 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Bloqueo de usuario
                    </a>
                  </div>
                </div>

                {/* Password field compacto */}
                <div className="space-y-1">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" />
                      </svg>
                    </div>
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Ingrese su contraseña"
                      autoComplete="current-password"
                      disabled={isLoading}
                      className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                        errors.password ? "border-red-400 ring-2 ring-red-200" : "border-slate-300 hover:border-slate-400"
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        className="text-slate-500 hover:text-slate-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded-lg hover:bg-slate-100"
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
                  {errors.password && (
                    <div className="text-red-700 text-xs mt-1 flex items-center bg-red-50 rounded-lg p-2 border border-red-200">
                      <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{errors.password}</span>
                    </div>
                  )}

                  {/* Enlace "¿Olvidó su contraseña?" compacto */}
                  <div className="text-xs">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLoading && onForgotPassword) {
                          onForgotPassword();
                        }
                      }}
                      className={`text-cyan-600 hover:text-cyan-800 transition-colors duration-300 font-semibold hover:underline decoration-2 underline-offset-2 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      ¿Olvidó su contraseña?
                    </a>
                  </div>
                </div>

                {/* Remember me checkbox compacto */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="h-3 w-3 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 text-xs font-medium text-slate-700">
                      Recordar mi usuario
                    </label>
                  </div>
                </div>

                {/* Submit button compacto */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                    
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10 tracking-wide text-xs">Verificando...</span>
                      </>
                    ) : (
                      <span className="relative z-10 tracking-wide font-bold uppercase text-sm">INICIAR SESIÓN</span>
                    )}
                  </button>
                </div>
              </form>

              {/* Enlaces adicionales compactos */}
              <div className="mt-5 space-y-3 relative z-10">
                {/* Enlace de registro de preguntas de seguridad */}
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">
                    ¿Necesita configurar sus preguntas de seguridad?
                  </p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isLoading && onSecurityQuestionsRegister) {
                        onSecurityQuestionsRegister();
                      }
                    }}
                    className={`inline-flex items-center space-x-1 text-cyan-600 hover:text-cyan-800 transition-colors duration-300 font-semibold hover:underline decoration-2 underline-offset-2 ${
                      isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Registrar Preguntas de Seguridad</span>
                  </a>
                </div>

                {/* Separador */}
                <div className="flex items-center my-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                  <span className="px-3 text-xs text-slate-500 font-medium">o</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                </div>

                {/* Enlace de registro */}
                <div className="text-center">
                  <p className="text-xs text-slate-600 mb-1">
                    ¿No tiene cuenta?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLoading && onRegister) {
                          onRegister();
                        }
                      }}
                      className={`text-cyan-600 hover:text-cyan-800 transition-colors duration-300 font-semibold hover:underline decoration-2 underline-offset-2 ${
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      Regístrese aquí
                    </a>
                  </p>
                </div>

                {/* Enlaces de servicio compactos */}
                <div className="flex justify-center space-x-4 text-xs pt-2">
                  <a href="#" className="text-cyan-600 hover:text-cyan-800 font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2">
                    Ayuda
                  </a>
                  <a href="#" className="text-cyan-600 hover:text-cyan-800 font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2">
                    Privacidad
                  </a>
                  <a href="#" className="text-cyan-600 hover:text-cyan-800 font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2">
                    Términos
                  </a>
                </div>
              </div>
            </div>

            {/* Footer compacto */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-sm"></div>
                <p className="text-xs text-white font-semibold drop-shadow-md">
                  © 2024 Cooperativa de ahorro y credito Vilcabamba. Todos los derechos reservados.
                </p>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;