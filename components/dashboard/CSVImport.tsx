
import React, { useRef } from 'react';
import Papa from 'papaparse';
import { Download, Upload, FileText, Syringe } from 'lucide-react';
import { Button } from '../ui/Button';

interface CSVImportProps {
  onImportBovines: (data: any[]) => void;
  onImportVaccines: (data: any[]) => void;
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImportBovines, onImportVaccines }) => {
  const bovineInputRef = useRef<HTMLInputElement>(null);
  const vaccineInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: 'bovines' | 'vaccines') => {
    let csvContent = "";
    let fileName = "";

    if (type === 'bovines') {
      csvContent = "brinco,raca,cor,data_entrada,quantidade,peso_inicial\nB001,Nelore,Branco,2024-01-01,1,450\nB002,Angus,Preto,2024-01-05,1,380";
      fileName = "modelo_bovinos.csv";
    } else {
      csvContent = "brinco_animal,vacina,data_aplicacao,data_vencimento\nB001,Febre Aftosa,2024-01-15,2024-07-15\nB002,Raiva,2024-02-10,2025-02-10";
      fileName = "modelo_vacinas.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'bovines' | 'vaccines') => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (type === 'bovines') {
          onImportBovines(results.data);
        } else {
          onImportVaccines(results.data);
        }
        // Reset input
        if (event.target) event.target.value = '';
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Erro ao processar o arquivo CSV. Verifique o formato.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Importar Bovinos</h3>
            <p className="text-xs text-gray-500">Carga em massa via CSV</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => downloadTemplate('bovines')}
          >
            <Download className="w-4 h-4 mr-2" />
            Modelo
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => bovineInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <input 
            type="file" 
            ref={bovineInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={(e) => handleFileUpload(e, 'bovines')}
          />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Syringe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Importar Vacinas</h3>
            <p className="text-xs text-gray-500">Histórico de vacinação via CSV</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => downloadTemplate('vaccines')}
          >
            <Download className="w-4 h-4 mr-2" />
            Modelo
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            className="flex-1"
            onClick={() => vaccineInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <input 
            type="file" 
            ref={vaccineInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={(e) => handleFileUpload(e, 'vaccines')}
          />
        </div>
      </div>
    </div>
  );
};
