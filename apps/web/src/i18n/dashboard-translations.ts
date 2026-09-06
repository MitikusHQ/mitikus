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
  // Today page
  todayGreetingMorning: string
  todayGreetingAfternoon: string
  todayGreetingEvening: string
  todayFallbackName: string
  todayArkosStepTitle: string
  todayArkosStepDescription: string
  todayClientStepTitle: string
  todayClientStepDescription: string
  todayTaskStepTitle: string
  todayTaskStepDescription: string
  todayInvoiceStepTitle: string
  todayInvoiceStepDescription: string
  todayFiscalStepTitle: string
  todayFiscalStepDescription: string
  todayTimeTracking: string
  todayViewHistory: string
  todayMyTasks: string
  todayViewAll: string
  todayAllCaughtUpTitle: string
  todayAllCaughtUpDescription: string
  todayAskArkosMission: string
  todayPendingSteps: string
  todayGoToStep: string
  todayWorkflows: string
  todayPending: string
  todayOpenWorkflow: string
  todayTeamActivity: string
  todayStatusQueued: string
  todayStatusRunning: string
  todayStatusCompleted: string
  todayStatusFailed: string
  todayStatusCancelled: string
  todayClockNotStarted: string
  todayClockElapsedPrefix: string
  todayClockInLabel: string
  todayClockCompleted: string
  todayClockInAction: string
  todayClockOutAction: string
  todayClockWorking: string
  todayClockInError: string
  todayClockOutError: string
  todayContractsPending: string
  todayContractDraft: string
  todayContractSent: string
  todayInvoicesPendingCollection: string
  todayInvoiceUnpaidSingular: string
  todayInvoiceUnpaidPlural: string
  todayFiscal: string
  todayFiscalSetupTitle: string
  todayFiscalSetupDescription: string
  todayConfigure: string
  todayUpcomingFiscal: string
  todayViewCalendar: string
  todayToday: string
  todayCalculate: string
  todayRecentNotebooks: string
  todaySourceSingular: string
  todaySourcePlural: string
  todayFirstSteps: string
  todayCompletedProgress: string
  // Tools page
  toolsInstalledTitle: string
  toolsInstalledDescription: string
  toolsGenerate: string
  toolsAdd: string
  toolsActive: string
  toolsOpen: string
  toolsCategoryAudit: string
  toolsCategoryEvaluation: string
  toolsCategoryChecklist: string
  toolsCategoryCrm: string
  toolsCategoryReport: string
  toolsCategoryHr: string
  toolsCategoryOperations: string
  toolsCategoryFinance: string
  toolsCategoryCustom: string
  toolsEmptyTitle: string
  toolsEmptyDescription: string
  toolsInstalling: string
  toolsViewCatalog: string
  toolsShortcutItAudit: string
  toolsShortcutItAuditDescription: string
  toolsShortcutGdprAudit: string
  toolsShortcutGdprAuditDescription: string
  toolsShortcutDigitalMaturity: string
  toolsShortcutDigitalMaturityDescription: string
  toolsShortcutPopular: string
  toolInvalidSchema: string
  toolNewEntry: string
  toolAiIdeas: string
  toolImportCsv: string
  toolNoRecords: string
  toolType: string
  toolDate: string
  toolActions: string
  toolForm: string
  toolApprovalPending: string
  toolApprovalApproved: string
  toolApprovalRejected: string
  toolApprovalOnHold: string
  toolRecordSingular: string
  toolRecordPlural: string
  toolDelete: string
  toolDeleting: string
  toolDeleteConfirm: string
  toolNavRecords: string
  toolNavRunAi: string
  toolNavAiHistory: string
  toolNavSettings: string
  toolNavAria: string
  toolReplay: string
  toolInputVariables: string
  toolInputDescription: string
  toolContextFilled: string
  toolSelectOption: string
  toolYes: string
  toolNoVariables: string
  toolRun: string
  toolGenerating: string
  toolResult: string
  toolResultDescription: string
  toolLoadingDescription: string
  toolExecutionErrorTitle: string
  toolUnknownError: string
  toolConnectionError: string
  toolMetaModel: string
  toolMetaTokens: string
  toolMetaCost: string
  toolMetaTime: string
  toolMissionUpdateError: string
  toolSaveSocialTitle: string
  toolSaveSocialDescription: string
  toolDraftSaved: string
  toolSaving: string
  toolSaved: string
  toolSaveDraft: string
  toolViewPosts: string
  toolMissionStepGenerated: string
  toolMissionStepGeneratedDescription: string
  toolUpdatingMission: string
  toolBackToMissionDone: string
  toolContinueWith: string
  toolUse: string
  toolNewExecution: string
  toolBackWithoutDone: string
  toolHistoryTitle: string
  toolNoExecutionsYet: string
  toolHistoryEmptyTitle: string
  toolHistoryEmptyDescription: string
  toolRunNow: string
  toolDuration: string
  toolRerunTitle: string
  toolRerun: string
  toolExecutionSingular: string
  toolExecutionPlural: string
  toolNoResult: string
  toolVariablesUsed: string
  toolTelemetry: string
  toolProvider: string
  toolInputTokens: string
  toolOutputTokens: string
  toolTotalTokens: string
  toolEstimatedCost: string
  toolRerunWithData: string
  toolCleanExecution: string
  toolImportRecordsTitle: string
  toolImportRecordsDescription: string
  toolCsvEmptyError: string
  toolCsvOnlyError: string
  toolImportUnexpectedError: string
  toolCsvTemplateFilename: string
  toolCsvDrop: string
  toolCsvOnlyUtf8: string
  toolDownloadCsvTemplate: string
  toolColumnMapping: string
  toolRequired: string
  toolMissingRequiredColumns: string
  toolMissingRequiredColumnsSuffix: string
  toolPreview: string
  toolPreviewFirstRows: string
  toolPreviewRows: string
  toolImporting: string
  toolImportRecords: string
  toolChangeFile: string
  toolImportedSingular: string
  toolImportedPlural: string
  toolSkippedSingular: string
  toolSkippedPlural: string
  toolSkippedReason: string
  toolViewRecords: string
  toolApprovalRequest: string
  toolApprovalRequestDate: string
  toolApprovalHistory: string
  toolApprovalDecision: string
  toolApprovalReason: string
  toolApprovalReasonRequired: string
  toolApprovalReasonPlaceholder: string
  toolApprovalCommentOptional: string
  toolApprovalCommentPlaceholder: string
  toolApprovalMissingReason: string
  toolApprovalSaving: string
  toolApprovalApproveAction: string
  toolApprovalRejectAction: string
  toolApprovalHoldAction: string
  toolApprovalConfirmReject: string
  toolSettingsTitle: string
  toolSettingsDescription: string
  toolSettingsLinkedClient: string
  toolSettingsLinkedClientDescription: string
  toolSettingsNoClient: string
  toolSettingsSave: string
  toolSettingsNoClientsYet: string
  toolSettingsCreateClient: string
  toolSettingsAiModel: string
  toolSettingsAiModelDescription: string
  toolSettingsProvider: string
  toolSettingsModel: string
  toolSettingsCreativity: string
  toolSettingsCreativityDescription: string
  toolSettingsTemperature: string
  toolSettingsTemperatureHint: string
  toolSettingsModelDefault: string
  toolSettingsTopPHint: string
  toolSettingsOutput: string
  toolSettingsOutputDescription: string
  toolSettingsResponseLanguage: string
  toolSettingsResponseFormat: string
  toolSettingsMaxOutputTokens: string
  toolSettingsMaxOutputTokensHint: string
  toolSettingsMaxModel: string
  toolSettingsCustomInstructions: string
  toolSettingsCustomInstructionsDescription: string
  toolSettingsAdditionalInstructions: string
  toolSettingsAdditionalInstructionsHint: string
  toolSettingsAdditionalInstructionsPlaceholder: string
  toolSettingsSystemPromptOverride: string
  toolSettingsSystemPromptOverrideHint: string
  toolSettingsSystemPromptOverridePlaceholder: string
  toolSettingsChangesNextRun: string
  toolSettingsSaved: string
  toolSettingsSaveConfig: string
  toolStatusPending: string
  toolStatusRunning: string
  toolStatusCompleted: string
  toolStatusFailed: string
  toolStatusCancelled: string
  toolSelectPlaceholder: string
  toolFieldRequiredErrorPrefix: string
  toolFieldRequiredErrorSuffix: string
  toolItemRequiredErrorPrefix: string
  toolItemRequiredErrorSuffix: string
  toolChecklistCompleted: string
  toolChecklistRequired: string
  toolChecklistUpdate: string
  toolChecklistSave: string
  toolScoringTotal: string
  toolScoringPassingMinimum: string
  toolScoringUpdate: string
  toolScoringSave: string
  toolEditRecord: string
  toolNewChecklist: string
  toolEditChecklist: string
  toolNewScoring: string
  toolEditScoring: string
  toolNewApprovalRequest: string
  toolSubmitApprovalRequest: string
  toolNoApprovalPermission: string
  toolAutoApproveBelowPrefix: string
  toolAutoApproveBelowSuffix: string
  toolApprovalWillRemainPending: string
  // Missions page
  missionsTitle: string
  missionsDescription: string
  missionsNewWithArkos: string
  missionsFilterAll: string
  missionsFilterActive: string
  missionsFilterCompleted: string
  missionsFilterPaused: string
  missionsFilterCancelled: string
  missionsStatusActive: string
  missionsStatusCompleted: string
  missionsStatusPaused: string
  missionsStatusCancelled: string
  missionsPriorityCritical: string
  missionsPriorityHigh: string
  missionsPriorityMedium: string
  missionsPriorityLow: string
  missionsEmptyAllTitle: string
  missionsEmptyFilteredTitle: string
  missionsEmptyDescription: string
  missionsCreateFirstWithArkos: string
  missionsStepSingular: string
  missionsStepPlural: string
  missionsTaskSingular: string
  missionsTaskPlural: string
  missionsDuePrefix: string
  missionsCompletedPrefix: string
  missionStatusPausedAlt: string
  missionStateNew: string
  missionStateReady: string
  missionStateInProgress: string
  missionStateWaitingUser: string
  missionStateWaitingAi: string
  missionStateBlocked: string
  missionStateCompleted: string
  missionStateArchived: string
  missionStepStatusPending: string
  missionStepStatusInProgress: string
  missionStepStatusCompleted: string
  missionStepStatusSkipped: string
  missionStepStatusBlocked: string
  missionActorUser: string
  missionActorAi: string
  missionActorShared: string
  missionDueDate: string
  missionProgressTitle: string
  missionCompletedSteps: string
  missionPendingStepsMetric: string
  missionRemainingTime: string
  missionCompletedValue: string
  missionExpectedImpact: string
  missionImpactCritical: string
  missionImpactHigh: string
  missionImpactMedium: string
  missionNextAction: string
  missionOpenTool: string
  missionWhyTitle: string
  missionDefaultWhyHigh: string
  missionDefaultWhyNormal: string
  missionDefaultBenefitHigh: string
  missionDefaultBenefitMedium: string
  missionDefaultBenefitLow: string
  missionUnlocks: string
  missionDepartmentsAffected: string
  missionImpactTitle: string
  missionImpact: string
  missionUrgency: string
  missionEffort: string
  missionHighRisk: string
  missionTimeline: string
  missionStepsTitle: string
  missionLinkedWorkflow: string
  missionLinkedWorkflowTitle: string
  missionLinkedWorkflowDescription: string
  missionOpenWorkflow: string
  missionNeedHelp: string
  missionNeedHelpDescription: string
  missionOpenArkos: string
  missionResponsibleTitle: string
  missionInstallTool: string
  missionNoStepsTitle: string
  missionNoStepsDescription: string
  missionDefineStepsWithArkos: string
  missionMarkPendingTitle: string
  missionUndoCompletedLabel: string
  missionRecoverStepTitle: string
  missionRecoverSkippedLabel: string
  missionStartStep: string
  missionCompleteStep: string
  missionSkipStepTitle: string
  missionSkipStepLabel: string
  missionAiNextRecommendations: string
  missionAiSuggestion: string
  missionAiThinking: string
  missionAiRegenerate: string
  missionAiRequest: string
  missionAiError: string
  missionAiGeneratingNext: string
  missionAiAskHelp: string
  // Clients page
  clientsTitle: string
  clientsDescription: string
  clientsNew: string
  clientsEmptyTitle: string
  clientsEmptyDescription: string
  clientsAdd: string
  clientsTypeClient: string
  clientsTypeCompany: string
  clientsTypeFreelancer: string
  clientsTypeIndividual: string
  clientsTypePatient: string
  clientsTypeStudent: string
  clientsTypeAthlete: string
  clientsTypeEvent: string
  clientsContactPrefix: string
  clientsViewDossier: string
  clientsEdit: string
  clientsEditTitle: string
  clientsTypeLabel: string
  clientsTypeClientNameLabel: string
  clientsTypeClientNamePlaceholder: string
  clientsTypeClientContactLabel: string
  clientsTypeClientContactPlaceholder: string
  clientsTypeCompanyNameLabel: string
  clientsTypeCompanyNamePlaceholder: string
  clientsTypeCompanyContactPlaceholder: string
  clientsTypeFreelancerNameLabel: string
  clientsTypeFreelancerNamePlaceholder: string
  clientsTypeFreelancerContactPlaceholder: string
  clientsTypeIndividualNameLabel: string
  clientsTypeIndividualNamePlaceholder: string
  clientsTypeIndividualContactLabel: string
  clientsTypeIndividualContactPlaceholder: string
  clientsTypePatientNameLabel: string
  clientsTypePatientNamePlaceholder: string
  clientsTypePatientContactLabel: string
  clientsTypePatientContactPlaceholder: string
  clientsTypeStudentNameLabel: string
  clientsTypeStudentNamePlaceholder: string
  clientsTypeStudentContactLabel: string
  clientsTypeStudentContactPlaceholder: string
  clientsTypeAthleteNameLabel: string
  clientsTypeAthleteNamePlaceholder: string
  clientsTypeAthleteContactLabel: string
  clientsTypeAthleteContactPlaceholder: string
  clientsTypeEventNameLabel: string
  clientsTypeEventNamePlaceholder: string
  clientsTypeEventContactPlaceholder: string
  clientsContactHelp: string
  clientsPhone: string
  clientsFiscalDataTitle: string
  clientsFiscalDataDescription: string
  clientsCountry: string
  clientsDefaultCountry: string
  clientsFiscalAddress: string
  clientsFiscalAddressPlaceholder: string
  clientsPostalCode: string
  clientsCity: string
  clientsProvince: string
  clientsSector: string
  clientsSectorPlaceholder: string
  clientsNotes: string
  clientsNotesPlaceholder: string
  clientsSaving: string
  clientsCreating: string
  clientsSaveChanges: string
  clientsArchive: string
  clientsArchiving: string
  clientsArchiveConfirm: string
  clientsSince: string
  clientsSendEmail: string
  clientsFiscalDataShort: string
  clientsClientCompany: string
  clientsPostalCityProvince: string
  clientsTools: string
  clientsExecutions: string
  clientsAiCost: string
  clientsFiles: string
  clientsLinkTool: string
  clientsNoLinkedTools: string
  clientsGoToTools: string
  clientsExecutionSingular: string
  clientsExecutionPlural: string
  clientsLastPrefix: string
  clientsRun: string
  clientsHistory: string
  clientsRecentExecutions: string
  clientsDate: string
  clientsTool: string
  clientsStatus: string
  clientsCost: string
  clientsUser: string
  clientsView: string
  clientsFilesDescription: string
  clientsUploadFile: string
  clientsUploading: string
  clientsUploadFolderLabel: string
  clientsNoFolder: string
  clientsNewFolder: string
  clientsNewFolderPlaceholder: string
  clientsCreate: string
  clientsFileTypeDoc: string
  clientsFileTypeSheet: string
  clientsFileTypePdf: string
  clientsFileTypeImage: string
  clientsFileTypeOther: string
  clientsFileUploadGenericError: string
  clientsFileUploadError: string
  clientsFolderCreateError: string
  clientsNoFiles: string
  clientsDropFilesHelp: string
  clientsFolderPrefix: string
  clientsDownload: string
  clientsPortalCopied: string
  clientsPortal: string
  // Leads page
  leadsTitle: string
  leadsSubtitle: string
  leadsNoLeads: string
  leadsNoLeadsHelp: string
  leadsName: string
  leadsStatus: string
  leadsCompany: string
  leadsDate: string
  leadsPhone: string
  leadsMessage: string
  leadsInternalNotes: string
  leadsSaveNotes: string
  leadsSaving: string
  leadsNotesPlaceholder: string
  leadsConvert: string
  leadsConverted: string
  leadsDelete: string
  leadsStatusNew: string
  leadsStatusContacted: string
  leadsStatusQualified: string
  leadsStatusLost: string
  leadsConvertConfirmPrefix: string
  leadsConvertConfirmSuffix: string
  leadsDeleteConfirmPrefix: string
  leadsDeleteConfirmSuffix: string
  // History page
  historyTitle: string
  historySubtitle: string
  historyExecutions: string
  historyCompleted: string
  historyAiCost: string
  historyEmpty: string
  historyEmptyDescription: string
  historyGoToTools: string
  historyDate: string
  historyTool: string
  historyStatus: string
  historyTokens: string
  historyCost: string
  historyDuration: string
  historyUser: string
  historyActions: string
  historyRerun: string
  historyView: string
  historyRetry: string
  historyFooterSingular: string
  historyFooterPlural: string
  historyFooterCostLabel: string
  historyRerunTitle: string
  // Analytics page
  analyticsTitle: string
  analyticsSubtitle: string
  analyticsAiCost: string
  analyticsTokens: string
  analyticsExecutions: string
  analyticsSuccessRate: string
  analyticsAvgTime: string
  analyticsAvgCost: string
  analyticsTotalExecsMicro: string
  analyticsTokensSumMicro: string
  analyticsWorkflowsMicroPrefix: string
  analyticsWorkflowsMicroSuffix: string
  analyticsSuccessRateMicro: string
  analyticsAvgTimeMicro: string
  analyticsAvgCostMicro: string
  analyticsCostByDayTitle: string
  analyticsCostByMonthTitle: string
  analyticsExecutionStatus: string
  analyticsTopTools: string
  analyticsProviderBreakdown: string
  analyticsAiModels: string
  analyticsWorkflowsExecuted: string
  analyticsExecutionsByDayTitle: string
  analyticsExecutionsByMonthTitle: string
  analyticsUserActivity: string
  analyticsAccessRestricted: string
  analyticsAdminOnly: string
  analyticsTotalLabel: string
  analyticsExecsSuffix: string
  analyticsEmptyTools: string
  analyticsEmptyModels: string
  analyticsEmptyWorkflows: string
  analyticsEmptyUsers: string
  analyticsFailRateLabel: string
  analyticsExecUnitShort: string
  // Office page
  officeTitle: string
  officeSubtitle: string
  officeDocumentsSection: string
  officeFiscalSection: string
  officeQuarterly: string
  officeAnnual: string
  officeSeeCalendar: string
  officeToolDocs: string
  officeToolDocsSubtitle: string
  officeToolContracts: string
  officeToolContractsSubtitle: string
  officeToolInvoices: string
  officeToolInvoicesSubtitle: string
  officeToolSheets: string
  officeToolSheetsSubtitle: string
  officeToolPdfs: string
  officeToolPdfsSubtitle: string
  officeToolPresentations: string
  officeToolPresentationsSubtitle: string
  officeToolNotebooks: string
  officeToolNotebooksSubtitle: string
  officeToolReceipts: string
  officeToolReceiptsSubtitle: string
  officeToolFiles: string
  officeToolFilesSubtitle: string
  // Audit page
  auditTitle: string
  auditSubtitlePrefix: string
  auditSubtitleSuffix: string
  auditExportCsv: string
  auditFiltersLabel: string
  auditTotalEvents: string
  auditErrors: string
  auditDenied: string
  auditEventsLabel: string
  auditPageLabel: string
  auditPageOf: string
  auditPrev: string
  auditNext: string
  auditAccessRestricted: string
  auditAdminOnly: string
  // Workflows page
  workflowsTitle: string
  workflowsSubtitle: string
  workflowsNew: string
  workflowsHowItWorksTitle: string
  workflowsStep1Title: string
  workflowsStep1Description: string
  workflowsStep2Title: string
  workflowsStep2Description: string
  workflowsStep3Title: string
  workflowsStep3Description: string
  workflowsTemplatesTitle: string
  workflowsTemplatesSubtitle: string
  workflowsMyWorkflows: string
  workflowsEmptyPrefix: string
  workflowsEmptySuffix: string
  workflowsCreateFromScratch: string
  workflowsSteps: string
  workflowsExecutions: string
  workflowsLastRun: string
  workflowsActiveTitle: string
  workflowsInactiveTitle: string
  // Home/workspace page
  homePanelSubtitle: string
  homeMissionsTitle: string
  homeCreateMission: string
  homeActiveSingular: string
  homeActivePlural: string
  homeBlockedSingular: string
  homeBlockedPlural: string
  homeOverdueSingular: string
  homeOverduePlural: string
  homeDueSoonSingularSuffix: string
  homeDueSoonPluralSuffix: string
  homeUnblockSingle: string
  homeUnblockMultiPrefix: string
  homeUnblockMultiSuffix: string
  homeResolveBlocker: string
  homeNoMissions: string
  homeNoMissionsDesc: string
  homeDefineWithArkos: string
  homePriorityCritical: string
  homePriorityHigh: string
  homePriorityMedium: string
  homePriorityLow: string
  homeDueOverdue: string
  homeDueSoonPrefix: string
  homeDueSoonSuffix: string
  homeFocusLabel: string
  homeNowLabel: string
  homeWhyFirstLabel: string
  homeWillUnlock: string
  homeTimeLabel: string
  homeStepsProgressSingular: string
  homeStepsProgressPlural: string
  homeContinueMission: string
  homeNowColon: string
  // TrialBanner
  trialUrgentPrefix: string
  trialDaySingular: string
  trialDayPlural: string
  trialUrgentSuffix: string
  trialNormalPrefix: string
  trialNormalSingularSuffix: string
  trialNormalPluralSuffix: string
  trialActivate: string
  // LastExecutionWidget
  lastExecEmpty: string
  lastExecSeeTools: string
  lastExecLabel: string
  lastExecDaysAgoPrefix: string
  lastExecDaysAgoSuffix: string
  lastExecHoursAgoPrefix: string
  lastExecHoursAgoSuffix: string
  lastExecJustNow: string
  lastExecRerun: string
  // MissionTemplateModal
  templateFromTemplate: string
  templateModalTitle: string
  templateModalSubtitle: string
  templateSteps: string
  templateBackToList: string
  templateIncludedStepsPrefix: string
  templateActorAI: string
  templateActorShared: string
  templateActorUser: string
  templateMinutes: string
  templateError: string
  templateBack: string
  templateCreating: string
  templateCreate: string
  // GlobalSearch
  searchLabel: string
  searchGlobalLabel: string
  searchPlaceholder: string
  searchFilters: string
  searchClearFilters: string
  searchTypeDoc: string
  searchTypePdf: string
  searchTypeContract: string
  searchTypeNotebook: string
  searchTypeSheet: string
  searchTypePresentation: string
  searchTypeTask: string
  searchTypeMission: string
  searchTypeClient: string
  searchTypeTool: string
  searchCreatedBetween: string
  searchModifiedBetween: string
  searchClearDates: string
  searchNoResults: string
  searchNoResultsHint: string
  searchMinChars: string
  searchMinCharsFilters: string
  searchCreated: string
  searchModified: string
  searchNav: string
  searchOpen: string
  searchClose: string
  searchResultsSuffix: string
  searchRelativeToday: string
  searchRelativeYesterday: string
  searchRelativeDaysAgo: string
  searchRelativeWeeks: string
  searchRelativeMonths: string
  // TaskList
  tasksTitle: string
  tasksNew: string
  tasksFilterAll: string
  tasksFilterPending: string
  tasksFilterInProgress: string
  tasksFilterDone: string
  tasksFilterMine: string
  tasksEmpty: string
  tasksCreateFirst: string
  tasksPendingSingular: string
  tasksPendingPlural: string
  tasksTotal: string
  // Analytics
  analyticsEmpty: string
  analyticsEmptyHint: string
  analyticsNoExecutions: string
  analyticsCompleted: string
  analyticsFailed: string
  analyticsCancelled: string
  analyticsRunning: string
  analyticsPending: string
  // Invoices
  invoicesTitle: string
  invoicesSubtitle: string
  invoicesStatMonth: string
  invoicesStatPending: string
  invoicesStatPaid: string
  invoicesNew: string
  invoicesEmpty: string
  invoicesCreateFirst: string
  invoicesNoClient: string
  invoicesDue: string
  invoicesSelectHint: string
  invoicesStatusDraft: string
  invoicesStatusSent: string
  invoicesStatusPaid: string
  invoicesStatusOverdue: string
  invoicesStatusCancelled: string
  invoicesSend: string
  invoicesReviewReplies: string
  invoicesReviewingReplies: string
  invoicesView: string
  invoicesEdit: string
  invoicesCreateRect: string
  invoicesDelete: string
  invoicesColDesc: string
  invoicesColQty: string
  invoicesColUnit: string
  invoicesColTotal: string
  invoicesSubtotal: string
  invoicesVAT: string
  invoicesTotal: string
  invoicesChangeStatus: string
  invoicesEmails: string
  invoicesEmailInbound: string
  invoicesEmailSent: string
  invoicesRectTitle: string
  invoicesRectDesc: string
  invoicesRectReason: string
  invoicesRectPlaceholder: string
  invoicesRectCancel: string
  invoicesRectCreate: string
  invoicesRectCreating: string
  invoicesRectError: string
  invoicesRectReasonRequired: string
  invoicesSendTitle: string
  invoicesSendRecipient: string
  invoicesSendRecipientPlaceholder: string
  invoicesSendEmail: string
  invoicesSendNote: string
  invoicesSendClose: string
  invoicesSendCancel: string
  invoicesSendButton: string
  invoicesSending: string
  invoicesSentOk: string
  invoicesSendError: string
  invoicesSendErrorSettings: string
  invoicesNoReplies: string
  invoicesRepliesError: string
  invoicesDeleteConfirm: string
  invoicesSuffix: string
  // Workspace settings page
  wsSettingsTitle: string
  wsSettingsSubtitle: string
  // Workspace settings client
  wsLogoSection: string
  wsLogoDesc: string
  wsLogoShowName: string
  wsLogoNameAdjust: string
  wsLogoHorizontal: string
  wsLogoVertical: string
  wsLogoSize: string
  wsLogoFontColor: string
  wsLogoFont: string
  wsEmailSection: string
  wsEmailDesc: string
  wsEmailMitikusLabel: string
  wsEmailMitikusDesc: string
  wsEmailSmtpLabel: string
  wsEmailSmtpDesc: string
  wsEmailGmailLabel: string
  wsEmailGmailDesc: string
  wsEmailOutlookLabel: string
  wsEmailOutlookDesc: string
  wsEmailGmailHelp: string
  wsEmailOutlookHelp: string
  wsEmailCustomHelp: string
  wsEmailMitikusHelp: string
  wsSenderName: string
  wsSenderNamePlaceholder: string
  wsReplyTo: string
  wsReplyToPlaceholder: string
  wsSignature: string
  wsSignaturePlaceholder: string
  wsSmtpTitle: string
  wsSmtpServer: string
  wsSmtpPort: string
  wsSmtpUser: string
  wsSmtpPassword: string
  wsSmtpPasswordPlaceholder: string
  wsSmtpTls: string
  wsImapTitle: string
  wsImapServer: string
  wsImapPort: string
  wsImapUser: string
  wsImapPassword: string
  wsImapPasswordPlaceholder: string
  wsImapTls: string
  wsImapNote: string
  wsEmailConnectionOk: string
  wsEmailTest: string
  wsEmailTesting: string
  wsEmailTestOk: string
  wsEmailSave: string
  wsEmailSaving: string
  wsEmailSaved: string
  wsEmailSaveError: string
  wsEmailTestError: string
  wsNameSection: string
  wsNameDesc: string
  wsBrandColorSection: string
  wsBrandColorDesc: string
  wsBrandColorPreview: string
  wsBrandColorCustom: string
  wsPermSection: string
  wsPermDesc: string
  wsPermOnlyAdmins: string
  wsPermOnlyAdminsActive: string
  wsPermOnlyAdminsInactive: string
  wsPermOwnerOnly: string
  wsPermSaved: string
  wsSave: string
  wsSaving: string
  wsSaved: string
  // Receipts page
  receiptsOffice: string
  receiptsTitle: string
  receiptsSubtitle: string
  // ReceiptsClient
  receiptsStatusPending: string
  receiptsStatusReviewed: string
  receiptsStatusAccounted: string
  receiptsTotalMonth: string
  receiptsPendingReview: string
  receiptsCount: string
  receiptsScan: string
  receiptsEmpty: string
  receiptsEmptyHint: string
  receiptsScanNow: string
  receiptsNoVendor: string
  receiptsDetail: string
  receiptsDelete: string
  receiptsSelectHint: string
  receiptsVendor: string
  receiptsDate: string
  receiptsTotal: string
  receiptsTaxBase: string
  receiptsTax: string
  receiptsCategory: string
  receiptsNotes: string
  receiptsStatus: string
  receiptsLines: string
  // Usage page
  usageTitle: string
  usagePlanSection: string
  usagePlanTrialing: string
  usagePlanActive: string
  usagePlanBlocked: string
  usageAISection: string
  usageAIGenerations: string
  usageTools: string
  usageBrain: string
  usageUnlimited: string
  usageGenPerMonth: string
  usageBrainPerMonth: string
  usageToolsLabel: string
  usageUsers: string
  usageWorkspaces: string
  usageReuseSection: string
  usageCatalogSearches: string
  usageToolsReused: string
  usageGenerations: string
  usageReuseRate: string
  usageReuseRateDesc: string
  usageStorageSection: string
  usageStorageLabel: string
  usageStorageFiles: string
  usageManageFiles: string
  usageActivitySection: string
  usageContracts: string
  usageInvoices: string
  usageTotalInvoiced: string
  usageViewContracts: string
  usageViewInvoices: string
  usageUpgradeCta: string
  usageUpgradeDesc: string
  usageViewPlans: string
  usageTodaySection: string
  usageInputTokens: string
  usageOutputTokens: string
  usageTotalTokens: string
  usageEstimatedCost: string
  usageDailyLimits: string
  usageLimitUser: string
  usageLimitWorkspace: string
  usageLimitSystem: string
  usageLimitCost: string
  usageLimitsReset: string
  usageRemainingText: string
  usageDailyRunsToday: string
  usageDailyRunsMonth: string
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
  todayGreetingMorning: 'Good morning',
  todayGreetingAfternoon: 'Good afternoon',
  todayGreetingEvening: 'Good evening',
  todayFallbackName: 'team',
  todayArkosStepTitle: 'Describe your business to Arkos',
  todayArkosStepDescription: 'Tell it what your company does so it can help you plan.',
  todayClientStepTitle: 'Add your first client',
  todayClientStepDescription: 'Register the company or person you serve.',
  todayTaskStepTitle: 'Create your first task',
  todayTaskStepDescription: 'Organize pending work with labels and priorities.',
  todayInvoiceStepTitle: 'Issue your first invoice',
  todayInvoiceStepDescription: 'Generate a PDF ready to send to your client.',
  todayFiscalStepTitle: 'Enable the tax calendar',
  todayFiscalStepDescription: 'Configure your legal form to see your tax obligations.',
  todayTimeTracking: 'Time tracking',
  todayViewHistory: 'View history',
  todayMyTasks: 'My tasks',
  todayViewAll: 'View all',
  todayAllCaughtUpTitle: 'Everything is up to date. Nice work.',
  todayAllCaughtUpDescription: 'You have no pending steps or workflows.',
  todayAskArkosMission: 'Ask Arkos for a new mission',
  todayPendingSteps: 'My pending steps',
  todayGoToStep: 'Go to step',
  todayWorkflows: 'Workflows',
  todayPending: 'Pending',
  todayOpenWorkflow: 'Open workflow',
  todayTeamActivity: 'Team activity today',
  todayStatusQueued: 'Queued',
  todayStatusRunning: 'Running',
  todayStatusCompleted: 'Completed',
  todayStatusFailed: 'Failed',
  todayStatusCancelled: 'Cancelled',
  todayClockNotStarted: 'Not clocked in',
  todayClockElapsedPrefix: 'You have been working',
  todayClockInLabel: 'Clock-in',
  todayClockCompleted: 'Workday completed',
  todayClockInAction: 'Clock in',
  todayClockOutAction: 'Clock out',
  todayClockWorking: 'Clocking...',
  todayClockInError: 'Could not register clock-in. Try again.',
  todayClockOutError: 'Could not register clock-out. Try again.',
  todayContractsPending: 'Pending contracts',
  todayContractDraft: 'Draft',
  todayContractSent: 'Sent',
  todayInvoicesPendingCollection: 'Invoices pending collection',
  todayInvoiceUnpaidSingular: 'unpaid invoice',
  todayInvoiceUnpaidPlural: 'unpaid invoices',
  todayFiscal: 'Tax',
  todayFiscalSetupTitle: 'Configure your tax profile',
  todayFiscalSetupDescription: 'Enable the tax obligations calendar for your legal form.',
  todayConfigure: 'Configure',
  todayUpcomingFiscal: 'Upcoming tax obligations',
  todayViewCalendar: 'View calendar',
  todayToday: 'Today',
  todayCalculate: 'Calculate',
  todayRecentNotebooks: 'Recent notebooks',
  todaySourceSingular: 'source',
  todaySourcePlural: 'sources',
  todayFirstSteps: 'First steps',
  todayCompletedProgress: 'completed',
  toolsInstalledTitle: 'Installed tools',
  toolsInstalledDescription: 'Small apps for specific business tasks: audits, checklists, reports...',
  toolsGenerate: 'Generate',
  toolsAdd: 'Add',
  toolsActive: 'Active',
  toolsOpen: 'Open',
  toolsCategoryAudit: 'Audit',
  toolsCategoryEvaluation: 'Evaluation',
  toolsCategoryChecklist: 'Checklist',
  toolsCategoryCrm: 'CRM',
  toolsCategoryReport: 'Reports',
  toolsCategoryHr: 'HR',
  toolsCategoryOperations: 'Operations',
  toolsCategoryFinance: 'Finance',
  toolsCategoryCustom: 'Custom',
  toolsEmptyTitle: 'Install your first tool',
  toolsEmptyDescription: 'In less than a minute you will have an audit ready to run with your first client.',
  toolsInstalling: 'Installing...',
  toolsViewCatalog: 'View full catalog',
  toolsShortcutItAudit: 'IT security audit',
  toolsShortcutItAuditDescription: 'Controls, access, infrastructure and vulnerabilities.',
  toolsShortcutGdprAudit: 'GDPR compliance',
  toolsShortcutGdprAuditDescription: 'Data processing, legal basis and security measures.',
  toolsShortcutDigitalMaturity: 'Digital maturity',
  toolsShortcutDigitalMaturityDescription: 'Digitalization level and transformation priorities.',
  toolsShortcutPopular: 'Most popular',
  toolInvalidSchema: 'Invalid tool schema.',
  toolNewEntry: 'New entry',
  toolAiIdeas: 'AI ideas',
  toolImportCsv: 'Import CSV',
  toolNoRecords: 'No records in this tool yet.',
  toolType: 'Type',
  toolDate: 'Date',
  toolActions: 'Actions',
  toolForm: 'Form',
  toolApprovalPending: 'Pending',
  toolApprovalApproved: 'Approved',
  toolApprovalRejected: 'Rejected',
  toolApprovalOnHold: 'On hold',
  toolRecordSingular: 'record',
  toolRecordPlural: 'records',
  toolDelete: 'Delete',
  toolDeleting: 'Deleting...',
  toolDeleteConfirm: 'Delete this record? This action cannot be undone.',
  toolNavRecords: 'Records',
  toolNavRunAi: 'Run AI',
  toolNavAiHistory: 'AI history',
  toolNavSettings: 'Settings',
  toolNavAria: 'Tool sections',
  toolReplay: 'Replay',
  toolInputVariables: 'Input variables',
  toolInputDescription: 'Fill in the fields to customize the AI output',
  toolContextFilled: 'Some fields have been filled from your company context',
  toolSelectOption: 'Select an option',
  toolYes: 'Yes',
  toolNoVariables: 'This tool does not require variables. Run it directly.',
  toolRun: 'Run',
  toolGenerating: 'Generating...',
  toolResult: 'Execution result',
  toolResultDescription: 'Fill in the variables and click "Run" to generate the output for',
  toolLoadingDescription: 'This may take a few seconds',
  toolExecutionErrorTitle: 'Execution error',
  toolUnknownError: 'Unknown error',
  toolConnectionError: 'Connection error. Try again.',
  toolMetaModel: 'Model',
  toolMetaTokens: 'Tokens',
  toolMetaCost: 'Cost',
  toolMetaTime: 'Time',
  toolMissionUpdateError: 'Could not update the mission. Try again.',
  toolSaveSocialTitle: 'Save this idea as a post',
  toolSaveSocialDescription: 'Create a draft in MITIKUS with the generated result. It does not publish to external social networks.',
  toolDraftSaved: 'Draft saved successfully.',
  toolSaving: 'Saving...',
  toolSaved: 'Saved',
  toolSaveDraft: 'Save as draft',
  toolViewPosts: 'View posts',
  toolMissionStepGenerated: 'Result generated: this completes your mission step.',
  toolMissionStepGeneratedDescription: 'Go back to the mission to mark it as done. Progress and the next action update automatically.',
  toolUpdatingMission: 'Updating mission...',
  toolBackToMissionDone: 'Back to mission and mark as done',
  toolContinueWith: 'Continue with...',
  toolUse: 'Use',
  toolNewExecution: 'New execution',
  toolBackWithoutDone: 'Back without marking as done',
  toolHistoryTitle: 'AI execution history',
  toolNoExecutionsYet: 'No executions yet',
  toolHistoryEmptyTitle: 'No history',
  toolHistoryEmptyDescription: 'AI executions will appear here once you run the tool.',
  toolRunNow: 'Run now',
  toolDuration: 'Duration',
  toolRerunTitle: 'Rerun with the same variables',
  toolRerun: 'Rerun',
  toolExecutionSingular: 'execution',
  toolExecutionPlural: 'executions',
  toolNoResult: 'No result is available for this execution.',
  toolVariablesUsed: 'Variables used',
  toolTelemetry: 'Telemetry',
  toolProvider: 'Provider',
  toolInputTokens: 'Input tokens',
  toolOutputTokens: 'Output tokens',
  toolTotalTokens: 'Total tokens',
  toolEstimatedCost: 'Estimated cost',
  toolRerunWithData: 'Rerun with this data',
  toolCleanExecution: 'Clean new execution',
  toolImportRecordsTitle: 'Import records from CSV',
  toolImportRecordsDescription: 'Upload a CSV file. Headers must match the tool field names. Download the template if you do not have the format.',
  toolCsvEmptyError: 'The file is empty or has no headers.',
  toolCsvOnlyError: 'Only .csv files are supported',
  toolImportUnexpectedError: 'Unexpected import error.',
  toolCsvTemplateFilename: 'template.csv',
  toolCsvDrop: 'Drop a CSV here or click to select',
  toolCsvOnlyUtf8: 'CSV files only · UTF-8',
  toolDownloadCsvTemplate: 'Download CSV template',
  toolColumnMapping: 'Column mapping',
  toolRequired: 'required',
  toolMissingRequiredColumns: 'Missing required columns',
  toolMissingRequiredColumnsSuffix: 'Valid records cannot be imported.',
  toolPreview: 'Preview',
  toolPreviewFirstRows: 'first rows',
  toolPreviewRows: 'rows',
  toolImporting: 'Importing...',
  toolImportRecords: 'Import records',
  toolChangeFile: 'Change file',
  toolImportedSingular: 'record imported',
  toolImportedPlural: 'records imported',
  toolSkippedSingular: 'row skipped',
  toolSkippedPlural: 'rows skipped',
  toolSkippedReason: 'empty required fields or plan limit',
  toolViewRecords: 'View records',
  toolApprovalRequest: 'Request',
  toolApprovalRequestDate: 'Request date',
  toolApprovalHistory: 'History',
  toolApprovalDecision: 'Decision',
  toolApprovalReason: 'Reason',
  toolApprovalReasonRequired: 'required',
  toolApprovalReasonPlaceholder: 'Explain the reason for your decision...',
  toolApprovalCommentOptional: 'Comment (optional)',
  toolApprovalCommentPlaceholder: 'Add a comment to your decision...',
  toolApprovalMissingReason: 'Enter the rejection reason.',
  toolApprovalSaving: 'Saving...',
  toolApprovalApproveAction: 'Approve',
  toolApprovalRejectAction: 'Reject',
  toolApprovalHoldAction: 'Put on hold',
  toolApprovalConfirmReject: 'Confirm rejection',
  toolSettingsTitle: 'Installation settings',
  toolSettingsDescription: 'Adjust the AI provider, model, creativity and output format for this tool.',
  toolSettingsLinkedClient: 'Linked client',
  toolSettingsLinkedClientDescription: 'Link this tool to a client so it appears in their dossier.',
  toolSettingsNoClient: 'No client',
  toolSettingsSave: 'Save',
  toolSettingsNoClientsYet: 'You do not have clients in this workspace yet.',
  toolSettingsCreateClient: 'Create client',
  toolSettingsAiModel: 'AI model',
  toolSettingsAiModelDescription: 'Choose the provider and model this tool will use when it runs',
  toolSettingsProvider: 'Provider',
  toolSettingsModel: 'Model',
  toolSettingsCreativity: 'Creativity',
  toolSettingsCreativityDescription: 'Control the randomness and creativity of responses',
  toolSettingsTemperature: 'Temperature',
  toolSettingsTemperatureHint: '0 = deterministic and precise · 1 = more creative and varied',
  toolSettingsModelDefault: 'Model default',
  toolSettingsTopPHint: 'Controls candidate token diversity. Only change it if you know what you are doing.',
  toolSettingsOutput: 'Output',
  toolSettingsOutputDescription: 'Language, format and maximum response length',
  toolSettingsResponseLanguage: 'Response language',
  toolSettingsResponseFormat: 'Response format',
  toolSettingsMaxOutputTokens: 'Maximum output tokens',
  toolSettingsMaxOutputTokensHint: 'Empty = model maximum. Lower values limit response length.',
  toolSettingsMaxModel: 'Model maximum',
  toolSettingsCustomInstructions: 'Custom instructions',
  toolSettingsCustomInstructionsDescription: 'Adjust or replace the AI behavior for this installation',
  toolSettingsAdditionalInstructions: 'Additional instructions',
  toolSettingsAdditionalInstructionsHint: 'Added to the end of the system prompt. Use this for company context, a specific output format, etc.',
  toolSettingsAdditionalInstructionsPlaceholder: 'Example: Our report style is concise and executive. Always include a next steps section.',
  toolSettingsSystemPromptOverride: 'Replace full system prompt',
  toolSettingsSystemPromptOverrideHint: 'Advanced — completely replaces the generated system prompt. Leave empty to use the tool automatic prompt.',
  toolSettingsSystemPromptOverridePlaceholder: 'Write the custom system prompt here (optional)...',
  toolSettingsChangesNextRun: 'Changes apply on the next run',
  toolSettingsSaved: 'Saved',
  toolSettingsSaveConfig: 'Save settings',
  toolStatusPending: 'Pending',
  toolStatusRunning: 'Running...',
  toolStatusCompleted: 'Completed',
  toolStatusFailed: 'Error',
  toolStatusCancelled: 'Cancelled',
  toolSelectPlaceholder: 'Select an option',
  toolFieldRequiredErrorPrefix: 'The field "',
  toolFieldRequiredErrorSuffix: '" is required.',
  toolItemRequiredErrorPrefix: 'The item "',
  toolItemRequiredErrorSuffix: '" is required.',
  toolChecklistCompleted: 'completed',
  toolChecklistRequired: 'Required',
  toolChecklistUpdate: 'Update checklist',
  toolChecklistSave: 'Save checklist',
  toolScoringTotal: 'Total score',
  toolScoringPassingMinimum: 'Minimum to pass',
  toolScoringUpdate: 'Update evaluation',
  toolScoringSave: 'Save evaluation',
  toolEditRecord: 'Edit record',
  toolNewChecklist: 'New checklist',
  toolEditChecklist: 'Edit checklist',
  toolNewScoring: 'New evaluation',
  toolEditScoring: 'Edit evaluation',
  toolNewApprovalRequest: 'New request',
  toolSubmitApprovalRequest: 'Submit request',
  toolNoApprovalPermission: 'You do not have permission to create requests in this tool.',
  toolAutoApproveBelowPrefix: 'Requests with an amount below',
  toolAutoApproveBelowSuffix: 'are approved automatically.',
  toolApprovalWillRemainPending: 'Your request will remain pending approval by a responsible person.',
  missionsTitle: 'Missions',
  missionsDescription: 'Strategic goals and their execution tracking',
  missionsNewWithArkos: 'New mission with Arkos',
  missionsFilterAll: 'All',
  missionsFilterActive: 'Active',
  missionsFilterCompleted: 'Completed',
  missionsFilterPaused: 'Paused',
  missionsFilterCancelled: 'Cancelled',
  missionsStatusActive: 'Active',
  missionsStatusCompleted: 'Completed',
  missionsStatusPaused: 'Paused',
  missionsStatusCancelled: 'Cancelled',
  missionsPriorityCritical: 'Critical',
  missionsPriorityHigh: 'High',
  missionsPriorityMedium: 'Medium',
  missionsPriorityLow: 'Low',
  missionsEmptyAllTitle: 'No missions yet',
  missionsEmptyFilteredTitle: 'No missions in this status',
  missionsEmptyDescription: 'Missions are strategic goals with execution steps. Create them with Arkos or from the main panel.',
  missionsCreateFirstWithArkos: 'Create first mission with Arkos',
  missionsStepSingular: 'step',
  missionsStepPlural: 'steps',
  missionsTaskSingular: 'task',
  missionsTaskPlural: 'tasks',
  missionsDuePrefix: 'Due',
  missionsCompletedPrefix: 'Completed',
  missionStatusPausedAlt: 'Paused',
  missionStateNew: 'New',
  missionStateReady: 'Ready to start',
  missionStateInProgress: 'In progress',
  missionStateWaitingUser: 'Waiting for you to continue',
  missionStateWaitingAi: 'AI is working',
  missionStateBlocked: 'Blocked',
  missionStateCompleted: 'Completed',
  missionStateArchived: 'Archived',
  missionStepStatusPending: 'Pending',
  missionStepStatusInProgress: 'In progress',
  missionStepStatusCompleted: 'Completed',
  missionStepStatusSkipped: 'Skipped',
  missionStepStatusBlocked: 'Blocked',
  missionActorUser: 'You',
  missionActorAi: 'AI',
  missionActorShared: 'Shared',
  missionDueDate: 'Due date',
  missionProgressTitle: 'Mission progress',
  missionCompletedSteps: 'Completed steps',
  missionPendingStepsMetric: 'Pending',
  missionRemainingTime: 'Remaining time',
  missionCompletedValue: 'Completed',
  missionExpectedImpact: 'Expected impact',
  missionImpactCritical: 'Critical',
  missionImpactHigh: 'High',
  missionImpactMedium: 'Medium',
  missionNextAction: 'Next action',
  missionOpenTool: 'Open tool',
  missionWhyTitle: 'Why it matters',
  missionDefaultWhyHigh: 'This mission is marked as a high business priority, so it is worth resolving as soon as possible.',
  missionDefaultWhyNormal: 'This mission is part of the company active goals.',
  missionDefaultBenefitHigh: 'High impact: unlocks capabilities and improves company knowledge.',
  missionDefaultBenefitMedium: 'Moderate impact: advances company knowledge and operations.',
  missionDefaultBenefitLow: 'Focused impact: improves a specific operational area.',
  missionUnlocks: 'Will unlock',
  missionDepartmentsAffected: 'Departments affected',
  missionImpactTitle: 'Expected impact',
  missionImpact: 'Impact',
  missionUrgency: 'Urgency',
  missionEffort: 'Effort',
  missionHighRisk: 'High risk if postponed',
  missionTimeline: 'Timeline',
  missionStepsTitle: 'Mission steps',
  missionLinkedWorkflow: 'Linked workflow',
  missionLinkedWorkflowTitle: 'Workflow linked to this mission',
  missionLinkedWorkflowDescription: 'View the associated automated process',
  missionOpenWorkflow: 'Open workflow',
  missionNeedHelp: 'Need help with this mission?',
  missionNeedHelpDescription: 'Arkos can guide you, create steps and recommend tools.',
  missionOpenArkos: 'Open Arkos',
  missionResponsibleTitle: 'Responsible',
  missionInstallTool: 'Install tool',
  missionNoStepsTitle: 'This mission does not have defined steps yet.',
  missionNoStepsDescription: 'Define the steps to know exactly what to do, in what order and with which tool.',
  missionDefineStepsWithArkos: 'Define steps with Arkos',
  missionMarkPendingTitle: 'Mark as pending',
  missionUndoCompletedLabel: 'Undo completed',
  missionRecoverStepTitle: 'Recover step',
  missionRecoverSkippedLabel: 'Recover skipped step',
  missionStartStep: 'Start',
  missionCompleteStep: 'Complete',
  missionSkipStepTitle: 'Skip step',
  missionSkipStepLabel: 'Skip step',
  missionAiNextRecommendations: 'Recommended next',
  missionAiSuggestion: 'AI suggestion',
  missionAiThinking: 'Thinking...',
  missionAiRegenerate: 'Regenerate',
  missionAiRequest: 'Ask AI suggestion',
  missionAiError: 'Could not generate the suggestion. Try again.',
  missionAiGeneratingNext: 'Generating recommendations for next missions...',
  missionAiAskHelp: 'Ask for a suggestion if you are unsure how to continue.',
  clientsTitle: 'Clients',
  clientsDescription: 'Companies or people you serve: link tools and missions to each one',
  clientsNew: 'New client',
  clientsEmptyTitle: 'Add your first client',
  clientsEmptyDescription: 'Link every audit, document and contract to a company. Everything organized, always easy to find.',
  clientsAdd: 'Add client',
  clientsTypeClient: 'Client',
  clientsTypeCompany: 'Company',
  clientsTypeFreelancer: 'Freelancer',
  clientsTypeIndividual: 'Individual',
  clientsTypePatient: 'Patient',
  clientsTypeStudent: 'Student',
  clientsTypeAthlete: 'Athlete',
  clientsTypeEvent: 'Event',
  clientsContactPrefix: 'Contact',
  clientsViewDossier: 'View dossier',
  clientsEdit: 'Edit',
  clientsEditTitle: 'Edit client',
  clientsTypeLabel: 'Type',
  clientsTypeClientNameLabel: 'Client',
  clientsTypeClientNamePlaceholder: 'Company, freelancer or person',
  clientsTypeClientContactLabel: 'Contact person',
  clientsTypeClientContactPlaceholder: 'Only if different from the client',
  clientsTypeCompanyNameLabel: 'Company',
  clientsTypeCompanyNamePlaceholder: 'Company name',
  clientsTypeCompanyContactPlaceholder: 'Name of the person you deal with',
  clientsTypeFreelancerNameLabel: 'Professional name',
  clientsTypeFreelancerNamePlaceholder: 'Professional name or brand',
  clientsTypeFreelancerContactPlaceholder: 'Optional, if different',
  clientsTypeIndividualNameLabel: 'Full name',
  clientsTypeIndividualNamePlaceholder: 'Person name',
  clientsTypeIndividualContactLabel: 'Alternative contact',
  clientsTypeIndividualContactPlaceholder: 'Optional',
  clientsTypePatientNameLabel: 'Patient',
  clientsTypePatientNamePlaceholder: 'Patient name',
  clientsTypePatientContactLabel: 'Contact/guardian',
  clientsTypePatientContactPlaceholder: 'Optional, useful for minors or dependants',
  clientsTypeStudentNameLabel: 'Student',
  clientsTypeStudentNamePlaceholder: 'Student name',
  clientsTypeStudentContactLabel: 'Guardian/contact',
  clientsTypeStudentContactPlaceholder: 'Parent or guardian if applicable',
  clientsTypeAthleteNameLabel: 'Athlete',
  clientsTypeAthleteNamePlaceholder: 'Athlete name',
  clientsTypeAthleteContactLabel: 'Contact/coach',
  clientsTypeAthleteContactPlaceholder: 'Optional',
  clientsTypeEventNameLabel: 'Event',
  clientsTypeEventNamePlaceholder: 'Laura and Andres wedding, family session...',
  clientsTypeEventContactPlaceholder: 'Who coordinates the event',
  clientsContactHelp: 'For freelancers or individuals you can leave it empty.',
  clientsPhone: 'Phone',
  clientsFiscalDataTitle: 'Tax details for invoices',
  clientsFiscalDataDescription: 'These details will appear as recipient data when you issue an invoice to this client.',
  clientsCountry: 'Country',
  clientsDefaultCountry: 'Spain',
  clientsFiscalAddress: 'Tax address',
  clientsFiscalAddressPlaceholder: 'Street, number, floor...',
  clientsPostalCode: 'Postal code',
  clientsCity: 'City',
  clientsProvince: 'Province / region',
  clientsSector: 'Sector',
  clientsSectorPlaceholder: 'Technology, hospitality...',
  clientsNotes: 'Notes',
  clientsNotesPlaceholder: 'Additional information...',
  clientsSaving: 'Saving...',
  clientsCreating: 'Creating...',
  clientsSaveChanges: 'Save changes',
  clientsArchive: 'Archive',
  clientsArchiving: 'Archiving...',
  clientsArchiveConfirm: 'Archive this client? It will be hidden from the list.',
  clientsSince: 'Since',
  clientsSendEmail: 'Send email',
  clientsFiscalDataShort: 'Tax details',
  clientsClientCompany: 'Client / Company',
  clientsPostalCityProvince: 'Postcode / city / province',
  clientsTools: 'Tools',
  clientsExecutions: 'Executions',
  clientsAiCost: 'AI cost',
  clientsFiles: 'Files',
  clientsLinkTool: 'Link tool',
  clientsNoLinkedTools: 'No tools linked to this client.',
  clientsGoToTools: 'Go to Tools',
  clientsExecutionSingular: 'execution',
  clientsExecutionPlural: 'executions',
  clientsLastPrefix: 'Last',
  clientsRun: 'Run',
  clientsHistory: 'History',
  clientsRecentExecutions: 'Recent executions',
  clientsDate: 'Date',
  clientsTool: 'Tool',
  clientsStatus: 'Status',
  clientsCost: 'Cost',
  clientsUser: 'User',
  clientsView: 'View',
  clientsFilesDescription: 'Document dossier linked to this client. It is also saved in My Office.',
  clientsUploadFile: 'Upload file',
  clientsUploading: 'Uploading...',
  clientsUploadFolderLabel: 'Folder for new uploads',
  clientsNoFolder: 'No folder',
  clientsNewFolder: 'New folder',
  clientsNewFolderPlaceholder: 'Contracts, Reports...',
  clientsCreate: 'Create',
  clientsFileTypeDoc: 'Document',
  clientsFileTypeSheet: 'Sheet',
  clientsFileTypePdf: 'PDF',
  clientsFileTypeImage: 'Image',
  clientsFileTypeOther: 'File',
  clientsFileUploadGenericError: 'Could not upload the file',
  clientsFileUploadError: 'Could not upload the file. Check the size and format, then try again.',
  clientsFolderCreateError: 'Could not create the folder. Try again.',
  clientsNoFiles: 'No files linked to this client.',
  clientsDropFilesHelp: 'Drop contracts, PDFs, images or any related document here.',
  clientsFolderPrefix: 'Folder',
  clientsDownload: 'Download',
  clientsPortalCopied: 'Link copied',
  clientsPortal: 'Client portal',
  // Leads
  leadsTitle: 'Leads',
  leadsSubtitle: 'Potential clients — captured from your public form.',
  leadsNoLeads: 'No leads yet',
  leadsNoLeadsHelp: 'Share the form link and start capturing potential clients.',
  leadsName: 'Name',
  leadsStatus: 'Status',
  leadsCompany: 'Company',
  leadsDate: 'Date',
  leadsPhone: 'Phone',
  leadsMessage: 'Message',
  leadsInternalNotes: 'Internal notes',
  leadsSaveNotes: 'Save notes',
  leadsSaving: 'Saving...',
  leadsNotesPlaceholder: 'Add notes about this lead...',
  leadsConvert: 'Convert to client',
  leadsConverted: '✓ Converted to client',
  leadsDelete: 'Delete lead',
  leadsStatusNew: 'New',
  leadsStatusContacted: 'Contacted',
  leadsStatusQualified: 'Qualified',
  leadsStatusLost: 'Lost',
  leadsConvertConfirmPrefix: 'Convert ',
  leadsConvertConfirmSuffix: ' to client?',
  leadsDeleteConfirmPrefix: 'Delete the lead of ',
  leadsDeleteConfirmSuffix: '?',
  // History
  historyTitle: 'Work history',
  historySubtitle: 'All work history in this workspace',
  historyExecutions: 'Executions',
  historyCompleted: 'Completed',
  historyAiCost: 'Total AI cost',
  historyEmpty: 'No history yet',
  historyEmptyDescription: 'AI executions from your tools will appear here.',
  historyGoToTools: 'Go to Tools',
  historyDate: 'Date',
  historyTool: 'Tool',
  historyStatus: 'Status',
  historyTokens: 'Tokens',
  historyCost: 'Cost',
  historyDuration: 'Duration',
  historyUser: 'User',
  historyActions: 'Actions',
  historyRerun: '↻ Re-run',
  historyView: 'View',
  historyRetry: '↻ Retry',
  historyFooterSingular: 'execution',
  historyFooterPlural: 'executions',
  historyFooterCostLabel: 'Total cost:',
  historyRerunTitle: 'Re-run with same variables',
  // Analytics
  analyticsTitle: 'Analytics',
  analyticsSubtitle: 'AI usage, executions and costs of the workspace',
  analyticsAiCost: 'AI Cost',
  analyticsTokens: 'Tokens used',
  analyticsExecutions: 'Executions',
  analyticsSuccessRate: 'Success rate',
  analyticsAvgTime: 'Avg. time',
  analyticsAvgCost: 'Avg. cost',
  analyticsTotalExecsMicro: 'total executions',
  analyticsTokensSumMicro: 'Sum of input + output tokens',
  analyticsWorkflowsMicroPrefix: '+ ',
  analyticsWorkflowsMicroSuffix: ' complete workflows',
  analyticsSuccessRateMicro: 'Completed / finished',
  analyticsAvgTimeMicro: 'Per tool execution',
  analyticsAvgCostMicro: 'Per execution',
  analyticsCostByDayTitle: 'AI Cost per day',
  analyticsCostByMonthTitle: 'AI Cost per month',
  analyticsExecutionStatus: 'Execution status',
  analyticsTopTools: 'Most used tools',
  analyticsProviderBreakdown: 'Provider breakdown',
  analyticsAiModels: 'AI Models',
  analyticsWorkflowsExecuted: 'Executed workflows',
  analyticsExecutionsByDayTitle: 'Executions per day',
  analyticsExecutionsByMonthTitle: 'Executions per month',
  analyticsUserActivity: 'User activity',
  analyticsAccessRestricted: 'Restricted access',
  analyticsAdminOnly: 'Only workspace administrators can view analytics.',
  analyticsTotalLabel: 'Total:',
  analyticsExecsSuffix: 'executions',
  analyticsEmptyTools: 'No tools executed',
  analyticsEmptyModels: 'No model data',
  analyticsEmptyWorkflows: 'No workflows executed',
  analyticsEmptyUsers: 'No user activity',
  analyticsFailRateLabel: 'failure ',
  analyticsExecUnitShort: 'exec.',
  // Office
  officeTitle: 'My Office',
  officeSubtitle: 'Your document and management tools',
  officeDocumentsSection: 'Documents',
  officeFiscalSection: 'Tax (Spain)',
  officeQuarterly: 'Quarterly',
  officeAnnual: 'Annual',
  officeSeeCalendar: 'See calendar →',
  officeToolDocs: 'Documents',
  officeToolDocsSubtitle: 'Draft and edit with AI',
  officeToolContracts: 'Contracts',
  officeToolContractsSubtitle: 'Electronic signature',
  officeToolInvoices: 'Invoices',
  officeToolInvoicesSubtitle: 'Downloadable PDF',
  officeToolSheets: 'Spreadsheets',
  officeToolSheetsSubtitle: 'Data and budgets',
  officeToolPdfs: 'PDFs',
  officeToolPdfsSubtitle: 'Viewer and search',
  officeToolPresentations: 'Presentations',
  officeToolPresentationsSubtitle: 'Create and share',
  officeToolNotebooks: 'Notebooks',
  officeToolNotebooksSubtitle: 'Synthesize with AI',
  officeToolReceipts: 'Expenses',
  officeToolReceiptsSubtitle: 'OCR by camera',
  officeToolFiles: 'Files',
  officeToolFilesSubtitle: 'Folders and files',
  // Audit
  auditTitle: 'Audit',
  auditSubtitlePrefix: 'Audit trail · ',
  auditSubtitleSuffix: ' events',
  auditExportCsv: 'Export CSV',
  auditFiltersLabel: 'Filters',
  auditTotalEvents: 'Total events',
  auditErrors: 'Errors',
  auditDenied: 'Denied',
  auditEventsLabel: 'Events',
  auditPageLabel: 'Page ',
  auditPageOf: ' of ',
  auditPrev: '← Previous',
  auditNext: 'Next →',
  auditAccessRestricted: 'Restricted access',
  auditAdminOnly: 'Only workspace administrators can view the audit log.',
  // Workflows
  workflowsTitle: 'Workflows',
  workflowsSubtitle: 'Smart tool chains',
  workflowsNew: '+ New workflow',
  workflowsHowItWorksTitle: 'How does a workflow work?',
  workflowsStep1Title: 'Choose the tools',
  workflowsStep1Description: 'Combine any installed tool in your workspace: analyzers, generators, data extractors…',
  workflowsStep2Title: 'Connect the steps',
  workflowsStep2Description: 'Each tool\'s output passes automatically as input to the next. No copy-paste.',
  workflowsStep3Title: 'Run it in one click',
  workflowsStep3Description: 'Enter the initial data and the workflow does the rest. Review execution history any time.',
  workflowsTemplatesTitle: 'Templates',
  workflowsTemplatesSubtitle: 'Ready-to-use workflow templates',
  workflowsMyWorkflows: 'My workflows',
  workflowsEmptyPrefix: 'Use a template or ',
  workflowsEmptySuffix: '.',
  workflowsCreateFromScratch: 'create a workflow from scratch',
  workflowsSteps: 'Steps',
  workflowsExecutions: 'Executions',
  workflowsLastRun: 'Last run',
  workflowsActiveTitle: 'Active',
  workflowsInactiveTitle: 'Inactive',
  // Home/workspace page
  homePanelSubtitle: 'Panel — what is most important for you to do today',
  homeMissionsTitle: 'Active missions',
  homeCreateMission: 'Create mission →',
  homeActiveSingular: 'active',
  homeActivePlural: 'active',
  homeBlockedSingular: 'blocked',
  homeBlockedPlural: 'blocked',
  homeOverdueSingular: 'overdue',
  homeOverduePlural: 'overdue',
  homeDueSoonSingularSuffix: 'due this week',
  homeDueSoonPluralSuffix: 'due this week',
  homeUnblockSingle: 'To continue, resolve this blocker:',
  homeUnblockMultiPrefix: 'To continue, resolve these ',
  homeUnblockMultiSuffix: ' blockers:',
  homeResolveBlocker: 'Resolve blocker →',
  homeNoMissions: 'No active missions.',
  homeNoMissionsDesc: 'Tell Arkos a business goal and it will turn it into a mission with clear steps — or use a template to start instantly.',
  homeDefineWithArkos: 'Define with Arkos →',
  homePriorityCritical: 'Critical',
  homePriorityHigh: 'High',
  homePriorityMedium: 'Medium',
  homePriorityLow: 'Low',
  homeDueOverdue: 'Overdue',
  homeDueSoonPrefix: 'Due in ',
  homeDueSoonSuffix: 'd',
  homeFocusLabel: 'Focus of the day',
  homeNowLabel: 'Now',
  homeWhyFirstLabel: 'Why first?',
  homeWillUnlock: 'Will unlock:',
  homeTimeLabel: 'Time:',
  homeStepsProgressSingular: 'step',
  homeStepsProgressPlural: 'steps',
  homeContinueMission: 'Continue mission →',
  homeNowColon: 'Now:',
  // TrialBanner
  trialUrgentPrefix: '⚠️ Your trial ends in ',
  trialDaySingular: ' day',
  trialDayPlural: ' days',
  trialUrgentSuffix: '. You won\'t lose anything if you activate your plan now.',
  trialNormalPrefix: 'Trial period · ',
  trialNormalSingularSuffix: ' day remaining',
  trialNormalPluralSuffix: ' days remaining',
  trialActivate: 'Activate plan →',
  // LastExecutionWidget
  lastExecEmpty: 'You haven\'t executed any tool yet.',
  lastExecSeeTools: 'See tools →',
  lastExecLabel: 'Last execution',
  lastExecDaysAgoPrefix: '',
  lastExecDaysAgoSuffix: 'd ago',
  lastExecHoursAgoPrefix: '',
  lastExecHoursAgoSuffix: 'h ago',
  lastExecJustNow: 'less than 1h ago',
  lastExecRerun: 'Run again →',
  // MissionTemplateModal
  templateFromTemplate: 'From template',
  templateModalTitle: 'Mission templates',
  templateModalSubtitle: 'Choose one to start with predefined steps.',
  templateSteps: 'steps',
  templateBackToList: '← Back to templates',
  templateIncludedStepsPrefix: 'Included steps (',
  templateActorAI: '✨ AI',
  templateActorShared: '🤝 Shared',
  templateActorUser: '👤 You',
  templateMinutes: 'min',
  templateError: 'Could not create the mission. Please try again.',
  templateBack: 'Back',
  templateCreating: 'Creating...',
  templateCreate: 'Create mission',
  // GlobalSearch
  searchLabel: 'Search',
  searchGlobalLabel: 'Global search',
  searchPlaceholder: 'Search across documents, clients, contracts…',
  searchFilters: 'Filters',
  searchClearFilters: 'Clear',
  searchTypeDoc: 'Document',
  searchTypePdf: 'PDF',
  searchTypeContract: 'Contract',
  searchTypeNotebook: 'Notebook',
  searchTypeSheet: 'Spreadsheet',
  searchTypePresentation: 'Presentation',
  searchTypeTask: 'Task',
  searchTypeMission: 'Mission',
  searchTypeClient: 'Client',
  searchTypeTool: 'Tool',
  searchCreatedBetween: 'Created between',
  searchModifiedBetween: 'Modified between',
  searchClearDates: 'Clear dates',
  searchNoResults: 'No results for',
  searchNoResultsHint: 'Try broadening your date or type filters',
  searchMinChars: 'Type at least 2 characters · Search across documents, PDFs, contracts, sheets, presentations, tasks, missions, clients and tools',
  searchMinCharsFilters: 'Type at least 2 characters to search with the applied filters',
  searchCreated: 'Created',
  searchModified: 'Modified',
  searchNav: '↑↓ navigate',
  searchOpen: '↵ open',
  searchClose: 'Esc close',
  searchResultsSuffix: 'result',
  searchRelativeToday: 'today',
  searchRelativeYesterday: 'yesterday',
  searchRelativeDaysAgo: 'd ago',
  searchRelativeWeeks: 'w ago',
  searchRelativeMonths: 'mo ago',
  // TaskList
  tasksTitle: 'Tasks',
  tasksNew: 'New task',
  tasksFilterAll: 'All',
  tasksFilterPending: 'Pending',
  tasksFilterInProgress: 'In progress',
  tasksFilterDone: 'Done',
  tasksFilterMine: 'Mine only',
  tasksEmpty: 'No tasks match these filters.',
  tasksCreateFirst: 'Create the first →',
  tasksPendingSingular: 'pending',
  tasksPendingPlural: 'pending',
  tasksTotal: 'total',
  // Analytics
  analyticsEmpty: 'No activity in this period',
  analyticsEmptyHint: 'Run tools or workflows to see metrics here.',
  analyticsNoExecutions: 'No executions',
  analyticsCompleted: 'Completed',
  analyticsFailed: 'Failed',
  analyticsCancelled: 'Cancelled',
  analyticsRunning: 'Running',
  analyticsPending: 'Pending',
  // Invoices
  invoicesTitle: 'Invoices',
  invoicesSubtitle: 'Create and manage your invoices. Download the PDF ready to send.',
  invoicesStatMonth: 'Issued this month',
  invoicesStatPending: 'Pending payment',
  invoicesStatPaid: 'Total collected',
  invoicesNew: 'New invoice',
  invoicesEmpty: 'No invoices yet',
  invoicesCreateFirst: 'Create first invoice',
  invoicesNoClient: 'No client',
  invoicesDue: 'Due',
  invoicesSelectHint: 'Select an invoice to see the detail',
  invoicesStatusDraft: 'Draft',
  invoicesStatusSent: 'Sent',
  invoicesStatusPaid: 'Paid',
  invoicesStatusOverdue: 'Overdue',
  invoicesStatusCancelled: 'Cancelled',
  invoicesSend: 'Send',
  invoicesReviewReplies: 'Check replies',
  invoicesReviewingReplies: 'Checking…',
  invoicesView: 'View detail',
  invoicesEdit: 'Edit',
  invoicesCreateRect: 'Create credit note',
  invoicesDelete: 'Delete',
  invoicesColDesc: 'Description',
  invoicesColQty: 'Qty.',
  invoicesColUnit: 'Unit price',
  invoicesColTotal: 'Total',
  invoicesSubtotal: 'Subtotal',
  invoicesVAT: 'VAT',
  invoicesTotal: 'Total',
  invoicesChangeStatus: 'Change status:',
  invoicesEmails: 'Emails',
  invoicesEmailInbound: 'Reply received',
  invoicesEmailSent: 'Sent',
  invoicesRectTitle: 'Create credit note',
  invoicesRectDesc: 'A credit note (type R1) will be created as a draft referencing invoice',
  invoicesRectReason: 'Reason for the credit note',
  invoicesRectPlaceholder: 'E.g. Amount error, partial refund…',
  invoicesRectCancel: 'Cancel',
  invoicesRectCreate: 'Create credit note',
  invoicesRectCreating: 'Creating…',
  invoicesRectError: 'Could not create the credit note. Please try again.',
  invoicesRectReasonRequired: 'Please enter the reason for the credit note',
  invoicesSendTitle: 'Send invoice to client',
  invoicesSendRecipient: 'Recipient',
  invoicesSendRecipientPlaceholder: 'Contact or client name',
  invoicesSendEmail: 'Client email',
  invoicesSendNote: 'MITIKUS will send invoice {number} using the configured email identity. If sending fails, the invoice will not be marked as sent.',
  invoicesSendClose: 'Close',
  invoicesSendCancel: 'Cancel',
  invoicesSendButton: 'Send invoice',
  invoicesSending: 'Sending…',
  invoicesSentOk: '✓ Invoice sent successfully.',
  invoicesSendError: 'Could not send the invoice. Check that you have email configured in Settings → Email.',
  invoicesSendErrorSettings: 'Settings → Email',
  invoicesNoReplies: 'No new replies right now.',
  invoicesRepliesError: 'Could not check mailbox replies.',
  invoicesDeleteConfirm: 'Delete invoice {number}?',
  invoicesSuffix: 'invoice',
  // Workspace settings page
  wsSettingsTitle: 'Workspace settings',
  wsSettingsSubtitle: 'Customise branding, visible data and sending settings for your workspace.',
  // Workspace settings client
  wsLogoSection: 'Company logo',
  wsLogoDesc: 'Shown in the workspace sidebar.',
  wsLogoShowName: 'Show workspace name above the logo in the sidebar',
  wsLogoNameAdjust: 'Name overlay settings',
  wsLogoHorizontal: 'Horizontal',
  wsLogoVertical: 'Vertical',
  wsLogoSize: 'Size',
  wsLogoFontColor: 'Font colour',
  wsLogoFont: 'Font',
  wsEmailSection: 'Email & sending',
  wsEmailDesc: 'Choose how emails are sent from this workspace.',
  wsEmailMitikusLabel: 'MITIKUS',
  wsEmailMitikusDesc: 'MITIKUS sends on your behalf. Replies go to the email you set.',
  wsEmailSmtpLabel: 'Custom SMTP',
  wsEmailSmtpDesc: 'Hosting, webmail or corporate email.',
  wsEmailGmailLabel: 'Gmail',
  wsEmailGmailDesc: 'Use smtp.gmail.com with an app password.',
  wsEmailOutlookLabel: 'Outlook / Microsoft 365',
  wsEmailOutlookDesc: 'Use Microsoft 365 with SMTP AUTH enabled.',
  wsEmailGmailHelp: 'Gmail requires a Google app password. Do not use your normal password if two-factor authentication is enabled.',
  wsEmailOutlookHelp: 'Outlook and Microsoft 365 may require enabling SMTP AUTH or using an app password.',
  wsEmailCustomHelp: 'Use the manual configuration from your hosting provider: SMTP server, port, user and password.',
  wsEmailMitikusHelp: 'Replies go to the email you enter. Delivery is handled by MITIKUS infrastructure.',
  wsSenderName: 'Sender display name',
  wsSenderNamePlaceholder: 'Your company',
  wsReplyTo: 'Reply-to email',
  wsReplyToPlaceholder: 'you@yourcompany.com',
  wsSignature: 'Default signature',
  wsSignaturePlaceholder: 'Regards,\n{name}',
  wsSmtpTitle: 'SMTP configuration (outgoing)',
  wsSmtpServer: 'SMTP server',
  wsSmtpPort: 'Port',
  wsSmtpUser: 'User / email',
  wsSmtpPassword: 'Password',
  wsSmtpPasswordPlaceholder: 'Leave blank to keep current',
  wsSmtpTls: 'Use direct TLS (port 465)',
  wsImapTitle: 'IMAP configuration (inbox)',
  wsImapServer: 'IMAP server',
  wsImapPort: 'IMAP port',
  wsImapUser: 'IMAP user',
  wsImapPassword: 'IMAP password',
  wsImapPasswordPlaceholder: 'Leave blank if same as SMTP',
  wsImapTls: 'Use TLS (IMAPS, recommended)',
  wsImapNote: 'Passwords are encrypted before saving. If outgoing and incoming use the same email, you can leave the IMAP password blank.',
  wsEmailConnectionOk: 'Email connection successful. You can save this configuration.',
  wsEmailTest: 'Test connection',
  wsEmailTesting: 'Testing…',
  wsEmailTestOk: '✓ Connection OK',
  wsEmailSave: 'Save email',
  wsEmailSaving: 'Saving…',
  wsEmailSaved: '✓ Saved',
  wsEmailSaveError: 'Could not save email settings. Check your details and try again.',
  wsEmailTestError: 'Could not test the SMTP connection. Check the server and port.',
  wsNameSection: 'Workspace name',
  wsNameDesc: 'Visible in the sidebar and in invitation emails.',
  wsBrandColorSection: 'Brand colour',
  wsBrandColorDesc: 'Used for the logo initial when no image is set.',
  wsBrandColorPreview: 'Initial preview',
  wsBrandColorCustom: 'Custom colour',
  wsPermSection: 'Creation permissions',
  wsPermDesc: 'Control who can install tools and create missions in this workspace.',
  wsPermOnlyAdmins: 'Only Admins and Owners can create',
  wsPermOnlyAdminsActive: 'Active — Editors and below cannot install tools or create missions.',
  wsPermOnlyAdminsInactive: 'Disabled — All Editors can install tools and create missions.',
  wsPermOwnerOnly: 'Only the workspace Owner can change this setting.',
  wsPermSaved: '✓ Saved',
  wsSave: 'Save changes',
  wsSaving: 'Saving…',
  wsSaved: '✓ Saved',
  // Receipts page
  receiptsOffice: 'My Office',
  receiptsTitle: 'Expenses',
  receiptsSubtitle: 'Scan receipts and invoices — AI extracts the data automatically',
  // ReceiptsClient
  receiptsStatusPending: 'Pending',
  receiptsStatusReviewed: 'Reviewed',
  receiptsStatusAccounted: 'Accounted',
  receiptsTotalMonth: 'Total this month',
  receiptsPendingReview: 'Pending review',
  receiptsCount: 'Receipts recorded',
  receiptsScan: 'Scan receipt',
  receiptsEmpty: 'No receipts recorded',
  receiptsEmptyHint: 'Scan your first receipt to get started',
  receiptsScanNow: 'Scan now →',
  receiptsNoVendor: 'No vendor',
  receiptsDetail: 'Detail',
  receiptsDelete: 'Delete',
  receiptsSelectHint: 'Select a receipt to see details',
  receiptsVendor: 'Vendor',
  receiptsDate: 'Date',
  receiptsTotal: 'Total',
  receiptsTaxBase: 'Tax base',
  receiptsTax: 'Tax',
  receiptsCategory: 'Category',
  receiptsNotes: 'Notes',
  receiptsStatus: 'Status',
  receiptsLines: 'Lines',
  // Usage page
  usageTitle: 'Plan usage',
  usagePlanSection: 'Account & plan',
  usagePlanTrialing: 'In trial',
  usagePlanActive: 'Active',
  usagePlanBlocked: 'Blocked',
  usageAISection: 'Your plan AI usage',
  usageAIGenerations: 'AI generations this month',
  usageTools: 'Tools installed',
  usageBrain: 'Brain queries this month',
  usageUnlimited: 'unlimited',
  usageGenPerMonth: 'Generations/month',
  usageBrainPerMonth: 'Brain/month',
  usageToolsLabel: 'Tools',
  usageUsers: 'Users',
  usageWorkspaces: 'Workspaces',
  usageReuseSection: 'Reuse',
  usageCatalogSearches: 'Catalogue searches',
  usageToolsReused: 'Tools reused',
  usageGenerations: 'Generations',
  usageReuseRate: 'Reuse rate',
  usageReuseRateDesc: '{reused} of {total} searches resulted in install or fork instead of generating a new one.',
  usageStorageSection: 'Storage',
  usageStorageLabel: 'Files in this workspace',
  usageStorageFiles: 'files stored',
  usageManageFiles: 'Manage files →',
  usageActivitySection: 'Accumulated activity',
  usageContracts: 'Contracts created',
  usageInvoices: 'Invoices issued',
  usageTotalInvoiced: 'Total invoiced',
  usageViewContracts: 'View contracts →',
  usageViewInvoices: 'View invoices →',
  usageUpgradeCta: 'Activate a plan to remove limits',
  usageUpgradeDesc: 'More AI generations, more storage, more users and Brain access.',
  usageViewPlans: 'View plans →',
  usageTodaySection: 'Today',
  usageInputTokens: 'Input tokens',
  usageOutputTokens: 'Output tokens',
  usageTotalTokens: 'Total tokens',
  usageEstimatedCost: 'Estimated cost (org)',
  usageDailyLimits: 'Daily limits',
  usageLimitUser: 'You (personal)',
  usageLimitWorkspace: 'Workspace',
  usageLimitSystem: 'System (global)',
  usageLimitCost: 'Estimated cost (global)',
  usageLimitsReset: 'Limits reset automatically at 00:00 UTC.',
  usageRemainingText: 'You can generate {personal} more tools today (personal limit) and {workspace} in this workspace.',
  usageDailyRunsToday: 'Runs today',
  usageDailyRunsMonth: 'Runs this month',
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
  todayGreetingMorning: 'Buenos días',
  todayGreetingAfternoon: 'Buenas tardes',
  todayGreetingEvening: 'Buenas noches',
  todayFallbackName: 'equipo',
  todayArkosStepTitle: 'Describe tu negocio a Arkos',
  todayArkosStepDescription: 'Cuéntale qué hace tu empresa para que pueda ayudarte a planificar.',
  todayClientStepTitle: 'Añade tu primer cliente',
  todayClientStepDescription: 'Registra la empresa o persona a quien prestas servicio.',
  todayTaskStepTitle: 'Crea tu primera tarea',
  todayTaskStepDescription: 'Organiza el trabajo pendiente con etiquetas y prioridades.',
  todayInvoiceStepTitle: 'Emite tu primera factura',
  todayInvoiceStepDescription: 'Genera un PDF listo para enviar a tu cliente.',
  todayFiscalStepTitle: 'Activa el calendario fiscal',
  todayFiscalStepDescription: 'Configura tu forma jurídica para ver tus obligaciones tributarias.',
  todayTimeTracking: 'Control horario',
  todayViewHistory: 'Ver historial',
  todayMyTasks: 'Mis tareas',
  todayViewAll: 'Ver todas',
  todayAllCaughtUpTitle: 'Todo al día. Buen trabajo.',
  todayAllCaughtUpDescription: 'No tienes pasos ni workflows pendientes.',
  todayAskArkosMission: 'Pedir a Arkos una nueva misión',
  todayPendingSteps: 'Mis pasos pendientes',
  todayGoToStep: 'Ir al paso',
  todayWorkflows: 'Flujos',
  todayPending: 'Pendiente',
  todayOpenWorkflow: 'Abrir flujo',
  todayTeamActivity: 'Actividad del equipo hoy',
  todayStatusQueued: 'En cola',
  todayStatusRunning: 'Ejecutando',
  todayStatusCompleted: 'Completado',
  todayStatusFailed: 'Fallido',
  todayStatusCancelled: 'Cancelado',
  todayClockNotStarted: 'Sin fichar',
  todayClockElapsedPrefix: 'Llevas',
  todayClockInLabel: 'Entrada',
  todayClockCompleted: 'Jornada completada',
  todayClockInAction: 'Fichar entrada',
  todayClockOutAction: 'Fichar salida',
  todayClockWorking: 'Fichando...',
  todayClockInError: 'No se pudo registrar la entrada. Inténtalo de nuevo.',
  todayClockOutError: 'No se pudo registrar la salida. Inténtalo de nuevo.',
  todayContractsPending: 'Contratos pendientes',
  todayContractDraft: 'Borrador',
  todayContractSent: 'Enviado',
  todayInvoicesPendingCollection: 'Facturas pendientes de cobro',
  todayInvoiceUnpaidSingular: 'factura sin cobrar',
  todayInvoiceUnpaidPlural: 'facturas sin cobrar',
  todayFiscal: 'Fiscal',
  todayFiscalSetupTitle: 'Configura tu perfil fiscal',
  todayFiscalSetupDescription: 'Activa el calendario de obligaciones tributarias para tu forma jurídica.',
  todayConfigure: 'Configurar',
  todayUpcomingFiscal: 'Próximas obligaciones fiscales',
  todayViewCalendar: 'Ver calendario',
  todayToday: 'Hoy',
  todayCalculate: 'Calcular',
  todayRecentNotebooks: 'Notebooks recientes',
  todaySourceSingular: 'fuente',
  todaySourcePlural: 'fuentes',
  todayFirstSteps: 'Primeros pasos',
  todayCompletedProgress: 'completados',
  toolsInstalledTitle: 'Herramientas instaladas',
  toolsInstalledDescription: 'Pequeñas apps para tareas concretas de tu negocio: auditorías, checklists, informes...',
  toolsGenerate: 'Generar',
  toolsAdd: 'Añadir',
  toolsActive: 'Activa',
  toolsOpen: 'Abrir',
  toolsCategoryAudit: 'Auditoría',
  toolsCategoryEvaluation: 'Evaluación',
  toolsCategoryChecklist: 'Checklist',
  toolsCategoryCrm: 'CRM',
  toolsCategoryReport: 'Informes',
  toolsCategoryHr: 'RRHH',
  toolsCategoryOperations: 'Operaciones',
  toolsCategoryFinance: 'Finanzas',
  toolsCategoryCustom: 'Personalizado',
  toolsEmptyTitle: 'Instala tu primera herramienta',
  toolsEmptyDescription: 'En menos de un minuto tendrás una auditoría lista para ejecutar con tu primer cliente.',
  toolsInstalling: 'Instalando...',
  toolsViewCatalog: 'Ver catálogo completo',
  toolsShortcutItAudit: 'Auditoría de seguridad IT',
  toolsShortcutItAuditDescription: 'Controles, accesos, infraestructura y vulnerabilidades.',
  toolsShortcutGdprAudit: 'Cumplimiento RGPD',
  toolsShortcutGdprAuditDescription: 'Tratamiento de datos, base legal y medidas de seguridad.',
  toolsShortcutDigitalMaturity: 'Madurez digital',
  toolsShortcutDigitalMaturityDescription: 'Nivel de digitalización y prioridades de transformación.',
  toolsShortcutPopular: 'La más popular',
  toolInvalidSchema: 'Schema de herramienta inválido.',
  toolNewEntry: 'Nueva entrada',
  toolAiIdeas: 'Ideas con IA',
  toolImportCsv: 'Importar CSV',
  toolNoRecords: 'Aún no hay registros en esta herramienta.',
  toolType: 'Tipo',
  toolDate: 'Fecha',
  toolActions: 'Acciones',
  toolForm: 'Formulario',
  toolApprovalPending: 'Pendiente',
  toolApprovalApproved: 'Aprobada',
  toolApprovalRejected: 'Rechazada',
  toolApprovalOnHold: 'En espera',
  toolRecordSingular: 'registro',
  toolRecordPlural: 'registros',
  toolDelete: 'Eliminar',
  toolDeleting: 'Eliminando...',
  toolDeleteConfirm: '¿Eliminar este registro? Esta acción no se puede deshacer.',
  toolNavRecords: 'Registros',
  toolNavRunAi: 'Ejecutar IA',
  toolNavAiHistory: 'Historial IA',
  toolNavSettings: 'Ajustes',
  toolNavAria: 'Secciones de herramienta',
  toolReplay: 'Reejecución',
  toolInputVariables: 'Variables de entrada',
  toolInputDescription: 'Rellena los campos para personalizar el output de la IA',
  toolContextFilled: 'Algunos campos se han rellenado desde el contexto de tu empresa',
  toolSelectOption: 'Selecciona una opción',
  toolYes: 'Sí',
  toolNoVariables: 'Esta herramienta no requiere variables. Ejecuta directamente.',
  toolRun: 'Ejecutar',
  toolGenerating: 'Generando...',
  toolResult: 'Resultado de la ejecución',
  toolResultDescription: 'Rellena las variables y pulsa "Ejecutar" para generar el output de',
  toolLoadingDescription: 'Esto puede tardar unos segundos',
  toolExecutionErrorTitle: 'Error en la ejecución',
  toolUnknownError: 'Error desconocido',
  toolConnectionError: 'Error de conexión. Inténtalo de nuevo.',
  toolMetaModel: 'Modelo',
  toolMetaTokens: 'Tokens',
  toolMetaCost: 'Coste',
  toolMetaTime: 'Tiempo',
  toolMissionUpdateError: 'No se pudo actualizar la misión. Inténtalo de nuevo.',
  toolSaveSocialTitle: 'Guardar esta idea como publicación',
  toolSaveSocialDescription: 'Crea un borrador en MITIKUS con el resultado generado. No publica en redes externas.',
  toolDraftSaved: 'Borrador guardado correctamente.',
  toolSaving: 'Guardando...',
  toolSaved: 'Guardado',
  toolSaveDraft: 'Guardar como borrador',
  toolViewPosts: 'Ver publicaciones',
  toolMissionStepGenerated: 'Resultado generado: esto completa el paso de tu misión.',
  toolMissionStepGeneratedDescription: 'Vuelve a la misión para marcarlo como hecho. El progreso y la siguiente acción se actualizan solos.',
  toolUpdatingMission: 'Actualizando misión...',
  toolBackToMissionDone: 'Volver a la misión y marcar como hecho',
  toolContinueWith: '¿Continuar con...?',
  toolUse: 'Usar',
  toolNewExecution: 'Nueva ejecución',
  toolBackWithoutDone: 'Volver sin marcar como hecho',
  toolHistoryTitle: 'Historial de ejecuciones IA',
  toolNoExecutionsYet: 'Sin ejecuciones aún',
  toolHistoryEmptyTitle: 'Sin historial',
  toolHistoryEmptyDescription: 'Las ejecuciones IA aparecerán aquí una vez que ejecutes la herramienta.',
  toolRunNow: 'Ejecutar ahora',
  toolDuration: 'Duración',
  toolRerunTitle: 'Reejecutar con las mismas variables',
  toolRerun: 'Reejecutar',
  toolExecutionSingular: 'ejecución',
  toolExecutionPlural: 'ejecuciones',
  toolNoResult: 'No hay resultado disponible para esta ejecución.',
  toolVariablesUsed: 'Variables utilizadas',
  toolTelemetry: 'Telemetría',
  toolProvider: 'Proveedor',
  toolInputTokens: 'Tokens entrada',
  toolOutputTokens: 'Tokens salida',
  toolTotalTokens: 'Total tokens',
  toolEstimatedCost: 'Coste estimado',
  toolRerunWithData: 'Reejecutar con estos datos',
  toolCleanExecution: 'Nueva ejecución limpia',
  toolImportRecordsTitle: 'Importar registros desde CSV',
  toolImportRecordsDescription: 'Sube un fichero CSV. Las cabeceras deben coincidir con los nombres de campo de la herramienta. Descarga la plantilla si no tienes el formato.',
  toolCsvEmptyError: 'El fichero está vacío o no tiene cabeceras.',
  toolCsvOnlyError: 'Solo se admiten ficheros .csv',
  toolImportUnexpectedError: 'Error inesperado al importar.',
  toolCsvTemplateFilename: 'plantilla.csv',
  toolCsvDrop: 'Arrastra un CSV aquí o haz clic para seleccionar',
  toolCsvOnlyUtf8: 'Solo ficheros .csv · UTF-8',
  toolDownloadCsvTemplate: 'Descargar plantilla CSV',
  toolColumnMapping: 'Mapeo de columnas',
  toolRequired: 'obligatorio',
  toolMissingRequiredColumns: 'Faltan columnas obligatorias',
  toolMissingRequiredColumnsSuffix: 'No se podrán importar registros válidos.',
  toolPreview: 'Vista previa',
  toolPreviewFirstRows: 'primeras filas',
  toolPreviewRows: 'filas',
  toolImporting: 'Importando...',
  toolImportRecords: 'Importar registros',
  toolChangeFile: 'Cambiar fichero',
  toolImportedSingular: 'registro importado',
  toolImportedPlural: 'registros importados',
  toolSkippedSingular: 'fila omitida',
  toolSkippedPlural: 'filas omitidas',
  toolSkippedReason: 'campos obligatorios vacíos o límite de plan',
  toolViewRecords: 'Ver registros',
  toolApprovalRequest: 'Solicitud',
  toolApprovalRequestDate: 'Fecha solicitud',
  toolApprovalHistory: 'Historial',
  toolApprovalDecision: 'Decisión',
  toolApprovalReason: 'Motivo',
  toolApprovalReasonRequired: 'obligatorio',
  toolApprovalReasonPlaceholder: 'Indica el motivo de tu decisión...',
  toolApprovalCommentOptional: 'Comentario (opcional)',
  toolApprovalCommentPlaceholder: 'Añade un comentario a tu decisión...',
  toolApprovalMissingReason: 'Indica el motivo del rechazo.',
  toolApprovalSaving: 'Guardando...',
  toolApprovalApproveAction: 'Aprobar',
  toolApprovalRejectAction: 'Rechazar',
  toolApprovalHoldAction: 'Poner en espera',
  toolApprovalConfirmReject: 'Confirmar rechazo',
  toolSettingsTitle: 'Configuración de la instalación',
  toolSettingsDescription: 'Ajusta el proveedor IA, modelo, creatividad y formato de salida para esta herramienta.',
  toolSettingsLinkedClient: 'Cliente vinculado',
  toolSettingsLinkedClientDescription: 'Asocia esta herramienta a un cliente para que aparezca en su expediente.',
  toolSettingsNoClient: 'Sin cliente',
  toolSettingsSave: 'Guardar',
  toolSettingsNoClientsYet: 'Aún no tienes clientes en este workspace.',
  toolSettingsCreateClient: 'Crear cliente',
  toolSettingsAiModel: 'Modelo IA',
  toolSettingsAiModelDescription: 'Elige el proveedor y modelo que usará esta herramienta al ejecutarse',
  toolSettingsProvider: 'Proveedor',
  toolSettingsModel: 'Modelo',
  toolSettingsCreativity: 'Creatividad',
  toolSettingsCreativityDescription: 'Controla la aleatoriedad y creatividad de las respuestas',
  toolSettingsTemperature: 'Temperatura',
  toolSettingsTemperatureHint: '0 = determinista y preciso · 1 = más creativo y variado',
  toolSettingsModelDefault: 'Por defecto del modelo',
  toolSettingsTopPHint: 'Controla la diversidad de tokens candidatos. Solo modifica si sabes lo que haces.',
  toolSettingsOutput: 'Salida',
  toolSettingsOutputDescription: 'Idioma, formato y longitud máxima de las respuestas',
  toolSettingsResponseLanguage: 'Idioma de respuesta',
  toolSettingsResponseFormat: 'Formato de respuesta',
  toolSettingsMaxOutputTokens: 'Tokens máximos de salida',
  toolSettingsMaxOutputTokensHint: 'Vacío = máximo del modelo. Reducir limita la longitud de respuesta.',
  toolSettingsMaxModel: 'Máximo del modelo',
  toolSettingsCustomInstructions: 'Instrucciones personalizadas',
  toolSettingsCustomInstructionsDescription: 'Ajusta o sustituye el comportamiento de la IA para esta instalación',
  toolSettingsAdditionalInstructions: 'Instrucciones adicionales',
  toolSettingsAdditionalInstructionsHint: 'Se añaden al final del prompt del sistema. Usa esto para añadir contexto de tu empresa, formato de salida específico, etc.',
  toolSettingsAdditionalInstructionsPlaceholder: 'Ejemplo: Nuestro estilo de informes es conciso y ejecutivo. Siempre incluye una sección de próximos pasos.',
  toolSettingsSystemPromptOverride: 'Sustituir prompt del sistema completo',
  toolSettingsSystemPromptOverrideHint: 'Avanzado — reemplaza por completo el prompt de sistema generado. Deja vacío para usar el prompt automático de la herramienta.',
  toolSettingsSystemPromptOverridePlaceholder: 'Escribe aquí el prompt de sistema personalizado (opcional)...',
  toolSettingsChangesNextRun: 'Los cambios se aplican en la próxima ejecución',
  toolSettingsSaved: 'Guardado',
  toolSettingsSaveConfig: 'Guardar configuración',
  toolStatusPending: 'Pendiente',
  toolStatusRunning: 'Ejecutando...',
  toolStatusCompleted: 'Completado',
  toolStatusFailed: 'Error',
  toolStatusCancelled: 'Cancelado',
  toolSelectPlaceholder: 'Selecciona una opción',
  toolFieldRequiredErrorPrefix: 'El campo "',
  toolFieldRequiredErrorSuffix: '" es obligatorio.',
  toolItemRequiredErrorPrefix: 'El ítem "',
  toolItemRequiredErrorSuffix: '" es obligatorio.',
  toolChecklistCompleted: 'completados',
  toolChecklistRequired: 'Obligatorio',
  toolChecklistUpdate: 'Actualizar checklist',
  toolChecklistSave: 'Guardar checklist',
  toolScoringTotal: 'Puntuación total',
  toolScoringPassingMinimum: 'Mínimo para pasar',
  toolScoringUpdate: 'Actualizar evaluación',
  toolScoringSave: 'Guardar evaluación',
  toolEditRecord: 'Editar registro',
  toolNewChecklist: 'Nuevo checklist',
  toolEditChecklist: 'Editar checklist',
  toolNewScoring: 'Nueva evaluación',
  toolEditScoring: 'Editar evaluación',
  toolNewApprovalRequest: 'Nueva solicitud',
  toolSubmitApprovalRequest: 'Enviar solicitud',
  toolNoApprovalPermission: 'No tienes permisos para crear solicitudes en esta herramienta.',
  toolAutoApproveBelowPrefix: 'Las solicitudes con importe inferior a',
  toolAutoApproveBelowSuffix: 'se aprueban automáticamente.',
  toolApprovalWillRemainPending: 'Tu solicitud quedará pendiente de aprobación por un responsable.',
  missionsTitle: 'Misiones',
  missionsDescription: 'Objetivos estratégicos y su seguimiento de ejecución',
  missionsNewWithArkos: 'Nueva misión con Arkos',
  missionsFilterAll: 'Todas',
  missionsFilterActive: 'Activas',
  missionsFilterCompleted: 'Completadas',
  missionsFilterPaused: 'Pausadas',
  missionsFilterCancelled: 'Canceladas',
  missionsStatusActive: 'Activa',
  missionsStatusCompleted: 'Completada',
  missionsStatusPaused: 'Pausada',
  missionsStatusCancelled: 'Cancelada',
  missionsPriorityCritical: 'Crítica',
  missionsPriorityHigh: 'Alta',
  missionsPriorityMedium: 'Media',
  missionsPriorityLow: 'Baja',
  missionsEmptyAllTitle: 'Aún no hay misiones',
  missionsEmptyFilteredTitle: 'No hay misiones en este estado',
  missionsEmptyDescription: 'Las misiones son objetivos estratégicos con pasos de ejecución. Créalas con Arkos o desde el panel principal.',
  missionsCreateFirstWithArkos: 'Crear primera misión con Arkos',
  missionsStepSingular: 'paso',
  missionsStepPlural: 'pasos',
  missionsTaskSingular: 'tarea',
  missionsTaskPlural: 'tareas',
  missionsDuePrefix: 'Vence',
  missionsCompletedPrefix: 'Completada',
  missionStatusPausedAlt: 'En pausa',
  missionStateNew: 'Nueva',
  missionStateReady: 'Lista para empezar',
  missionStateInProgress: 'En progreso',
  missionStateWaitingUser: 'Esperando a que continúes',
  missionStateWaitingAi: 'La IA está trabajando',
  missionStateBlocked: 'Bloqueada',
  missionStateCompleted: 'Completada',
  missionStateArchived: 'Archivada',
  missionStepStatusPending: 'Pendiente',
  missionStepStatusInProgress: 'En progreso',
  missionStepStatusCompleted: 'Completado',
  missionStepStatusSkipped: 'Omitido',
  missionStepStatusBlocked: 'Bloqueado',
  missionActorUser: 'Tú',
  missionActorAi: 'IA',
  missionActorShared: 'Compartido',
  missionDueDate: 'Fecha límite',
  missionProgressTitle: 'Progreso de la misión',
  missionCompletedSteps: 'Pasos completados',
  missionPendingStepsMetric: 'Pendientes',
  missionRemainingTime: 'Tiempo restante',
  missionCompletedValue: 'Completado',
  missionExpectedImpact: 'Impacto esperado',
  missionImpactCritical: 'Crítico',
  missionImpactHigh: 'Alto',
  missionImpactMedium: 'Medio',
  missionNextAction: 'Próxima acción',
  missionOpenTool: 'Abrir herramienta',
  missionWhyTitle: 'Por qué importa',
  missionDefaultWhyHigh: 'Esta misión está marcada como prioridad alta para el negocio: conviene resolverla cuanto antes.',
  missionDefaultWhyNormal: 'Esta misión forma parte de los objetivos activos de la empresa.',
  missionDefaultBenefitHigh: 'Alto impacto: desbloquea capacidades y mejora el conocimiento de la empresa.',
  missionDefaultBenefitMedium: 'Impacto moderado: avanza el conocimiento y la operativa de la empresa.',
  missionDefaultBenefitLow: 'Impacto puntual: mejora un aspecto concreto de la operativa.',
  missionUnlocks: 'Desbloqueará',
  missionDepartmentsAffected: 'Departamentos afectados',
  missionImpactTitle: 'Impacto esperado',
  missionImpact: 'Impacto',
  missionUrgency: 'Urgencia',
  missionEffort: 'Esfuerzo',
  missionHighRisk: 'Riesgo alto si se pospone',
  missionTimeline: 'Línea temporal',
  missionStepsTitle: 'Pasos de la misión',
  missionLinkedWorkflow: 'Flujo asociado',
  missionLinkedWorkflowTitle: 'Flujo vinculado a esta misión',
  missionLinkedWorkflowDescription: 'Ver el proceso automatizado asociado',
  missionOpenWorkflow: 'Abrir flujo',
  missionNeedHelp: '¿Necesitas ayuda con esta misión?',
  missionNeedHelpDescription: 'Arkos puede guiarte, crear pasos y recomendar herramientas.',
  missionOpenArkos: 'Abrir Arkos',
  missionResponsibleTitle: 'Responsable',
  missionInstallTool: 'Instalar herramienta',
  missionNoStepsTitle: 'Esta misión no tiene pasos definidos todavía.',
  missionNoStepsDescription: 'Define los pasos para saber exactamente qué hacer, en qué orden y con qué herramienta.',
  missionDefineStepsWithArkos: 'Definir pasos con Arkos',
  missionMarkPendingTitle: 'Marcar como pendiente',
  missionUndoCompletedLabel: 'Deshacer completado',
  missionRecoverStepTitle: 'Recuperar paso',
  missionRecoverSkippedLabel: 'Recuperar paso omitido',
  missionStartStep: 'Iniciar',
  missionCompleteStep: 'Completar',
  missionSkipStepTitle: 'Omitir paso',
  missionSkipStepLabel: 'Omitir paso',
  missionAiNextRecommendations: 'Recomendamos a continuación',
  missionAiSuggestion: 'Sugerencia de IA',
  missionAiThinking: 'Pensando...',
  missionAiRegenerate: 'Regenerar',
  missionAiRequest: 'Pedir sugerencia IA',
  missionAiError: 'No se pudo generar la sugerencia. Inténtalo de nuevo.',
  missionAiGeneratingNext: 'Generando recomendaciones de próximas misiones...',
  missionAiAskHelp: 'Pide una sugerencia si dudas sobre cómo continuar.',
  clientsTitle: 'Clientes',
  clientsDescription: 'Empresas o personas a las que prestas servicio: vincula herramientas y misiones a cada una',
  clientsNew: 'Nuevo cliente',
  clientsEmptyTitle: 'Añade tu primer cliente',
  clientsEmptyDescription: 'Vincula cada auditoría, documento y contrato a una empresa. Todo ordenado, siempre localizable.',
  clientsAdd: 'Añadir cliente',
  clientsTypeClient: 'Cliente',
  clientsTypeCompany: 'Empresa',
  clientsTypeFreelancer: 'Autónomo',
  clientsTypeIndividual: 'Particular',
  clientsTypePatient: 'Paciente',
  clientsTypeStudent: 'Alumno',
  clientsTypeAthlete: 'Deportista',
  clientsTypeEvent: 'Evento',
  clientsContactPrefix: 'Contacto',
  clientsViewDossier: 'Ver expediente',
  clientsEdit: 'Editar',
  clientsEditTitle: 'Editar cliente',
  clientsTypeLabel: 'Tipo',
  clientsTypeClientNameLabel: 'Cliente',
  clientsTypeClientNamePlaceholder: 'Empresa, autónomo o persona',
  clientsTypeClientContactLabel: 'Persona de contacto',
  clientsTypeClientContactPlaceholder: 'Solo si es distinta del cliente',
  clientsTypeCompanyNameLabel: 'Empresa',
  clientsTypeCompanyNamePlaceholder: 'Nombre de la empresa',
  clientsTypeCompanyContactPlaceholder: 'Nombre de la persona con la que tratas',
  clientsTypeFreelancerNameLabel: 'Nombre profesional',
  clientsTypeFreelancerNamePlaceholder: 'Nombre del profesional o marca',
  clientsTypeFreelancerContactPlaceholder: 'Opcional, si no coincide',
  clientsTypeIndividualNameLabel: 'Nombre completo',
  clientsTypeIndividualNamePlaceholder: 'Nombre de la persona',
  clientsTypeIndividualContactLabel: 'Contacto alternativo',
  clientsTypeIndividualContactPlaceholder: 'Opcional',
  clientsTypePatientNameLabel: 'Paciente',
  clientsTypePatientNamePlaceholder: 'Nombre del paciente',
  clientsTypePatientContactLabel: 'Contacto/tutor',
  clientsTypePatientContactPlaceholder: 'Opcional, útil si es menor o dependiente',
  clientsTypeStudentNameLabel: 'Alumno',
  clientsTypeStudentNamePlaceholder: 'Nombre del alumno',
  clientsTypeStudentContactLabel: 'Tutor/contacto',
  clientsTypeStudentContactPlaceholder: 'Padre, madre o tutor si aplica',
  clientsTypeAthleteNameLabel: 'Deportista',
  clientsTypeAthleteNamePlaceholder: 'Nombre del deportista',
  clientsTypeAthleteContactLabel: 'Contacto/entrenador',
  clientsTypeAthleteContactPlaceholder: 'Opcional',
  clientsTypeEventNameLabel: 'Evento',
  clientsTypeEventNamePlaceholder: 'Boda Laura y Andrés, sesión familiar...',
  clientsTypeEventContactPlaceholder: 'Quién coordina el evento',
  clientsContactHelp: 'Para autónomos o particulares puedes dejarlo vacío.',
  clientsPhone: 'Teléfono',
  clientsFiscalDataTitle: 'Datos fiscales para facturas',
  clientsFiscalDataDescription: 'Se mostrarán como datos del destinatario cuando emitas una factura a este cliente.',
  clientsCountry: 'País',
  clientsDefaultCountry: 'España',
  clientsFiscalAddress: 'Domicilio fiscal',
  clientsFiscalAddressPlaceholder: 'Calle, número, piso...',
  clientsPostalCode: 'Código postal',
  clientsCity: 'Ciudad',
  clientsProvince: 'Provincia / región',
  clientsSector: 'Sector',
  clientsSectorPlaceholder: 'Tecnología, Hostelería...',
  clientsNotes: 'Notas',
  clientsNotesPlaceholder: 'Información adicional...',
  clientsSaving: 'Guardando...',
  clientsCreating: 'Creando...',
  clientsSaveChanges: 'Guardar cambios',
  clientsArchive: 'Archivar',
  clientsArchiving: 'Archivando...',
  clientsArchiveConfirm: '¿Archivar este cliente? Se ocultará de la lista.',
  clientsSince: 'Desde',
  clientsSendEmail: 'Enviar correo',
  clientsFiscalDataShort: 'Datos fiscales',
  clientsClientCompany: 'Cliente / Empresa',
  clientsPostalCityProvince: 'CP / ciudad / provincia',
  clientsTools: 'Herramientas',
  clientsExecutions: 'Ejecuciones',
  clientsAiCost: 'Coste IA',
  clientsFiles: 'Archivos',
  clientsLinkTool: 'Vincular herramienta',
  clientsNoLinkedTools: 'No hay herramientas vinculadas a este cliente.',
  clientsGoToTools: 'Ir a Herramientas',
  clientsExecutionSingular: 'ejecución',
  clientsExecutionPlural: 'ejecuciones',
  clientsLastPrefix: 'Última',
  clientsRun: 'Ejecutar',
  clientsHistory: 'Historial',
  clientsRecentExecutions: 'Últimas ejecuciones',
  clientsDate: 'Fecha',
  clientsTool: 'Herramienta',
  clientsStatus: 'Estado',
  clientsCost: 'Coste',
  clientsUser: 'Usuario',
  clientsView: 'Ver',
  clientsFilesDescription: 'Expediente documental vinculado a este cliente. También queda guardado en Mi Office.',
  clientsUploadFile: 'Subir archivo',
  clientsUploading: 'Subiendo...',
  clientsUploadFolderLabel: 'Carpeta para nuevas subidas',
  clientsNoFolder: 'Sin carpeta',
  clientsNewFolder: 'Nueva carpeta',
  clientsNewFolderPlaceholder: 'Contratos, Informes...',
  clientsCreate: 'Crear',
  clientsFileTypeDoc: 'Documento',
  clientsFileTypeSheet: 'Hoja',
  clientsFileTypePdf: 'PDF',
  clientsFileTypeImage: 'Imagen',
  clientsFileTypeOther: 'Archivo',
  clientsFileUploadGenericError: 'No se pudo subir el archivo',
  clientsFileUploadError: 'No se pudo subir el archivo. Comprueba el tamaño y formato, e inténtalo de nuevo.',
  clientsFolderCreateError: 'No se pudo crear la carpeta. Inténtalo de nuevo.',
  clientsNoFiles: 'No hay archivos vinculados a este cliente.',
  clientsDropFilesHelp: 'Arrastra aquí contratos, PDFs, imágenes o cualquier documento relacionado.',
  clientsFolderPrefix: 'Carpeta',
  clientsDownload: 'Descargar',
  clientsPortalCopied: 'Enlace copiado',
  clientsPortal: 'Portal del cliente',
  // Leads
  leadsTitle: 'Leads',
  leadsSubtitle: 'Potenciales clientes — captados desde tu formulario público.',
  leadsNoLeads: 'Aún no tienes leads',
  leadsNoLeadsHelp: 'Comparte el enlace del formulario y empieza a captar potenciales clientes.',
  leadsName: 'Nombre',
  leadsStatus: 'Estado',
  leadsCompany: 'Empresa',
  leadsDate: 'Fecha',
  leadsPhone: 'Teléfono',
  leadsMessage: 'Mensaje',
  leadsInternalNotes: 'Notas internas',
  leadsSaveNotes: 'Guardar notas',
  leadsSaving: 'Guardando...',
  leadsNotesPlaceholder: 'Añade notas sobre este lead...',
  leadsConvert: 'Convertir a cliente',
  leadsConverted: '✓ Convertido en cliente',
  leadsDelete: 'Eliminar lead',
  leadsStatusNew: 'Nuevo',
  leadsStatusContacted: 'Contactado',
  leadsStatusQualified: 'Cualificado',
  leadsStatusLost: 'Perdido',
  leadsConvertConfirmPrefix: '¿Convertir a ',
  leadsConvertConfirmSuffix: ' en cliente?',
  leadsDeleteConfirmPrefix: '¿Eliminar el lead de ',
  leadsDeleteConfirmSuffix: '?',
  // History
  historyTitle: 'Historial de trabajo',
  historySubtitle: 'Todo el historial de trabajo en este workspace',
  historyExecutions: 'Ejecuciones',
  historyCompleted: 'Completadas',
  historyAiCost: 'Coste total IA',
  historyEmpty: 'Sin historial todavía',
  historyEmptyDescription: 'Las ejecuciones IA de tus herramientas aparecerán aquí.',
  historyGoToTools: 'Ir a Herramientas',
  historyDate: 'Fecha',
  historyTool: 'Herramienta',
  historyStatus: 'Estado',
  historyTokens: 'Tokens',
  historyCost: 'Coste',
  historyDuration: 'Duración',
  historyUser: 'Usuario',
  historyActions: 'Acciones',
  historyRerun: '↻ Reejecutar',
  historyView: 'Ver',
  historyRetry: '↻ Reintentar',
  historyFooterSingular: 'ejecución',
  historyFooterPlural: 'ejecuciones',
  historyFooterCostLabel: 'Coste total:',
  historyRerunTitle: 'Reejecutar con las mismas variables',
  // Analytics
  analyticsTitle: 'Analytics',
  analyticsSubtitle: 'Uso de IA, ejecuciones y costes del workspace',
  analyticsAiCost: 'Coste IA',
  analyticsTokens: 'Tokens usados',
  analyticsExecutions: 'Ejecuciones',
  analyticsSuccessRate: 'Tasa de éxito',
  analyticsAvgTime: 'Tiempo medio',
  analyticsAvgCost: 'Coste medio',
  analyticsTotalExecsMicro: 'ejecuciones totales',
  analyticsTokensSumMicro: 'Suma de input + output tokens',
  analyticsWorkflowsMicroPrefix: '+ ',
  analyticsWorkflowsMicroSuffix: ' workflows completos',
  analyticsSuccessRateMicro: 'Completadas / finalizadas',
  analyticsAvgTimeMicro: 'Por ejecución de herramienta',
  analyticsAvgCostMicro: 'Por ejecución',
  analyticsCostByDayTitle: 'Coste IA por día',
  analyticsCostByMonthTitle: 'Coste IA por mes',
  analyticsExecutionStatus: 'Estado de ejecuciones',
  analyticsTopTools: 'Herramientas más usadas',
  analyticsProviderBreakdown: 'Distribución por proveedor',
  analyticsAiModels: 'Modelos IA',
  analyticsWorkflowsExecuted: 'Flujos ejecutados',
  analyticsExecutionsByDayTitle: 'Ejecuciones por día',
  analyticsExecutionsByMonthTitle: 'Ejecuciones por mes',
  analyticsUserActivity: 'Actividad por usuario',
  analyticsAccessRestricted: 'Acceso restringido',
  analyticsAdminOnly: 'Solo los administradores del workspace pueden ver la analítica.',
  analyticsTotalLabel: 'Total:',
  analyticsExecsSuffix: 'ejecuciones',
  analyticsEmptyTools: 'Sin herramientas ejecutadas',
  analyticsEmptyModels: 'Sin datos de modelo',
  analyticsEmptyWorkflows: 'Sin workflows ejecutados',
  analyticsEmptyUsers: 'Sin actividad de usuario',
  analyticsFailRateLabel: 'fallo ',
  analyticsExecUnitShort: 'ejec.',
  // Office
  officeTitle: 'Mi Office',
  officeSubtitle: 'Tus herramientas de documento y gestión',
  officeDocumentsSection: 'Documentos',
  officeFiscalSection: 'Fiscal (España)',
  officeQuarterly: 'Trimestral',
  officeAnnual: 'Anual',
  officeSeeCalendar: 'Ver calendario →',
  officeToolDocs: 'Documentos',
  officeToolDocsSubtitle: 'Redacta y edita con IA',
  officeToolContracts: 'Contratos',
  officeToolContractsSubtitle: 'Firma electrónica',
  officeToolInvoices: 'Facturas',
  officeToolInvoicesSubtitle: 'PDF descargable',
  officeToolSheets: 'Hojas de cálculo',
  officeToolSheetsSubtitle: 'Datos y presupuestos',
  officeToolPdfs: 'PDFs',
  officeToolPdfsSubtitle: 'Visor y búsqueda',
  officeToolPresentations: 'Presentaciones',
  officeToolPresentationsSubtitle: 'Crea y comparte',
  officeToolNotebooks: 'Notebooks',
  officeToolNotebooksSubtitle: 'Sintetiza con IA',
  officeToolReceipts: 'Gastos',
  officeToolReceiptsSubtitle: 'OCR por cámara',
  officeToolFiles: 'Archivos',
  officeToolFilesSubtitle: 'Carpetas y ficheros',
  // Audit
  auditTitle: 'Auditoría',
  auditSubtitlePrefix: 'Rastro de auditoría · ',
  auditSubtitleSuffix: ' eventos',
  auditExportCsv: 'Exportar CSV',
  auditFiltersLabel: 'Filtros',
  auditTotalEvents: 'Total eventos',
  auditErrors: 'Errores',
  auditDenied: 'Denegados',
  auditEventsLabel: 'Eventos',
  auditPageLabel: 'Página ',
  auditPageOf: ' de ',
  auditPrev: '← Anterior',
  auditNext: 'Siguiente →',
  auditAccessRestricted: 'Acceso restringido',
  auditAdminOnly: 'Solo los administradores del workspace pueden ver el registro de auditoría.',
  // Workflows
  workflowsTitle: 'Flujos',
  workflowsSubtitle: 'Cadenas de herramientas inteligentes',
  workflowsNew: '+ Nuevo flujo',
  workflowsHowItWorksTitle: '¿Cómo funciona un flujo?',
  workflowsStep1Title: 'Elige las herramientas',
  workflowsStep1Description: 'Combina cualquier herramienta instalada en tu workspace: analizadores, generadores, extractores de datos…',
  workflowsStep2Title: 'Conecta los pasos',
  workflowsStep2Description: 'El resultado de cada herramienta pasa automáticamente como entrada a la siguiente. Sin copiar ni pegar.',
  workflowsStep3Title: 'Ejecútalo en un clic',
  workflowsStep3Description: 'Introduce el dato inicial y el flujo hace el resto. Revisa el historial de cada ejecución cuando quieras.',
  workflowsTemplatesTitle: 'Plantillas',
  workflowsTemplatesSubtitle: 'Flujos preconstruidos listos en un clic',
  workflowsMyWorkflows: 'Mis flujos',
  workflowsEmptyPrefix: 'Usa un template o ',
  workflowsEmptySuffix: '.',
  workflowsCreateFromScratch: 'crea un flujo desde cero',
  workflowsSteps: 'Pasos',
  workflowsExecutions: 'Ejecuciones',
  workflowsLastRun: 'Última ejecución',
  workflowsActiveTitle: 'Activo',
  workflowsInactiveTitle: 'Inactivo',
  // Home/workspace page
  homePanelSubtitle: 'Panel — qué es lo más importante que debes hacer hoy',
  homeMissionsTitle: 'Misiones activas',
  homeCreateMission: 'Crear misión →',
  homeActiveSingular: 'activa',
  homeActivePlural: 'activas',
  homeBlockedSingular: 'bloqueada',
  homeBlockedPlural: 'bloqueadas',
  homeOverdueSingular: 'vencida',
  homeOverduePlural: 'vencidas',
  homeDueSoonSingularSuffix: 'vence esta semana',
  homeDueSoonPluralSuffix: 'vencen esta semana',
  homeUnblockSingle: 'Para continuar, resuelve este bloqueo:',
  homeUnblockMultiPrefix: 'Para continuar, resuelve estos ',
  homeUnblockMultiSuffix: ' bloqueos:',
  homeResolveBlocker: 'Resolver bloqueo →',
  homeNoMissions: 'No hay misiones activas.',
  homeNoMissionsDesc: 'Cuéntale a Arkos un objetivo de tu empresa y lo convertirá en una misión con pasos claros, o usa una plantilla para empezar al instante.',
  homeDefineWithArkos: 'Definir con Arkos →',
  homePriorityCritical: 'Crítica',
  homePriorityHigh: 'Alta',
  homePriorityMedium: 'Media',
  homePriorityLow: 'Baja',
  homeDueOverdue: 'Vencida',
  homeDueSoonPrefix: 'Vence en ',
  homeDueSoonSuffix: 'd',
  homeFocusLabel: 'Foco de la jornada',
  homeNowLabel: 'Ahora',
  homeWhyFirstLabel: '¿Por qué primero?',
  homeWillUnlock: 'Desbloqueará:',
  homeTimeLabel: 'Tiempo:',
  homeStepsProgressSingular: 'paso',
  homeStepsProgressPlural: 'pasos',
  homeContinueMission: 'Continuar misión →',
  homeNowColon: 'Ahora:',
  // TrialBanner
  trialUrgentPrefix: '⚠️ Tu periodo de prueba termina en ',
  trialDaySingular: ' día',
  trialDayPlural: ' días',
  trialUrgentSuffix: '. No perderás nada si activas tu plan ahora.',
  trialNormalPrefix: 'Periodo de prueba · ',
  trialNormalSingularSuffix: ' día restante',
  trialNormalPluralSuffix: ' días restantes',
  trialActivate: 'Activar plan →',
  // LastExecutionWidget
  lastExecEmpty: 'Aún no has ejecutado ninguna herramienta.',
  lastExecSeeTools: 'Ver herramientas →',
  lastExecLabel: 'Última ejecución',
  lastExecDaysAgoPrefix: 'hace ',
  lastExecDaysAgoSuffix: 'd',
  lastExecHoursAgoPrefix: 'hace ',
  lastExecHoursAgoSuffix: 'h',
  lastExecJustNow: 'hace menos de 1h',
  lastExecRerun: 'Ejecutar de nuevo →',
  // MissionTemplateModal
  templateFromTemplate: 'Desde plantilla',
  templateModalTitle: 'Plantillas de misión',
  templateModalSubtitle: 'Elige una para empezar con los pasos ya definidos.',
  templateSteps: 'pasos',
  templateBackToList: '← Volver a plantillas',
  templateIncludedStepsPrefix: 'Pasos incluidos (',
  templateActorAI: '✨ IA',
  templateActorShared: '🤝 Compartido',
  templateActorUser: '👤 Tú',
  templateMinutes: 'min',
  templateError: 'No se pudo crear la misión. Inténtalo de nuevo.',
  templateBack: 'Atrás',
  templateCreating: 'Creando...',
  templateCreate: 'Crear misión',
  // GlobalSearch
  searchLabel: 'Buscar',
  searchGlobalLabel: 'Búsqueda global',
  searchPlaceholder: 'Busca entre documentos, clientes, contratos…',
  searchFilters: 'Filtros',
  searchClearFilters: 'Limpiar',
  searchTypeDoc: 'Documento',
  searchTypePdf: 'PDF',
  searchTypeContract: 'Contrato',
  searchTypeNotebook: 'Cuaderno',
  searchTypeSheet: 'Hoja de cálculo',
  searchTypePresentation: 'Presentación',
  searchTypeTask: 'Tarea',
  searchTypeMission: 'Misión',
  searchTypeClient: 'Cliente',
  searchTypeTool: 'Herramienta',
  searchCreatedBetween: 'Creado entre',
  searchModifiedBetween: 'Modificado entre',
  searchClearDates: 'Limpiar fechas',
  searchNoResults: 'Sin resultados para',
  searchNoResultsHint: 'Prueba a ampliar los filtros de fecha o tipo',
  searchMinChars: 'Escribe al menos 2 caracteres · Busca entre documentos, PDFs, contratos, hojas, presentaciones, tareas, misiones, clientes y herramientas',
  searchMinCharsFilters: 'Escribe al menos 2 caracteres para buscar con los filtros aplicados',
  searchCreated: 'Creado',
  searchModified: 'Modificado',
  searchNav: '↑↓ navegar',
  searchOpen: '↵ abrir',
  searchClose: 'Esc cerrar',
  searchResultsSuffix: 'resultado',
  searchRelativeToday: 'hoy',
  searchRelativeYesterday: 'ayer',
  searchRelativeDaysAgo: 'd atrás',
  searchRelativeWeeks: 'sem atrás',
  searchRelativeMonths: 'mes atrás',
  // TaskList
  tasksTitle: 'Tareas',
  tasksNew: 'Nueva tarea',
  tasksFilterAll: 'Todas',
  tasksFilterPending: 'Pendiente',
  tasksFilterInProgress: 'En curso',
  tasksFilterDone: 'Completada',
  tasksFilterMine: 'Solo las mías',
  tasksEmpty: 'Ninguna tarea coincide con estos filtros.',
  tasksCreateFirst: 'Crea la primera →',
  tasksPendingSingular: 'pendiente',
  tasksPendingPlural: 'pendientes',
  tasksTotal: 'total',
  // Analytics
  analyticsEmpty: 'Sin actividad en este periodo',
  analyticsEmptyHint: 'Ejecuta herramientas o workflows para ver métricas aquí.',
  analyticsNoExecutions: 'Sin ejecuciones',
  analyticsCompleted: 'Completadas',
  analyticsFailed: 'Fallidas',
  analyticsCancelled: 'Canceladas',
  analyticsRunning: 'En curso',
  analyticsPending: 'Pendientes',
  // Invoices
  invoicesTitle: 'Facturas',
  invoicesSubtitle: 'Crea y gestiona tus facturas. Descarga el PDF listo para enviar.',
  invoicesStatMonth: 'Emitido este mes',
  invoicesStatPending: 'Pendiente de cobro',
  invoicesStatPaid: 'Cobrado total',
  invoicesNew: 'Nueva factura',
  invoicesEmpty: 'No hay facturas todavía',
  invoicesCreateFirst: 'Crear primera factura',
  invoicesNoClient: 'Sin cliente',
  invoicesDue: 'Vence',
  invoicesSelectHint: 'Selecciona una factura para ver el detalle',
  invoicesStatusDraft: 'Borrador',
  invoicesStatusSent: 'Enviada',
  invoicesStatusPaid: 'Pagada',
  invoicesStatusOverdue: 'Vencida',
  invoicesStatusCancelled: 'Cancelada',
  invoicesSend: 'Enviar',
  invoicesReviewReplies: 'Revisar respuestas',
  invoicesReviewingReplies: 'Revisando…',
  invoicesView: 'Ver detalle',
  invoicesEdit: 'Editar',
  invoicesCreateRect: 'Crear rectificativa',
  invoicesDelete: 'Eliminar',
  invoicesColDesc: 'Descripción',
  invoicesColQty: 'Cant.',
  invoicesColUnit: 'P. unit.',
  invoicesColTotal: 'Total',
  invoicesSubtotal: 'Subtotal',
  invoicesVAT: 'IVA',
  invoicesTotal: 'Total',
  invoicesChangeStatus: 'Cambiar estado:',
  invoicesEmails: 'Correos',
  invoicesEmailInbound: 'Respuesta recibida',
  invoicesEmailSent: 'Enviado',
  invoicesRectTitle: 'Crear factura rectificativa',
  invoicesRectDesc: 'Se creará una factura rectificativa (tipo R1) en borrador referenciando la factura',
  invoicesRectReason: 'Motivo de la rectificación',
  invoicesRectPlaceholder: 'Ej: Error en importe, devolución parcial de servicio…',
  invoicesRectCancel: 'Cancelar',
  invoicesRectCreate: 'Crear rectificativa',
  invoicesRectCreating: 'Creando…',
  invoicesRectError: 'No se pudo crear la factura rectificativa. Inténtalo de nuevo.',
  invoicesRectReasonRequired: 'Indica el motivo de la rectificación',
  invoicesSendTitle: 'Enviar factura al cliente',
  invoicesSendRecipient: 'Dirigido a',
  invoicesSendRecipientPlaceholder: 'Persona de contacto o cliente',
  invoicesSendEmail: 'Email del cliente',
  invoicesSendNote: 'MITIKUS enviará la factura {number} usando la identidad de correo configurada. Si el envío falla, la factura no se marcará como enviada.',
  invoicesSendClose: 'Cerrar',
  invoicesSendCancel: 'Cancelar',
  invoicesSendButton: 'Enviar factura',
  invoicesSending: 'Enviando…',
  invoicesSentOk: '✓ Factura enviada correctamente.',
  invoicesSendError: 'No se pudo enviar la factura. Comprueba que tienes correo configurado en Ajustes → Correo y envíos.',
  invoicesSendErrorSettings: 'Ajustes → Correo y envíos',
  invoicesNoReplies: 'Sin respuestas nuevas por ahora.',
  invoicesRepliesError: 'No se han podido revisar las respuestas del buzón.',
  invoicesDeleteConfirm: '¿Eliminar factura {number}?',
  invoicesSuffix: 'factura',
  // Workspace settings page
  wsSettingsTitle: 'Ajustes del workspace',
  wsSettingsSubtitle: 'Personaliza marca, datos visibles y envíos de tu espacio de trabajo.',
  // Workspace settings client
  wsLogoSection: 'Logo de la empresa',
  wsLogoDesc: 'Aparece en la barra lateral del workspace.',
  wsLogoShowName: 'Mostrar el nombre encima del logo en la barra lateral',
  wsLogoNameAdjust: 'Ajuste del nombre sobre el logo',
  wsLogoHorizontal: 'Horizontal',
  wsLogoVertical: 'Vertical',
  wsLogoSize: 'Tamaño',
  wsLogoFontColor: 'Color de letra',
  wsLogoFont: 'Fuente',
  wsEmailSection: 'Correo y envíos',
  wsEmailDesc: 'Elige cómo salen los correos desde este workspace.',
  wsEmailMitikusLabel: 'MITIKUS',
  wsEmailMitikusDesc: 'MITIKUS envía por ti. Las respuestas llegan al email que indiques.',
  wsEmailSmtpLabel: 'SMTP propio',
  wsEmailSmtpDesc: 'Hosting, webmail o correo corporativo.',
  wsEmailGmailLabel: 'Gmail',
  wsEmailGmailDesc: 'Usa smtp.gmail.com con contraseña de aplicación.',
  wsEmailOutlookLabel: 'Outlook / Microsoft 365',
  wsEmailOutlookDesc: 'Usa Microsoft 365 con SMTP AUTH activo.',
  wsEmailGmailHelp: 'Gmail necesita una contraseña de aplicación de Google. No uses tu contraseña normal si tienes doble factor.',
  wsEmailOutlookHelp: 'Outlook y Microsoft 365 pueden requerir activar SMTP AUTH o usar una contraseña de aplicación.',
  wsEmailCustomHelp: 'Usa los datos de configuración manual de tu hosting: servidor SMTP, puerto, usuario y contraseña.',
  wsEmailMitikusHelp: 'Las respuestas llegarán al email indicado. La entrega real se gestiona desde la infraestructura de MITIKUS.',
  wsSenderName: 'Nombre visible del remitente',
  wsSenderNamePlaceholder: 'Tu empresa',
  wsReplyTo: 'Email de respuesta',
  wsReplyToPlaceholder: 'tu@empresa.com',
  wsSignature: 'Firma o cierre por defecto',
  wsSignaturePlaceholder: 'Gracias,\n{name}',
  wsSmtpTitle: 'Configuración SMTP (salida)',
  wsSmtpServer: 'Servidor SMTP',
  wsSmtpPort: 'Puerto',
  wsSmtpUser: 'Usuario / email',
  wsSmtpPassword: 'Contraseña',
  wsSmtpPasswordPlaceholder: 'Déjalo vacío para no cambiarla',
  wsSmtpTls: 'Usar TLS directo (puerto 465)',
  wsImapTitle: 'Configuración IMAP (bandeja de entrada)',
  wsImapServer: 'Servidor IMAP',
  wsImapPort: 'Puerto IMAP',
  wsImapUser: 'Usuario IMAP',
  wsImapPassword: 'Contraseña IMAP',
  wsImapPasswordPlaceholder: 'Vacío si es la misma que SMTP',
  wsImapTls: 'Usar TLS (IMAPS, recomendado)',
  wsImapNote: 'Las contraseñas se cifran antes de guardarse. Si salida y entrada usan el mismo email, puedes dejar la contraseña IMAP vacía.',
  wsEmailConnectionOk: 'Conexión de correo correcta. Ya puedes guardar esta configuración.',
  wsEmailTest: 'Probar conexión',
  wsEmailTesting: 'Probando…',
  wsEmailTestOk: '✓ Conexión correcta',
  wsEmailSave: 'Guardar correo',
  wsEmailSaving: 'Guardando…',
  wsEmailSaved: '✓ Guardado',
  wsEmailSaveError: 'No se han podido guardar los ajustes de correo. Revisa los datos e inténtalo de nuevo.',
  wsEmailTestError: 'No se ha podido probar la conexión SMTP. Comprueba el servidor y el puerto.',
  wsNameSection: 'Nombre del workspace',
  wsNameDesc: 'Visible en la barra lateral y en los correos de invitación.',
  wsBrandColorSection: 'Color de marca',
  wsBrandColorDesc: 'Se usa en la inicial del logo cuando no hay imagen.',
  wsBrandColorPreview: 'Vista previa de la inicial',
  wsBrandColorCustom: 'Color personalizado',
  wsPermSection: 'Permisos de creación',
  wsPermDesc: 'Controla quién puede instalar herramientas y crear misiones en este workspace.',
  wsPermOnlyAdmins: 'Solo Admins y Owners pueden crear',
  wsPermOnlyAdminsActive: 'Activo — Editores y rangos inferiores no pueden instalar herramientas ni crear misiones.',
  wsPermOnlyAdminsInactive: 'Desactivado — Todos los Editores pueden instalar herramientas y crear misiones.',
  wsPermOwnerOnly: 'Solo el Owner del workspace puede cambiar este ajuste.',
  wsPermSaved: '✓ Guardado',
  wsSave: 'Guardar cambios',
  wsSaving: 'Guardando…',
  wsSaved: '✓ Guardado',
  // Receipts page
  receiptsOffice: 'Mi Office',
  receiptsTitle: 'Gastos',
  receiptsSubtitle: 'Escanea tickets y facturas — la IA extrae los datos automáticamente',
  // ReceiptsClient
  receiptsStatusPending: 'Pendiente',
  receiptsStatusReviewed: 'Revisado',
  receiptsStatusAccounted: 'Contabilizado',
  receiptsTotalMonth: 'Total este mes',
  receiptsPendingReview: 'Pendientes de revisar',
  receiptsCount: 'Tickets registrados',
  receiptsScan: 'Escanear ticket',
  receiptsEmpty: 'Sin tickets registrados',
  receiptsEmptyHint: 'Escanea tu primer recibo para empezar',
  receiptsScanNow: 'Escanear ahora →',
  receiptsNoVendor: 'Sin proveedor',
  receiptsDetail: 'Detalle',
  receiptsDelete: 'Eliminar',
  receiptsSelectHint: 'Selecciona un ticket para ver el detalle',
  receiptsVendor: 'Proveedor',
  receiptsDate: 'Fecha',
  receiptsTotal: 'Total',
  receiptsTaxBase: 'Base imp.',
  receiptsTax: 'IVA',
  receiptsCategory: 'Categoría',
  receiptsNotes: 'Notas',
  receiptsStatus: 'Estado',
  receiptsLines: 'Líneas',
  // Usage page
  usageTitle: 'Uso del plan',
  usagePlanSection: 'Cuenta y plan',
  usagePlanTrialing: 'En prueba',
  usagePlanActive: 'Activo',
  usagePlanBlocked: 'Bloqueado',
  usageAISection: 'Uso IA de tu plan',
  usageAIGenerations: 'Generaciones IA este mes',
  usageTools: 'Herramientas instaladas',
  usageBrain: 'Consultas Brain este mes',
  usageUnlimited: 'ilimitado',
  usageGenPerMonth: 'Generaciones/mes',
  usageBrainPerMonth: 'Brain/mes',
  usageToolsLabel: 'Herramientas',
  usageUsers: 'Usuarios',
  usageWorkspaces: 'Workspaces',
  usageReuseSection: 'Reutilización',
  usageCatalogSearches: 'Búsquedas en catálogo',
  usageToolsReused: 'Herramientas reutilizadas',
  usageGenerations: 'Generaciones',
  usageReuseRate: 'Tasa de reutilización',
  usageReuseRateDesc: '{reused} de {total} búsquedas resultaron en instalación o fork en lugar de generar una nueva.',
  usageStorageSection: 'Almacenamiento',
  usageStorageLabel: 'Archivos en este workspace',
  usageStorageFiles: 'archivos almacenados',
  usageManageFiles: 'Gestionar archivos →',
  usageActivitySection: 'Actividad acumulada',
  usageContracts: 'Contratos creados',
  usageInvoices: 'Facturas emitidas',
  usageTotalInvoiced: 'Total facturado',
  usageViewContracts: 'Ver contratos →',
  usageViewInvoices: 'Ver facturas →',
  usageUpgradeCta: 'Activa un plan para eliminar los límites',
  usageUpgradeDesc: 'Más generaciones IA, más almacenamiento, más usuarios y acceso al Brain.',
  usageViewPlans: 'Ver planes →',
  usageTodaySection: 'Hoy',
  usageInputTokens: 'Tokens entrada',
  usageOutputTokens: 'Tokens salida',
  usageTotalTokens: 'Tokens totales',
  usageEstimatedCost: 'Coste estimado (org)',
  usageDailyLimits: 'Límites diarios',
  usageLimitUser: 'Usuario (tú)',
  usageLimitWorkspace: 'Workspace',
  usageLimitSystem: 'Sistema (global)',
  usageLimitCost: 'Coste estimado (global)',
  usageLimitsReset: 'Los límites se reinician automáticamente a las 00:00 UTC.',
  usageRemainingText: 'Puedes generar {personal} herramientas más hoy (límite personal) y {workspace} en este workspace.',
  usageDailyRunsToday: 'Ejecuciones hoy',
  usageDailyRunsMonth: 'Ejecuciones este mes',
}

const fr: DashboardTranslations = {
  ...en,
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
  ...en,
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
  ...en,
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
  ...en,
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
