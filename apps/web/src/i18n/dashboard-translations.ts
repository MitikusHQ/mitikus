import { type Locale } from './config'

export interface DashboardTranslations {
  // Nav items
  navToday: string
  navCopilot: string
  navBrain: string
  navMail: string
  navClients: string
  navLeads: string
  navTasks: string
  navTools: string
  navWorkflows: string
  navOffice: string
  navFiles: string
  navMissions: string
  navFiscal: string
  navInvoices: string
  navReceipts: string
  navAnalytics: string
  navUsage: string
  navAudit: string
  navAdminOrg: string
  navProfile: string
  navSupport: string
  navSettings: string
  // Nav groups
  groupWork: string
  groupContent: string
  groupSystem: string
  // Nav descriptions
  descToday: string
  descCopilot: string
  descBrain: string
  descMail: string
  descClients: string
  descLeads: string
  descTasks: string
  descTools: string
  descWorkflows: string
  descOffice: string
  descFiles: string
  descMissions: string
  descFiscal: string
  descInvoices: string
  descReceipts: string
  descAnalytics: string
  descUsage: string
  descAudit: string
  descAdminOrg: string
  descProfile: string
  descSupport: string
  descSettings: string
  // Topbar
  newMission: string
  expandSidebar: string
  collapseSidebar: string
  openMenu: string
  closeTeamPanel: string
  openTeamPanel: string
  welcomeTour: string
  // Section labels for breadcrumb
  sectionTools: string
  sectionWorkflows: string
  sectionClients: string
  sectionAnalytics: string
  sectionAudit: string
  sectionUsage: string
  sectionTeam: string
  sectionSettings: string
  sectionGenerate: string
  sectionImport: string
  sectionCopilot: string
  sectionBrain: string
  sectionTasks: string
  sectionToday: string
  sectionTimelog: string
  sectionMissions: string
  sectionProfile: string
  sectionDocs: string
  sectionSheets: string
  sectionPdfs: string
  sectionContracts: string
  sectionPresentations: string
  sectionNotebooks: string
  sectionOffice: string
  sectionHistory: string
  sectionInvoices: string
  sectionReceipts: string
  // Sub-labels
  subHistory: string
  subRun: string
  subSettings: string
  subRecords: string
  subChecklist: string
  subScoring: string
  subEdit: string
  subNew: string
  // Banner
  bannerEarlyAccess: string
  bannerCta: string
}

const en: DashboardTranslations = {
  navToday: 'My day',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'Mail',
  navClients: 'Clients',
  navLeads: 'Leads',
  navTasks: 'Tasks',
  navTools: 'Tools',
  navWorkflows: 'Workflows',
  navOffice: 'My Office',
  navFiles: 'Files',
  navMissions: 'Missions',
  navFiscal: 'Tax Calendar',
  navInvoices: 'Invoices',
  navReceipts: 'Expenses',
  navAnalytics: 'Analytics',
  navUsage: 'Plan Usage',
  navAudit: 'Audit',
  navAdminOrg: 'Admin Org',
  navProfile: 'My Profile',
  navSupport: 'Support',
  navSettings: 'Settings',
  groupWork: 'Work',
  groupContent: 'Content',
  groupSystem: 'System',
  descToday: 'Your pending tasks and team activity today',
  descCopilot: 'Your strategic advisor — share your goals and it helps you plan them',
  descBrain: 'Query the workspace memory — documents, goals and decisions',
  descMail: 'Inbox, sent, drafts and client emails',
  descClients: 'The companies or people you serve',
  descLeads: 'Potential clients captured from your public form',
  descTasks: 'Team tasks with collaborative tagging',
  descTools: 'The tools you have installed or created for your business',
  descWorkflows: 'Chain several tools to automate a complete process',
  descOffice: 'Documents, spreadsheets, PDFs, contracts and presentations',
  descFiles: 'Workspace file storage with ZIP export',
  descMissions: 'Strategic goals and their execution steps',
  descFiscal: 'Tax obligations calendar for your company',
  descInvoices: 'Create and manage invoices for your clients with downloadable PDF',
  descReceipts: 'Scan tickets and invoices with the camera — AI extracts the data',
  descAnalytics: 'Activity, executions and costs of your workspace',
  descUsage: 'How much you have generated this month and how much remains in your plan',
  descAudit: 'Record of who did what and when in this workspace',
  descAdminOrg: 'Members, plans and configuration of your organisation',
  descProfile: 'Your profile photo and personal preferences',
  descSupport: 'Help assistant and contact with the MITIKUS team',
  descSettings: 'Logo, brand colour and workspace name',
  newMission: 'New mission',
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  openMenu: 'Open menu',
  closeTeamPanel: 'Close team panel',
  openTeamPanel: 'Open team panel',
  welcomeTour: 'Welcome tour',
  sectionTools: 'Tools',
  sectionWorkflows: 'Workflows',
  sectionClients: 'Clients',
  sectionAnalytics: 'Analytics',
  sectionAudit: 'Audit',
  sectionUsage: 'Usage',
  sectionTeam: 'Team',
  sectionSettings: 'Settings',
  sectionGenerate: 'Create tool',
  sectionImport: 'Import',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Tasks',
  sectionToday: 'My day',
  sectionTimelog: 'Time log',
  sectionMissions: 'Missions',
  sectionProfile: 'My Profile',
  sectionDocs: 'Documents',
  sectionSheets: 'Spreadsheets',
  sectionPdfs: 'PDFs',
  sectionContracts: 'Contracts',
  sectionPresentations: 'Presentations',
  sectionNotebooks: 'Notebooks',
  sectionOffice: 'My Office',
  sectionHistory: 'History',
  sectionInvoices: 'Invoices',
  sectionReceipts: 'Expenses',
  subHistory: 'History',
  subRun: 'Run',
  subSettings: 'Settings',
  subRecords: 'Records',
  subChecklist: 'Checklist',
  subScoring: 'Scoring',
  subEdit: 'Edit',
  subNew: 'New',
  bannerEarlyAccess: 'Early access',
  bannerCta: 'Limited spots · Join now and lock in your launch price',
}

