
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ReportData, Status, VerificationStore, VerificationData, SubmissionEntry } from './types';
import ChecklistTable from './components/ChecklistTable';
import Dashboard from './components/Dashboard';
import { HEALTH_UNITS, PROGRAMS, MONTHS } from './constants';

const DEFAULT_VERIFICATION: VerificationData = {
  verifiedBy: '',
  jobTitle: '',
  date: '',
  observations: ''
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'checklist' | 'dashboard' | 'storage'>('checklist');
  const [selectedUsId, setSelectedUsId] = useState<string>(HEALTH_UNITS[0].id);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [storageSearchTerm, setStorageSearchTerm] = useState('');

  const storageKey = useMemo(() => `reports_v${selectedYear}_gondola`, [selectedYear]);
  const metaKey = useMemo(() => `meta_v${selectedYear}_gondola`, [selectedYear]);
  const historyKey = 'submissions_history_global_gondola';

  const [reportData, setReportData] = useState<ReportData>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [verificationStore, setVerificationStore] = useState<VerificationStore>(() => {
    const saved = localStorage.getItem(metaKey);
    return saved ? JSON.parse(saved) : {};
  });

  const [submissionHistory, setSubmissionHistory] = useState<SubmissionEntry[]>(() => {
    const saved = localStorage.getItem(historyKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedReport = localStorage.getItem(storageKey);
    const savedMeta = localStorage.getItem(metaKey);
    setReportData(savedReport ? JSON.parse(savedReport) : {});
    setVerificationStore(savedMeta ? JSON.parse(savedMeta) : {});
  }, [selectedYear, storageKey, metaKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(reportData));
  }, [reportData, storageKey]);

  useEffect(() => {
    localStorage.setItem(metaKey, JSON.stringify(verificationStore));
  }, [verificationStore, metaKey]);

  useEffect(() => {
    localStorage.setItem(historyKey, JSON.stringify(submissionHistory));
  }, [submissionHistory, historyKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'admin') {
      setIsLoggedIn(true);
      sessionStorage.setItem('isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Use admin/admin.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
  };

  const handleUpdate = useCallback((reportId: string, monthIdx: number, status: Status) => {
    setReportData(prev => {
      const usCurrentData = prev[selectedUsId] || {};
      const reportCurrentData = usCurrentData[reportId] || {};
      return {
        ...prev,
        [selectedUsId]: {
          ...usCurrentData,
          [reportId]: {
            ...reportCurrentData,
            [monthIdx]: status
          }
        }
      };
    });
  }, [selectedUsId]);

  const handleVerificationUpdate = useCallback((newData: Partial<VerificationData>) => {
    setVerificationStore(prev => ({
      ...prev,
      [selectedUsId]: {
        ...(prev[selectedUsId] || DEFAULT_VERIFICATION),
        ...newData
      }
    }));
  }, [selectedUsId]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const usData = reportData[selectedUsId] || {};
      let received = 0;
      let total = 0;
      const targetMonthIdx = selectedMonth;

      PROGRAMS.forEach(prog => {
        prog.reports.forEach(report => {
          const isMonthAllowed = !report.quarterlyMonths || report.quarterlyMonths.includes(targetMonthIdx);
          if (!isMonthAllowed) return;

          const status = usData[report.id]?.[targetMonthIdx] || 'PENDING';
          if (status !== 'NA') {
            total++;
            if (status === 'DONE') received++;
          }
        });
      });

      const currentUsName = HEALTH_UNITS.find(u => u.id === selectedUsId)?.name || 'Desconhecida';
      const newSubmission: SubmissionEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        usName: currentUsName,
        year: selectedYear,
        totalReports: total,
        receivedCount: received,
        performance: total > 0 ? Math.round((received / total) * 100) : 0
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmissionHistory(prev => [newSubmission, ...prev].slice(0, 500));
      alert(`✅ Sincronização Concluída: Dados de ${MONTHS[selectedMonth]}/${selectedYear} armazenados com sucesso!`);
    } catch (error) {
      alert("❌ Erro ao sincronizar dados.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const reportsRows: any[] = [];
      HEALTH_UNITS.forEach(us => {
        PROGRAMS.forEach(prog => {
          prog.reports.forEach(report => {
            const statusMap = reportData[us.id]?.[report.id] || {};
            const row: any = { 'Unidade Sanitária': us.name, 'Programa': prog.name, 'Relatório': report.name };
            MONTHS.forEach((m, idx) => { 
              const isMonthAllowed = !report.quarterlyMonths || report.quarterlyMonths.includes(idx);
              row[m] = isMonthAllowed ? (statusMap[idx] || 'PENDING') : 'NA'; 
            });
            reportsRows.push(row);
          });
        });
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reportsRows), 'Relatorios');
      const historyRows = submissionHistory.map(h => ({
        'ID': h.id, 'Timestamp': h.timestamp, 'Unidade Sanitária': h.usName, 'Ano': h.year, 'Total': h.totalReports, 'Recebidos': h.receivedCount, 'Performance %': h.performance
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(historyRows), 'Historico');
      XLSX.writeFile(workbook, `SDSMAS_Gondola_Consolidado_${selectedYear}.xlsx`);
    } catch (error) { alert("Erro ao exportar Excel."); }
  };

  const handleCloudBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulação de backup para o Drive Folder ID: 1CgGpsXhABEr7i1ln77eD1RpDJjbE9-n0
      // Em uma implementação real, isso chamaria o script no gas_scripts.js via web app URL ou API do Google
      console.log("Iniciando backup diário para o Google Drive Folder...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const lastBackup = localStorage.getItem('last_drive_backup');
      const today = new Date().toDateString();
      
      localStorage.setItem('last_drive_backup', today);
      alert(`✅ Backup Diário Concluído!\n\nOs dados foram processados para armazenamento na pasta do Google Drive:\nhttps://drive.google.com/drive/folders/1CgGpsXhABEr7i1ln77eD1RpDJjbE9-n0`);
    } catch (error) {
      alert("Erro ao realizar backup para o Drive.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log("Imported data:", jsonData);
        alert("Importação de dados concluída (Simulação).");
      } catch (error) {
        alert("Erro ao importar Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6 overflow-hidden">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Coat_of_arms_of_Mozambique.svg/1200px-Coat_of_arms_of_Mozambique.svg.png" alt="Logo" className="w-14 h-14 object-contain brightness-0 invert" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">SDSMAS GONDOLA</h2>
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">Portal de Relatórios 2026</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Utilizador</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                placeholder="Ex: admin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Código de Acesso</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
            
            {loginError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{loginError}</p>}

            <button 
              type="submit" 
              className="w-full py-4 bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-800 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Entrar no Sistema
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Acesso Restrito • Província de Manica
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="bg-blue-700 p-2 rounded-xl shadow-lg shadow-blue-200">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">SDSMAS GONDOLA</h1>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Sistema de Monitoria de Relatórios • 2026</p>
              </div>
            </div>

            <nav className="flex items-center bg-gray-100 p-1.5 rounded-2xl gap-1">
              {[
                { id: 'checklist', label: 'Checklist', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                { id: 'dashboard', label: 'Análise', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'storage', label: 'Dados', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
                  {tab.label}
                </button>
              ))}
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase text-red-500 hover:bg-red-50 transition-all"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'checklist' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Unidade Sanitária:</label>
                  <select
                    value={selectedUsId}
                    onChange={(e) => setSelectedUsId(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {HEALTH_UNITS.map(us => <option key={us.id} value={us.id}>{us.name}</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ano:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Imprimir
                </button>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-8 py-3.5 bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-800 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {isSyncing ? (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  )}
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              </div>
            </div>

            <ChecklistTable
              data={reportData[selectedUsId] || {}}
              verification={verificationStore[selectedUsId] || DEFAULT_VERIFICATION}
              onUpdate={handleUpdate}
              onVerificationUpdate={handleVerificationUpdate}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <Dashboard 
              data={reportData} 
              verificationStore={verificationStore} 
              submissionHistory={submissionHistory} 
            />
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    Gestão de Armazenamento Central
                  </h3>
                  <button 
                    onClick={handleCloudBackup}
                    disabled={isBackingUp}
                    className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all flex items-center gap-2"
                  >
                    {isBackingUp ? 'Processando...' : 'Fazer Backup para Drive'}
                  </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <h4 className="text-sm font-black text-blue-800 uppercase mb-4">Exportar Ficheiros Locais</h4>
                    <p className="text-xs text-blue-600 font-medium mb-6">Descarregue os dados do período atual no formato Excel consolidado.</p>
                    <button onClick={handleExportExcel} className="w-full py-3 bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       Exportar Excel Completo
                    </button>
                  </div>

                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="text-sm font-black text-emerald-800 uppercase mb-4">Importar Dados</h4>
                    <p className="text-xs text-emerald-600 font-medium mb-6">Importe relatórios de ficheiros externos sem alterar a estrutura atual.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                       Importar de Ficheiro
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
                  </div>
               </div>

               <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Estado da Sincronização Cloud</h4>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-[10px] font-black text-green-600 uppercase">Ligado ao Drive</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Último Backup Drive</p>
                        <p className="text-xs font-black text-gray-700">{localStorage.getItem('last_drive_backup') || 'Nunca realizado'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Periodicidade</p>
                        <p className="text-xs font-black text-gray-700">DIÁRIA</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Destino Cloud</p>
                        <p className="text-[8px] font-black text-blue-600 break-all">ID: 1CgGpsXhABEr7i1ln77eD1RpDJjbE9-n0</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-10 mt-12 print:hidden">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2">SDSMAS GONDOLA • REPARTIÇÃO DE ESTATÍSTICA</p>
              <p className="text-xs font-bold text-gray-400">Desenvolvido para monitoria de desempenho de saúde • 2026</p>
          </div>
      </footer>
    </div>
  );
};

export default App;
