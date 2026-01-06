
import { Program, HealthUnit } from './types';

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const HEALTH_UNITS: HealthUnit[] = [
  { id: 'cs_amatongas', name: 'CS Amatongas' },
  { id: 'cs_cafumpe', name: 'CS Cafumpe' },
  { id: 'cs_chipindauwe', name: 'CS Chipindauwe' },
  { id: 'cs_fmanhanga', name: 'CS F. Manhanga' },
  { id: 'cs_gondola', name: 'CS Gondola' },
  { id: 'cs_inchope', name: 'CS Inchope' },
  { id: 'cs_josina', name: 'CS Josina Machel' },
  { id: 'cs_maforga', name: 'CS Maforga' },
  { id: 'cs_mapara', name: 'CS Maparanhanga Serra' },
  { id: 'cs_mudas', name: 'CS Muda Serração' },
  { id: 'cs_mutocote', name: 'CS Mutocoma' },
  { id: 'hd_gondola', name: 'HD Gondola' },
];

export const PROGRAMS: Program[] = [
  {
    id: 'vacinacao',
    name: 'Vacinação',
    reports: [
      { id: 'v1', name: 'Mod. SIS A03 - PAV' },
      { id: 'v2', name: 'Mod. SIS A03 - PAV-VAT' },
      { id: 'v3', name: 'PAV - HPV' },
      { id: 'v4', name: 'PAV - Stock de Vacinas' },
    ]
  },
  {
    id: 'smi',
    name: 'Saúde Materna Infantil',
    reports: [
      { id: 'smi1', name: 'Mod. SIS B01 - CPN - Provisório' },
      { id: 'smi2', name: 'Mod. SIS B02 - CPN - Coorte' },
      { id: 'smi3', name: 'Mod. SIS B03 - MATERNIDADE' },
      { id: 'smi4', name: 'Mod. SIS B05 - PF' },
      { id: 'smi5', name: 'PF - Integrado' },
      { id: 'smi6', name: 'Mod. SIS B06 - U. GINECOLOGIA' },
      { id: 'smi7', name: 'Mod. SIS B04 - CPP' },
      { id: 'smi8', name: 'Mod. SIS B00 - CCS' },
      { id: 'smi9', name: 'Mod. SIS B07 - CCR' },
      { id: 'smi10', name: 'Mod. SIS B08 - CCD' },
    ]
  },
  {
    id: 'seaj',
    name: 'SEAJ',
    reports: [{ id: 'seaj1', name: 'Mod. SIS - N05 SAAJ' }]
  },
  {
    id: 'cacum',
    name: 'CACUM',
    reports: [{ id: 'cacum1', name: 'Mod. SIS. CAN-02A CACUM' }]
  },
  {
    id: 'nutricao',
    name: 'Nutrição',
    reports: [
      { id: 'n1', name: 'Mod. SIS N02-A - TDA' },
      { id: 'n2', name: 'Mod. SIS N02-B - PRN' },
      { id: 'n3', name: 'Mod. SIS N04 - TDI' },
      { id: 'n4', name: 'Mod. SIS N03-A - SAL MULHERES GRÁVIDAS' },
      { id: 'n5', name: 'Mod. SIS N03-B - SAL LACTANTES' },
      { id: 'n6', name: 'Mod. SIS N03-C - SAL ADOLESCENTES' },
      { id: 'n7', name: 'Mod. SIS N05 - D. CULINÁRIAS' },
      { id: 'n8', name: 'Resumo Mensal de Desparazitação-Mulheres Grávidas' },
    ]
  },
  {
    id: 'its_hiv',
    name: 'Programa ITS, HIV/SIDA',
    reports: [
      { id: 'hiv1', name: 'Mod. SIS H22 D - ITS' },
      { id: 'hiv2', name: 'Mod. SIS H20-B - ATS' },
      { id: 'hiv3', name: 'Mod. SIS H04-A - HIV/SIDA' },
      { id: 'hiv4', name: 'Auto - Teste HIV' },
      { id: 'hiv5', name: 'Mod. SIS-H13 - MM, AJM e HC' },
      { id: 'hiv6', name: 'Relatorio de PrEp' },
      { id: 'hiv7', name: 'Tutoria Clinica' },
    ]
  },
  {
    id: 'pncm',
    name: 'PNCM',
    reports: [{ id: 'pncm1', name: 'Mod. SIS M01 - MALARIA' }]
  },
  {
    id: 'pnct',
    name: 'PNCT',
    reports: [
      { id: 'pnct1', name: 'PNCT-07 Notificação de TB e TB-HIV' },
      { id: 'pnct2', name: 'Mod. SIS. PNCT - R05 Vigilância e Notificação de TB' },
      { id: 'pnct3', name: 'Mod. SIS. PNCT - IC10A Rastreio e Investigação de TB, Contactos e TPT' },
      { 
        id: 'pnct8', 
        name: 'PNCT-08 Rev 2023 Resumo Trimestral de Avaliaçao de Tratamento de TB',
        quarterlyMonths: [3, 5, 8, 11] // Abril, Junho, Setembro e Dezembro
      },
      { 
        id: 'pnct9', 
        name: 'PNCT09-Rev 2023 Resumo Trimestrais de Cuidados de TB em Grupo de alto risco',
        quarterlyMonths: [3, 5, 8, 11] // Abril, Junho, Setembro e Dezembro
      }
    ]
  },
  {
    id: 'ce',
    name: 'CE',
    reports: [{ id: 'ce1', name: 'Mod. SIS C01 - CONSULTAS EXTERNAS' }]
  },
  {
    id: 'internamento',
    name: 'Internamento',
    reports: [{ id: 'int1', name: 'Mod. SIS D04 - INT. HOSPITAIS' }]
  },
  {
    id: 'laboratorio',
    name: 'Laboratório',
    reports: [{ id: 'lab1', name: 'Estatísticas Laboratoriais (Parasitologia e Serologia)' }]
  },
  {
    id: 'farmacia',
    name: 'Farmácia',
    reports: [{ id: 'f1', name: 'Consumo AL&TDR MMIA' }]
  },
  {
    id: 'estomatologia',
    name: 'Estomatologia',
    reports: [{ id: 'esto1', name: 'Mod. SIS. G02 Saúde Oral' }]
  },
  {
    id: 'oftalmologia',
    name: 'Oftalmologia',
    reports: [{ id: 'oft1', name: 'SIS. G01-B Saúde Ocular' }]
  },
  {
    id: 'vigilancia',
    name: 'Vigilância Epidemiológica',
    reports: [{ id: 'vig1', name: 'Mod. SIS C03-A Boletim Epidemiológico Semanal' }]
  },
  {
    id: 'envolvimento',
    name: 'Envolvimento Comunitário',
    reports: [
      { id: 'env1', name: 'Envolvimento Comunitário' },
      { id: 'env2', name: 'Mod. SIS AP1-A - APS' },
    ]
  },
  {
    id: 'dtn_dnt',
    name: 'DTN/DNT',
    reports: [
      { id: 'dtn1', name: 'Doenças Não Transmissíveis' },
      { id: 'dtn2', name: 'Doenças Tropicais e Negligenciadas' },
    ]
  },
  {
    id: 'vbg',
    name: 'VBG',
    reports: [{ id: 'vbg1', name: 'Mod. SIS V01-C Violência Baseada no Género' }]
  },
  {
    id: 'pmt',
    name: 'PMT',
    reports: [{ id: 'pmt1', name: 'RM de Praticante de Medicina Tradicional' }]
  }
];