const es: DashboardTranslations = {
  navToday: 'Mi día',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'Correo',
  navClients: 'Clientes',
  navLeads: 'Leads',
  navTasks: 'Tareas',
  navTools: 'Herramientas',
  navWorkflows: 'Flujos',
  navOffice: 'Mi Office',
  navFiles: 'Archivos',
  navMissions: 'Misiones',
  navFiscal: 'Fiscal',
  navInvoices: 'Facturas',
  navReceipts: 'Gastos',
  navAnalytics: 'Analítica',
  navUsage: 'Uso del plan',
  navAudit: 'Auditoría',
  navAdminOrg: 'Admin Org',
  navProfile: 'Mi perfil',
  navSupport: 'Soporte',
  navSettings: 'Ajustes',
  groupWork: 'Trabajo',
  groupContent: 'Contenido',
  groupSystem: 'Sistema',
  descToday: 'Tus tareas pendientes y actividad del equipo de hoy',
  descCopilot: 'Tu asesor estratégico — cuéntale tus objetivos y te ayuda a planificarlos',
  descBrain: 'Consulta la memoria del workspace — documentos, objetivos y decisiones',
  descMail: 'Recibidos, enviados, borradores y correos de clientes',
  descClients: 'Las empresas o personas a las que prestas servicio',
  descLeads: 'Potenciales clientes captados desde tu formulario público',
  descTasks: 'Tareas del equipo con etiquetado colaborativo',
  descTools: 'Las herramientas que has instalado o creado para tu negocio',
  descWorkflows: 'Encadena varias herramientas para automatizar un proceso completo',
  descOffice: 'Documentos, hojas de cálculo, PDFs, contratos y presentaciones',
  descFiles: 'Almacén de archivos del workspace con exportación ZIP',
  descMissions: 'Objetivos estratégicos y sus pasos de ejecución',
  descFiscal: 'Calendario de obligaciones fiscales para tu empresa',
  descInvoices: 'Crea y gestiona facturas para tus clientes con PDF descargable',
  descReceipts: 'Escanea tickets y facturas con la cámara — la IA extrae los datos',
  descAnalytics: 'Actividad, ejecuciones y costes de tu workspace',
  descUsage: 'Cuánto has generado este mes y cuánto te queda de tu plan',
  descAudit: 'Registro de quién hizo qué y cuándo en este workspace',
  descAdminOrg: 'Miembros, planes y configuración de tu organización',
  descProfile: 'Tu foto de perfil y preferencias personales',
  descSupport: 'Asistente de ayuda y contacto con el equipo MITIKUS',
  descSettings: 'Logo, color de marca y nombre del workspace',
  newMission: 'Nueva misión',
  expandSidebar: 'Expandir sidebar',
  collapseSidebar: 'Colapsar sidebar',
  openMenu: 'Abrir menú',
  closeTeamPanel: 'Cerrar panel de equipo',
  openTeamPanel: 'Abrir panel de equipo',
  welcomeTour: 'Tour de bienvenida',
  sectionTools: 'Herramientas',
  sectionWorkflows: 'Flujos',
  sectionClients: 'Clientes',
  sectionAnalytics: 'Analytics',
  sectionAudit: 'Auditoría',
  sectionUsage: 'Uso',
  sectionTeam: 'Equipo',
  sectionSettings: 'Ajustes',
  sectionGenerate: 'Generar herramienta',
  sectionImport: 'Importar',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Tareas',
  sectionToday: 'Mi día',
  sectionTimelog: 'Control horario',
  sectionMissions: 'Misiones',
  sectionProfile: 'Mi perfil',
  sectionDocs: 'Documentos',
  sectionSheets: 'Hojas de cálculo',
  sectionPdfs: 'PDFs',
  sectionContracts: 'Contratos',
  sectionPresentations: 'Presentaciones',
  sectionNotebooks: 'Notebooks',
  sectionOffice: 'Mi Office',
  sectionHistory: 'Historial',
  sectionInvoices: 'Facturas',
  sectionReceipts: 'Gastos',
  subHistory: 'Historial',
  subRun: 'Ejecutar',
  subSettings: 'Ajustes',
  subRecords: 'Registros',
  subChecklist: 'Checklist',
  subScoring: 'Scoring',
  subEdit: 'Editar',
  subNew: 'Nuevo',
  bannerEarlyAccess: 'Acceso anticipado',
  bannerCta: 'Plazas limitadas · Únete ahora y bloquea tu precio de lanzamiento',
}

