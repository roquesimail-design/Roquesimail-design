
import React from 'react';
import { PROGRAMS, MONTHS } from '../constants';
import { Status, MonthlyStatus, VerificationData } from '../types';
import StatusSelector from './StatusSelector';

interface ChecklistTableProps {
  data: { [reportId: string]: MonthlyStatus };
  verification: VerificationData;
  onUpdate: (reportId: string, monthIdx: number, status: Status) => void;
  onVerificationUpdate: (newData: Partial<VerificationData>) => void;
}

const ChecklistTable: React.FC<ChecklistTableProps> = ({ data, verification, onUpdate, onVerificationUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-48">Programas / Serviços</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">Relatórios</th>
                {MONTHS.map((month) => (
                  <th key={month} className="px-2 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-tighter border-r border-gray-200 w-12">
                    {month.substring(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {PROGRAMS.map((program) => (
                <React.Fragment key={program.id}>
                  {program.reports.map((report, rIdx) => (
                    <tr key={report.id} className="hover:bg-gray-50 group transition-colors">
                      {rIdx === 0 && (
                        <td 
                          rowSpan={program.reports.length} 
                          className="px-4 py-4 text-xs font-black text-gray-700 bg-blue-50/50 border-r border-gray-200 align-top uppercase tracking-tighter"
                        >
                          {program.name}
                        </td>
                      )}
                      <td className="px-4 py-3 text-[11px] text-gray-600 border-r border-gray-200 font-medium group-hover:text-blue-600 transition-colors">
                        {report.name}
                        {report.quarterlyMonths && (
                          <span className="block text-[8px] text-amber-600 font-black uppercase mt-1">Periodicidade Trimestral</span>
                        )}
                      </td>
                      {MONTHS.map((_, mIdx) => {
                        const isMonthAllowed = !report.quarterlyMonths || report.quarterlyMonths.includes(mIdx);
                        
                        return (
                          <td key={mIdx} className="px-1 py-2 text-center border-r border-gray-200 last:border-r-0">
                            <div className="flex justify-center">
                              {isMonthAllowed ? (
                                <StatusSelector 
                                  status={data[report.id]?.[mIdx] || 'PENDING'}
                                  onChange={(newStatus) => onUpdate(report.id, mIdx, newStatus)}
                                />
                              ) : (
                                <div className="w-8 h-8 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-md bg-gray-50 text-[8px] font-black text-gray-300 cursor-not-allowed" title="Relatório não aplicável neste mês">
                                  NA
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verso do Formulário: Verificação e Observações (EDITÁVEL) */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-8 shadow-sm print:shadow-none">
        
        {/* Campos de Verificação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verificado por:</label>
                <input 
                  type="text"
                  value={verification.verifiedBy}
                  onChange={(e) => onVerificationUpdate({ verifiedBy: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 px-3 text-sm font-bold text-gray-700 focus:border-blue-500 focus:outline-none focus:bg-white transition-all rounded-t"
                />
            </div>
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Função:</label>
                <input 
                  type="text"
                  value={verification.jobTitle}
                  onChange={(e) => onVerificationUpdate({ jobTitle: e.target.value })}
                  placeholder="Cargo ou função"
                  className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 px-3 text-sm font-bold text-gray-700 focus:border-blue-500 focus:outline-none focus:bg-white transition-all rounded-t"
                />
            </div>
            <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data:</label>
                <input 
                  type="date"
                  value={verification.date}
                  onChange={(e) => onVerificationUpdate({ date: e.target.value })}
                  className="w-full bg-gray-50 border-b-2 border-gray-200 py-2 px-3 text-sm font-bold text-gray-700 focus:border-blue-500 focus:outline-none focus:bg-white transition-all rounded-t"
                />
            </div>
        </div>

        {/* Instruções de Preenchimento (Estático) */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-[10px] font-black text-gray-600 text-center uppercase tracking-widest">
            Instruções do Preenchimento:
          </div>
          <table className="w-full text-[11px] text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 font-bold text-gray-500 w-16">Ordem</th>
                <th className="px-4 py-2 font-bold text-gray-500">Instrução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
              <tr>
                <td className="px-4 py-2">1.</td>
                <td className="px-4 py-2">Marque com (Chixi) <span className="text-red-600 font-black">X</span>, os Relatórios não feitos e especificar os motivos nas observações;</td>
              </tr>
              <tr>
                <td className="px-4 py-2">2.</td>
                <td className="px-4 py-2">Marque com (Certo) <span className="text-green-600 font-black">✓</span>, os Relatórios feitos;</td>
              </tr>
              <tr>
                <td className="px-4 py-2">3.</td>
                <td className="px-4 py-2">Escreva (Não Aplicável) <span className="text-gray-500 font-black">NA</span>, os Relatórios não feitos porque os serviços não são prestados.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Campo de Observações (EDITÁVEL) */}
        <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Observações:</label>
            <textarea 
              value={verification.observations}
              onChange={(e) => onVerificationUpdate({ observations: e.target.value })}
              placeholder="Escreva aqui os motivos de relatórios não feitos ou outras notas importantes..."
              rows={4}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 text-sm font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:bg-white transition-all resize-none shadow-inner"
            ></textarea>
        </div>

        {/* Nota de Rodapé e Elaboração */}
        <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
            <p className="text-[10px] font-black text-gray-800 uppercase tracking-tighter max-w-2xl leading-relaxed">
              NOTA: RELATÓRIOS COMPLETOS É IMPORTANTE PARA GARANTIR ANÁLISE E CRUZAMENTO DOS INDICADORES PARA TOMADA DE DECISÕES A TEMPO E PLANIFICAÇÃO APROPRIADA
            </p>
            <div className="w-full flex justify-between items-end text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Elaborado por Roque Simail - Téc. Estatística Sanitária</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-500">Verso do Checklist de Relatórios</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChecklistTable;
