// src/components/SecurityQuestionsPage.jsx - DISEÑO CENTRADO COMPLETO
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

const SecurityQuestionsPage = ({ clientData, cedula, onNext, onBack }) => {
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([
    { codigo: '', pregunta: '', respuesta: '' },
    { codigo: '', pregunta: '', respuesta: '' },
    { codigo: '', pregunta: '', respuesta: '' }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Referencias para los inputs de respuesta
  const responseRefs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    loadAvailableQuestions();
    return () => clearTimeout(timer);
  }, []);

  const loadAvailableQuestions = async () => {
    setIsLoading(true);
    try {
      console.log('❓ [QUESTIONS] Cargando preguntas de seguridad disponibles');
      const result = await apiService.getAvailableSecurityQuestions();
      
      if (result.success) {
        console.log('✅ [QUESTIONS] Preguntas cargadas:', result.data.questions.length);
        setAvailableQuestions(result.data.questions);
        setAlert({ message: 'Preguntas de seguridad cargadas correctamente', type: 'success' });
        setTimeout(() => setAlert(null), 3000);
      } else {
        console.error('❌ [QUESTIONS] Error cargando preguntas:', result.error);
        setAlert({ message: result.error.message, type: 'error' });
      }
    } catch (error) {
      console.error('💥 [QUESTIONS] Error inesperado:', error);
      setAlert({ message: 'Error al cargar las preguntas de seguridad', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...selectedQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    
    if (field === 'codigo') {
      const selectedQuestion = availableQuestions.find(q => q.codigo === value);
      updatedQuestions[index].pregunta = selectedQuestion ? selectedQuestion.descri : '';
      // Limpiar respuesta si cambia la pregunta
      updatedQuestions[index].respuesta = '';
    }
    
    setSelectedQuestions(updatedQuestions);

    // Limpiar errores específicos
    if (errors[`question_${index}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`question_${index}_${field}`];
        return newErrors;
      });
    }

    if (alert && alert.type === 'error') {
      setAlert(null);
    }
  };

  const validateQuestions = () => {
    const newErrors = {};
    const usedCodes = new Set();

    selectedQuestions.forEach((question, index) => {
      if (!question.codigo) {
        newErrors[`question_${index}_codigo`] = 'Debe seleccionar una pregunta';
      } else if (usedCodes.has(question.codigo)) {
        newErrors[`question_${index}_codigo`] = 'No puede repetir la misma pregunta';
      } else {
        usedCodes.add(question.codigo);
      }

      if (!question.respuesta.trim()) {
        newErrors[`question_${index}_respuesta`] = 'La respuesta es requerida';
      } else if (question.respuesta.trim().length < 2) {
        newErrors[`question_${index}_respuesta`] = 'La respuesta debe tener al menos 2 caracteres';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 [QUESTIONS] Validando preguntas antes de continuar');
    
    if (!validateQuestions()) {
      setAlert({ message: 'Por favor, complete todas las preguntas correctamente', type: 'error' });
      return;
    }

    setIsSaving(true);
    setAlert({ message: 'Solicitando código de seguridad...', type: 'info' });

    try {
      // Solicitar el código de seguridad
      console.log('📨 [QUESTIONS] Solicitando código de seguridad para:', cedula);
      const codeResult = await apiService.requestSecurityCodeForRegistration(cedula);
      
      if (codeResult.success) {
        console.log('✅ [QUESTIONS] Código solicitado exitosamente');
        setAlert({ message: 'Código de seguridad enviado. Continuando...', type: 'success' });
        
        setTimeout(() => {
          if (onNext) {
            onNext({
              selectedQuestions: selectedQuestions.filter(q => q.codigo && q.respuesta.trim()),
              idemsg: codeResult.data.idemsg
            });
          }
        }, 1500);
      } else {
        console.error('❌ [QUESTIONS] Error solicitando código:', codeResult.error);
        setAlert({ message: codeResult.error.message, type: 'error' });
      }
    } catch (error) {
      console.error('💥 [QUESTIONS] Error inesperado:', error);
      setAlert({ message: 'Error al procesar las preguntas de seguridad', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailableQuestionsForIndex = (currentIndex) => {
    const usedCodes = selectedQuestions
      .map((q, index) => index !== currentIndex ? q.codigo : null)
      .filter(code => code);
    
    return availableQuestions.filter(q => !usedCodes.includes(q.codigo));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" style={backgroundStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando preguntas de seguridad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-16 w-24 h-24 bg-cyan-400/5 rounded-lg rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-cyan-500/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

<div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`      w-full max-w-2xl transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              disabled={isSaving}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Regresar</span>
            </button>
          </div>

          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['Validar Identidad', 'Preguntas de Seguridad', 'Código de Seguridad'].map((step, index) => (
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
                  {index < 2 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
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
                Paso 2 de 3: Preguntas de Seguridad
              </p>
            </div>
          </div>

          {/* Main card - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-5 shadow-2xl border border-white/50 relative overflow-hidden">
            
            {/* Efectos de brillo sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            {/* Header - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            <div className="text-center mb-5 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4">
                <img src="/assets/images/isocoaclasnaves.png" alt="Logo Cooperativa" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Preguntas de Seguridad
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-800 text-sm font-medium">
                Paso 3 de 4: Configure 3 preguntas de seguridad
              </p>
              {clientData && (
                <div className="mt-3 bg-cyan-50/90 border-cyan-200/70 text-cyan-900 rounded-lg p-3 border backdrop-blur-sm">
                  <p className="text-cyan-900 text-sm font-bold">
                    <span className="font-bold">{clientData.nomcli} {clientData.apecli}</span> • Cédula: {clientData.idecli}
                  </p>
                </div>
              )}
            </div>

            {/* Alert - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {alert && (
              <div className="mb-4 relative z-10">
                <div className={`p-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${
                  alert.type === 'success' ? 'bg-cyan-50/80 border-cyan-200/60 text-cyan-800' : 
                  alert.type === 'error' ? 'bg-red-50/80 border-red-200/60 text-red-800' :
                  'bg-cyan-50/80 border-cyan-200/60 text-cyan-800'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                      alert.type === 'success' ? 'bg-cyan-100/80' : 
                      alert.type === 'error' ? 'bg-red-100/80' : 'bg-cyan-100/80'
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        {alert.type === 'success' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        ) : alert.type === 'error' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        ) : (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        )}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Preguntas de seguridad */}
              {selectedQuestions.map((question, index) => (
                <div key={index} className="bg-white/95 rounded-lg p-4 border border-slate-200/60 backdrop-blur-sm relative z-10">
                  <h4 className="text-slate-900 font-bold mb-3 flex items-center">
                    <span className="w-7 h-7 bg-cyan-100/90 rounded-lg flex items-center justify-center text-sm mr-3 text-cyan-700 font-bold">
                      {index + 1}
                    </span>
                    Pregunta {index + 1}
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">
                        Seleccione una pregunta
                      </label>
                      <select
                        value={question.codigo}
                        onChange={(e) => handleQuestionChange(index, 'codigo', e.target.value)}
                        disabled={isSaving}
                        className={`w-full px-3 py-2.5 rounded-lg bg-white text-slate-900 border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 font-medium text-sm shadow-sm hover:shadow-md ${
                          errors[`question_${index}_codigo`] 
                            ? 'border-red-400 ring-2 ring-red-400/50' 
                            : 'border-slate-300'
                        }`}
                      >
                        <option value="" className="text-slate-500">-- Seleccione una pregunta --</option>
                        {getAvailableQuestionsForIndex(index).map((q) => (
                          <option key={q.codigo} value={q.codigo} className="text-slate-900">
                            {q.descri}
                          </option>
                        ))}
                      </select>
                      {errors[`question_${index}_codigo`] && (
                        <p className="text-red-700 text-sm mt-1 font-medium">{errors[`question_${index}_codigo`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-900 mb-2">
                        Su respuesta
                      </label>
                      <input
                        ref={responseRefs[index]}
                        type="text"
                        value={question.respuesta}
                        onChange={(e) => handleQuestionChange(index, 'respuesta', e.target.value)}
                        placeholder="Ingrese su respuesta (mínimo 2 caracteres)"
                        disabled={isSaving || !question.codigo}
                        className={`w-full px-3 py-2.5 rounded-lg bg-white text-slate-900 placeholder-slate-500 border-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 font-medium text-sm shadow-sm hover:shadow-md ${
                          errors[`question_${index}_respuesta`] 
                            ? 'border-red-400 ring-2 ring-red-200' 
                            : 'border-slate-300 hover:border-slate-400'
                        }`}
                      />
                      {errors[`question_${index}_respuesta`] && (
                        <p className="text-red-700 text-sm mt-1 font-medium">{errors[`question_${index}_respuesta`]}</p>
                      )}
                      {question.respuesta && (
                        <p className="text-slate-600 text-xs mt-1">
                          Longitud: {question.respuesta.length} caracteres
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Información importante */}
              <div className="bg-cyan-50/90 border border-cyan-200/70 rounded-lg p-3 backdrop-blur-sm relative z-10">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-cyan-700 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-cyan-900 font-bold text-sm">Importante:</p>
                    <p className="text-cyan-800 text-sm mt-1 font-medium">
                      Recuerde sus respuestas exactamente como las escribió. Serán necesarias para validar transacciones futuras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="space-y-3 relative z-10 mt-5">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      PROCESANDO...
                    </>
                  ) : (
                    'CONTINUAR'
                  )}
                </button>

                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSaving}
                  className="w-full flex justify-center py-2 px-4 text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200 font-medium"
                >
                  Regresar al paso anterior
                </button>
              </div>
            </form>
          </div>

          {/* Security notice */}
          
        </div>
      </div>
    </div>
  );
};

export default SecurityQuestionsPage;