const fr: DashboardTranslations = {
  navToday: 'Mon espace jour',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'Courrier',
  navClients: 'Clients',
  navLeads: 'Prospects',
  navTasks: 'Tâches',
  navTools: 'Outils',
  navWorkflows: 'Flux de travail',
  navOffice: 'Mon Bureau',
  navFiles: 'Fichiers',
  navMissions: 'Missions',
  navFiscal: 'Calendrier fiscal',
  navInvoices: 'Factures',
  navReceipts: 'Dépenses',
  navAnalytics: 'Analytique',
  navUsage: 'Utilisation du plan',
  navAudit: 'Audit',
  navAdminOrg: 'Admin Org',
  navProfile: 'Mon profil',
  navSupport: 'Support',
  navSettings: 'Paramètres',
  groupWork: 'Travail',
  groupContent: 'Contenu',
  groupSystem: 'Système',
  descToday: 'Vos tâches en attente et l\'activité de l\'équipe aujourd\'hui',
  descCopilot: 'Votre conseiller stratégique — partagez vos objectifs et il vous aide à les planifier',
  descBrain: 'Interrogez la mémoire du workspace — documents, objectifs et décisions',
  descMail: 'Boîte de réception, envoyés, brouillons et e-mails clients',
  descClients: 'Les entreprises ou personnes auxquelles vous fournissez des services',
  descLeads: 'Clients potentiels capturés depuis votre formulaire public',
  descTasks: 'Tâches d\'équipe avec étiquetage collaboratif',
  descTools: 'Les outils que vous avez installés ou créés pour votre activité',
  descWorkflows: 'Enchaînez plusieurs outils pour automatiser un processus complet',
  descOffice: 'Documents, tableurs, PDFs, contrats et présentations',
  descFiles: 'Stockage de fichiers du workspace avec export ZIP',
  descMissions: 'Objectifs stratégiques et leurs étapes d\'exécution',
  descFiscal: 'Calendrier des obligations fiscales de votre entreprise',
  descInvoices: 'Créez et gérez des factures pour vos clients avec PDF téléchargeable',
  descReceipts: 'Scannez tickets et factures avec la caméra — l\'IA extrait les données',
  descAnalytics: 'Activité, exécutions et coûts de votre workspace',
  descUsage: 'Combien vous avez généré ce mois et combien il reste de votre plan',
  descAudit: 'Registre de qui a fait quoi et quand dans ce workspace',
  descAdminOrg: 'Membres, plans et configuration de votre organisation',
  descProfile: 'Votre photo de profil et préférences personnelles',
  descSupport: 'Assistant d\'aide et contact avec l\'équipe MITIKUS',
  descSettings: 'Logo, couleur de marque et nom du workspace',
  newMission: 'Nouvelle mission',
  expandSidebar: 'Agrandir la barre latérale',
  collapseSidebar: 'Réduire la barre latérale',
  openMenu: 'Ouvrir le menu',
  closeTeamPanel: 'Fermer le panneau équipe',
  openTeamPanel: 'Ouvrir le panneau équipe',
  welcomeTour: 'Tour de bienvenue',
  sectionTools: 'Outils',
  sectionWorkflows: 'Flux',
  sectionClients: 'Clients',
  sectionAnalytics: 'Analytique',
  sectionAudit: 'Audit',
  sectionUsage: 'Utilisation',
  sectionTeam: 'Équipe',
  sectionSettings: 'Paramètres',
  sectionGenerate: 'Créer un outil',
  sectionImport: 'Importer',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Tâches',
  sectionToday: 'Mon espace jour',
  sectionTimelog: 'Suivi du temps',
  sectionMissions: 'Missions',
  sectionProfile: 'Mon profil',
  sectionDocs: 'Documents',
  sectionSheets: 'Tableurs',
  sectionPdfs: 'PDFs',
  sectionContracts: 'Contrats',
  sectionPresentations: 'Présentations',
  sectionNotebooks: 'Carnets',
  sectionOffice: 'Mon Bureau',
  sectionHistory: 'Historique',
  sectionInvoices: 'Factures',
  sectionReceipts: 'Dépenses',
  subHistory: 'Historique',
  subRun: 'Exécuter',
  subSettings: 'Paramètres',
  subRecords: 'Enregistrements',
  subChecklist: 'Checklist',
  subScoring: 'Score',
  subEdit: 'Modifier',
  subNew: 'Nouveau',
  bannerEarlyAccess: 'Accès anticipé',
  bannerCta: 'Places limitées · Rejoignez maintenant et bloquez votre prix de lancement',
}

const de: DashboardTranslations = {
  navToday: 'Mein Tag',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'E-Mail',
  navClients: 'Kunden',
  navLeads: 'Leads',
  navTasks: 'Aufgaben',
  navTools: 'Tools',
  navWorkflows: 'Workflows',
  navOffice: 'Mein Büro',
  navFiles: 'Dateien',
  navMissions: 'Missionen',
  navFiscal: 'Steuerkalender',
  navInvoices: 'Rechnungen',
  navReceipts: 'Ausgaben',
  navAnalytics: 'Analytik',
  navUsage: 'Plan-Nutzung',
  navAudit: 'Audit',
  navAdminOrg: 'Admin Org',
  navProfile: 'Mein Profil',
  navSupport: 'Support',
  navSettings: 'Einstellungen',
  groupWork: 'Arbeit',
  groupContent: 'Inhalt',
  groupSystem: 'System',
  descToday: 'Ihre ausstehenden Aufgaben und Teamaktivitäten heute',
  descCopilot: 'Ihr strategischer Berater — teilen Sie Ihre Ziele und er hilft Ihnen, diese zu planen',
  descBrain: 'Workspace-Gedächtnis abfragen — Dokumente, Ziele und Entscheidungen',
  descMail: 'Posteingang, Gesendet, Entwürfe und Kunden-E-Mails',
  descClients: 'Die Unternehmen oder Personen, denen Sie Dienstleistungen erbringen',
  descLeads: 'Potenzielle Kunden aus Ihrem öffentlichen Formular',
  descTasks: 'Teamaufgaben mit kollaborativer Etikettierung',
  descTools: 'Die Tools, die Sie für Ihr Unternehmen installiert oder erstellt haben',
  descWorkflows: 'Verketten Sie mehrere Tools zur Automatisierung eines vollständigen Prozesses',
  descOffice: 'Dokumente, Tabellen, PDFs, Verträge und Präsentationen',
  descFiles: 'Workspace-Dateispeicher mit ZIP-Export',
  descMissions: 'Strategische Ziele und ihre Ausführungsschritte',
  descFiscal: 'Steuerlicher Verpflichtungskalender für Ihr Unternehmen',
  descInvoices: 'Erstellen und verwalten Sie Rechnungen für Kunden mit herunterladbarem PDF',
  descReceipts: 'Belege und Rechnungen mit der Kamera scannen — KI extrahiert die Daten',
  descAnalytics: 'Aktivität, Ausführungen und Kosten Ihres Workspaces',
  descUsage: 'Wie viel Sie diesen Monat generiert haben und wie viel Ihres Plans noch verbleibt',
  descAudit: 'Protokoll wer was wann in diesem Workspace getan hat',
  descAdminOrg: 'Mitglieder, Pläne und Konfiguration Ihrer Organisation',
  descProfile: 'Ihr Profilfoto und persönliche Einstellungen',
  descSupport: 'Hilfe-Assistent und Kontakt mit dem MITIKUS-Team',
  descSettings: 'Logo, Markenfarbe und Workspace-Name',
  newMission: 'Neue Mission',
  expandSidebar: 'Seitenleiste erweitern',
  collapseSidebar: 'Seitenleiste einklappen',
  openMenu: 'Menü öffnen',
  closeTeamPanel: 'Team-Panel schließen',
  openTeamPanel: 'Team-Panel öffnen',
  welcomeTour: 'Willkommenstour',
  sectionTools: 'Tools',
  sectionWorkflows: 'Workflows',
  sectionClients: 'Kunden',
  sectionAnalytics: 'Analytik',
  sectionAudit: 'Audit',
  sectionUsage: 'Nutzung',
  sectionTeam: 'Team',
  sectionSettings: 'Einstellungen',
  sectionGenerate: 'Tool erstellen',
  sectionImport: 'Importieren',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Aufgaben',
  sectionToday: 'Mein Tag',
  sectionTimelog: 'Zeitprotokoll',
  sectionMissions: 'Missionen',
  sectionProfile: 'Mein Profil',
  sectionDocs: 'Dokumente',
  sectionSheets: 'Tabellen',
  sectionPdfs: 'PDFs',
  sectionContracts: 'Verträge',
  sectionPresentations: 'Präsentationen',
  sectionNotebooks: 'Notizbücher',
  sectionOffice: 'Mein Büro',
  sectionHistory: 'Verlauf',
  sectionInvoices: 'Rechnungen',
  sectionReceipts: 'Ausgaben',
  subHistory: 'Verlauf',
  subRun: 'Ausführen',
  subSettings: 'Einstellungen',
  subRecords: 'Einträge',
  subChecklist: 'Checkliste',
  subScoring: 'Bewertung',
  subEdit: 'Bearbeiten',
  subNew: 'Neu',
  bannerEarlyAccess: 'Früher Zugang',
  bannerCta: 'Begrenzte Plätze · Jetzt beitreten und Einführungspreis sichern',
}

