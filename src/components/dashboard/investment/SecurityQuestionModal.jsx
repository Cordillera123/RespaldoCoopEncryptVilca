import React, { useState, useRef, useEffect } from 'react';

const SecurityQuestionModal = ({
  isOpen,
  securityQuestion,
  onValidateAnswer,
  onCancel,
  investmentData
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  
  const answerInputRef = useRef(null);

  // Focus en el input cuando se abre el modal
  useEffect(() => {
    if (isOpen && answerInputRef.current) {
      setTimeout(() => {
        answerInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  // Limpiar estados cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setAnswer('');
      setError(null);
      setAttempts(0);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Por favor ingrese su respuesta');
      return;
    }

    if (answer.trim().length < 2) {
      setError('La respuesta debe tener al menos 2 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔒 [SECURITY-MODAL] Validando respuesta de seguridad...');
      
      // ✅ AGREGADO await porque onValidateAnswer ahora es async
      const result = await onValidateAnswer(answer.trim());
      
      if (result.success) {
        console.log('✅ [SECURITY-MODAL] Respuesta validada correctamente');
        // El modal se cerrará automáticamente cuando cambie la fase
      } else {
        console.error('❌ [SECURITY-MODAL] Respuesta incorrecta:', result.error);
        
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Respuesta incorrecta. Ha superado el máximo de ${maxAttempts} intentos. El proceso se cancelará.`);
          
          // Cancelar proceso después de máximo de intentos
          setTimeout(() => {
            onCancel();
          }, 3000);
        } else {
          setError(`Respuesta incorrecta. Intentos restantes: ${maxAttempts - newAttempts}`);
          setAnswer('');
          
          // Enfocar de nuevo en el input
          setTimeout(() => {
            if (answerInputRef.current) {
              answerInputRef.current.focus();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('💥 [SECURITY-MODAL] Error inesperado:', error);
      setError('Error inesperado. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ [SECURITY-MODAL] Usuario canceló validación de seguridad');
    setAnswer('');
    setError(null);
    onCancel();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Validación de Seguridad</h2>
              <p className="text-blue-100 text-sm">Confirme su identidad para continuar</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          
          {/* Resumen de inversión */}
          {investmentData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
                </svg>
                Confirmar Inversión
              </h4>
              <div className="text-green-700 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(investmentData.valinver))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plazo:</span>
                  <span className="font-semibold">{investmentData.plzinver} días</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasa:</span>
                  <span className="font-semibold">{investmentData.tasinver}% anual</span>
                </div>
              </div>
            </div>
          )}

          {/* Estado de carga de pregunta */}
          {securityQuestion.loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 text-sm font-medium">
                  Cargando pregunta de seguridad...
                </span>
              </div>
            </div>
          )}

          {/* Error cargando pregunta */}
          {securityQuestion.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-red-800 font-medium text-sm">Error de seguridad</p>
                  <p className="text-red-700 text-sm mt-1">{securityQuestion.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de pregunta de seguridad */}
          {securityQuestion.data && !securityQuestion.loading && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Pregunta - CORREGIDO: cambiar descri por detprg */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Pregunta de Seguridad:
                </label>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-800 font-medium">
                    {securityQuestion.data.detprg}
                  </p>
                </div>
              </div>

              {/* Input de respuesta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Su respuesta:
                </label>
                <input
                  ref={answerInputRef}
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Ingrese su respuesta exacta..."
                  disabled={isSubmitting || attempts >= maxAttempts}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    error 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isSubmitting && answer.trim()) {
                      handleSubmit(e);
                    }
                  }}
                />
                
                {/* Contador de caracteres */}
                {answer && (
                  <p className="text-xs text-gray-500 mt-1">
                    Longitud: {answer.length} caracteres
                  </p>
                )}
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-red-700 text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Indicador de intentos */}
              {attempts > 0 && attempts < maxAttempts && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-700 text-sm">
                      Intento {attempts} de {maxAttempts}. Quedan {maxAttempts - attempts} intentos.
                    </span>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmitting || attempts >= maxAttempts}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Validando...</span>
                    </div>
                  ) : (
                    'Validar Respuesta'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Información de seguridad */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">¿Por qué necesitamos esto?</p>
                <ul className="space-y-1 text-xs text-blue-600">
                  <li>• Esta validación protege sus inversiones</li>
                  <li>• Confirma que usted autorizó esta transacción</li>
                  <li>• Es requerido para transacciones de alto valor</li>
                  <li>• Sus datos están protegidos y encriptados</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityQuestionModal;