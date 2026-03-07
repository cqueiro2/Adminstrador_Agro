import { EstimativaTipoCriacao } from './types';

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
export const APP_TITLE = "Controle de Gado Inteligente";
export const CARCASS_YIELD_PERCENTAGE = 0.50; // Standard 50% carcass yield

export const ESTIMATIVAS_TIPO_CRIACAO: EstimativaTipoCriacao[] = [
  { 
    id: 'tipo-1', 
    tipo: '1. Peso A Pasto', 
    ganhoPesoMensalKgMin: 21, 
    ganhoPesoMensalKgMax: 30, 
    pesoEstimado24MesesKg: 380, 
    pesoEstimado24MesesArroba: 25.33 
  },
  { 
    id: 'tipo-2', 
    tipo: '2. Peso Semi Confinado', 
    ganhoPesoMensalKgMin: 30, 
    ganhoPesoMensalKgMax: 30, 
    pesoEstimado24MesesKg: 470, 
    pesoEstimado24MesesArroba: 31.33 
  },
  { 
    id: 'tipo-3', 
    tipo: '3. Peso Confinado', 
    ganhoPesoMensalKgMin: 45, 
    ganhoPesoMensalKgMax: 60, 
    pesoEstimado24MesesKg: 483, 
    pesoEstimado24MesesArroba: 32.20 
  },
];