const pt: DashboardTranslations = {
  navToday: 'O meu dia',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'Correio',
  navClients: 'Clientes',
  navLeads: 'Leads',
  navTasks: 'Tarefas',
  navTools: 'Ferramentas',
  navWorkflows: 'Fluxos',
  navOffice: 'O meu Escritório',
  navFiles: 'Ficheiros',
  navMissions: 'Missões',
  navFiscal: 'Calendário Fiscal',
  navInvoices: 'Faturas',
  navReceipts: 'Despesas',
  navAnalytics: 'Analítica',
  navUsage: 'Utilização do plano',
  navAudit: 'Auditoria',
  navAdminOrg: 'Admin Org',
  navProfile: 'O meu perfil',
  navSupport: 'Suporte',
  navSettings: 'Definições',
  groupWork: 'Trabalho',
  groupContent: 'Conteúdo',
  groupSystem: 'Sistema',
  descToday: 'As suas tarefas pendentes e atividade da equipa hoje',
  descCopilot: 'O seu conselheiro estratégico — partilhe os seus objetivos e ajuda-o a planeá-los',
  descBrain: 'Consulte a memória do workspace — documentos, objetivos e decisões',
  descMail: 'Recebidos, enviados, rascunhos e emails de clientes',
  descClients: 'As empresas ou pessoas a quem presta serviços',
  descLeads: 'Potenciais clientes captados a partir do seu formulário público',
  descTasks: 'Tarefas da equipa com etiquetagem colaborativa',
  descTools: 'As ferramentas que instalou ou criou para o seu negócio',
  descWorkflows: 'Encadeie várias ferramentas para automatizar um processo completo',
  descOffice: 'Documentos, folhas de cálculo, PDFs, contratos e apresentações',
  descFiles: 'Armazenamento de ficheiros do workspace com exportação ZIP',
  descMissions: 'Objetivos estratégicos e os seus passos de execução',
  descFiscal: 'Calendário de obrigações fiscais para a sua empresa',
  descInvoices: 'Crie e gira faturas para os seus clientes com PDF descarregável',
  descReceipts: 'Digitalize tickets e faturas com a câmara — a IA extrai os dados',
  descAnalytics: 'Atividade, execuções e custos do seu workspace',
  descUsage: 'Quanto gerou este mês e quanto resta do seu plano',
  descAudit: 'Registo de quem fez o quê e quando neste workspace',
  descAdminOrg: 'Membros, planos e configuração da sua organização',
  descProfile: 'A sua foto de perfil e preferências pessoais',
  descSupport: 'Assistente de ajuda e contacto com a equipa MITIKUS',
  descSettings: 'Logótipo, cor de marca e nome do workspace',
  newMission: 'Nova missão',
  expandSidebar: 'Expandir barra lateral',
  collapseSidebar: 'Recolher barra lateral',
  openMenu: 'Abrir menu',
  closeTeamPanel: 'Fechar painel de equipa',
  openTeamPanel: 'Abrir painel de equipa',
  welcomeTour: 'Tour de boas-vindas',
  sectionTools: 'Ferramentas',
  sectionWorkflows: 'Fluxos',
  sectionClients: 'Clientes',
  sectionAnalytics: 'Analítica',
  sectionAudit: 'Auditoria',
  sectionUsage: 'Utilização',
  sectionTeam: 'Equipa',
  sectionSettings: 'Definições',
  sectionGenerate: 'Criar ferramenta',
  sectionImport: 'Importar',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Tarefas',
  sectionToday: 'O meu dia',
  sectionTimelog: 'Registo de tempo',
  sectionMissions: 'Missões',
  sectionProfile: 'O meu perfil',
  sectionDocs: 'Documentos',
  sectionSheets: 'Folhas de cálculo',
  sectionPdfs: 'PDFs',
  sectionContracts: 'Contratos',
  sectionPresentations: 'Apresentações',
  sectionNotebooks: 'Cadernos',
  sectionOffice: 'O meu Escritório',
  sectionHistory: 'Histórico',
  sectionInvoices: 'Faturas',
  sectionReceipts: 'Despesas',
  subHistory: 'Histórico',
  subRun: 'Executar',
  subSettings: 'Definições',
  subRecords: 'Registos',
  subChecklist: 'Checklist',
  subScoring: 'Pontuação',
  subEdit: 'Editar',
  subNew: 'Novo',
  bannerEarlyAccess: 'Acesso antecipado',
  bannerCta: 'Vagas limitadas · Junte-se agora e bloqueie o seu preço de lançamento',
}

