
import React, { useState, useEffect } from 'react';
import { AnimalFormData, WeightControlFormData, VaccinationFormData, Animal, WeightControl, Vaccination } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AnimalFormProps {
  onSubmit: (data: AnimalFormData) => void;
  initialData?: AnimalFormData;
  onCancel?: () => void;
}

// Helper function to create a complete AnimalFormData with defaults
const getSanitizedAnimalFormData = (data?: AnimalFormData): AnimalFormData => {
  const defaultQuantity = 1;
  if (data) {
    return {
      raca: data.raca || '',
      cor: data.cor || '',
      dataEntradaAnimal: data.dataEntradaAnimal || '',
      // Ensure quantidade is a valid number, defaulting if undefined, null, or NaN
      quantidade: (data.quantidade === undefined || data.quantidade === null || isNaN(data.quantidade)) 
                    ? defaultQuantity 
                    : data.quantidade,
    };
  }
  return { raca: '', cor: '', dataEntradaAnimal: '', quantidade: defaultQuantity };
};


export const AnimalForm: React.FC<AnimalFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<AnimalFormData>(() => getSanitizedAnimalFormData(initialData));

  useEffect(() => {
    setFormData(getSanitizedAnimalFormData(initialData));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevFormData => ({
        ...prevFormData,
        [name]: type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.raca || !formData.cor || !formData.dataEntradaAnimal || !(formData.quantidade > 0)) { // formData.quantidade can be NaN from parseInt
        alert("Por favor, preencha todos os campos obrigatórios. Quantidade deve ser um número maior que zero.");
        return;
    }
    onSubmit(formData);
    if (!initialData) { // Reset if it's a new form, initialData prop will be undefined
        setFormData(getSanitizedAnimalFormData(undefined));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Raça" name="raca" value={formData.raca} onChange={handleChange} required placeholder="Ex: Nelore" />
        <Input label="Cor" name="cor" value={formData.cor} onChange={handleChange} required placeholder="Ex: Branco" />
        <Input label="Data de Entrada" name="dataEntradaAnimal" type="date" value={formData.dataEntradaAnimal} onChange={handleChange} required />
        <Input label="Quantidade" name="quantidade" type="number" value={formData.quantidade.toString()} onChange={handleChange} required min="1" />
      </div>
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary">{initialData ? 'Atualizar Animal' : 'Adicionar Animal'}</Button>
      </div>
    </form>
  );
};


interface WeightControlFormProps {
  onSubmit: (data: WeightControlFormData) => void;
  initialData?: WeightControlFormData;
  onCancel?: () => void;
}

export const WeightControlForm: React.FC<WeightControlFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<WeightControlFormData>(initialData || {
    pesoEntrada: 0, dataEntradaPeso: '', precoEntrada: 0,
    pesoFinal: undefined, dataSaidaPeso: '', precoSaida: undefined, dataVenda: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        pesoEntrada: initialData.pesoEntrada || 0,
        dataEntradaPeso: initialData.dataEntradaPeso || '',
        precoEntrada: initialData.precoEntrada || 0,
        pesoFinal: initialData.pesoFinal === null ? undefined : initialData.pesoFinal, // Handle null from potential DB
        dataSaidaPeso: initialData.dataSaidaPeso || '',
        precoSaida: initialData.precoSaida === null ? undefined : initialData.precoSaida,
        dataVenda: initialData.dataVenda || '',
      });
    } else {
        setFormData({
            pesoEntrada: 0, dataEntradaPeso: '', precoEntrada: 0,
            pesoFinal: undefined, dataSaidaPeso: '', precoSaida: undefined, dataVenda: '',
        });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevFormData => ({ 
        ...prevFormData, 
        [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value 
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
     if (!formData.dataEntradaPeso || formData.pesoEntrada === undefined || formData.pesoEntrada <= 0 || formData.precoEntrada === undefined || formData.precoEntrada <= 0) {
        alert("Dados de entrada (Data, Peso, Preço) são obrigatórios e devem ser positivos.");
        return;
    }
    onSubmit(formData);
     if (!initialData) {
        setFormData({ pesoEntrada: 0, dataEntradaPeso: '', precoEntrada: 0 });
     }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input label="Data Entrada (Peso)" name="dataEntradaPeso" type="date" value={formData.dataEntradaPeso} onChange={handleChange} required />
        <Input label="Peso Entrada (kg)" name="pesoEntrada" type="number" step="0.1" value={formData.pesoEntrada === undefined ? '' : formData.pesoEntrada.toString()} onChange={handleChange} required />
        <Input label="Preço Entrada (R$)" name="precoEntrada" type="number" step="0.01" value={formData.precoEntrada === undefined ? '' : formData.precoEntrada.toString()} onChange={handleChange} required />
      </div>
      
      <div className="pt-6 border-t border-slate-100">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Dados de Saída (Opcional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Input label="Data Saída (Peso)" name="dataSaidaPeso" type="date" value={formData.dataSaidaPeso || ''} onChange={handleChange} />
          <Input label="Peso Final (kg)" name="pesoFinal" type="number" step="0.1" value={formData.pesoFinal === undefined ? '' : formData.pesoFinal.toString()} onChange={handleChange} />
          <Input label="Preço Saída (R$)" name="precoSaida" type="number" step="0.01" value={formData.precoSaida === undefined ? '' : formData.precoSaida.toString()} onChange={handleChange} />
          <Input label="Data Venda" name="dataVenda" type="date" value={formData.dataVenda || ''} onChange={handleChange} />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary">{initialData ? 'Atualizar Controle' : 'Adicionar Controle'}</Button>
      </div>
    </form>
  );
};


interface VaccinationFormProps {
  onSubmit: (data: VaccinationFormData) => void;
  initialData?: VaccinationFormData;
  onCancel?: () => void;
}

export const VaccinationForm: React.FC<VaccinationFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<VaccinationFormData>(initialData || {
    nomeVacina: '', dataAplicacao: '', dataVencimento: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
        setFormData({ nomeVacina: '', dataAplicacao: '', dataVencimento: '' });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prevFormData => ({ ...prevFormData, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeVacina || !formData.dataAplicacao) {
        alert("Nome da Vacina e Data de Aplicação são obrigatórios.");
        return;
    }
    onSubmit(formData);
    if (!initialData) {
      setFormData({ nomeVacina: '', dataAplicacao: '', dataVencimento: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Input label="Nome da Vacina" name="nomeVacina" value={formData.nomeVacina} onChange={handleChange} required placeholder="Ex: Febre Aftosa" />
        <Input label="Data de Aplicação" name="dataAplicacao" type="date" value={formData.dataAplicacao} onChange={handleChange} required />
        <Input label="Data de Vencimento" name="dataVencimento" type="date" value={formData.dataVencimento || ''} onChange={handleChange} />
      </div>
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" variant="primary">{initialData ? 'Atualizar Vacina' : 'Adicionar Vacina'}</Button>
      </div>
    </form>
  );
};
