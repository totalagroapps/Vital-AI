import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, Activity, Info, AlertTriangle, CheckCircle2, Mic } from 'lucide-react';

const TriageWizard = ({ onBack, onComplete }) => {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    // Check if autoStartMic is set
    const shouldAutoStart = localStorage.getItem('autoStartMic') === 'true';
    if (shouldAutoStart) {
      localStorage.removeItem('autoStartMic');
      setTimeout(() => {
        toggleListening();
      }, 500); // Give it a moment to render
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setSymptoms(prev => prev + (prev ? ' ' : '') + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && symptoms.length > 5) {
      setStep(2);
      // Simulate API call and completion
      setTimeout(() => {
        onComplete(symptoms);
      }, 2000);
    }
  };