const it: DashboardTranslations = {
  navToday: 'La mia giornata',
  navCopilot: 'Arkos',
  navBrain: 'Brain',
  navMail: 'Posta',
  navClients: 'Clienti',
  navLeads: 'Lead',
  navTasks: 'Attività',
  navTools: 'Strumenti',
  navWorkflows: 'Flussi',
  navOffice: 'Il mio Ufficio',
  navFiles: 'File',
  navMissions: 'Missioni',
  navFiscal: 'Calendario Fiscale',
  navInvoices: 'Fatture',
  navReceipts: 'Spese',
  navAnalytics: 'Analisi',
  navUsage: 'Utilizzo del piano',
  navAudit: 'Audit',
  navAdminOrg: 'Admin Org',
  navProfile: 'Il mio profilo',
  navSupport: 'Supporto',
  navSettings: 'Impostazioni',
  groupWork: 'Lavoro',
  groupContent: 'Contenuto',
  groupSystem: 'Sistema',
  descToday: 'Le tue attività in sospeso e l\'attività del team oggi',
  descCopilot: 'Il tuo consulente strategico — condividi i tuoi obiettivi e ti aiuta a pianificarli',
  descBrain: 'Interroga la memoria del workspace — documenti, obiettivi e decisioni',
  descMail: 'Posta in arrivo, inviati, bozze ed email dei clienti',
  descClients: 'Le aziende o persone a cui fornisci servizi',
  descLeads: 'Potenziali clienti catturati dal tuo modulo pubblico',
  descTasks: 'Attività del team con etichettatura collaborativa',
  descTools: 'Gli strumenti che hai installato o creato per la tua attività',
  descWorkflows: 'Collega più strumenti per automatizzare un processo completo',
  descOffice: 'Documenti, fogli di calcolo, PDF, contratti e presentazioni',
  descFiles: 'Archiviazione file del workspace con esportazione ZIP',
  descMissions: 'Obiettivi strategici e loro fasi di esecuzione',
  descFiscal: 'Calendario degli obblighi fiscali per la tua azienda',
  descInvoices: 'Crea e gestisci fatture per i tuoi clienti con PDF scaricabile',
  descReceipts: 'Scansiona scontrini e fatture con la fotocamera — l\'IA estrae i dati',
  descAnalytics: 'Attività, esecuzioni e costi del tuo workspace',
  descUsage: 'Quanto hai generato questo mese e quanto rimane del tuo piano',
  descAudit: 'Registro di chi ha fatto cosa e quando in questo workspace',
  descAdminOrg: 'Membri, piani e configurazione della tua organizzazione',
  descProfile: 'La tua foto del profilo e le preferenze personali',
  descSupport: 'Assistente di aiuto e contatto con il team MITIKUS',
  descSettings: 'Logo, colore del brand e nome del workspace',
  newMission: 'Nuova missione',
  expandSidebar: 'Espandi barra laterale',
  collapseSidebar: 'Comprimi barra laterale',
  openMenu: 'Apri menu',
  closeTeamPanel: 'Chiudi pannello team',
  openTeamPanel: 'Apri pannello team',
  welcomeTour: 'Tour di benvenuto',
  sectionTools: 'Strumenti',
  sectionWorkflows: 'Flussi',
  sectionClients: 'Clienti',
  sectionAnalytics: 'Analisi',
  sectionAudit: 'Audit',
  sectionUsage: 'Utilizzo',
  sectionTeam: 'Team',
  sectionSettings: 'Impostazioni',
  sectionGenerate: 'Crea strumento',
  sectionImport: 'Importa',
  sectionCopilot: 'Arkos',
  sectionBrain: 'Brain',
  sectionTasks: 'Attività',
  sectionToday: 'La mia giornata',
  sectionTimelog: 'Registro ore',
  sectionMissions: 'Missioni',
  sectionProfile: 'Il mio profilo',
  sectionDocs: 'Documenti',
  sectionSheets: 'Fogli di calcolo',
  sectionPdfs: 'PDF',
  sectionContracts: 'Contratti',
  sectionPresentations: 'Presentazioni',
  sectionNotebooks: 'Taccuini',
  sectionOffice: 'Il mio Ufficio',
  sectionHistory: 'Cronologia',
  sectionInvoices: 'Fatture',
  sectionReceipts: 'Spese',
  subHistory: 'Cronologia',
  subRun: 'Esegui',
  subSettings: 'Impostazioni',
  subRecords: 'Registrazioni',
  subChecklist: 'Checklist',
  subScoring: 'Punteggio',
  subEdit: 'Modifica',
  subNew: 'Nuovo',
  bannerEarlyAccess: 'Accesso anticipato',
  bannerCta: 'Posti limitati · Unisciti ora e blocca il tuo prezzo di lancio',
}

// Factory: spread en, apply overrides for key strings
const fromEn = (overrides: Partial<DashboardTranslations>): DashboardTranslations => ({ ...en, ...overrides })

