
/**
 * Sistema de Gestão de Relatórios de Unidades Sanitárias 2026
 * Funções: Salvar, Apagar e Exportar Relatórios em Falta
 */

const SPREADSHEET_ID = 'SUA_ID_DA_PLANILHA'; // Opcional se rodar na própria planilha
const SHEET_NAME = "Relatorios";
const DRIVE_FOLDER_ID = "1CgGpsXhABEr7i1ln77eD1RpDJjbE9-n0";

// 1. SALVAR OU ATUALIZAR RELATÓRIO
function salvarRelatorio(unidade, mes, ano, status) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  
  // Adiciona nova linha com carimbo de data
  sheet.appendRow([Utilities.getUuid(), unidade, mes, ano, status, new Date()]);
  return "Relatório de " + unidade + " salvo com sucesso!";
}

// 2. APAGAR RELATÓRIO POR UNIDADE E MÊS
function apagarRelatorio(unidade, mes, ano) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] == unidade && data[i][2] == mes && data[i][3] == ano) {
      sheet.deleteRow(i + 1);
    }
  }
}

// 3. EXPORTAR RELATÓRIO DE UNIDADES EM FALTA (GERAR PDF)
function exportarRelatoriosEmFalta() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var data = sheet.getDataRange().getValues();
  var html = "<h1>Relatório de Unidades em Falta - 2026</h1><table border='1'><tr><th>Unidade</th><th>Mês</th></tr>";
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][4] === "Em Falta") {
      html += "<tr><td>" + data[i][1] + "</td><td>" + data[i][2] + "</td></tr>";
    }
  }
  html += "</table>";
  
  // Cria o PDF no Google Drive
  var blob = Utilities.newBlob(html, 'text/html', 'Relatorio_Faltas_2026.pdf');
  var file = DriveApp.createFile(blob);
  
  return "PDF exportado para o Drive: " + file.getUrl();
}

/**
 * 4. BACKUP DIÁRIO PARA PASTA ESPECÍFICA
 * Esta função deve ser configurada com um Acionador (Trigger) diário no GAS
 */
function realizarBackupDiarioParaPasta() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const dateStr = Utilities.formatDate(new Date(), "GMT+2", "yyyy-MM-dd_HH-mm");
  const fileName = "BACKUP_SDSMAS_GONDOLA_" + dateStr;
  
  // Cria uma cópia da planilha na pasta de destino
  const copy = DriveApp.getFileById(ss.getId()).makeCopy(fileName, folder);
  
  console.log("Backup realizado com sucesso: " + copy.getUrl());
  return copy.getUrl();
}

// 5. CRIAR MENU NA PLANILHA
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚙️ Gestão de Saúde')
      .addItem('Exportar Relatório de Faltas', 'exportarRelatoriosEmFalta')
      .addItem('Executar Backup para Drive Agora', 'realizarBackupDiarioParaPasta')
      .addToUi();
}
