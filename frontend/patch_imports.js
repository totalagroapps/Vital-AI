import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, User, Bot, Upload, Paperclip, Loader2, Sparkles, AlertCircle, FileText,
  Activity, Calendar, HeartPulse, Settings, FileSearch, CheckCircle2, ChevronRight, X, Menu,
  Stethoscope, Brain
} from 'lucide-react';
import DoctorDashboard from './DoctorDashboard';
import PatientHome from './views/PatientHome';
import TriageWizard from './views/TriageWizard';
import DocumentAnalyzer from './views/DocumentAnalyzer';
import BottomNav from './components/BottomNav';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const { t, language } = useLanguage();
  const [token, setToken] = useState(localStorage.getItem('med_token') || null);
  const [username, setUsername] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient');
  
  // Patient Navigation State
  const [patientScreen, setPatientScreen] = useState('home');