const nl = fromEn({
  navToday: 'Mijn dag', navMail: 'E-mail', navClients: 'Klanten', navTasks: 'Taken',
  navTools: 'Tools', navWorkflows: 'Werkstromen', navOffice: 'Mijn kantoor', navFiles: 'Bestanden',
  navMissions: 'Missies', navFiscal: 'Belastingkalender', navInvoices: 'Facturen', navReceipts: 'Uitgaven',
  navAnalytics: 'Analytiek', navUsage: 'Plangebruik', navProfile: 'Mijn profiel', navSettings: 'Instellingen',
  groupWork: 'Werk', groupContent: 'Inhoud', groupSystem: 'Systeem',
  newMission: 'Nieuwe missie', expandSidebar: 'Zijbalk uitvouwen', collapseSidebar: 'Zijbalk inklappen',
  openMenu: 'Menu openen', closeTeamPanel: 'Teampaneel sluiten', openTeamPanel: 'Teampaneel openen',
  bannerEarlyAccess: 'Vroegtijdige toegang', bannerCta: 'Beperkte plaatsen · Meld u nu aan en blokkeer uw lanceringsprijs',
})

const pl = fromEn({
  navToday: 'Mój dzień', navMail: 'Poczta', navClients: 'Klienci', navTasks: 'Zadania',
  navTools: 'Narzędzia', navWorkflows: 'Przepływy', navOffice: 'Moje biuro', navFiles: 'Pliki',
  navMissions: 'Misje', navFiscal: 'Kalendarz podatkowy', navInvoices: 'Faktury', navReceipts: 'Wydatki',
  navAnalytics: 'Analityka', navUsage: 'Użycie planu', navProfile: 'Mój profil', navSettings: 'Ustawienia',
  groupWork: 'Praca', groupContent: 'Treść', groupSystem: 'System',
  newMission: 'Nowa misja', expandSidebar: 'Rozwiń pasek boczny', collapseSidebar: 'Zwiń pasek boczny',
  openMenu: 'Otwórz menu', closeTeamPanel: 'Zamknij panel zespołu', openTeamPanel: 'Otwórz panel zespołu',
  bannerEarlyAccess: 'Wczesny dostęp', bannerCta: 'Ograniczone miejsca · Dołącz teraz i zablokuj cenę startową',
})

const ro = fromEn({
  navToday: 'Ziua mea', navMail: 'E-mail', navClients: 'Clienți', navTasks: 'Sarcini',
  navTools: 'Instrumente', navWorkflows: 'Fluxuri', navOffice: 'Biroul meu', navFiles: 'Fișiere',
  navMissions: 'Misiuni', navFiscal: 'Calendar fiscal', navInvoices: 'Facturi', navReceipts: 'Cheltuieli',
  navAnalytics: 'Analiză', navUsage: 'Utilizare plan', navProfile: 'Profilul meu', navSettings: 'Setări',
  groupWork: 'Muncă', groupContent: 'Conținut', groupSystem: 'Sistem',
  newMission: 'Misiune nouă', expandSidebar: 'Extinde bara laterală', collapseSidebar: 'Restrânge bara laterală',
  openMenu: 'Deschide meniu', closeTeamPanel: 'Închide panoul echipei', openTeamPanel: 'Deschide panoul echipei',
  bannerEarlyAccess: 'Acces anticipat', bannerCta: 'Locuri limitate · Alăturați-vă acum și blocați prețul de lansare',
})

const sv = fromEn({
  navToday: 'Min dag', navMail: 'E-post', navClients: 'Kunder', navTasks: 'Uppgifter',
  navTools: 'Verktyg', navWorkflows: 'Arbetsflöden', navOffice: 'Mitt kontor', navFiles: 'Filer',
  navMissions: 'Uppdrag', navFiscal: 'Skattekalender', navInvoices: 'Fakturor', navReceipts: 'Utgifter',
  navAnalytics: 'Analys', navUsage: 'Plananvändning', navProfile: 'Min profil', navSettings: 'Inställningar',
  groupWork: 'Arbete', groupContent: 'Innehåll', groupSystem: 'System',
  newMission: 'Nytt uppdrag', expandSidebar: 'Expandera sidofält', collapseSidebar: 'Kollapsa sidofält',
  openMenu: 'Öppna meny', closeTeamPanel: 'Stäng teampanel', openTeamPanel: 'Öppna teampanel',
  bannerEarlyAccess: 'Tidig åtkomst', bannerCta: 'Begränsade platser · Gå med nu och lås ditt lanseringspris',
})

const da = fromEn({
  navToday: 'Min dag', navMail: 'E-mail', navClients: 'Kunder', navTasks: 'Opgaver',
  navTools: 'Værktøjer', navWorkflows: 'Arbejdsflows', navOffice: 'Mit kontor', navFiles: 'Filer',
  navMissions: 'Missioner', navFiscal: 'Skattekalender', navInvoices: 'Fakturaer', navReceipts: 'Udgifter',
  navAnalytics: 'Analyse', navUsage: 'Planbrug', navProfile: 'Min profil', navSettings: 'Indstillinger',
  groupWork: 'Arbejde', groupContent: 'Indhold', groupSystem: 'System',
  newMission: 'Ny mission', expandSidebar: 'Udvid sidebjælke', collapseSidebar: 'Skjul sidebjælke',
  openMenu: 'Åbn menu', closeTeamPanel: 'Luk teampanel', openTeamPanel: 'Åbn teampanel',
  bannerEarlyAccess: 'Tidlig adgang', bannerCta: 'Begrænsede pladser · Tilmeld dig nu og lås din lanceringspris',
})

const no = fromEn({
  navToday: 'Min dag', navMail: 'E-post', navClients: 'Kunder', navTasks: 'Oppgaver',
  navTools: 'Verktøy', navWorkflows: 'Arbeidsflyter', navOffice: 'Mitt kontor', navFiles: 'Filer',
  navMissions: 'Oppdrag', navFiscal: 'Skattekalender', navInvoices: 'Fakturaer', navReceipts: 'Utgifter',
  navAnalytics: 'Analyse', navUsage: 'Planbruk', navProfile: 'Min profil', navSettings: 'Innstillinger',
  groupWork: 'Arbeid', groupContent: 'Innhold', groupSystem: 'System',
  newMission: 'Nytt oppdrag', expandSidebar: 'Utvid sidefelt', collapseSidebar: 'Skjul sidefelt',
  openMenu: 'Åpne meny', closeTeamPanel: 'Lukk teampanel', openTeamPanel: 'Åpne teampanel',
  bannerEarlyAccess: 'Tidlig tilgang', bannerCta: 'Begrenset antall plasser · Bli med nå og lås startprisen',
})

