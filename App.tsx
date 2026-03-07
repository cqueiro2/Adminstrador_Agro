
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Import xlsx library
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Animal, 
  WeightControl, 
  Vaccination, 
  AnimalFormData, 
  WeightControlFormData, 
  VaccinationFormData, 
  ControlChartData, 
  EstimativaTipoCriacao 
} from './types';
import { APP_TITLE, ESTIMATIVAS_TIPO_CRIACAO, CARCASS_YIELD_PERCENTAGE } from './constants';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { Modal } from './components/ui/Modal';
import { AnimalForm, WeightControlForm, VaccinationForm } from './components/dashboard/AnimalDataForm';
import { ControlChart } from './components/dashboard/ControlChart';
import { GestaoAgro } from './components/dashboard/GestaoAgro';
import { Administradores } from './components/dashboard/Administradores';
import { estimateFinalWeight } from './services/geminiService';
import { Alert } from './components/ui/Alert';
import { AlertProps } from './components/ui/Alert';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  AlertCircle, 
  Plus, 
  Syringe, 
  Scale, 
  MoveHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Settings,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type VaccinationStatus = 'ok' | 'proximoVencimento' | 'vencida';

const KG_PER_ARROBA = 15;

const kgToArroba = (kg?: number | null): string => {
  if (kg === undefined || kg === null || isNaN(kg) || kg <=0) return '-';
  return (kg / KG_PER_ARROBA).toFixed(2);
};

const calculateMonthsDifference = (startDateStr: string, endDateStr: string): number => {
  const startDate = new Date(startDateStr + "T00:00:00");
  const endDate = new Date(endDateStr + "T00:00:00");
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) return 0;
  const diffTime = endDate.getTime() - startDate.getTime(); 
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays / (365.25 / 12); 
};

const calculateTableEstimation = (
  control: WeightControl,
  tipoEstimacao: EstimativaTipoCriacao
): number | null => {
  if (!control.dataEntradaPeso || !control.dataSaidaPeso || control.pesoEntrada <= 0) return null;
  const months = calculateMonthsDifference(control.dataEntradaPeso, control.dataSaidaPeso);
  if (months <= 0) return null;
  const monthlyGainAvg = (tipoEstimacao.ganhoPesoMensalKgMin + tipoEstimacao.ganhoPesoMensalKgMax) / 2;
  const totalGain = months * monthlyGainAvg;
  return control.pesoEntrada + totalGain;
};

const calculateCarcassYieldDetails = (
  weightKg: number | undefined | null,
  yieldPercentage: number
): { carcassKg?: number; carcassArroba: string } => {
  if (weightKg === undefined || weightKg === null || isNaN(weightKg) || weightKg <= 0) {
    return { carcassKg: undefined, carcassArroba: '-' };
  }
  const calculatedCarcassKg = weightKg * yieldPercentage;
  return {
    carcassKg: calculatedCarcassKg,
    carcassArroba: kgToArroba(calculatedCarcassKg),
  };
};

const getVaccinationStatus = (vaccination: Vaccination): VaccinationStatus => {
  if (!vaccination.dataVencimento) return 'ok';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const vencimentoDate = new Date(vaccination.dataVencimento + "T00:00:00");
  if (vencimentoDate < today) return 'vencida';
  const thirtyDaysFromToday = new Date(today); thirtyDaysFromToday.setDate(today.getDate() + 30);
  if (vencimentoDate <= thirtyDaysFromToday) return 'proximoVencimento';
  return 'ok';
};

const getVaccinationStatusText = (status: VaccinationStatus): string => {
  switch (status) {
    case 'ok': return 'OK';
    case 'proximoVencimento': return 'Próximo Vencimento';
    case 'vencida': return 'Vencida';
    default: return 'Desconhecido';
  }
};

