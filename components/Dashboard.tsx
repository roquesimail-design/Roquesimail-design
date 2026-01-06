
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, VerificationStore, ActionPlanItem, SubmissionEntry } from '../types';
import { PROGRAMS, HEALTH_UNITS, MONTHS } from '../constants';

interface DashboardProps {
  data: ReportData;
  verificationStore: VerificationStore;
  submissionHistory: SubmissionEntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ data, verificationStore, submissionHistory }) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [actionPlan, setActionPlan] = useState<ActionPlanItem[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para busca global
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Calcular indicadores por US e Mês
  const stats = useMemo(() => {
    return HEALTH_UNITS.map(us => {
      let done = 0;
      let expected = 0;
      let notDone = 0;
      const missingReportsList: {program: string, name: string}[] = [];
      const submittedReportsList: {program: string, name: string}[] = [];
      const usData = data[us.id] || {};

      PROGRAMS.forEach(prog => {
        prog.reports.forEach(report => {
          // Lógica de exclusão para relatórios trimestrais
          const isMonthAllowed = !report.quarterlyMonths || report.quarterlyMonths.includes(selectedMonth);
          if (!isMonthAllowed) return;

          const statusMap = usData[report.id] || {};
          const status = statusMap[selectedMonth] || 'PENDING';
          
          if (status !== 'NA') {
            expected++;
            if (status === 'DONE') {
              done++;
              submittedReportsList.push({ program: prog.name, name: report.name });
            } else {
              notDone++;
              missingReportsList.push({ program: prog.name, name: report.name });
            }
          }
        });
      });

      return {
        id: us.id,
        name: us.name,
        recebidos: done,
        naoRecebidos: notDone,
        total: expected,
        percentagem: expected > 0 ? Math.round((done / expected) * 100) : 0,
        missingReports: missingReportsList,
        submittedReports: submittedReportsList
      };
    });
  }, [data, selectedMonth]);

  const totalReceived = stats.reduce((acc, curr) => acc + curr.recebidos, 0);
  const totalExpected = stats.reduce((acc, curr) => acc + curr.total, 0);
  const avgPerformance = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

  // Filtragem das tabelas com base no termo de busca
  const allSubmitted = useMemo(() => {
    const list = stats.flatMap(s => s.submittedReports.map(r => ({ ...r, us: s.name })));
    if (!searchTerm) return list;
    return list.filter(item => 
      item.us.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.program.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  const allMissing = useMemo(() => {
    const list = stats.flatMap(s => s.missingReports.map(r => ({ ...r, us: s.name })));
    if (!searchTerm) return list;
    return list.filter(item => 
      item.us.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.program.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stats, searchTerm]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return submissionHistory;
    return submissionHistory.filter(h => 
      h.usName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      h.timestamp.includes(searchTerm) || 
      h.year.toString().includes(searchTerm)
    );
  }, [submissionHistory, searchTerm]);

  const generateActionPlan = async () => {
    setIsGenerating(true);
    try {
      const observationsText = HEALTH_UNITS
        .map(us => {
          const obs = verificationStore[us.id]?.observations;
          return obs ? `${us.name}: ${obs}` : null;
        })
        .filter(Boolean)
        .join('\n');

      if (!observationsText) {
        alert("Nenhuma observação encontrada nas unidades sanitárias para analisar.");
        setIsGenerating(false);
        return;
      }

      // Initialize ai instance with apiKey from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Using gemini-3-pro-preview for complex reasoning task (Action Plan Generation)
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analise as seguintes observações das unidades sanitárias e sugira um plano de acção estruturado em JSON: ${observationsText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING },
                issue: { type: Type.STRING },
                action: { type: Type.STRING },
                responsible: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['ALTA', 'MÉDIA', 'BAIXA'] },
                deadline: { type: Type.STRING }
              },
              required: ["unit", "issue", "action", "responsible", "priority", "deadline"]
            }
          }
        }
      });

      // Directly access .text property from response as per guidelines
      const plan = JSON.parse(response.text || '[]');
      setActionPlan(plan);
    } catch (error) {
      alert("Erro ao gerar plano.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Sistema de Busca e Filtro de Mês */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Análise e Histórico de Dados Sincronizados</h3>
          <p className="text-sm text-gray-500 font-bold">Consulte aqui todas as submissões anteriores e atuais</p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Barra de Busca de Dados Sincronizados */}
            <div className="relative group min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar Unidade, Relatório ou Data..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-sm focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-gray-400"
                />
            </div>

            <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase">Mês Ref:</span>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent font-black text-blue-700 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
            </div>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-green-500">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Recebidos ({MONTHS[selectedMonth]})</p>
          <p className="text-4xl font-black text-gray-900">{totalReceived}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-blue-600">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Taxa de Conformidade</p>
          <p className="text-4xl font-black text-blue-600">{avgPerformance.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-emerald-500">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Esperados</p>
          <p className="text-4xl font-black text-gray-900">{totalExpected}</p>
        </div>
      </div>

      {/* Gráficos de Barra de Desempenho */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Desempenho por Unidade Sanitária</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Relatórios Submetidos vs. Em Falta • {MONTHS[selectedMonth]}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">Submetidos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-sm"></div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">Em Falta</span>
                </div>
            </div>
        </div>
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0} 
                        height={80} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                    />
                    <YAxis tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                        cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }} />
                    <Bar name="Submetidos" dataKey="recebidos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar name="Em Falta" dataKey="naoRecebidos" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabela de Relatórios Submetidos (Filtrável) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-green-50 flex items-center justify-between">
             <h3 className="text-sm font-black text-green-800 uppercase tracking-tight flex items-center gap-2">
                Relatórios Submetidos ({allSubmitted.length})
             </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <tr className="text-gray-400 font-black uppercase tracking-widest">
                  <th className="px-6 py-3">Unidade</th>
                  <th className="px-6 py-3">Programa</th>
                  <th className="px-6 py-3">Relatório</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubmitted.map((r, i) => (
                  <tr key={i} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-3 font-black text-gray-700">{r.us}</td>
                    <td className="px-6 py-3 font-bold text-blue-600">{r.program}</td>
                    <td className="px-6 py-3 text-gray-600">{r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Relatórios em Falta (Filtrável) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-red-50 flex items-center justify-between">
             <h3 className="text-sm font-black text-red-800 uppercase tracking-tight flex items-center gap-2">
                Relatórios em Falta ({allMissing.length})
             </h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                <tr className="text-gray-400 font-black uppercase tracking-widest">
                  <th className="px-6 py-3">Unidade</th>
                  <th className="px-6 py-3">Programa</th>
                  <th className="px-6 py-3">Relatório</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allMissing.map((r, i) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-6 py-3 font-black text-gray-700">{r.us}</td>
                    <td className="px-6 py-3 font-bold text-blue-600">{r.program}</td>
                    <td className="px-6 py-3 text-gray-600">{r.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Histórico de Submissões Consolidado (Busca em todos os anos sincronizados) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Registro Consolidado de Submissões (Busca Histórica)</h3>
              <span className="px-3 py-1 bg-blue-700 text-white text-[9px] font-black rounded-full uppercase tracking-widest">Global</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                 <thead className="bg-gray-50 sticky top-0 border-b border-gray-100 z-10">
                    <tr className="text-gray-400 font-black uppercase tracking-widest">
                       <th className="px-6 py-3">Data/Hora</th>
                       <th className="px-6 py-3">Unidade Sanitária</th>
                       <th className="px-6 py-3">Ano Ref.</th>
                       <th className="px-6 py-3">Relatórios</th>
                       <th className="px-6 py-3">Desempenho</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {filteredHistory.map((sub) => (
                       <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-500">{new Date(sub.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-3 font-black text-gray-700">{sub.usName}</td>
                          <td className="px-6 py-3 font-bold text-gray-400">{sub.year}</td>
                          <td className="px-6 py-3 font-bold text-gray-600">{sub.receivedCount} / {sub.totalReports}</td>
                          <td className="px-6 py-3 font-black text-blue-600">{sub.performance}%</td>
                       </tr>
                    ))}
                    {filteredHistory.length === 0 && (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold italic">Nenhum registro encontrado para a busca atual.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
          </div>
      </div>

      {/* SEÇÃO IA (Mantida conforme solicitado) */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 rounded-3xl p-8 shadow-xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight">Plano de Acção Estratégico</h3>
              </div>
              <p className="text-blue-100 font-medium leading-relaxed">Analise todas as observações registradas nas Unidades Sanitárias através de Inteligência Artificial.</p>
            </div>
            <button 
              onClick={generateActionPlan}
              disabled={isGenerating}
              className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all ${isGenerating ? 'bg-white/20 cursor-wait' : 'bg-white text-blue-900 hover:bg-blue-50 hover:scale-105 active:scale-95'}`}
            >
              {isGenerating ? 'Analisando...' : 'Gerar Plano de Acção'}
            </button>
        </div>

        {actionPlan && (
          <div className="mt-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
             <table className="w-full text-left text-xs">
                <thead className="bg-black/20 text-blue-200 font-black uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Unidade</th>
                    <th className="px-6 py-4">Problema</th>
                    <th className="px-6 py-4">Acção Recomendada</th>
                    <th className="px-6 py-4">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {actionPlan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="px-6 py-4 font-black">{item.unit}</td>
                      <td className="px-6 py-4 opacity-90">{item.issue}</td>
                      <td className="px-6 py-4 font-bold text-blue-100">{item.action}</td>
                      <td className="px-6 py-4 font-black">{item.priority}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