const hu = fromEn({
  navToday: 'Az én napom', navMail: 'E-mail', navClients: 'Ügyfelek', navTasks: 'Feladatok',
  navTools: 'Eszközök', navWorkflows: 'Munkafolyamatok', navOffice: 'Irodám', navFiles: 'Fájlok',
  navMissions: 'Missziók', navFiscal: 'Adónaptár', navInvoices: 'Számlák', navReceipts: 'Kiadások',
  navAnalytics: 'Elemzés', navUsage: 'Tervhasználat', navProfile: 'Profilom', navSettings: 'Beállítások',
  groupWork: 'Munka', groupContent: 'Tartalom', groupSystem: 'Rendszer',
  newMission: 'Új misszió', expandSidebar: 'Oldalsáv kibontása', collapseSidebar: 'Oldalsáv összecsukása',
  openMenu: 'Menü megnyitása', closeTeamPanel: 'Csapat panel bezárása', openTeamPanel: 'Csapat panel megnyitása',
  bannerEarlyAccess: 'Korai hozzáférés', bannerCta: 'Korlátozott helyek · Csatlakozzon most és rögzítse az indítási árat',
})

const cs = fromEn({
  navToday: 'Můj den', navMail: 'E-mail', navClients: 'Klienti', navTasks: 'Úkoly',
  navTools: 'Nástroje', navWorkflows: 'Pracovní postupy', navOffice: 'Má kancelář', navFiles: 'Soubory',
  navMissions: 'Mise', navFiscal: 'Daňový kalendář', navInvoices: 'Faktury', navReceipts: 'Výdaje',
  navAnalytics: 'Analytika', navUsage: 'Využití plánu', navProfile: 'Můj profil', navSettings: 'Nastavení',
  groupWork: 'Práce', groupContent: 'Obsah', groupSystem: 'Systém',
  newMission: 'Nová mise', expandSidebar: 'Rozbalit postranní panel', collapseSidebar: 'Sbalit postranní panel',
  openMenu: 'Otevřít nabídku', closeTeamPanel: 'Zavřít panel týmu', openTeamPanel: 'Otevřít panel týmu',
  bannerEarlyAccess: 'Předčasný přístup', bannerCta: 'Omezený počet míst · Připojte se nyní a zajistěte si cenu při spuštění',
})

const sk = fromEn({
  navToday: 'Môj deň', navMail: 'E-mail', navClients: 'Klienti', navTasks: 'Úlohy',
  navTools: 'Nástroje', navWorkflows: 'Pracovné postupy', navOffice: 'Moja kancelária', navFiles: 'Súbory',
  navMissions: 'Misie', navFiscal: 'Daňový kalendár', navInvoices: 'Faktúry', navReceipts: 'Výdavky',
  navAnalytics: 'Analytika', navUsage: 'Využitie plánu', navProfile: 'Môj profil', navSettings: 'Nastavenia',
  groupWork: 'Práca', groupContent: 'Obsah', groupSystem: 'Systém',
  newMission: 'Nová misia', expandSidebar: 'Rozbaliť bočný panel', collapseSidebar: 'Zbaliť bočný panel',
  openMenu: 'Otvoriť ponuku', closeTeamPanel: 'Zatvoriť panel tímu', openTeamPanel: 'Otvoriť panel tímu',
  bannerEarlyAccess: 'Skorý prístup', bannerCta: 'Obmedzený počet miest · Pripojte sa teraz a zabezpečte si cenu pri spustení',
})

const el = fromEn({
  navToday: 'Η μέρα μου', navMail: 'E-mail', navClients: 'Πελάτες', navTasks: 'Εργασίες',
  navTools: 'Εργαλεία', navWorkflows: 'Ροές εργασίας', navOffice: 'Το γραφείο μου', navFiles: 'Αρχεία',
  navMissions: 'Αποστολές', navFiscal: 'Φορολογικό ημερολόγιο', navInvoices: 'Τιμολόγια', navReceipts: 'Έξοδα',
  navAnalytics: 'Αναλυτικά', navUsage: 'Χρήση πλάνου', navProfile: 'Το προφίλ μου', navSettings: 'Ρυθμίσεις',
  groupWork: 'Εργασία', groupContent: 'Περιεχόμενο', groupSystem: 'Σύστημα',
  newMission: 'Νέα αποστολή', expandSidebar: 'Ανάπτυξη πλαϊνής μπάρας', collapseSidebar: 'Σύμπτυξη πλαϊνής μπάρας',
  openMenu: 'Άνοιγμα μενού', closeTeamPanel: 'Κλείσιμο πίνακα ομάδας', openTeamPanel: 'Άνοιγμα πίνακα ομάδας',
  bannerEarlyAccess: 'Πρώιμη πρόσβαση', bannerCta: 'Περιορισμένες θέσεις · Εγγραφείτε τώρα και κλειδώστε την τιμή εκκίνησης',
})

const fi = fromEn({
  navToday: 'Päiväni', navMail: 'Sähköposti', navClients: 'Asiakkaat', navTasks: 'Tehtävät',
  navTools: 'Työkalut', navWorkflows: 'Työnkulut', navOffice: 'Toimistoni', navFiles: 'Tiedostot',
  navMissions: 'Tehtävät', navFiscal: 'Verokalenteri', navInvoices: 'Laskut', navReceipts: 'Kulut',
  navAnalytics: 'Analytiikka', navUsage: 'Suunnitelman käyttö', navProfile: 'Profiilini', navSettings: 'Asetukset',
  groupWork: 'Työ', groupContent: 'Sisältö', groupSystem: 'Järjestelmä',
  newMission: 'Uusi tehtävä', expandSidebar: 'Laajenna sivupalkki', collapseSidebar: 'Tiivistä sivupalkki',
  openMenu: 'Avaa valikko', closeTeamPanel: 'Sulje tiimipaneeli', openTeamPanel: 'Avaa tiimipaneeli',
  bannerEarlyAccess: 'Varhainen pääsy', bannerCta: 'Rajoitettu määrä paikkoja · Liity nyt ja lukitse julkaisuhinta',
})