const App: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [weightControls, setWeightControls] = useState<WeightControl[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [animalsRes, weightsRes, vaccinesRes] = await Promise.all([
          fetch('/api/animals'),
          fetch('/api/weights'),
          fetch('/api/vaccines')
        ]);

        if (animalsRes.ok && weightsRes.ok && vaccinesRes.ok) {
          const [animalsData, weightsData, vaccinesData] = await Promise.all([
            animalsRes.json(),
            weightsRes.json(),
            vaccinesRes.json()
          ]);
          setAnimals(animalsData);
          setWeightControls(weightsData);
          setVaccinations(vaccinesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setNotification({ message: 'Erro ao carregar dados do servidor.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [selectedWeightControlId, setSelectedWeightControlId] = useState<string | null>(null);
  
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);

  const [showWeightControlModal, setShowWeightControlModal] = useState(false);
  const [editingWeightControl, setEditingWeightControl] = useState<WeightControl | null>(null);
  
  const [showVaccinationModal, setShowVaccinationModal] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const [notification, setNotification] = useState<{ message: string, type: AlertProps['type'] } | null>(null);
  const [showReportOptions, setShowReportOptions] = useState(false);
  const reportDropdownRef = useRef<HTMLDivElement>(null);

  const [showEstimacaoTabelaModal, setShowEstimacaoTabelaModal] = useState(false);
  const [selectedTipoCriacaoIdPerControl, setSelectedTipoCriacaoIdPerControl] = useState<Record<string, string>>({});
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Effect to manage selectedAnimalId based on animals list
  useEffect(() => {
    if (animals.length > 0) {
        const currentSelectedAnimalIsValid = animals.some(animal => animal.id === selectedAnimalId);
        if (!currentSelectedAnimalIsValid) {
            // If current selection is invalid (e.g. animal deleted) or no animal is selected yet
            setSelectedAnimalId(animals[0].id);
            setSelectedWeightControlId(null); // Also reset weight control view
        }
    } else {
        // No animals left
        if (selectedAnimalId !== null) {
          setSelectedAnimalId(null);
          setSelectedWeightControlId(null);
        }
    }
  }, [animals, selectedAnimalId]); // Listen to selectedAnimalId to re-evaluate if it's programmatically changed elsewhere, though animals is main driver


  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (reportDropdownRef.current && !reportDropdownRef.current.contains(event.target as Node)) {
            setShowReportOptions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reportDropdownRef]);


  // Animal CRUD
  const handleAddOrUpdateAnimal = async (data: AnimalFormData) => {
    try {
      if (editingAnimal) {
        const response = await fetch(`/api/animals/${editingAnimal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (response.ok) {
          setAnimals(animals.map(a => a.id === editingAnimal.id ? { ...editingAnimal, ...data } : a));
          setNotification({ message: 'Animal atualizado com sucesso!', type: 'success' });
        }
      } else {
        const newAnimal: Animal = { ...data, id: crypto.randomUUID() };
        const response = await fetch('/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnimal)
        });
        if (response.ok) {
          setAnimals([...animals, newAnimal]);
          setNotification({ message: 'Animal adicionado com sucesso!', type: 'success' });
        }
      }
    } catch (error) {
      setNotification({ message: 'Erro ao salvar animal.', type: 'error' });
    }
    setShowAnimalModal(false);
    setEditingAnimal(null);
  };

  const handleDeleteAnimal = async (animalIdToDelete: string) => {
    if (window.confirm('Tem certeza que deseja excluir este animal e todos os seus registros associados?')) {
      try {
        const response = await fetch(`/api/animals/${animalIdToDelete}`, { method: 'DELETE' });
        if (response.ok) {
          setAnimals(prevAnimals => prevAnimals.filter(a => a.id !== animalIdToDelete));
          setWeightControls(prevWcs => prevWcs.filter(wc => wc.animalId !== animalIdToDelete));
          setVaccinations(prevVacs => prevVacs.filter(v => v.animalId !== animalIdToDelete));
          setNotification({ message: 'Animal excluído com sucesso!', type: 'success' });
        }
      } catch (error) {
        setNotification({ message: 'Erro ao excluir animal.', type: 'error' });
      }
    }
  };

  // WeightControl CRUD
  const handleAddOrUpdateWeightControl = async (data: WeightControlFormData) => {
    if (!selectedAnimalId) return;
    try {
      if (editingWeightControl) {
        const updatedWc = { ...editingWeightControl, ...data, animalId: selectedAnimalId };
        const response = await fetch(`/api/weights/${editingWeightControl.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedWc)
        });
        if (response.ok) {
          setWeightControls(weightControls.map(wc => wc.id === editingWeightControl.id ? updatedWc : wc));
          setNotification({ message: 'Controle de peso atualizado!', type: 'success' });
        }
      } else {
        const newWeightControl: WeightControl = { ...data, id: crypto.randomUUID(), animalId: selectedAnimalId, estimativaEngordaStatus: 'idle' };
        const response = await fetch('/api/weights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWeightControl)
        });
        if (response.ok) {
          setWeightControls([...weightControls, newWeightControl]);
          setNotification({ message: 'Controle de peso adicionado!', type: 'success' });
        }
      }
    } catch (error) {
      setNotification({ message: 'Erro ao salvar controle de peso.', type: 'error' });
    }
    setShowWeightControlModal(false);
    setEditingWeightControl(null);
  };

  const handleDeleteWeightControl = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de peso?')) {
      try {
        const response = await fetch(`/api/weights/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setWeightControls(weightControls.filter(wc => wc.id !== id));
          if(selectedWeightControlId === id) setSelectedWeightControlId(null);
          setNotification({ message: 'Controle de peso excluído!', type: 'success' });
        }
      } catch (error) {
        setNotification({ message: 'Erro ao excluir registro de peso.', type: 'error' });
      }
    }
  };

  const handleEstimateWeightGemini = async (controlId: string) => {
    const control = weightControls.find(wc => wc.id === controlId);
    const animal = animals.find(a => a.id === control?.animalId);

    if (!control || !animal || !control.dataEntradaPeso || !control.pesoEntrada || !control.dataSaidaPeso) {
      setNotification({ message: 'Dados insuficientes para estimativa Gemini: Verifique Data Entrada/Saída do Peso e Peso de Entrada.', type: 'error' });
      return;
    }
     if (!process.env.API_KEY) {
      setNotification({ message: 'API Key do Gemini não configurada. Estimativa não disponível.', type: 'error'});
      return;
    }

    setWeightControls(prev => prev.map(wc => wc.id === controlId ? { ...wc, estimativaEngordaStatus: 'loading', estimativaEngordaError: undefined } : wc));

    try {
      const estimatedWeight = await estimateFinalWeight(animal, control.pesoEntrada, control.dataEntradaPeso, control.dataSaidaPeso);
      
      if(estimatedWeight) {
        const updatedWc = { ...control, pesoFinalEstimado: estimatedWeight };
        const response = await fetch(`/api/weights/${controlId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedWc)
        });

        if (response.ok) {
          setWeightControls(prev => prev.map(wc => wc.id === controlId ? { ...updatedWc, estimativaEngordaStatus: 'success' } : wc));
          setNotification({ message: `Peso estimado (Gemini): ${estimatedWeight.toFixed(1)} kg (${kgToArroba(estimatedWeight)}@)`, type: 'success' });
        }
      } else {
        setWeightControls(prev => prev.map(wc => wc.id === controlId ? { ...wc, estimativaEngordaStatus: 'success' } : wc));
        setNotification({ message: 'Não foi possível estimar o peso (Gemini).', type: 'warning' });
      }
      
      if (selectedWeightControlId === controlId) { 
         setSelectedWeightControlId(null); 
         setTimeout(() => setSelectedWeightControlId(controlId),0);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao estimar peso (Gemini).";
      setWeightControls(prev => prev.map(wc => wc.id === controlId ? { ...wc, estimativaEngordaStatus: 'error', estimativaEngordaError: errorMessage } : wc));
      setNotification({ message: `Erro na estimativa (Gemini): ${errorMessage}`, type: 'error' });
    }
  };

  const handleTipoCriacaoChange = (controlId: string, tipoId: string) => {
      setSelectedTipoCriacaoIdPerControl(prev => ({ ...prev, [controlId]: tipoId }));
  };

  const handleCalculateTableEstimation = async (controlId: string) => {
    const control = weightControls.find(wc => wc.id === controlId);
    const selectedTipoId = selectedTipoCriacaoIdPerControl[controlId];
    const tipoEstimacao = ESTIMATIVAS_TIPO_CRIACAO.find(t => t.id === selectedTipoId);

    if (!control) {
        setNotification({ message: 'Controle de peso não encontrado.', type: 'error' });
        return;
    }
    if (!tipoEstimacao) {
      setNotification({ message: 'Selecione um tipo de criação da tabela e tente novamente.', type: 'warning' });
      return;
    }
    if (!control.dataSaidaPeso) {
      setNotification({ message: 'Data de Saída do Peso é obrigatória para esta estimativa.', type: 'error' });
      return;
    }
     if (!control.dataEntradaPeso || control.pesoEntrada <= 0) {
      setNotification({ message: 'Data de Entrada e Peso de Entrada válidos são obrigatórios.', type: 'error' });
      return;
    }

    const estimatedWeight = calculateTableEstimation(control, tipoEstimacao);
    
    if (estimatedWeight !== null) {
      try {
        const updatedWc = { ...control, pesoFinalEstimadoTabela: estimatedWeight };
        const response = await fetch(`/api/weights/${controlId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedWc)
        });

        if (response.ok) {
          setWeightControls(prevWcs => prevWcs.map(wc =>
            wc.id === controlId ? updatedWc : wc
          ));
          setNotification({ message: `Peso estimado (Tabela): ${estimatedWeight.toFixed(1)}kg (${kgToArroba(estimatedWeight)}@)`, type: 'success' });
        }
      } catch (error) {
        setNotification({ message: 'Erro ao salvar estimativa da tabela.', type: 'error' });
      }

      if (selectedWeightControlId === controlId) { 
         setSelectedWeightControlId(null);
         setTimeout(() => setSelectedWeightControlId(controlId),0);
      }
    } else {
      setNotification({ message: 'Não foi possível calcular a estimativa com base na tabela. Verifique os dados do controle (datas, peso inicial).', type: 'error' });
    }
  };


  // Vaccination CRUD
  const handleAddOrUpdateVaccination = async (data: VaccinationFormData) => {
    if (!selectedAnimalId) return;
    try {
      if (editingVaccination) {
        const updatedVac = { ...editingVaccination, ...data, animalId: selectedAnimalId };
        const response = await fetch(`/api/vaccines/${editingVaccination.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedVac)
        });
        if (response.ok) {
          setVaccinations(vaccinations.map(v => v.id === editingVaccination.id ? updatedVac : v));
          setNotification({ message: 'Vacinação atualizada!', type: 'success' });
        }
      } else {
        const newVaccination: Vaccination = { ...data, id: crypto.randomUUID(), animalId: selectedAnimalId };
        const response = await fetch('/api/vaccines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVaccination)
        });
        if (response.ok) {
          setVaccinations([...vaccinations, newVaccination]);
          setNotification({ message: 'Vacinação adicionada!', type: 'success' });
        }
      }
    } catch (error) {
      setNotification({ message: 'Erro ao salvar vacinação.', type: 'error' });
    }
    setShowVaccinationModal(false);
    setEditingVaccination(null);
  };

  const handleDeleteVaccination = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro de vacinação?')) {
      try {
        const response = await fetch(`/api/vaccines/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setVaccinations(vaccinations.filter(v => v.id !== id));
          setNotification({ message: 'Vacinação excluída!', type: 'success' });
        }
      } catch (error) {
        setNotification({ message: 'Erro ao excluir vacinação.', type: 'error' });
      }
    }
  };
  
  const handleGenerateExcelReport = (targetAnimalId?: string) => {
    const reportAnimalsData = targetAnimalId ? animals.filter(a => a.id === targetAnimalId) : animals;
    const reportWeightControlsData = targetAnimalId ? weightControls.filter(wc => wc.animalId === targetAnimalId) : weightControls;
    const reportVaccinationsData = targetAnimalId ? vaccinations.filter(v => v.animalId === targetAnimalId) : vaccinations;

    const animalsSheetData = reportAnimalsData.map(animal => ({
      'ID Animal': animal.id,
      'Raça': animal.raca,
      'Cor': animal.cor,
      'Quantidade': animal.quantidade,
      'Data Entrada Animal': animal.dataEntradaAnimal,
    }));

    const weightControlsSheetData = reportWeightControlsData.map(wc => {
      const animal = animals.find(a => a.id === wc.animalId); 
      const animalInfo = animal ? `${animal.raca} - ${animal.cor}` : 'Animal não encontrado';
      const ganhoPesoRealKg = (wc.pesoFinal && wc.pesoEntrada) ? (wc.pesoFinal - wc.pesoEntrada) : null;
      const lucroPrejuizo = (wc.precoSaida && wc.precoEntrada) ? (wc.precoSaida - wc.precoEntrada) : null;
      
      const carcassYieldTable = calculateCarcassYieldDetails(wc.pesoFinalEstimadoTabela, CARCASS_YIELD_PERCENTAGE);
      const liquidWeightReal = calculateCarcassYieldDetails(wc.pesoFinal, CARCASS_YIELD_PERCENTAGE);
      
      return {
        'ID Controle': wc.id,
        'ID Animal': wc.animalId,
        'Animal': animalInfo,
        'Data Entrada Peso': wc.dataEntradaPeso,
        'Peso Entrada (kg)': wc.pesoEntrada,
        'Peso Entrada (@)': kgToArroba(wc.pesoEntrada),
        'Preço Entrada (R$)': wc.precoEntrada,
        'Data Saída Peso': wc.dataSaidaPeso || null,
        'Peso Final Real (kg)': wc.pesoFinal || null,
        'Peso Final Real (@)': kgToArroba(wc.pesoFinal),
        'Peso Líquido Real (50%) (kg)': liquidWeightReal.carcassKg?.toFixed(1) || null,
        'Peso Líquido Real (50%) (@)': liquidWeightReal.carcassArroba || null,
        'Preço Saída (R$)': wc.precoSaida || null,
        'Data Venda': wc.dataVenda || null,
        'Peso Estimado (Gemini) (kg)': wc.pesoFinalEstimado || null,
        'Peso Estimado (Gemini) (@)': kgToArroba(wc.pesoFinalEstimado),
        'Peso Estimado (Tabela) (kg)': wc.pesoFinalEstimadoTabela || null,
        'Peso Estimado (Tabela) (@)': kgToArroba(wc.pesoFinalEstimadoTabela),
        'Peso Carcaça Est. (Tabela) (kg)': carcassYieldTable.carcassKg?.toFixed(1) || null,
        'Peso Carcaça Est. (Tabela) (@)': carcassYieldTable.carcassArroba || null,
        'Ganho de Peso Real (kg)': ganhoPesoRealKg,
        'Ganho de Peso Real (@)': ganhoPesoRealKg !== null ? kgToArroba(ganhoPesoRealKg) : null,
        'Lucro/Prejuízo (R$)': lucroPrejuizo,
      };
    });

    const vaccinationsSheetData = reportVaccinationsData.map(vac => {
      const animal = animals.find(a => a.id === vac.animalId); 
      const animalInfo = animal ? `${animal.raca} - ${animal.cor}` : 'Animal não encontrado';
      const status = getVaccinationStatus(vac);
      const statusText = getVaccinationStatusText(status);

      return {
        'ID Vacina': vac.id,
        'ID Animal': vac.animalId,
        'Animal': animalInfo,
        'Nome Vacina': vac.nomeVacina,
        'Data Aplicação': vac.dataAplicacao,
        'Data Vencimento': vac.dataVencimento || null,
        'Status': statusText,
      };
    });

    const wb = XLSX.utils.book_new();
    if (animalsSheetData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(animalsSheetData), "Animais");
    if (weightControlsSheetData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(weightControlsSheetData), "Controles de Peso");
    if (vaccinationsSheetData.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vaccinationsSheetData), "Vacinações");

    const animalForFilename = targetAnimalId ? animals.find(a=>a.id === targetAnimalId) : null;
    const filenamePrefix = animalForFilename ? `${animalForFilename.raca}_${animalForFilename.cor}` : 'Todos_Animais';
    XLSX.writeFile(wb, `RelatorioControleGado_${filenamePrefix.replace(/\s+/g, '_')}.xlsx`);
    
    setNotification({ message: 'Relatório Excel gerado com sucesso!', type: 'success' });
    setShowReportOptions(false);
  };

  const handleGeneratePdfReport = (targetAnimalId?: string) => {
    const reportAnimalsData = targetAnimalId ? animals.filter(a => a.id === targetAnimalId) : animals;
    const reportWeightControlsData = targetAnimalId ? weightControls.filter(wc => wc.animalId === targetAnimalId) : weightControls;
    const reportVaccinationsData = targetAnimalId ? vaccinations.filter(v => v.animalId === targetAnimalId) : vaccinations;
    const animalForReport = targetAnimalId ? animals.find(a => a.id === targetAnimalId) : null;

    const doc = new jsPDF({ orientation: 'landscape' });
    let finalY = 15; 

    doc.setFontSize(18);
    doc.text(APP_TITLE, doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });
    finalY += 8;
    doc.setFontSize(12);
    if (animalForReport) {
      doc.text(`Relatório para: ${animalForReport.raca} - ${animalForReport.cor} (ID: ${animalForReport.id})`, doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });
    } else {
      doc.text("Relatório Geral - Todos os Animais", doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });
    }
    finalY += 10;

    const addSectionToPdf = (title: string, head: any[][], body: any[][], columnStylesOverride?: any) => {
      if (body.length === 0) return; 
      
      const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
      if (finalY + 30 > pageHeight ) { 
        doc.addPage();
        finalY = 15; 
      } else if (finalY > 15) {
         finalY += 5; 
      }

      doc.setFontSize(14);
      doc.text(title, 14, finalY);
      finalY += 7;
      
      autoTable(doc, {
        startY: finalY,
        head: head,
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 5.5, cellPadding: 0.5 }, 
        margin: { top: finalY, bottom: 10, left:10, right: 10 },
        tableWidth: 'auto', 
        styles: { fontSize: 5.5, cellPadding: 0.5, overflow: 'ellipsize' }, 
        columnStyles: columnStylesOverride || { },
        didDrawPage: (data) => {
          finalY = data.cursor?.y ? data.cursor.y : 0; 
        },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    };
    
    const animalsHead = [['ID Animal', 'Raça', 'Cor', 'Qtd', 'Data Entrada']];
    const animalsBody = reportAnimalsData.map(a => [a.id.substring(0,8), a.raca, a.cor, a.quantidade, a.dataEntradaAnimal]);
    addSectionToPdf("Animais", animalsHead, animalsBody);

    const wcHead = [[
      'ID Ctrl', 'ID Animal', 'Animal', 'Data Entra', 'Peso Entra(kg)', 'Preço Entra(R$)', 'Data Saída', 
      'Peso Final(kg)', 'Peso Final(@)', 'Preço Saída(R$)', 'Data Venda', 'Peso Líquido(kg)', 'Peso Líquido(@)',
      'Peso Estimado(Tabela)(kg)', 'Peso Estimado(Tabela)(@)', 'Peso Carcaça Est.(kg)', 'Peso Carcaça Est.(@)',
      'Peso Estimado (Gemini)(kg)', 'Peso Estimado (Gemini)(@)',
      'Ganho de Peso(kg)', 'Ganho de Peso(@)', 'Lucro/Prejuízo (R$)'
    ]];
    
    const wcBody = reportWeightControlsData.map(wc => {
      const animal = animals.find(a => a.id === wc.animalId);
      const animalDesc = animal ? `${animal.raca} - ${animal.cor.substring(0,1).toUpperCase()}` : 'N/A';
      const ganhoPesoRealKg = (wc.pesoFinal && wc.pesoEntrada) ? (wc.pesoFinal - wc.pesoEntrada) : null;
      const lucroPrejuizo = (wc.precoSaida && wc.precoEntrada) ? (wc.precoSaida - wc.precoEntrada).toFixed(2) : '-';
      
      const carcassYieldTable = calculateCarcassYieldDetails(wc.pesoFinalEstimadoTabela, CARCASS_YIELD_PERCENTAGE);
      const liquidWeightReal = calculateCarcassYieldDetails(wc.pesoFinal, CARCASS_YIELD_PERCENTAGE);
      
      return [
        wc.id.substring(0,5), 
        wc.animalId.substring(0,8), 
        animalDesc, 
        wc.dataEntradaPeso, 
        wc.pesoEntrada.toString(), 
        wc.precoEntrada.toFixed(2), 
        wc.dataSaidaPeso || '-', 
        wc.pesoFinal?.toString() || '-', 
        kgToArroba(wc.pesoFinal), 
        wc.precoSaida?.toFixed(2) || '-', 
        wc.dataVenda || '-', 
        liquidWeightReal.carcassKg?.toFixed(1) || '-', 
        liquidWeightReal.carcassArroba, 
        wc.pesoFinalEstimadoTabela?.toFixed(1) || '-', 
        kgToArroba(wc.pesoFinalEstimadoTabela), 
        carcassYieldTable.carcassKg?.toFixed(1) || '-', 
        carcassYieldTable.carcassArroba, 
        wc.pesoFinalEstimado?.toFixed(1) || '-', 
        kgToArroba(wc.pesoFinalEstimado), 
        ganhoPesoRealKg !== null ? ganhoPesoRealKg.toFixed(1) : '-', 
        ganhoPesoRealKg !== null ? kgToArroba(ganhoPesoRealKg) : '-', 
        lucroPrejuizo 
      ];
    });
    addSectionToPdf("Controles de Peso e Valor", wcHead, wcBody, {});

    const vacHead = [['ID Vacina', 'Animal', 'Nome Vacina', 'Aplicação', 'Vencimento', 'Status']];
    const vacBody = reportVaccinationsData.map(vac => {
      const animal = animals.find(a => a.id === vac.animalId);
      const animalDesc = animal ? `${animal.raca.substring(0,5)}..(${animal.id.substring(0,3)})` : vac.animalId.substring(0,5);
      const statusText = getVaccinationStatusText(getVaccinationStatus(vac));
      return [ vac.id.substring(0,5), animalDesc, vac.nomeVacina, vac.dataAplicacao, vac.dataVencimento || '-', statusText ];
    });
    addSectionToPdf("Vacinações", vacHead, vacBody);
    
    const animalForFilename = animalForReport ? `${animalForReport.raca}_${animalForReport.cor}` : 'Todos_Animais';
    doc.save(`RelatorioControleGado_${animalForFilename.replace(/\s+/g, '_')}.pdf`);
    setNotification({ message: 'Relatório PDF gerado com sucesso!', type: 'success' });
    setShowReportOptions(false);
  };


  const selectedAnimalDetails = animals.find(a => a.id === selectedAnimalId);
  const animalWeightControls = weightControls.filter(wc => wc.animalId === selectedAnimalId);
  const animalVaccinations = vaccinations.filter(v => v.animalId === selectedAnimalId);
  const selectedControlForChart = weightControls.find(wc => wc.id === selectedWeightControlId);

  const chartData: ControlChartData | null = selectedControlForChart ? {
    precoEntrada: selectedControlForChart.precoEntrada,
    precoSaida: selectedControlForChart.precoSaida,
    pesoEntrada: selectedControlForChart.pesoEntrada,
    pesoFinalReal: selectedControlForChart.pesoFinal,
    pesoFinalEstimado: selectedControlForChart.pesoFinalEstimado,
    pesoFinalEstimadoTabela: selectedControlForChart.pesoFinalEstimadoTabela,
  } : null;

  const getStatusEmoji = (status: VaccinationStatus) => {
    switch (status) {
      case 'ok': return <span title="Vacina OK" role="img" aria-label="Vacina OK">😊</span>;
      case 'proximoVencimento': return <span title="Vacina próxima ao vencimento" role="img" aria-label="Vacina próxima ao vencimento">😐</span>;
      case 'vencida': return <span title="Vacina vencida" role="img" aria-label="Vacina vencida">😟</span>;
      default: return '';
    }
  };


  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalAnimals = animals.reduce((acc, curr) => acc + curr.quantidade, 0);
  const animalsInTreatment = vaccinations.filter(v => getVaccinationStatus(v) !== 'ok').length;
  
  const stats = [
    { label: 'Total Bovinos', value: totalAnimals.toLocaleString(), icon: Users, color: 'text-orange-500', bg: 'bg-orange-50', trend: '+2.4%' },
    { label: 'Em Tratamento', value: animalsInTreatment.toString(), icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', trend: '-5.1%' },
    { label: 'GMD Médio', value: '0.8kg', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+0.2%' },
    { label: 'Alertas', value: '03', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', trend: '-10%' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="font-bold text-slate-400 uppercase tracking-widest animate-pulse">Carregando Dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-main">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block sticky top-0 h-screen">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 lg:hidden"
            >
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                isMobile 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={
            activeTab === 'dashboard' ? "Controle Individual de Bovino" :
            activeTab === 'gestao-agro' ? "Gestão Agro" :
            activeTab === 'administradores' ? "Administradores" :
            activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
          } 
          onMenuClick={() => setIsSidebarOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === 'dashboard' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-6 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-400 mb-1">{stat.label}</p>
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                          <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                            {stat.trend}
                          </span>
                        </div>
                      </div>
                      <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color}`}>
                        <stat.icon size={24} />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Main Content Area */}
                  <div className="xl:col-span-2 space-y-8">
                    {/* Evolution Chart Card */}
                    <Card title="Evolução de Peso (6 meses)">
                      <div className="h-80 w-full">
                        {selectedWeightControlId && chartData ? (
                          <ControlChart data={chartData} />
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                            <TrendingUp size={48} className="mb-4 opacity-20" />
                            <p className="font-medium">Selecione um animal e controle para ver a evolução</p>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Recent Alerts */}
                    <Card 
                      title="Alertas Recentes" 
                      actions={<Button variant="ghost" size="sm" className="text-brand border-none shadow-none hover:bg-orange-50">Ver todos</Button>}
                    >
                      <div className="space-y-4">
                        {vaccinations.filter(v => getVaccinationStatus(v) !== 'ok').slice(0, 3).map((vac, i) => (
                          <div key={vac.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getVaccinationStatus(vac) === 'vencida' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                              <AlertCircle size={20} />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-slate-800">{vac.nomeVacina} {getVaccinationStatus(vac) === 'vencida' ? 'Vencida' : 'Pendente'}</h4>
                              <p className="text-xs text-slate-400 font-medium">Animal ID: {vac.animalId.substring(0, 8)}</p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Há {i + 2} horas</span>
                          </div>
                        ))}
                        {vaccinations.filter(v => getVaccinationStatus(v) !== 'ok').length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500 opacity-50" />
                            <p className="text-sm font-medium">Nenhum alerta pendente</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Sidebar Content Area */}
                  <div className="space-y-8">
                    {/* Animal List Card */}
                    <Card 
                      title="Animais" 
                      actions={<Button onClick={() => { setEditingAnimal(null); setShowAnimalModal(true);}} size="sm" className="bg-brand hover:bg-orange-600"><Plus size={16} /></Button>}
                    >
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {animals.map(animal => (
                          <motion.div
                            key={animal.id}
                            layoutId={animal.id}
                            onClick={() => {
                              if (selectedAnimalId !== animal.id) {
                                setSelectedAnimalId(animal.id);
                                setSelectedWeightControlId(null);
                              }
                            }}
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group ${
                              selectedAnimalId === animal.id 
                                ? 'bg-primary-50 border-brand shadow-sm' 
                                : 'bg-white border-slate-50 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className={`text-sm font-bold ${selectedAnimalId === animal.id ? 'text-brand' : 'text-slate-800'}`}>
                                  {animal.raca}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                  {animal.cor} • {animal.quantidade} UNIDADES
                                </p>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-brand" onClick={(e) => { e.stopPropagation(); setEditingAnimal(animal); setShowAnimalModal(true);}}>
                                  <Edit2 size={14} />
                                </Button>
                                <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteAnimal(animal.id); }}>
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card title="Ações Rápidas">
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => { setEditingAnimal(null); setShowAnimalModal(true);}}
                          className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand hover:bg-orange-50 transition-all group"
                        >
                          <div className="w-10 h-10 bg-orange-50 text-brand rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                            <Plus size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Adicionar Animal</span>
                        </button>
                        <button 
                          onClick={() => { setEditingVaccination(null); setShowVaccinationModal(true);}}
                          className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand hover:bg-orange-50 transition-all group"
                        >
                          <div className="w-10 h-10 bg-orange-50 text-brand rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                            <Syringe size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Registrar Vacina</span>
                        </button>
                        <button 
                          onClick={() => { setEditingWeightControl(null); setShowWeightControlModal(true);}}
                          className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand hover:bg-orange-50 transition-all group"
                        >
                          <div className="w-10 h-10 bg-orange-50 text-brand rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                            <Scale size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Nova Pesagem</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand hover:bg-orange-50 transition-all group">
                          <div className="w-10 h-10 bg-orange-50 text-brand rounded-xl flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
                            <MoveHorizontal size={20} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">Mover Lote</span>
                        </button>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Detailed View for Selected Animal */}
                {selectedAnimalDetails && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-800">Detalhes do Animal Selecionado</h3>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-brand" onClick={() => { setEditingAnimal(selectedAnimalDetails); setShowAnimalModal(true); }}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-red-500" onClick={() => handleDeleteAnimal(selectedAnimalDetails.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => { setEditingWeightControl(null); setShowWeightControlModal(true); }}>
                          <Scale size={16} className="mr-2" /> Novo Peso
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setEditingVaccination(null); setShowVaccinationModal(true); }}>
                          <Syringe size={16} className="mr-2" /> Nova Vacina
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Weight Controls List */}
                      <Card title="Histórico de Pesagem">
                        <div className="space-y-4">
                          {animalWeightControls.map(wc => (
                            <div 
                              key={wc.id} 
                              onClick={() => setSelectedWeightControlId(wc.id)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                selectedWeightControlId === wc.id ? 'bg-primary-50 border-brand' : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                                    <Clock size={18} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{wc.dataEntradaPeso} {wc.dataSaidaPeso ? `→ ${wc.dataSaidaPeso}` : '(Atual)'}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Entrada: {wc.pesoEntrada}kg</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-brand">{wc.pesoFinal ? `${wc.pesoFinal}kg` : '---'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Peso Final</p>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-3 border-t border-slate-100">
                                 <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setEditingWeightControl(wc); setShowWeightControlModal(true);}}>
                                   <Edit2 size={12} /> Editar
                                 </Button>
                                 <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-red-500 hover:bg-red-50 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); handleDeleteWeightControl(wc.id); }}>
                                   <Trash2 size={12} /> Excluir
                                 </Button>
                                 {wc.dataSaidaPeso && process.env.API_KEY && (
                                   <Button variant="primary" size="sm" className="text-[10px] h-7 px-2" onClick={(e) => { e.stopPropagation(); handleEstimateWeightGemini(wc.id); }}>Gemini AI</Button>
                                 )}
                              </div>
                            </div>
                          ))}
                          {animalWeightControls.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">Nenhum registro de peso.</p>}
                        </div>
                      </Card>

                      {/* Vaccinations List */}
                      <Card title="Plano Sanitário">
                        <div className="space-y-4">
                          {animalVaccinations.map(vac => {
                            const status = getVaccinationStatus(vac);
                            return (
                              <div key={vac.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  status === 'vencida' ? 'bg-red-50 text-red-500' : 
                                  status === 'proximoVencimento' ? 'bg-orange-50 text-orange-500' : 
                                  'bg-emerald-50 text-emerald-500'
                                }`}>
                                  {status === 'vencida' ? <XCircle size={18} /> : status === 'proximoVencimento' ? <HelpCircle size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-slate-800">{vac.nomeVacina}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Aplicada em: {vac.dataAplicacao}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-brand" onClick={() => { setEditingVaccination(vac); setShowVaccinationModal(true); }}>
                                    <Edit2 size={14} />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="p-1 h-auto border-none shadow-none text-slate-400 hover:text-red-500" onClick={() => handleDeleteVaccination(vac.id)}>
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                                <div className="text-right ml-4">
                                  <p className={`text-xs font-bold ${status === 'vencida' ? 'text-red-500' : 'text-slate-600'}`}>
                                    {vac.dataVencimento || 'Dose única'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Vencimento</p>
                                </div>
                              </div>
                            );
                          })}
                          {animalVaccinations.length === 0 && <p className="text-center py-8 text-slate-400 text-sm">Nenhuma vacina registrada.</p>}
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {activeTab === 'gestao-agro' && <GestaoAgro />}
            {activeTab === 'administradores' && <Administradores />}
            
            {(activeTab !== 'dashboard' && activeTab !== 'gestao-agro' && activeTab !== 'administradores') && (
              <div className="text-center py-24 text-slate-400">
                <Settings size={64} className="mx-auto mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-slate-600">Seção em Desenvolvimento</h3>
                <p>A página de {activeTab} estará disponível em breve.</p>
                <Button onClick={() => setActiveTab('dashboard')} className="mt-6">Voltar ao Dashboard</Button>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white border-t border-slate-100 py-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} {APP_TITLE} • Gestão Inteligente
          </p>
          <div className="flex gap-6">
            <button className="text-xs font-bold text-slate-400 hover:text-brand transition-colors uppercase tracking-wider">Suporte</button>
            <button className="text-xs font-bold text-slate-400 hover:text-brand transition-colors uppercase tracking-wider">Privacidade</button>
          </div>
        </footer>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100]"
          >
            <Alert message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={showAnimalModal} onClose={() => {setShowAnimalModal(false); setEditingAnimal(null);}} title={editingAnimal ? 'Editar Animal' : 'Adicionar Novo Animal'}>
        <AnimalForm 
          onSubmit={handleAddOrUpdateAnimal} 
          initialData={editingAnimal ? {raca: editingAnimal.raca, cor: editingAnimal.cor, dataEntradaAnimal: editingAnimal.dataEntradaAnimal, quantidade: editingAnimal.quantidade} : undefined}
          onCancel={() => {setShowAnimalModal(false); setEditingAnimal(null);}}
        />
      </Modal>

      <Modal isOpen={showWeightControlModal} onClose={() => {setShowWeightControlModal(false); setEditingWeightControl(null);}} title={editingWeightControl ? 'Editar Controle' : 'Novo Controle'}>
        <WeightControlForm 
          onSubmit={handleAddOrUpdateWeightControl} 
          initialData={editingWeightControl ? {
              pesoEntrada: editingWeightControl.pesoEntrada, dataEntradaPeso: editingWeightControl.dataEntradaPeso,
              precoEntrada: editingWeightControl.precoEntrada, pesoFinal: editingWeightControl.pesoFinal,
              dataSaidaPeso: editingWeightControl.dataSaidaPeso, precoSaida: editingWeightControl.precoSaida,
              dataVenda: editingWeightControl.dataVenda
          } : undefined}
          onCancel={() => {setShowWeightControlModal(false); setEditingWeightControl(null);}}
        />
      </Modal>

      <Modal isOpen={showVaccinationModal} onClose={() => {setShowVaccinationModal(false); setEditingVaccination(null);}} title={editingVaccination ? 'Editar Vacina' : 'Nova Vacina'}>
        <VaccinationForm
          onSubmit={handleAddOrUpdateVaccination}
          initialData={editingVaccination ? {
              nomeVacina: editingVaccination.nomeVacina, 
              dataAplicacao: editingVaccination.dataAplicacao, 
              dataVencimento: editingVaccination.dataVencimento
          } : undefined}
          onCancel={() => {setShowVaccinationModal(false); setEditingVaccination(null);}}
        />
      </Modal>

      <Modal isOpen={showEstimacaoTabelaModal} onClose={() => setShowEstimacaoTabelaModal(false)} title="Tabela de Referência">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ganho Mensal</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">24 Meses (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ESTIMATIVAS_TIPO_CRIACAO.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.tipo}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {item.ganhoPesoMensalKgMin}-{item.ganhoPesoMensalKgMax}kg
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">{item.pesoEstimado24MesesKg}kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};


const RootApp: React.FC = () => (
  <HashRouter>
    <App />
  </HashRouter>
);

export default RootApp;
