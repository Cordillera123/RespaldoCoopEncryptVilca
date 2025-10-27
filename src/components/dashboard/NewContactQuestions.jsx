import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const NewContactQuestions = ({ beneficiaryData, onSecurityValidated, onBack, onCancel }) => {
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [validationAttempts, setValidationAttempts] = useState(0);
  const maxAttempts = 3;

  useEffect(() => {
    loadSecurityQuestion();
  }, []);

  const loadSecurityQuestion = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔒 [SECURITY-Q] Cargando pregunta de seguridad...');
      
      // Obtener cédula del usuario actual
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      // Obtener pregunta de seguridad
      const result = await apiService.getSecurityQuestion(cedula);
      
      if (result.success && result.questions && result.questions.length > 0) {
        // Tomar la primera pregunta disponible
        const question = result.questions[0];
        setSecurityQuestion(question);
        console.log('✅ [SECURITY-Q] Pregunta cargada:', question.detprg);
      } else {
        throw new Error(result.error?.message || 'No se pudieron obtener las preguntas de seguridad');
      }
    } catch (error) {
      console.error('❌ [SECURITY-Q] Error cargando pregunta:', error);
      setError('Error al cargar la pregunta de seguridad: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Por favor, ingresa tu respuesta');
      return;
    }

    if (!securityQuestion) {
      setError('No hay pregunta de seguridad disponible');
      return;
    }

    try {
      setIsValidating(true);
      setError('');
      
      console.log('🔐 [SECURITY-Q] Validando respuesta de seguridad...');
      
      // Obtener cédula del usuario actual
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      // Validar respuesta de seguridad
      const result = await apiService.validateSecurityAnswer(
        cedula,
        securityQuestion.codprg,
        userAnswer.trim()
      );

      if (result.success) {
        console.log('✅ [SECURITY-Q] Respuesta correcta, procediendo...');
        
        // Notificar al componente padre que la validación fue exitosa
        onSecurityValidated({
          questionCode: securityQuestion.codprg,
          answer: userAnswer.trim(),
          beneficiaryData: beneficiaryData
        });
      } else {
        console.error('❌ [SECURITY-Q] Respuesta incorrecta:', result.error?.message);
        
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Respuesta incorrecta. Has agotado tus ${maxAttempts} intentos. Por seguridad, el proceso ha sido cancelado.`);
          
          // Después de 3 segundos, cancelar el proceso
          setTimeout(() => {
            onCancel();
          }, 3000);
        } else {
          setError(`Respuesta incorrecta. Te quedan ${maxAttempts - newAttempts} intentos.`);
          setUserAnswer(''); // Limpiar respuesta
        }
      }
    } catch (error) {
      console.error('💥 [SECURITY-Q] Error inesperado:', error);
      setError('Error inesperado al validar la respuesta: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isValidating && userAnswer.trim()) {
      handleValidateAnswer();
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full bg-white overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header con botón de regreso */}
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 mr-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Nuevo beneficiario</span>
            </button>
          </div>

          {/* Loading State */}
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-700">Cargando pregunta de seguridad...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-white overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 mr-4"
            disabled={isValidating}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            <span>Nuevo beneficiario</span>
          </button>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verificación de seguridad</h1>
          <p className="text-gray-600">Responde la pregunta de seguridad para continuar</p>
        </div>

        {/* Resumen del beneficiario */}
        {beneficiaryData && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-sky-800 mb-4">Datos del beneficiario a registrar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-sky-600 font-medium">Nombre:</span>
                <p className="text-gray-800">{beneficiaryData.beneficiaryName}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Identificación:</span>
                <p className="text-gray-800">{beneficiaryData.identificationNumber}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Banco:</span>
                <p className="text-gray-800">{beneficiaryData.bankName}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Cuenta:</span>
                <p className="text-gray-800">{beneficiaryData.accountTypeName} - {beneficiaryData.accountNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de pregunta de seguridad */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 space-y-6">
            {/* Icono de seguridad */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                </svg>
              </div>
            </div>

            {/* Error o mensaje de intentos */}
            {error && (
              <div className={`border rounded-xl p-4 ${
                validationAttempts >= maxAttempts 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    validationAttempts >= maxAttempts 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                  }`}>
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                  </div>
                  <p className={`font-medium ${
                    validationAttempts >= maxAttempts ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Pregunta de seguridad */}
            {securityQuestion && validationAttempts < maxAttempts && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pregunta de seguridad:
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <p className="text-gray-800 font-medium">{securityQuestion.detprg}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tu respuesta *
                  </label>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ingresa tu respuesta"
                    disabled={isValidating}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                    autoFocus
                  />
                  {validationAttempts > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      Intento {validationAttempts} de {maxAttempts}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors duration-300"
                disabled={isValidating}
              >
                Cancelar
              </button>
              
              {securityQuestion && validationAttempts < maxAttempts && (
                <button
                  type="button"
                  onClick={handleValidateAnswer}
                  disabled={isValidating || !userAnswer.trim()}
                  className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
                >
                  {isValidating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validando...
                    </>
                  ) : (
                    'Verificar respuesta'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Por seguridad, tienes máximo {maxAttempts} intentos para responder correctamente</p>
        </div>
      </div>
    </div>
  );
};

export default NewContactQuestions;