const hr = fromEn({
  navToday: 'Moj dan', navMail: 'E-pošta', navClients: 'Klijenti', navTasks: 'Zadaci',
  navTools: 'Alati', navWorkflows: 'Tijekovi rada', navOffice: 'Moj ured', navFiles: 'Datoteke',
  navMissions: 'Misije', navFiscal: 'Porezni kalendar', navInvoices: 'Računi', navReceipts: 'Troškovi',
  navAnalytics: 'Analitika', navUsage: 'Korištenje plana', navProfile: 'Moj profil', navSettings: 'Postavke',
  groupWork: 'Rad', groupContent: 'Sadržaj', groupSystem: 'Sustav',
  newMission: 'Nova misija', expandSidebar: 'Proširi bočnu traku', collapseSidebar: 'Sažmi bočnu traku',
  openMenu: 'Otvori izbornik', closeTeamPanel: 'Zatvori panel tima', openTeamPanel: 'Otvori panel tima',
  bannerEarlyAccess: 'Rani pristup', bannerCta: 'Ograničena mjesta · Pridružite se sada i zaključajte svoju cijenu lansiranja',
})

const bg = fromEn({
  navToday: 'Моят ден', navMail: 'Поща', navClients: 'Клиенти', navTasks: 'Задачи',
  navTools: 'Инструменти', navWorkflows: 'Работни потоци', navOffice: 'Моят офис', navFiles: 'Файлове',
  navMissions: 'Мисии', navFiscal: 'Данъчен календар', navInvoices: 'Фактури', navReceipts: 'Разходи',
  navAnalytics: 'Анализи', navUsage: 'Използване на плана', navProfile: 'Моят профил', navSettings: 'Настройки',
  groupWork: 'Работа', groupContent: 'Съдържание', groupSystem: 'Система',
  newMission: 'Нова мисия', expandSidebar: 'Разгъни страничната лента', collapseSidebar: 'Свий страничната лента',
  openMenu: 'Отвори меню', closeTeamPanel: 'Затвори панела на екипа', openTeamPanel: 'Отвори панела на екипа',
  bannerEarlyAccess: 'Ранен достъп', bannerCta: 'Ограничени места · Присъединете се сега и заключете стартовата си цена',
})

const sl = fromEn({
  navToday: 'Moj dan', navMail: 'E-pošta', navClients: 'Stranke', navTasks: 'Naloge',
  navTools: 'Orodja', navWorkflows: 'Delovni tokovi', navOffice: 'Moja pisarna', navFiles: 'Datoteke',
  navMissions: 'Misije', navFiscal: 'Davčni koledar', navInvoices: 'Računi', navReceipts: 'Stroški',
  navAnalytics: 'Analitika', navUsage: 'Uporaba načrta', navProfile: 'Moj profil', navSettings: 'Nastavitve',
  groupWork: 'Delo', groupContent: 'Vsebina', groupSystem: 'Sistem',
  newMission: 'Nova misija', expandSidebar: 'Razširi stransko ploščo', collapseSidebar: 'Skrči stransko ploščo',
  openMenu: 'Odpri meni', closeTeamPanel: 'Zapri ploščo ekipe', openTeamPanel: 'Odpri ploščo ekipe',
  bannerEarlyAccess: 'Zgodnji dostop', bannerCta: 'Omejeno število mest · Pridružite se zdaj in si zagotovite ceno ob zagonu',
})

const ja = fromEn({
  navToday: '今日', navMail: 'メール', navClients: 'クライアント', navTasks: 'タスク',
  navTools: 'ツール', navWorkflows: 'ワークフロー', navOffice: 'マイオフィス', navFiles: 'ファイル',
  navMissions: 'ミッション', navFiscal: '税務カレンダー', navInvoices: '請求書', navReceipts: '経費',
  navAnalytics: '分析', navUsage: 'プラン利用状況', navProfile: 'プロフィール', navSettings: '設定',
  groupWork: '業務', groupContent: 'コンテンツ', groupSystem: 'システム',
  newMission: '新しいミッション', expandSidebar: 'サイドバーを展開', collapseSidebar: 'サイドバーを折りたたむ',
  openMenu: 'メニューを開く', closeTeamPanel: 'チームパネルを閉じる', openTeamPanel: 'チームパネルを開く',
  bannerEarlyAccess: 'アーリーアクセス', bannerCta: '限定枠 · 今すぐ参加してローンチ価格を確保',
})

const zh = fromEn({
  navToday: '我的今天', navMail: '邮件', navClients: '客户', navTasks: '任务',
  navTools: '工具', navWorkflows: '工作流', navOffice: '我的办公室', navFiles: '文件',
  navMissions: '任务目标', navFiscal: '税务日历', navInvoices: '发票', navReceipts: '费用',
  navAnalytics: '分析', navUsage: '计划使用情况', navProfile: '我的资料', navSettings: '设置',
  groupWork: '工作', groupContent: '内容', groupSystem: '系统',
  newMission: '新任务', expandSidebar: '展开侧边栏', collapseSidebar: '收起侧边栏',
  openMenu: '打开菜单', closeTeamPanel: '关闭团队面板', openTeamPanel: '打开团队面板',
  bannerEarlyAccess: '早期访问', bannerCta: '名额有限 · 立即加入并锁定发布价格',
})

const translations: Record<Locale, DashboardTranslations> = {
  en, es, fr, de, pt, it, nl, pl, ro, sv, da, no, hu, cs, sk, el, fi, hr, bg, sl, ja, zh,
}

export function getDashboardTranslations(locale: Locale): DashboardTranslations {
  return translations[locale] ?? en
}
