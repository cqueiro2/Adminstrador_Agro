
export interface Animal {
  id: string; // ID_Animal
  raca: string; // Breed
  cor: string; // Color
  dataEntradaAnimal: string; // Entry Date of Animal
  quantidade: number; // Quantity of animals with these characteristics
  // Representing one-to-many relationships
  weightControlIds?: string[]; 
  vaccinationIds?: string[];
}

export interface EstimativaTipoCriacao {
  id: string;
  tipo: string; // e.g., "1. Peso A Pasto"
  // descricao: string; // Detailed description of the type
  pesoEstimado24MesesKg?: number; 
  pesoEstimado24MesesArroba?: number; 
  ganhoPesoMensalKgMin: number;
  ganhoPesoMensalKgMax: number;
}

export interface WeightControl {
  id: string; // Id_Controle
  animalId: string;
  
  pesoEntrada: number; // Entry Weight
  dataEntradaPeso: string; // Date of Entry Weight
  
  pesoFinal?: number; // Final Weight
  dataSaidaPeso?: string; // Date of Final Weight / Exit Date
  
  precoEntrada: number; // Entry Price
  precoSaida?: number; // Exit Price
  dataVenda?: string; // Sale Date (often same as dataSaidaPeso)

  // For Gemini Estimation
  pesoFinalEstimado?: number;
  estimativaEngordaStatus?: 'idle' | 'loading' | 'success' | 'error';
  estimativaEngordaError?: string;

  // For Table-based Estimation
  selectedTipoCriacaoId?: string; // transient for UI, or can be persisted if needed
  pesoFinalEstimadoTabela?: number; 
}

export interface Vaccination {
  id: string; // ID_Vacina
  animalId: string;
  nomeVacina: string; // Vaccine Name
  dataAplicacao: string; // Application Date (formerly dataInicial)
  dataVencimento?: string; // Expiration Date (formerly dataFinal)
}

// For chart data
export interface ChartDataPoint {
  name: string; // Typically "Entrada" or "Saida" or date
  preco?: number;
  peso?: number;
  tipo: 'Preço Entrada' | 'Preço Saída' | 'Peso Entrada' | 'Peso Final Real' | 'Peso Final Estimado' | 'Peso Estimado (Tabela)';
}

export interface ControlChartData {
  precoEntrada?: number;
  precoSaida?: number;
  pesoEntrada?: number;
  pesoFinalReal?: number;
  pesoFinalEstimado?: number; // Gemini
  pesoFinalEstimadoTabela?: number; // Table-based
}

// Represents form data, using strings for dates and numbers for easier handling
export type AnimalFormData = Omit<Animal, 'id' | 'weightControlIds' | 'vaccinationIds'>;
export type WeightControlFormData = Omit<WeightControl, 'id' | 'animalId' | 'pesoFinalEstimado' | 'estimativaEngordaStatus' | 'estimativaEngordaError' | 'pesoFinalEstimadoTabela' | 'selectedTipoCriacaoId'>;
export type VaccinationFormData = Omit<Vaccination, 'id' | 'animalId'>;