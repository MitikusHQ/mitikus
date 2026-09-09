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
  navDownload: string
  navSupport: string
  navSettings: string
  navIntegrations: string
  // Nav groups
  groupWork: string
  groupContent: string
  groupSystem: string
  groupHR: string
  navEmployees: string
  navPayroll: string
  navLeaves: string
  descEmployees: string
  descPayroll: string
  descLeaves: string
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
  descDownload: string
  descSupport: string
  descSettings: string
  descIntegrations: string
  // Topbar
  newMission: string
  expandSidebar: string
  collapseSidebar: string
  openMenu: string
  closeTeamPanel: string
  openTeamPanel: string
  welcomeTour: string
  accountMenu: string
  accountMenuOpen: string
  accountPersonalData: string
  accountProfilePhoto: string
  accountSignOut: string
  // Section labels for breadcrumb
  sectionTools: string
  sectionWorkflows: string
  sectionClients: string
  sectionAnalytics: string
  sectionAudit: string
  sectionUsage: string
  sectionTeam: string
  sectionSettings: string
  sectionIntegrations: string
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
  toolRecordDetail: string
  toolExportPdf: string
  toolCreatedOn: string
  toolCompletedOfTotalPrefix: string
  toolCompletedOfTotalMiddle: string
  toolCompletedOfTotalSuffix: string
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
  clientsArchiveConfirmPrefix: string
  clientsArchiveConfirmSuffix: string
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
  // Brain page
  brainDescription: string
  brainTabBrain: string
  brainTabHistory: string
  brainTabMemory: string
  brainTabLocal: string
  brainQuickWhatNow: string
  brainQuickWhatNowQuery: string
  brainQuickRecentDecisions: string
  brainQuickRecentDecisionsQuery: string
  brainQuickActiveGoals: string
  brainQuickActiveGoalsQuery: string
  brainQuickFriction: string
  brainQuickFrictionQuery: string
  brainSourceDocument: string
  brainSourceMemory: string
  brainSourceConversation: string
  brainSourceTool: string
  brainSourceHelp: string
  brainSourceObjective: string
  brainSourceMissionStep: string
  brainSourceTask: string
  brainQueryPlaceholder: string
  brainQueryError: string
  brainConnectionError: string
  brainAnswer: string
  brainSourceSingular: string
  brainSourcePlural: string
  brainCopied: string
  brainCopy: string
  brainClear: string
  brainSources: string
  brainViewMemory: string
  brainViewFull: string
  brainHistoryLoadError: string
  brainModeEvidence: string
  brainModeInsufficient: string
  brainModeOrientation: string
  brainOriginAll: string
  brainOriginCloud: string
  brainOriginHelp: string
  brainOriginLocal: string
  brainQuerySingular: string
  brainQueryPlural: string
  brainNoQueries: string
  brainTryAllSources: string
  brainNormalizedQuery: string
  brainWarnings: string
  brainMemoryTypeNote: string
  brainMemoryTypeDecision: string
  brainMemoryTypeHypothesis: string
  brainMemoryTypeContext: string
  brainMemoryLoadError: string
  brainMemoryOpenError: string
  brainMemoryTitleRequired: string
  brainMemoryContentRequired: string
  brainMemorySaveError: string
  brainMemoryUpdateError: string
  brainMemoryArchiveError: string
  brainMemoryRestoreError: string
  brainMemoryArchiveConfirmPrefix: string
  brainMemoryArchiveConfirmSuffix: string
  brainMemoryCloudNotice: string
  brainMemoryActive: string
  brainMemoryArchived: string
  brainMemoryNew: string
  brainMemoryCancel: string
  brainMemorySearch: string
  brainMemorySearchPlaceholder: string
  brainMemoryType: string
  brainMemoryAll: string
  brainMemoryCount: string
  brainMemoryClearFilters: string
  brainMemoryTitle: string
  brainMemoryTitlePlaceholder: string
  brainMemoryContent: string
  brainMemoryContentPlaceholder: string
  brainMemorySaveCloud: string
  brainMemoryLoading: string
  brainMemoryNoMatches: string
  brainMemoryNoArchived: string
  brainMemoryEmpty: string
  brainMemoryTrySearch: string
  brainMemoryArchivedHint: string
  brainMemoryCreateFirst: string
  brainMemoryArchivedBadge: string
  brainMemoryEdit: string
  brainMemorySaveChanges: string
  brainMemoryArchiving: string
  brainMemoryArchive: string
  brainMemoryRestoring: string
  brainMemoryRestore: string
  brainLocalQuickCurrentState: string
  brainLocalQuickCurrentStateQuery: string
  brainLocalQuickHypotheses: string
  brainLocalQuickHypothesesQuery: string
  brainLocalQuickUserProfile: string
  brainLocalQuickUserProfileQuery: string
  brainLocalQuickPendingDecisions: string
  brainLocalQuickPendingDecisionsQuery: string
  brainLocalSetupDescription: string
  brainLocalReadProjectsError: string
  brainLocalProjectObjective: string
  brainLocalCreateProjectError: string
  brainLocalChecking: string
  brainLocalInactive: string
  brainLocalAdvancedCommand: string
  brainLocalActive: string
  brainLocalProjectSelectorDebug: string
  brainLocalHideSelector: string
  brainLocalNoProjects: string
  brainLocalSaved: string
  brainLocalRetry: string
  brainLocalAddBaseMemory: string
  brainLocalBaseMemoryDescription: string
  brainLocalTitlePlaceholder: string
  brainLocalContentPlaceholder: string
  brainLocalQuestionPlaceholder: string
  brainLocalNoSources: string
  brainLocalNoSourcesHint: string
  // Office files
  officeFilesTitle: string
  officeFilesDescription: string
  officeFilesRoot: string
  officeFilesNewFolder: string
  officeFilesNewSubfolder: string
  officeFilesDownloadZipTitle: string
  officeFilesPreparing: string
  officeFilesDownloadZip: string
  officeFilesStorage: string
  officeFilesLimitReached: string
  officeFilesAlmostFull: string
  officeFilesUpgradeStorage: string
  officeFilesAddStorage: string
  officeFilesProcessing: string
  officeFilesPurchaseError: string
  officeFilesNetworkError: string
  officeFilesDeleteConfirm: string
  officeFilesEmpty: string
  officeFilesDropToUpload: string
  officeFilesDownload: string
  officeFilesMove: string
  officeFilesDelete: string
  officeFilesUploadingPrefix: string
  officeFilesUploadPrompt: string
  officeFilesUploadHelp: string
  officeFilesFolderNamePlaceholder: string
  officeFilesCreating: string
  officeFilesCreate: string
  officeFilesMoveTitle: string
  officeFilesMoving: string
  officeFilesMoveHere: string
  // Contracts
  contractsTitle: string
  contractsSingular: string
  contractsPlural: string
  contractsPdfOnlyError: string
  contractsUploadError: string
  contractsUnexpectedResponse: string
  contractsConnectionError: string
  contractsSelectPdf: string
  contractsUploading: string
  contractsUploadPromptPrefix: string
  contractsChooseFile: string
  contractsEmptyTitle: string
  contractsEmptyDescription: string
  contractsStatusDraft: string
  contractsStatusSent: string
  contractsStatusSigned: string
  contractsSignedPdf: string
  contractsSendToClient: string
  contractsSaveSignatureError: string
  contractsSendError: string
  contractsYourSignature: string
  contractsSavingSignature: string
  contractsAcceptTerms: string
  contractsSignedOn: string
  contractsClientSignature: string
  contractsPendingSend: string
  contractsSentToPrefix: string
  contractsPendingSignature: string
  contractsClientName: string
  contractsClientNamePlaceholder: string
  contractsClientEmail: string
  contractsSending: string
  contractsSend: string
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
  officeTaxVatQuarterly: string
  officeTaxIrpfInstallments: string
  officeTaxIrpfWithholdings: string
  officeTaxRentWithholdings: string
  officeTaxAdvisorSummaryTitle: string
  officeTaxAdvisorSummary: string
  officeTaxVatAnnualSummary: string
  officeTaxWithholdingsAnnualSummary: string
  officeTaxIncomeReturn: string
  officeTaxCorporateTax: string
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
  tasksDueToday: string
  tasksDueTomorrow: string
  tasksPriorityCritical: string
  tasksPriorityHigh: string
  tasksPriorityMedium: string
  tasksPriorityLow: string
  tasksDeleteConfirm: string
  tasksMarkPending: string
  tasksMarkDone: string
  tasksEdit: string
  tasksDelete: string
  tasksAddToCalendar: string
  tasksCalendarSaved: string
  tasksOpenCalendarEvent: string
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
  integrationsTitle: string
  integrationsSubtitle: string
  integrationsEmailTitle: string
  integrationsEmailDescription: string
  integrationsCalendarTitle: string
  integrationsCalendarDescription: string
  integrationsGoogleCalendar: string
  integrationsOutlookCalendar: string
  integrationsConnectProvider: string
  integrationsConnecting: string
  integrationsDisconnect: string
  integrationsDisconnecting: string
  integrationsCalendarConnectedAccount: string
  integrationsCalendarConnectError: string
  integrationsCalendarDisconnectError: string
  integrationsStorageTitle: string
  integrationsStorageDescription: string
  integrationsGoogleDrive: string
  integrationsOneDrive: string
  integrationsDropbox: string
  integrationsStorageConnectedAccount: string
  integrationsStorageConnectError: string
  integrationsStorageDisconnectError: string
  integrationsStorageExportFiles: string
  integrationsStorageExporting: string
  integrationsStorageExported: string
  integrationsStorageOpenExport: string
  integrationsStorageExportError: string
  integrationsAiTitle: string
  integrationsAiDescription: string
  integrationsMitikusAi: string
  integrationsOpenAi: string
  integrationsAnthropic: string
  integrationsGemini: string
  integrationsManagedByMitikus: string
  integrationsAiOwnKeyConfigured: string
  integrationsAiKeyLabel: string
  integrationsAiKeyPlaceholder: string
  integrationsAiLabelLabel: string
  integrationsAiLabelPlaceholder: string
  integrationsAiSecurityNote: string
  integrationsAiSave: string
  integrationsAiSaving: string
  integrationsAiSaved: string
  integrationsAiSaveError: string
  integrationsAiDisconnectError: string
  integrationsSignatureTitle: string
  integrationsSignatureDescription: string
  integrationsMitikusSignature: string
  integrationsSignaturit: string
  integrationsDocuSign: string
  integrationsCommunicationTitle: string
  integrationsCommunicationDescription: string
  integrationsWhatsAppBusiness: string
  integrationsTwilio: string
  integrationsFormsTitle: string
  integrationsFormsDescription: string
  integrationsTypeform: string
  integrationsGoogleForms: string
  integrationsTally: string
  integrationsJotform: string
  integrationsFormsWebhookHelp: string
  integrationsFormsEnableWebhook: string
  integrationsFormsRotateToken: string
  integrationsFormsDisableWebhook: string
  integrationsFormsWebhookReady: string
  integrationsFormsWebhookUrl: string
  integrationsFormsCopyUrl: string
  integrationsFormsCopied: string
  integrationsFormsTokenPreview: string
  integrationsFormsTokenOnlyShownOnce: string
  integrationsFormsActionError: string
  integrationsFormsWebhookActive: string
  integrationsVideoCallsTitle: string
  integrationsVideoCallsDescription: string
  integrationsGoogleMeet: string
  integrationsMicrosoftTeams: string
  integrationsZoom: string
  integrationsAutomationTitle: string
  integrationsAutomationDescription: string
  integrationsMake: string
  integrationsZapier: string
  integrationsN8n: string
  integrationsAccountingTitle: string
  integrationsAccountingDescription: string
  integrationsHolded: string
  integrationsSage: string
  integrationsQuipu: string
  integrationsAnfix: string
  integrationsContasimple: string
  integrationsEcommerceTitle: string
  integrationsEcommerceDescription: string
  integrationsShopify: string
  integrationsWooCommerce: string
  integrationsPrestashop: string
  integrationsPaymentsTitle: string
  integrationsPaymentsDescription: string
  integrationsStripeConnect: string
  integrationsPaypal: string
  integrationsRedsys: string
  integrationsComingSoon: string
  integrationsRequiresSetup: string
  integrationsConfigured: string
  integrationsNotConfigured: string
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
  // Workflows
  wfNewTitle: string
  wfNewDesc: string
  wfNameLabel: string
  wfNamePlaceholder: string
  wfDescLabel: string
  wfDescOptional: string
  wfDescPlaceholder: string
  wfCreate: string
  wfCreating: string
  wfGenerateTitle: string
  wfGenerateDesc: string
  wfGenerate: string
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
  navDownload: 'Desktop App',
  navSupport: 'Support',
  navSettings: 'Settings',
  navIntegrations: 'Integrations',
  groupWork: 'Work',
  groupContent: 'Content',
  groupSystem: 'System',
  groupHR: 'HR',
  navEmployees: 'Employees',
  navPayroll: 'Payroll',
  navLeaves: 'Time Off',
  descEmployees: 'Manage your team, contracts and payroll settings',
  descPayroll: 'Generate and approve monthly payrolls',
  descLeaves: 'Manage vacation, sick leave and absences',
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
  descDownload: 'Download the MITIKUS desktop app for Windows',
  descSupport: 'Help assistant and contact with the MITIKUS team',
  descSettings: 'Logo, brand colour and workspace name',
  descIntegrations: 'Connect external apps and services to this workspace',
  newMission: 'New mission',
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  openMenu: 'Open menu',
  closeTeamPanel: 'Close team panel',
  openTeamPanel: 'Open team panel',
  welcomeTour: 'Welcome tour',
  accountMenu: 'My account',
  accountMenuOpen: 'Open account menu',
  accountPersonalData: 'Personal data',
  accountProfilePhoto: 'Profile photo',
  accountSignOut: 'Sign out',
  sectionTools: 'Tools',
  sectionWorkflows: 'Workflows',
  sectionClients: 'Clients',
  sectionAnalytics: 'Analytics',
  sectionAudit: 'Audit',
  sectionUsage: 'Usage',
  sectionTeam: 'Team',
  sectionSettings: 'Settings',
  sectionIntegrations: 'Integrations',
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
  toolRecordDetail: 'Record detail',
  toolExportPdf: 'Export PDF',
  toolCreatedOn: 'Created on',
  toolCompletedOfTotalPrefix: '',
  toolCompletedOfTotalMiddle: 'of',
  toolCompletedOfTotalSuffix: 'completed',
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
  clientsArchiveConfirmPrefix: 'Archive "',
  clientsArchiveConfirmSuffix: '"? It will be hidden from the list.',
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
  brainDescription: 'Query your workspace memory — documents, goals, conversations and tools.',
  brainTabBrain: 'Brain',
  brainTabHistory: 'History',
  brainTabMemory: 'Memory',
  brainTabLocal: 'Local',
  brainQuickWhatNow: 'What should I do now?',
  brainQuickWhatNowQuery: 'What are the most urgent tasks and goals right now?',
  brainQuickRecentDecisions: 'Recent decisions',
  brainQuickRecentDecisionsQuery: 'Important decisions recently made in the workspace',
  brainQuickActiveGoals: 'Active goals',
  brainQuickActiveGoalsQuery: 'Active goals and missions right now',
  brainQuickFriction: 'Friction',
  brainQuickFrictionQuery: 'Problems, risks or friction identified in the workspace',
  brainSourceDocument: 'Document',
  brainSourceMemory: 'Memory',
  brainSourceConversation: 'Conversation',
  brainSourceTool: 'Tool',
  brainSourceHelp: 'MITIKUS help',
  brainSourceObjective: 'Goal',
  brainSourceMissionStep: 'Step',
  brainSourceTask: 'Task',
  brainQueryPlaceholder: 'What do you want to query?',
  brainQueryError: 'Error querying Brain',
  brainConnectionError: 'Connection error. Try again.',
  brainAnswer: 'Answer',
  brainSourceSingular: 'source',
  brainSourcePlural: 'sources',
  brainCopied: 'Copied',
  brainCopy: 'Copy',
  brainClear: 'Clear',
  brainSources: 'Sources',
  brainViewMemory: 'View memory',
  brainViewFull: 'View in Brain',
  brainHistoryLoadError: 'Could not load history.',
  brainModeEvidence: 'Evidence',
  brainModeInsufficient: 'Insufficient evidence',
  brainModeOrientation: 'Orientation',
  brainOriginAll: 'All',
  brainOriginCloud: 'Cloud',
  brainOriginHelp: 'Help',
  brainOriginLocal: 'Local',
  brainQuerySingular: 'query',
  brainQueryPlural: 'queries',
  brainNoQueries: 'No queries have been recorded yet.',
  brainTryAllSources: 'Try selecting "All" to view every source.',
  brainNormalizedQuery: 'Normalized query',
  brainWarnings: 'Warnings',
  brainMemoryTypeNote: 'Note',
  brainMemoryTypeDecision: 'Decision',
  brainMemoryTypeHypothesis: 'Hypothesis',
  brainMemoryTypeContext: 'Context',
  brainMemoryLoadError: 'Could not load cloud memory. Try again.',
  brainMemoryOpenError: 'Could not open memory.',
  brainMemoryTitleRequired: 'The title is required.',
  brainMemoryContentRequired: 'The content is required.',
  brainMemorySaveError: 'Could not save. Try again.',
  brainMemoryUpdateError: 'Could not update. Try again.',
  brainMemoryArchiveError: 'Could not archive. Try again.',
  brainMemoryRestoreError: 'Could not restore. Try again.',
  brainMemoryArchiveConfirmPrefix: 'Archive "',
  brainMemoryArchiveConfirmSuffix: '"? It will stop appearing in Brain, but it will not be deleted.',
  brainMemoryCloudNotice: 'This memory is saved in MITIKUS Cloud as the source of truth. When the local Core is available, MITIKUS also tries to index it as a secondary copy.',
  brainMemoryActive: 'Active',
  brainMemoryArchived: 'Archived',
  brainMemoryNew: '+ New memory',
  brainMemoryCancel: 'Cancel',
  brainMemorySearch: 'Search',
  brainMemorySearchPlaceholder: 'Search by title or content',
  brainMemoryType: 'Type',
  brainMemoryAll: 'All',
  brainMemoryCount: 'memories',
  brainMemoryClearFilters: 'Clear filters',
  brainMemoryTitle: 'Title',
  brainMemoryTitlePlaceholder: 'e.g. Decision about auth architecture',
  brainMemoryContent: 'Content',
  brainMemoryContentPlaceholder: 'Write the memory content here...',
  brainMemorySaveCloud: 'Save to cloud',
  brainMemoryLoading: 'Loading cloud memory...',
  brainMemoryNoMatches: 'No matching memories.',
  brainMemoryNoArchived: 'No archived memories.',
  brainMemoryEmpty: 'No cloud memory yet.',
  brainMemoryTrySearch: 'Try another search or clear filters.',
  brainMemoryArchivedHint: 'When you archive a memory, it will appear here.',
  brainMemoryCreateFirst: 'Create the first one with the button above.',
  brainMemoryArchivedBadge: 'archived',
  brainMemoryEdit: 'Edit',
  brainMemorySaveChanges: 'Save changes',
  brainMemoryArchiving: 'Archiving...',
  brainMemoryArchive: 'Archive',
  brainMemoryRestoring: 'Restoring...',
  brainMemoryRestore: 'Restore',
  brainLocalQuickCurrentState: 'Where are we now?',
  brainLocalQuickCurrentStateQuery: 'What is the current project state and focus?',
  brainLocalQuickHypotheses: 'What hypotheses do we have?',
  brainLocalQuickHypothesesQuery: 'Project hypotheses and assumptions',
  brainLocalQuickUserProfile: 'What do we know about the user?',
  brainLocalQuickUserProfileQuery: 'Client user profile and the problem being solved',
  brainLocalQuickPendingDecisions: 'What decisions are pending?',
  brainLocalQuickPendingDecisionsQuery: 'Pending decisions and unresolved questions',
  brainLocalSetupDescription: 'MITIKUS keeps working with Brain, cloud memory, history and workspace data. Enable Core only if you want to add a private layer on this computer.',
  brainLocalReadProjectsError: 'Could not read projects from the local Core.',
  brainLocalProjectObjective: 'Private MITIKUS workspace memory',
  brainLocalCreateProjectError: 'Could not create the project in the local Core.',
  brainLocalChecking: 'Checking local memory...',
  brainLocalInactive: 'Local memory is not active',
  brainLocalAdvancedCommand: 'Advanced command',
  brainLocalActive: 'Local memory active',
  brainLocalProjectSelectorDebug: 'Project selector (debug)',
  brainLocalHideSelector: 'Hide selector',
  brainLocalNoProjects: 'No projects in Core',
  brainLocalSaved: 'Memory saved. Now you can ask using that context.',
  brainLocalRetry: 'Retry connection',
  brainLocalAddBaseMemory: 'Add base memory',
  brainLocalBaseMemoryDescription: 'Paste private context for this computer here. The product main memory is in the Memory tab.',
  brainLocalTitlePlaceholder: 'Base memory — project topic',
  brainLocalContentPlaceholder: 'What the project is, current goal, possible users, doubts, decisions and next steps.',
  brainLocalQuestionPlaceholder: 'What do you need to know now?',
  brainLocalNoSources: 'No sources in local memory for this query.',
  brainLocalNoSourcesHint: 'The main MITIKUS answer lives in Brain and cloud memory.',
  officeFilesTitle: 'Files',
  officeFilesDescription: 'Organize documents, images and spreadsheets in folders',
  officeFilesRoot: 'Root',
  officeFilesNewFolder: 'New folder',
  officeFilesNewSubfolder: 'New subfolder',
  officeFilesDownloadZipTitle: 'Download all files as ZIP',
  officeFilesPreparing: 'Preparing...',
  officeFilesDownloadZip: 'Download ZIP',
  officeFilesStorage: 'Storage',
  officeFilesLimitReached: 'Limit reached',
  officeFilesAlmostFull: 'Almost full',
  officeFilesUpgradeStorage: 'Upgrade your storage — €2/GB/month',
  officeFilesAddStorage: 'Add storage',
  officeFilesProcessing: 'Processing...',
  officeFilesPurchaseError: 'Error processing the purchase.',
  officeFilesNetworkError: 'Network error. Try again.',
  officeFilesDeleteConfirm: 'Delete this file? This action cannot be undone.',
  officeFilesEmpty: 'No files in this location',
  officeFilesDropToUpload: 'Drag files above to upload them',
  officeFilesDownload: 'Download',
  officeFilesMove: 'Move',
  officeFilesDelete: 'Delete',
  officeFilesUploadingPrefix: 'Uploading',
  officeFilesUploadPrompt: 'Drag files or click to select',
  officeFilesUploadHelp: 'PDF, DOCX, XLSX, images, TXT, MD, JSON, ZIP — max. 50 MB',
  officeFilesFolderNamePlaceholder: 'Folder name',
  officeFilesCreating: 'Creating...',
  officeFilesCreate: 'Create',
  officeFilesMoveTitle: 'Move file to...',
  officeFilesMoving: 'Moving...',
  officeFilesMoveHere: 'Move here',
  contractsTitle: 'Contracts',
  contractsSingular: 'contract',
  contractsPlural: 'contracts',
  contractsPdfOnlyError: 'Only PDF files (.pdf) are allowed',
  contractsUploadError: 'Error uploading the contract',
  contractsUnexpectedResponse: 'Unexpected server response',
  contractsConnectionError: 'Connection error. Try again.',
  contractsSelectPdf: 'Select contract PDF',
  contractsUploading: 'Uploading contract...',
  contractsUploadPromptPrefix: 'Drag a',
  contractsChooseFile: 'choose file',
  contractsEmptyTitle: 'Upload your first contract',
  contractsEmptyDescription: 'Drag a PDF above or use the upload button. The client can sign it digitally with OTP verification.',
  contractsStatusDraft: 'DRAFT',
  contractsStatusSent: 'SENT',
  contractsStatusSigned: 'SIGNED',
  contractsSignedPdf: 'Signed PDF',
  contractsSendToClient: 'Send to client',
  contractsSaveSignatureError: 'Error saving the signature. Try again.',
  contractsSendError: 'Error sending to the client. Try again.',
  contractsYourSignature: 'Your signature',
  contractsSavingSignature: 'Saving signature...',
  contractsAcceptTerms: 'I accept the terms',
  contractsSignedOn: 'Signed on',
  contractsClientSignature: 'Client signature',
  contractsPendingSend: 'Pending send',
  contractsSentToPrefix: 'Sent to',
  contractsPendingSignature: 'pending signature',
  contractsClientName: 'Client name',
  contractsClientNamePlaceholder: 'John Smith',
  contractsClientEmail: 'Client email',
  contractsSending: 'Sending...',
  contractsSend: 'Send',
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
  officeTaxVatQuarterly: 'Quarterly VAT',
  officeTaxIrpfInstallments: 'Personal income tax installments',
  officeTaxIrpfWithholdings: 'Personal income tax withholdings',
  officeTaxRentWithholdings: 'Rental withholdings',
  officeTaxAdvisorSummaryTitle: 'Advisor summary',
  officeTaxAdvisorSummary: 'Export for your advisor',
  officeTaxVatAnnualSummary: 'Annual VAT summary',
  officeTaxWithholdingsAnnualSummary: 'Annual withholdings summary',
  officeTaxIncomeReturn: 'Income tax return',
  officeTaxCorporateTax: 'Corporate tax',
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
  tasksDueToday: 'Today',
  tasksDueTomorrow: 'Tomorrow',
  tasksPriorityCritical: 'Critical',
  tasksPriorityHigh: 'High',
  tasksPriorityMedium: 'Medium',
  tasksPriorityLow: 'Low',
  tasksDeleteConfirm: 'Delete this task?',
  tasksMarkPending: 'Mark as pending',
  tasksMarkDone: 'Mark as done',
  tasksEdit: 'Edit task',
  tasksDelete: 'Delete task',
  tasksAddToCalendar: 'Add to calendar',
  tasksCalendarSaved: 'Event created',
  tasksOpenCalendarEvent: 'Open calendar event',
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
  integrationsTitle: 'Integrations',
  integrationsSubtitle: 'Connect the apps and accounts this workspace uses to work with clients, documents and automations.',
  integrationsEmailTitle: 'Email',
  integrationsEmailDescription: 'Send and receive client emails with MITIKUS, Gmail, Outlook or your own SMTP/IMAP account.',
  integrationsCalendarTitle: 'Calendar',
  integrationsCalendarDescription: 'Prepare Google Calendar or Outlook Calendar for calls, deadlines, reminders and mission planning.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Connect account',
  integrationsConnecting: 'Connecting...',
  integrationsDisconnect: 'Disconnect',
  integrationsDisconnecting: 'Disconnecting...',
  integrationsCalendarConnectedAccount: 'Calendar account connected',
  integrationsCalendarConnectError: 'Could not start the calendar connection.',
  integrationsCalendarDisconnectError: 'Could not disconnect the calendar.',
  integrationsStorageTitle: 'Storage',
  integrationsStorageDescription: 'Prepare external storage for documents, contracts, PDFs and workspace backups.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Storage account connected',
  integrationsStorageConnectError: 'Could not start the storage connection.',
  integrationsStorageDisconnectError: 'Could not disconnect the storage account.',
  integrationsStorageExportFiles: 'Save files ZIP',
  integrationsStorageExporting: 'Saving...',
  integrationsStorageExported: 'Files ZIP saved in the connected storage.',
  integrationsStorageOpenExport: 'Open',
  integrationsStorageExportError: 'Could not save the files ZIP in the connected storage.',
  integrationsAiTitle: 'AI providers',
  integrationsAiDescription: 'Use MITIKUS managed AI by default and prepare bring-your-own-key options for advanced plans.',
  integrationsMitikusAi: 'MITIKUS AI',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Managed by MITIKUS',
  integrationsAiOwnKeyConfigured: 'Own API key configured',
  integrationsAiKeyLabel: 'API key',
  integrationsAiKeyPlaceholder: 'Paste the provider API key',
  integrationsAiLabelLabel: 'Internal label',
  integrationsAiLabelPlaceholder: 'Example: agency OpenAI key',
  integrationsAiSecurityNote: 'The key is encrypted before it is stored.',
  integrationsAiSave: 'Save provider',
  integrationsAiSaving: 'Saving...',
  integrationsAiSaved: 'AI provider saved.',
  integrationsAiSaveError: 'Could not save the AI provider.',
  integrationsAiDisconnectError: 'Could not disconnect the AI provider.',
  integrationsSignatureTitle: 'Digital signature',
  integrationsSignatureDescription: 'Use MITIKUS OTP signature by default and prepare external providers for advanced contract workflows.',
  integrationsMitikusSignature: 'MITIKUS signature',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Communication',
  integrationsCommunicationDescription: 'Prepare customer messaging for lead follow-up, invoice reminders and workflow notifications.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Forms and lead capture',
  integrationsFormsDescription: 'Prepare external forms so responses can create leads, clients, tasks, contracts or missions in MITIKUS.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Video calls',
  integrationsVideoCallsDescription: 'Prepare online meeting links for clients, missions, contracts and scheduled follow-ups.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'External automations',
  integrationsAutomationDescription: 'Prepare Make, Zapier and n8n connections so MITIKUS workflows can trigger external processes later.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Accounting',
  integrationsAccountingDescription: 'Prepare exports and future sync with accounting tools used by freelancers, agencies and SMEs.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-commerce',
  integrationsEcommerceDescription: 'Prepare online store connections to import customers, orders, products and invoice-ready sales.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Invoice payments',
  integrationsPaymentsDescription: 'Prepare future payment links so clients can pay invoices issued by this workspace.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Coming soon',
  integrationsRequiresSetup: 'Requires OAuth setup before users can connect their account.',
  integrationsConfigured: 'Configured',
  integrationsNotConfigured: 'Not configured',
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
  // Workflows
  wfNewTitle: 'New Workflow',
  wfNewDesc: 'Define a name and description. You will add steps in the canvas editor.',
  wfNameLabel: 'Workflow name *',
  wfNamePlaceholder: 'e.g. Full strategic analysis',
  wfDescLabel: 'Description',
  wfDescOptional: '(optional)',
  wfDescPlaceholder: 'e.g. SWOT → Competitive analysis → Action plan → Executive report',
  wfCreate: 'Create and open editor →',
  wfCreating: 'Creating…',
  wfGenerateTitle: 'Generate',
  wfGenerateDesc: 'Describe your process in natural language and AI creates the workflow automatically, choosing and connecting the tools for you.',
  wfGenerate: '✨ Generate',
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
  navDownload: 'App de escritorio',
  navSupport: 'Soporte',
  navSettings: 'Ajustes',
  navIntegrations: 'Integraciones',
  groupWork: 'Trabajo',
  groupContent: 'Contenido',
  groupSystem: 'Sistema',
  groupHR: 'RRHH',
  navEmployees: 'Empleados',
  navPayroll: 'Nóminas',
  navLeaves: 'Ausencias',
  descEmployees: 'Gestiona tu equipo, contratos y configuración de nóminas',
  descPayroll: 'Genera y aprueba nóminas mensuales',
  descLeaves: 'Gestiona vacaciones, bajas y ausencias',
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
  descDownload: 'Descarga la app de escritorio de MITIKUS para Windows',
  descSupport: 'Asistente de ayuda y contacto con el equipo MITIKUS',
  descSettings: 'Logo, color de marca y nombre del workspace',
  descIntegrations: 'Conecta apps y servicios externos a este workspace',
  newMission: 'Nueva misión',
  expandSidebar: 'Expandir sidebar',
  collapseSidebar: 'Colapsar sidebar',
  openMenu: 'Abrir menú',
  closeTeamPanel: 'Cerrar panel de equipo',
  openTeamPanel: 'Abrir panel de equipo',
  welcomeTour: 'Tour de bienvenida',
  accountMenu: 'Mi cuenta',
  accountMenuOpen: 'Abrir menú de cuenta',
  accountPersonalData: 'Datos personales',
  accountProfilePhoto: 'Foto de perfil',
  accountSignOut: 'Cerrar sesión',
  sectionTools: 'Herramientas',
  sectionWorkflows: 'Flujos',
  sectionClients: 'Clientes',
  sectionAnalytics: 'Analytics',
  sectionAudit: 'Auditoría',
  sectionUsage: 'Uso',
  sectionTeam: 'Equipo',
  sectionSettings: 'Ajustes',
  sectionIntegrations: 'Integraciones',
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
  toolRecordDetail: 'Detalle del registro',
  toolExportPdf: 'Exportar PDF',
  toolCreatedOn: 'Creado el',
  toolCompletedOfTotalPrefix: '',
  toolCompletedOfTotalMiddle: 'de',
  toolCompletedOfTotalSuffix: 'completados',
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
  clientsArchiveConfirmPrefix: '¿Archivar a "',
  clientsArchiveConfirmSuffix: '"? Se ocultará de la lista.',
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
  brainDescription: 'Consulta la memoria de tu workspace — documentos, objetivos, conversaciones y herramientas.',
  brainTabBrain: 'Brain',
  brainTabHistory: 'Historial',
  brainTabMemory: 'Memoria',
  brainTabLocal: 'Local',
  brainQuickWhatNow: '¿Qué hago ahora?',
  brainQuickWhatNowQuery: '¿Cuáles son las tareas y objetivos más urgentes actualmente?',
  brainQuickRecentDecisions: 'Decisiones recientes',
  brainQuickRecentDecisionsQuery: 'Decisiones importantes tomadas recientemente en el workspace',
  brainQuickActiveGoals: 'Objetivos activos',
  brainQuickActiveGoalsQuery: 'Objetivos y misiones activas en este momento',
  brainQuickFriction: 'Fricciones',
  brainQuickFrictionQuery: 'Problemas, riesgos o fricciones identificadas en el workspace',
  brainSourceDocument: 'Documento',
  brainSourceMemory: 'Memoria',
  brainSourceConversation: 'Conversación',
  brainSourceTool: 'Herramienta',
  brainSourceHelp: 'Ayuda MITIKUS',
  brainSourceObjective: 'Objetivo',
  brainSourceMissionStep: 'Paso',
  brainSourceTask: 'Tarea',
  brainQueryPlaceholder: '¿Qué quieres consultar?',
  brainQueryError: 'Error al consultar el Brain',
  brainConnectionError: 'Error de conexión. Inténtalo de nuevo.',
  brainAnswer: 'Respuesta',
  brainSourceSingular: 'fuente',
  brainSourcePlural: 'fuentes',
  brainCopied: 'Copiado',
  brainCopy: 'Copiar',
  brainClear: 'Limpiar',
  brainSources: 'Fuentes',
  brainViewMemory: 'Ver memoria',
  brainViewFull: 'Ver en Brain',
  brainHistoryLoadError: 'No se pudo cargar el historial.',
  brainModeEvidence: 'Evidencia',
  brainModeInsufficient: 'Sin evidencia',
  brainModeOrientation: 'Orientación',
  brainOriginAll: 'Todos',
  brainOriginCloud: 'Cloud',
  brainOriginHelp: 'Ayuda',
  brainOriginLocal: 'Local',
  brainQuerySingular: 'consulta',
  brainQueryPlural: 'consultas',
  brainNoQueries: 'No hay consultas registradas todavía.',
  brainTryAllSources: 'Prueba a seleccionar "Todos" para ver todas las fuentes.',
  brainNormalizedQuery: 'Consulta normalizada',
  brainWarnings: 'Avisos',
  brainMemoryTypeNote: 'Nota',
  brainMemoryTypeDecision: 'Decisión',
  brainMemoryTypeHypothesis: 'Hipótesis',
  brainMemoryTypeContext: 'Contexto',
  brainMemoryLoadError: 'No se pudo cargar la memoria cloud. Inténtalo de nuevo.',
  brainMemoryOpenError: 'No se pudo abrir la memoria.',
  brainMemoryTitleRequired: 'El título es obligatorio.',
  brainMemoryContentRequired: 'El contenido es obligatorio.',
  brainMemorySaveError: 'No se pudo guardar. Inténtalo de nuevo.',
  brainMemoryUpdateError: 'No se pudo actualizar. Inténtalo de nuevo.',
  brainMemoryArchiveError: 'No se pudo archivar. Inténtalo de nuevo.',
  brainMemoryRestoreError: 'No se pudo restaurar. Inténtalo de nuevo.',
  brainMemoryArchiveConfirmPrefix: '¿Archivar "',
  brainMemoryArchiveConfirmSuffix: '"? Dejará de aparecer en Brain, pero no se borrará.',
  brainMemoryCloudNotice: 'Esta memoria se guarda en MITIKUS Cloud como fuente de verdad. Cuando el Core local está disponible, MITIKUS intenta indexarla también como copia secundaria.',
  brainMemoryActive: 'Activas',
  brainMemoryArchived: 'Archivadas',
  brainMemoryNew: '+ Nueva memoria',
  brainMemoryCancel: 'Cancelar',
  brainMemorySearch: 'Buscar',
  brainMemorySearchPlaceholder: 'Busca por título o contenido',
  brainMemoryType: 'Tipo',
  brainMemoryAll: 'Todos',
  brainMemoryCount: 'memorias',
  brainMemoryClearFilters: 'Limpiar filtros',
  brainMemoryTitle: 'Título',
  brainMemoryTitlePlaceholder: 'p. ej. Decisión sobre arquitectura de auth',
  brainMemoryContent: 'Contenido',
  brainMemoryContentPlaceholder: 'Escribe aquí el contenido de la memoria...',
  brainMemorySaveCloud: 'Guardar en cloud',
  brainMemoryLoading: 'Cargando memoria cloud...',
  brainMemoryNoMatches: 'No hay memorias que coincidan.',
  brainMemoryNoArchived: 'No hay memorias archivadas.',
  brainMemoryEmpty: 'No hay memoria cloud todavía.',
  brainMemoryTrySearch: 'Prueba con otra búsqueda o limpia los filtros.',
  brainMemoryArchivedHint: 'Cuando archives una memoria, aparecerá aquí.',
  brainMemoryCreateFirst: 'Crea la primera con el botón de arriba.',
  brainMemoryArchivedBadge: 'archivada',
  brainMemoryEdit: 'Editar',
  brainMemorySaveChanges: 'Guardar cambios',
  brainMemoryArchiving: 'Archivando...',
  brainMemoryArchive: 'Archivar',
  brainMemoryRestoring: 'Restaurando...',
  brainMemoryRestore: 'Restaurar',
  brainLocalQuickCurrentState: '¿En qué estamos ahora?',
  brainLocalQuickCurrentStateQuery: 'Cuál es el estado actual y foco del proyecto',
  brainLocalQuickHypotheses: '¿Qué hipótesis tenemos?',
  brainLocalQuickHypothesesQuery: 'Hipótesis y supuestos del proyecto',
  brainLocalQuickUserProfile: '¿Qué sabemos del usuario?',
  brainLocalQuickUserProfileQuery: 'Perfil de usuario cliente y problema que resuelve',
  brainLocalQuickPendingDecisions: '¿Qué decisiones están pendientes?',
  brainLocalQuickPendingDecisionsQuery: 'Decisiones pendientes y dudas sin resolver',
  brainLocalSetupDescription: 'MITIKUS sigue funcionando con Brain, memoria cloud, historial y datos del workspace. Activa el Core solo si quieres añadir una capa privada en este ordenador.',
  brainLocalReadProjectsError: 'No se pudo leer proyectos del Core local.',
  brainLocalProjectObjective: 'Memoria privada del workspace MITIKUS',
  brainLocalCreateProjectError: 'No se pudo crear el proyecto en el Core local.',
  brainLocalChecking: 'Comprobando memoria local...',
  brainLocalInactive: 'Memoria local no activa',
  brainLocalAdvancedCommand: 'Comando avanzado',
  brainLocalActive: 'Memoria local activa',
  brainLocalProjectSelectorDebug: 'Selector de proyecto (debug)',
  brainLocalHideSelector: 'Ocultar selector',
  brainLocalNoProjects: 'Sin proyectos en el Core',
  brainLocalSaved: 'Memoria guardada. Ahora puedes preguntar usando ese contexto.',
  brainLocalRetry: 'Reintentar conexión',
  brainLocalAddBaseMemory: 'Añadir memoria base',
  brainLocalBaseMemoryDescription: 'Pega aquí contexto privado para este ordenador. La memoria principal del producto está en la pestaña Memoria.',
  brainLocalTitlePlaceholder: 'Memoria base — tema del proyecto',
  brainLocalContentPlaceholder: 'Qué es el proyecto, objetivo actual, usuarios posibles, dudas, decisiones y próximos pasos.',
  brainLocalQuestionPlaceholder: '¿Qué necesitas saber ahora?',
  brainLocalNoSources: 'Sin fuentes en la memoria local para esta consulta.',
  brainLocalNoSourcesHint: 'La respuesta principal de MITIKUS vive en Brain y en la memoria cloud.',
  officeFilesTitle: 'Archivos',
  officeFilesDescription: 'Organiza documentos, imágenes y hojas de cálculo en carpetas',
  officeFilesRoot: 'Raíz',
  officeFilesNewFolder: 'Nueva carpeta',
  officeFilesNewSubfolder: 'Nueva subcarpeta',
  officeFilesDownloadZipTitle: 'Descargar todos los archivos como ZIP',
  officeFilesPreparing: 'Preparando...',
  officeFilesDownloadZip: 'Descargar ZIP',
  officeFilesStorage: 'Almacenamiento',
  officeFilesLimitReached: 'Límite alcanzado',
  officeFilesAlmostFull: 'Casi lleno',
  officeFilesUpgradeStorage: 'Amplía tu almacenamiento — €2/GB/mes',
  officeFilesAddStorage: 'Añadir almacenamiento',
  officeFilesProcessing: 'Procesando...',
  officeFilesPurchaseError: 'Error al procesar la compra.',
  officeFilesNetworkError: 'Error de red. Inténtalo de nuevo.',
  officeFilesDeleteConfirm: '¿Eliminar este archivo? Esta acción no se puede deshacer.',
  officeFilesEmpty: 'Sin archivos en esta ubicación',
  officeFilesDropToUpload: 'Arrastra archivos arriba para subirlos',
  officeFilesDownload: 'Descargar',
  officeFilesMove: 'Mover',
  officeFilesDelete: 'Eliminar',
  officeFilesUploadingPrefix: 'Subiendo',
  officeFilesUploadPrompt: 'Arrastra archivos o haz clic para seleccionar',
  officeFilesUploadHelp: 'PDF, DOCX, XLSX, imágenes, TXT, MD, JSON, ZIP — máx. 50 MB',
  officeFilesFolderNamePlaceholder: 'Nombre de la carpeta',
  officeFilesCreating: 'Creando...',
  officeFilesCreate: 'Crear',
  officeFilesMoveTitle: 'Mover archivo a...',
  officeFilesMoving: 'Moviendo...',
  officeFilesMoveHere: 'Mover aquí',
  contractsTitle: 'Contratos',
  contractsSingular: 'contrato',
  contractsPlural: 'contratos',
  contractsPdfOnlyError: 'Solo se admiten archivos PDF (.pdf)',
  contractsUploadError: 'Error al subir el contrato',
  contractsUnexpectedResponse: 'Respuesta inesperada del servidor',
  contractsConnectionError: 'Error de conexión. Inténtalo de nuevo.',
  contractsSelectPdf: 'Seleccionar PDF de contrato',
  contractsUploading: 'Subiendo contrato...',
  contractsUploadPromptPrefix: 'Arrastra un',
  contractsChooseFile: 'elige archivo',
  contractsEmptyTitle: 'Sube tu primer contrato',
  contractsEmptyDescription: 'Arrastra un PDF arriba o usa el botón de carga. El cliente puede firmarlo digitalmente con verificación OTP.',
  contractsStatusDraft: 'BORRADOR',
  contractsStatusSent: 'ENVIADO',
  contractsStatusSigned: 'FIRMADO',
  contractsSignedPdf: 'PDF firmado',
  contractsSendToClient: 'Enviar al cliente',
  contractsSaveSignatureError: 'Error al guardar la firma. Inténtalo de nuevo.',
  contractsSendError: 'Error al enviar al cliente. Inténtalo de nuevo.',
  contractsYourSignature: 'Tu firma',
  contractsSavingSignature: 'Guardando firma...',
  contractsAcceptTerms: 'Acepto los términos',
  contractsSignedOn: 'Firmado el',
  contractsClientSignature: 'Firma cliente',
  contractsPendingSend: 'Pendiente de envío',
  contractsSentToPrefix: 'Enviado a',
  contractsPendingSignature: 'pendiente de firma',
  contractsClientName: 'Nombre del cliente',
  contractsClientNamePlaceholder: 'Juan García',
  contractsClientEmail: 'Email del cliente',
  contractsSending: 'Enviando...',
  contractsSend: 'Enviar',
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
  officeTaxVatQuarterly: 'IVA trimestral',
  officeTaxIrpfInstallments: 'IRPF fraccionado (autónomos)',
  officeTaxIrpfWithholdings: 'Retenciones IRPF',
  officeTaxRentWithholdings: 'Retenciones alquileres',
  officeTaxAdvisorSummaryTitle: 'Resumen gestor',
  officeTaxAdvisorSummary: 'Exporta para tu asesor',
  officeTaxVatAnnualSummary: 'IVA resumen anual',
  officeTaxWithholdingsAnnualSummary: 'Retenciones resumen anual',
  officeTaxIncomeReturn: 'Renta (IRPF autónomos)',
  officeTaxCorporateTax: 'Impuesto sobre Sociedades',
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
  tasksDueToday: 'Hoy',
  tasksDueTomorrow: 'Mañana',
  tasksPriorityCritical: 'Crítica',
  tasksPriorityHigh: 'Alta',
  tasksPriorityMedium: 'Media',
  tasksPriorityLow: 'Baja',
  tasksDeleteConfirm: '¿Eliminar esta tarea?',
  tasksMarkPending: 'Marcar como pendiente',
  tasksMarkDone: 'Marcar como hecha',
  tasksEdit: 'Editar tarea',
  tasksDelete: 'Eliminar tarea',
  tasksAddToCalendar: 'Añadir al calendario',
  tasksCalendarSaved: 'Evento creado',
  tasksOpenCalendarEvent: 'Abrir evento de calendario',
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
  integrationsTitle: 'Integraciones',
  integrationsSubtitle: 'Conecta las apps y cuentas que usa este workspace para trabajar con clientes, documentos y automatizaciones.',
  integrationsEmailTitle: 'Correo',
  integrationsEmailDescription: 'Envía y recibe correos de clientes con MITIKUS, Gmail, Outlook o tu propia cuenta SMTP/IMAP.',
  integrationsCalendarTitle: 'Calendario',
  integrationsCalendarDescription: 'Prepara Google Calendar u Outlook Calendar para llamadas, vencimientos, recordatorios y planificación de misiones.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Conectar cuenta',
  integrationsConnecting: 'Conectando...',
  integrationsDisconnect: 'Desconectar',
  integrationsDisconnecting: 'Desconectando...',
  integrationsCalendarConnectedAccount: 'Cuenta de calendario conectada',
  integrationsCalendarConnectError: 'No se pudo iniciar la conexión del calendario.',
  integrationsCalendarDisconnectError: 'No se pudo desconectar el calendario.',
  integrationsStorageTitle: 'Almacenamiento',
  integrationsStorageDescription: 'Prepara almacenamiento externo para documentos, contratos, PDFs y copias del workspace.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Cuenta de almacenamiento conectada',
  integrationsStorageConnectError: 'No se pudo iniciar la conexión de almacenamiento.',
  integrationsStorageDisconnectError: 'No se pudo desconectar el almacenamiento.',
  integrationsStorageExportFiles: 'Guardar ZIP de archivos',
  integrationsStorageExporting: 'Guardando...',
  integrationsStorageExported: 'ZIP de archivos guardado en el almacenamiento conectado.',
  integrationsStorageOpenExport: 'Abrir',
  integrationsStorageExportError: 'No se pudo guardar el ZIP de archivos en el almacenamiento conectado.',
  integrationsAiTitle: 'Proveedores IA',
  integrationsAiDescription: 'Usa la IA gestionada por MITIKUS por defecto y prepara claves propias para planes avanzados.',
  integrationsMitikusAi: 'MITIKUS IA',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Gestionado por MITIKUS',
  integrationsAiOwnKeyConfigured: 'API key propia configurada',
  integrationsAiKeyLabel: 'API key',
  integrationsAiKeyPlaceholder: 'Pega la API key del proveedor',
  integrationsAiLabelLabel: 'Etiqueta interna',
  integrationsAiLabelPlaceholder: 'Ejemplo: clave OpenAI agencia',
  integrationsAiSecurityNote: 'La clave se cifra antes de guardarse.',
  integrationsAiSave: 'Guardar proveedor',
  integrationsAiSaving: 'Guardando...',
  integrationsAiSaved: 'Proveedor IA guardado.',
  integrationsAiSaveError: 'No se pudo guardar el proveedor IA.',
  integrationsAiDisconnectError: 'No se pudo desconectar el proveedor IA.',
  integrationsSignatureTitle: 'Firma digital',
  integrationsSignatureDescription: 'Usa la firma OTP de MITIKUS por defecto y prepara proveedores externos para contratos avanzados.',
  integrationsMitikusSignature: 'Firma MITIKUS',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Comunicación',
  integrationsCommunicationDescription: 'Prepara mensajería con clientes para seguimiento de leads, recordatorios de facturas y avisos de flujos.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Formularios y captación',
  integrationsFormsDescription: 'Prepara formularios externos para que las respuestas puedan crear leads, clientes, tareas, contratos o misiones en MITIKUS.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Videollamadas',
  integrationsVideoCallsDescription: 'Prepara enlaces de reunión online para clientes, misiones, contratos y seguimientos programados.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'Automatizaciones externas',
  integrationsAutomationDescription: 'Prepara conexiones con Make, Zapier y n8n para que los flujos de MITIKUS puedan disparar procesos externos más adelante.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Contabilidad',
  integrationsAccountingDescription: 'Prepara exportaciones y futura sincronización con herramientas contables usadas por autónomos, agencias y pymes.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-commerce',
  integrationsEcommerceDescription: 'Prepara conexiones con tiendas online para importar clientes, pedidos, productos y ventas listas para facturar.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Pagos de facturas',
  integrationsPaymentsDescription: 'Prepara enlaces de pago futuros para que los clientes puedan pagar facturas emitidas por este workspace.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Próximamente',
  integrationsRequiresSetup: 'Requiere configurar OAuth antes de que los usuarios puedan conectar su cuenta.',
  integrationsConfigured: 'Configurado',
  integrationsNotConfigured: 'Sin configurar',
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
  // Workflows
  wfNewTitle: 'Nuevo Workflow',
  wfNewDesc: 'Define un nombre y descripción. Añadirás los pasos en el editor de canvas.',
  wfNameLabel: 'Nombre del workflow *',
  wfNamePlaceholder: 'ej. Análisis estratégico completo',
  wfDescLabel: 'Descripción',
  wfDescOptional: '(opcional)',
  wfDescPlaceholder: 'ej. DAFO → Análisis competencia → Plan de acción → Informe ejecutivo',
  wfCreate: 'Crear y abrir editor →',
  wfCreating: 'Creando…',
  wfGenerateTitle: 'Generar',
  wfGenerateDesc: 'Describe tu proceso en lenguaje natural y la IA crea el workflow automáticamente, eligiendo y conectando las herramientas por ti.',
  wfGenerate: '✨ Generar',
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
  navIntegrations: 'Intégrations',
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
  descIntegrations: 'Connectez des apps et services externes à ce workspace',
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
  sectionIntegrations: 'Intégrations',
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
  integrationsTitle: 'Intégrations',
  integrationsSubtitle: 'Connectez les apps et comptes que ce workspace utilise pour travailler avec clients, documents et automatisations.',
  integrationsEmailTitle: 'E-mail',
  integrationsEmailDescription: 'Envoyez et recevez des e-mails clients avec MITIKUS, Gmail, Outlook ou votre propre compte SMTP/IMAP.',
  integrationsCalendarTitle: 'Calendrier',
  integrationsCalendarDescription: 'Préparez Google Calendar ou Outlook Calendar pour les appels, échéances, rappels et la planification des missions.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Connecter le compte',
  integrationsConnecting: 'Connexion...',
  integrationsDisconnect: 'Déconnecter',
  integrationsDisconnecting: 'Déconnexion...',
  integrationsCalendarConnectedAccount: 'Compte de calendrier connecté',
  integrationsCalendarConnectError: 'Impossible de démarrer la connexion au calendrier.',
  integrationsCalendarDisconnectError: 'Impossible de déconnecter le calendrier.',
  integrationsStorageTitle: 'Stockage',
  integrationsStorageDescription: 'Préparez le stockage externe pour documents, contrats, PDFs et sauvegardes du workspace.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Compte de stockage connecté',
  integrationsStorageConnectError: 'Impossible de démarrer la connexion au stockage.',
  integrationsStorageDisconnectError: 'Impossible de déconnecter le compte de stockage.',
  integrationsStorageExportFiles: 'Enregistrer le ZIP des fichiers',
  integrationsStorageExporting: 'Enregistrement...',
  integrationsStorageExported: 'ZIP des fichiers enregistré dans le stockage connecté.',
  integrationsStorageOpenExport: 'Ouvrir',
  integrationsStorageExportError: 'Impossible d’enregistrer le ZIP des fichiers dans le stockage connecté.',
  integrationsAiTitle: 'Fournisseurs IA',
  integrationsAiDescription: 'Utilisez l’IA gérée par MITIKUS par défaut et préparez les clés propres pour les plans avancés.',
  integrationsMitikusAi: 'MITIKUS IA',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Géré par MITIKUS',
  integrationsAiOwnKeyConfigured: 'Clé API propre configurée',
  integrationsAiKeyLabel: 'Clé API',
  integrationsAiKeyPlaceholder: 'Collez la clé API du fournisseur',
  integrationsAiLabelLabel: 'Libellé interne',
  integrationsAiLabelPlaceholder: 'Exemple : clé OpenAI agence',
  integrationsAiSecurityNote: 'La clé est chiffrée avant d’être enregistrée.',
  integrationsAiSave: 'Enregistrer le fournisseur',
  integrationsAiSaving: 'Enregistrement...',
  integrationsAiSaved: 'Fournisseur IA enregistré.',
  integrationsAiSaveError: 'Impossible d’enregistrer le fournisseur IA.',
  integrationsAiDisconnectError: 'Impossible de déconnecter le fournisseur IA.',
  integrationsSignatureTitle: 'Signature numérique',
  integrationsSignatureDescription: 'Utilisez la signature OTP MITIKUS par défaut et préparez des fournisseurs externes pour les contrats avancés.',
  integrationsMitikusSignature: 'Signature MITIKUS',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Communication',
  integrationsCommunicationDescription: 'Préparez la messagerie client pour le suivi des leads, les rappels de factures et les notifications de flux.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Formulaires et acquisition',
  integrationsFormsDescription: 'Préparez des formulaires externes pour que les réponses puissent créer des leads, clients, tâches, contrats ou missions dans MITIKUS.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Appels vidéo',
  integrationsVideoCallsDescription: 'Préparez des liens de réunion en ligne pour clients, missions, contrats et suivis planifiés.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'Automatisations externes',
  integrationsAutomationDescription: 'Préparez les connexions Make, Zapier et n8n pour que les flux MITIKUS puissent déclencher des processus externes plus tard.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Comptabilité',
  integrationsAccountingDescription: 'Préparez les exports et la future synchronisation avec les outils comptables utilisés par indépendants, agences et PME.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-commerce',
  integrationsEcommerceDescription: 'Préparez des connexions avec les boutiques en ligne pour importer clients, commandes, produits et ventes prêtes à facturer.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Paiement des factures',
  integrationsPaymentsDescription: 'Préparez de futurs liens de paiement pour que les clients puissent payer les factures émises par ce workspace.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Bientôt',
  integrationsRequiresSetup: 'Nécessite la configuration OAuth avant que les utilisateurs puissent connecter leur compte.',
  integrationsConfigured: 'Configuré',
  integrationsNotConfigured: 'Non configuré',
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
  navIntegrations: 'Integrationen',
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
  descIntegrations: 'Externe Apps und Dienste mit diesem Workspace verbinden',
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
  sectionIntegrations: 'Integrationen',
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
  integrationsTitle: 'Integrationen',
  integrationsSubtitle: 'Verbinden Sie die Apps und Konten, die dieser Workspace für Kunden, Dokumente und Automatisierungen nutzt.',
  integrationsEmailTitle: 'E-Mail',
  integrationsEmailDescription: 'Senden und empfangen Sie Kunden-E-Mails mit MITIKUS, Gmail, Outlook oder Ihrem eigenen SMTP/IMAP-Konto.',
  integrationsCalendarTitle: 'Kalender',
  integrationsCalendarDescription: 'Bereiten Sie Google Calendar oder Outlook Calendar für Anrufe, Fristen, Erinnerungen und Missionsplanung vor.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Konto verbinden',
  integrationsConnecting: 'Verbinden...',
  integrationsDisconnect: 'Trennen',
  integrationsDisconnecting: 'Wird getrennt...',
  integrationsCalendarConnectedAccount: 'Kalenderkonto verbunden',
  integrationsCalendarConnectError: 'Die Kalenderverbindung konnte nicht gestartet werden.',
  integrationsCalendarDisconnectError: 'Der Kalender konnte nicht getrennt werden.',
  integrationsStorageTitle: 'Speicher',
  integrationsStorageDescription: 'Externen Speicher für Dokumente, Verträge, PDFs und Workspace-Backups vorbereiten.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Speicherkonto verbunden',
  integrationsStorageConnectError: 'Die Speicherverbindung konnte nicht gestartet werden.',
  integrationsStorageDisconnectError: 'Das Speicherkonto konnte nicht getrennt werden.',
  integrationsStorageExportFiles: 'Dateien-ZIP speichern',
  integrationsStorageExporting: 'Speichern...',
  integrationsStorageExported: 'Dateien-ZIP im verbundenen Speicher gespeichert.',
  integrationsStorageOpenExport: 'Öffnen',
  integrationsStorageExportError: 'Das Dateien-ZIP konnte nicht im verbundenen Speicher gespeichert werden.',
  integrationsAiTitle: 'KI-Anbieter',
  integrationsAiDescription: 'MITIKUS verwaltete KI standardmäßig nutzen und eigene API-Schlüssel für erweiterte Pläne vorbereiten.',
  integrationsMitikusAi: 'MITIKUS KI',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Von MITIKUS verwaltet',
  integrationsAiOwnKeyConfigured: 'Eigener API-Schlüssel konfiguriert',
  integrationsAiKeyLabel: 'API-Schlüssel',
  integrationsAiKeyPlaceholder: 'API-Schlüssel des Anbieters einfügen',
  integrationsAiLabelLabel: 'Interne Bezeichnung',
  integrationsAiLabelPlaceholder: 'Beispiel: Agentur OpenAI-Schlüssel',
  integrationsAiSecurityNote: 'Der Schlüssel wird vor dem Speichern verschlüsselt.',
  integrationsAiSave: 'Anbieter speichern',
  integrationsAiSaving: 'Speichern...',
  integrationsAiSaved: 'KI-Anbieter gespeichert.',
  integrationsAiSaveError: 'Der KI-Anbieter konnte nicht gespeichert werden.',
  integrationsAiDisconnectError: 'Der KI-Anbieter konnte nicht getrennt werden.',
  integrationsSignatureTitle: 'Digitale Signatur',
  integrationsSignatureDescription: 'MITIKUS OTP-Signatur standardmäßig nutzen und externe Anbieter für erweiterte Vertragsabläufe vorbereiten.',
  integrationsMitikusSignature: 'MITIKUS Signatur',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Kommunikation',
  integrationsCommunicationDescription: 'Kunden-Nachrichten für Lead-Nachverfolgung, Rechnungserinnerungen und Workflow-Benachrichtigungen vorbereiten.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Formulare und Lead-Erfassung',
  integrationsFormsDescription: 'Externe Formulare vorbereiten, damit Antworten Leads, Kunden, Aufgaben, Verträge oder Missionen in MITIKUS erstellen können.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Videoanrufe',
  integrationsVideoCallsDescription: 'Online-Meeting-Links für Kunden, Missionen, Verträge und geplante Nachverfolgungen vorbereiten.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'Externe Automatisierungen',
  integrationsAutomationDescription: 'Make-, Zapier- und n8n-Verbindungen vorbereiten, damit MITIKUS-Workflows später externe Prozesse auslösen können.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Buchhaltung',
  integrationsAccountingDescription: 'Exporte und spätere Synchronisierung mit Buchhaltungstools für Selbständige, Agenturen und KMU vorbereiten.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-Commerce',
  integrationsEcommerceDescription: 'Online-Shop-Verbindungen vorbereiten, um Kunden, Bestellungen, Produkte und abrechnungsbereite Verkäufe zu importieren.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Rechnungszahlungen',
  integrationsPaymentsDescription: 'Zukünftige Zahlungslinks vorbereiten, damit Kunden Rechnungen dieses Workspaces bezahlen können.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Demnächst',
  integrationsRequiresSetup: 'OAuth muss eingerichtet werden, bevor Nutzer ihr Konto verbinden können.',
  integrationsConfigured: 'Konfiguriert',
  integrationsNotConfigured: 'Nicht konfiguriert',
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
  navIntegrations: 'Integrações',
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
  descIntegrations: 'Ligue apps e serviços externos a este workspace',
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
  sectionIntegrations: 'Integrações',
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
  integrationsTitle: 'Integrações',
  integrationsSubtitle: 'Ligue as apps e contas que este workspace usa para trabalhar com clientes, documentos e automatizações.',
  integrationsEmailTitle: 'Correio',
  integrationsEmailDescription: 'Envie e receba emails de clientes com MITIKUS, Gmail, Outlook ou a sua própria conta SMTP/IMAP.',
  integrationsCalendarTitle: 'Calendário',
  integrationsCalendarDescription: 'Prepare o Google Calendar ou Outlook Calendar para chamadas, prazos, lembretes e planeamento de missões.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Ligar conta',
  integrationsConnecting: 'A ligar...',
  integrationsDisconnect: 'Desligar',
  integrationsDisconnecting: 'A desligar...',
  integrationsCalendarConnectedAccount: 'Conta de calendário ligada',
  integrationsCalendarConnectError: 'Não foi possível iniciar a ligação ao calendário.',
  integrationsCalendarDisconnectError: 'Não foi possível desligar o calendário.',
  integrationsStorageTitle: 'Armazenamento',
  integrationsStorageDescription: 'Prepare armazenamento externo para documentos, contratos, PDFs e cópias do workspace.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Conta de armazenamento ligada',
  integrationsStorageConnectError: 'Não foi possível iniciar a ligação ao armazenamento.',
  integrationsStorageDisconnectError: 'Não foi possível desligar a conta de armazenamento.',
  integrationsStorageExportFiles: 'Guardar ZIP de ficheiros',
  integrationsStorageExporting: 'A guardar...',
  integrationsStorageExported: 'ZIP de ficheiros guardado no armazenamento ligado.',
  integrationsStorageOpenExport: 'Abrir',
  integrationsStorageExportError: 'Não foi possível guardar o ZIP de ficheiros no armazenamento ligado.',
  integrationsAiTitle: 'Fornecedores de IA',
  integrationsAiDescription: 'Use a IA gerida pela MITIKUS por defeito e prepare chaves próprias para planos avançados.',
  integrationsMitikusAi: 'MITIKUS IA',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Gerido pela MITIKUS',
  integrationsAiOwnKeyConfigured: 'Chave API própria configurada',
  integrationsAiKeyLabel: 'Chave API',
  integrationsAiKeyPlaceholder: 'Cole a chave API do fornecedor',
  integrationsAiLabelLabel: 'Etiqueta interna',
  integrationsAiLabelPlaceholder: 'Exemplo: chave OpenAI agência',
  integrationsAiSecurityNote: 'A chave é cifrada antes de ser guardada.',
  integrationsAiSave: 'Guardar fornecedor',
  integrationsAiSaving: 'A guardar...',
  integrationsAiSaved: 'Fornecedor de IA guardado.',
  integrationsAiSaveError: 'Não foi possível guardar o fornecedor de IA.',
  integrationsAiDisconnectError: 'Não foi possível desligar o fornecedor de IA.',
  integrationsSignatureTitle: 'Assinatura digital',
  integrationsSignatureDescription: 'Use a assinatura OTP da MITIKUS por defeito e prepare fornecedores externos para contratos avançados.',
  integrationsMitikusSignature: 'Assinatura MITIKUS',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Comunicação',
  integrationsCommunicationDescription: 'Prepare mensagens com clientes para acompanhamento de leads, lembretes de faturas e avisos de fluxos.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Formulários e captação',
  integrationsFormsDescription: 'Prepare formulários externos para que as respostas possam criar leads, clientes, tarefas, contratos ou missões na MITIKUS.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Videochamadas',
  integrationsVideoCallsDescription: 'Prepare links de reunião online para clientes, missões, contratos e acompanhamentos programados.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'Automatizações externas',
  integrationsAutomationDescription: 'Prepare ligações com Make, Zapier e n8n para que os fluxos da MITIKUS possam acionar processos externos mais tarde.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Contabilidade',
  integrationsAccountingDescription: 'Prepare exportações e futura sincronização com ferramentas contabilísticas usadas por freelancers, agências e PMEs.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-commerce',
  integrationsEcommerceDescription: 'Prepare ligações com lojas online para importar clientes, encomendas, produtos e vendas prontas para faturar.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Pagamentos de faturas',
  integrationsPaymentsDescription: 'Prepare futuros links de pagamento para que os clientes possam pagar faturas emitidas por este workspace.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Brevemente',
  integrationsRequiresSetup: 'Requer configuração OAuth antes de os utilizadores poderem ligar a sua conta.',
  integrationsConfigured: 'Configurado',
  integrationsNotConfigured: 'Não configurado',
  todayGreetingMorning: 'Bom dia',
  todayGreetingAfternoon: 'Boa tarde',
  todayGreetingEvening: 'Boa noite',
  todayFallbackName: 'utilizador',
  todayArkosStepTitle: 'Definir a primeira missão',
  todayArkosStepDescription: 'Conte à Arkos o que quer alcançar e transforme-o num plano.',
  todayClientStepTitle: 'Adicionar um cliente',
  todayClientStepDescription: 'Crie o seu primeiro dossiê de cliente para organizar trabalho e documentos.',
  todayTaskStepTitle: 'Criar uma tarefa',
  todayTaskStepDescription: 'Registe uma ação simples para começar a acompanhar o trabalho.',
  todayInvoiceStepTitle: 'Criar uma fatura',
  todayInvoiceStepDescription: 'Prepare a sua primeira fatura com PDF descarregável.',
  todayFiscalStepTitle: 'Configurar fiscalidade',
  todayFiscalStepDescription: 'Indique país e forma jurídica para ver obrigações fiscais.',
  todayTimeTracking: 'Registo de tempo',
  todayViewHistory: 'Ver histórico',
  todayMyTasks: 'As minhas tarefas',
  todayViewAll: 'Ver tudo',
  todayAllCaughtUpTitle: 'Está tudo em dia. Bom trabalho.',
  todayAllCaughtUpDescription: 'Não tem passos nem fluxos pendentes.',
  todayAskArkosMission: 'Pedir uma nova missão à Arkos',
  todayPendingSteps: 'Passos pendentes',
  todayGoToStep: 'Ir para o passo',
  todayWorkflows: 'Fluxos',
  todayPending: 'Pendente',
  todayOpenWorkflow: 'Abrir fluxo',
  todayTeamActivity: 'Atividade da equipa',
  todayStatusQueued: 'Em fila',
  todayStatusRunning: 'Em execução',
  todayStatusCompleted: 'Concluído',
  todayStatusFailed: 'Falhou',
  todayStatusCancelled: 'Cancelado',
  todayClockNotStarted: 'Sem entrada registada',
  todayClockElapsedPrefix: 'Tempo registado',
  todayClockInLabel: 'Entrada',
  todayClockCompleted: 'Turno concluído',
  todayClockInAction: 'Registar entrada',
  todayClockOutAction: 'Registar saída',
  todayClockWorking: 'A trabalhar',
  todayClockInError: 'Não foi possível registar a entrada.',
  todayClockOutError: 'Não foi possível registar a saída.',
  todayContractsPending: 'Contratos pendentes',
  todayContractDraft: 'Rascunho',
  todayContractSent: 'Enviado',
  todayInvoicesPendingCollection: 'Faturas por cobrar',
  todayInvoiceUnpaidSingular: 'fatura pendente',
  todayInvoiceUnpaidPlural: 'faturas pendentes',
  todayFiscal: 'Fiscalidade',
  todayFiscalSetupTitle: 'Configurar calendário fiscal',
  todayFiscalSetupDescription: 'Complete os dados fiscais para ver os próximos prazos.',
  todayConfigure: 'Configurar',
  todayUpcomingFiscal: 'Próximas obrigações',
  todayViewCalendar: 'Ver calendário',
  todayToday: 'Hoje',
  todayCalculate: 'Calcular',
  todayRecentNotebooks: 'Cadernos recentes',
  todaySourceSingular: 'fonte',
  todaySourcePlural: 'fontes',
  todayFirstSteps: 'Primeiros passos',
  todayCompletedProgress: 'concluídos',
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
  navIntegrations: 'Integrazioni',
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
  descIntegrations: 'Collega app e servizi esterni a questo workspace',
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
  sectionIntegrations: 'Integrazioni',
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
  integrationsTitle: 'Integrazioni',
  integrationsSubtitle: 'Collega le app e gli account che questo workspace usa per lavorare con clienti, documenti e automazioni.',
  integrationsEmailTitle: 'Email',
  integrationsEmailDescription: 'Invia e ricevi email dei clienti con MITIKUS, Gmail, Outlook o il tuo account SMTP/IMAP.',
  integrationsCalendarTitle: 'Calendario',
  integrationsCalendarDescription: 'Prepara Google Calendar o Outlook Calendar per chiamate, scadenze, promemoria e pianificazione delle missioni.',
  integrationsGoogleCalendar: 'Google Calendar',
  integrationsOutlookCalendar: 'Outlook Calendar',
  integrationsConnectProvider: 'Collega account',
  integrationsConnecting: 'Connessione...',
  integrationsDisconnect: 'Disconnetti',
  integrationsDisconnecting: 'Disconnessione...',
  integrationsCalendarConnectedAccount: 'Account calendario collegato',
  integrationsCalendarConnectError: 'Impossibile avviare il collegamento del calendario.',
  integrationsCalendarDisconnectError: 'Impossibile disconnettere il calendario.',
  integrationsStorageTitle: 'Archiviazione',
  integrationsStorageDescription: 'Prepara l’archiviazione esterna per documenti, contratti, PDF e backup del workspace.',
  integrationsGoogleDrive: 'Google Drive',
  integrationsOneDrive: 'OneDrive',
  integrationsDropbox: 'Dropbox',
  integrationsStorageConnectedAccount: 'Account di archiviazione collegato',
  integrationsStorageConnectError: 'Impossibile avviare il collegamento dell’archiviazione.',
  integrationsStorageDisconnectError: 'Impossibile disconnettere l’account di archiviazione.',
  integrationsStorageExportFiles: 'Salva ZIP dei file',
  integrationsStorageExporting: 'Salvataggio...',
  integrationsStorageExported: 'ZIP dei file salvato nell’archiviazione collegata.',
  integrationsStorageOpenExport: 'Apri',
  integrationsStorageExportError: 'Impossibile salvare lo ZIP dei file nell’archiviazione collegata.',
  integrationsAiTitle: 'Provider IA',
  integrationsAiDescription: 'Usa l’IA gestita da MITIKUS per impostazione predefinita e prepara chiavi proprie per i piani avanzati.',
  integrationsMitikusAi: 'MITIKUS IA',
  integrationsOpenAi: 'OpenAI',
  integrationsAnthropic: 'Anthropic',
  integrationsGemini: 'Google Gemini',
  integrationsManagedByMitikus: 'Gestito da MITIKUS',
  integrationsAiOwnKeyConfigured: 'Chiave API propria configurata',
  integrationsAiKeyLabel: 'Chiave API',
  integrationsAiKeyPlaceholder: 'Incolla la chiave API del provider',
  integrationsAiLabelLabel: 'Etichetta interna',
  integrationsAiLabelPlaceholder: 'Esempio: chiave OpenAI agenzia',
  integrationsAiSecurityNote: 'La chiave viene cifrata prima di essere salvata.',
  integrationsAiSave: 'Salva provider',
  integrationsAiSaving: 'Salvataggio...',
  integrationsAiSaved: 'Provider IA salvato.',
  integrationsAiSaveError: 'Impossibile salvare il provider IA.',
  integrationsAiDisconnectError: 'Impossibile disconnettere il provider IA.',
  integrationsSignatureTitle: 'Firma digitale',
  integrationsSignatureDescription: 'Usa la firma OTP di MITIKUS per impostazione predefinita e prepara provider esterni per contratti avanzati.',
  integrationsMitikusSignature: 'Firma MITIKUS',
  integrationsSignaturit: 'Signaturit',
  integrationsDocuSign: 'DocuSign',
  integrationsCommunicationTitle: 'Comunicazione',
  integrationsCommunicationDescription: 'Prepara la messaggistica con i clienti per follow-up dei lead, promemoria fatture e notifiche dei flussi.',
  integrationsWhatsAppBusiness: 'WhatsApp Business',
  integrationsTwilio: 'Twilio',
  integrationsFormsTitle: 'Moduli e acquisizione',
  integrationsFormsDescription: 'Prepara moduli esterni affinché le risposte possano creare lead, clienti, attività, contratti o missioni in MITIKUS.',
  integrationsTypeform: 'Typeform',
  integrationsGoogleForms: 'Google Forms',
  integrationsTally: 'Tally',
  integrationsJotform: 'Jotform',
  integrationsFormsWebhookHelp: 'Use this private webhook URL in external forms. Each valid submission creates a lead in MITIKUS.',
  integrationsFormsEnableWebhook: 'Enable webhook',
  integrationsFormsRotateToken: 'Rotate token',
  integrationsFormsDisableWebhook: 'Disable',
  integrationsFormsWebhookReady: 'Webhook URL generated. Copy it now.',
  integrationsFormsWebhookUrl: 'Webhook URL',
  integrationsFormsCopyUrl: 'Copy URL',
  integrationsFormsCopied: 'Copied.',
  integrationsFormsTokenPreview: 'Token',
  integrationsFormsTokenOnlyShownOnce: 'For security, the full URL is only shown when you enable or rotate the token.',
  integrationsFormsActionError: 'Could not update the forms integration.',
  integrationsFormsWebhookActive: 'Webhook active',
  integrationsVideoCallsTitle: 'Videochiamate',
  integrationsVideoCallsDescription: 'Prepara link per riunioni online con clienti, missioni, contratti e follow-up programmati.',
  integrationsGoogleMeet: 'Google Meet',
  integrationsMicrosoftTeams: 'Microsoft Teams',
  integrationsZoom: 'Zoom',
  integrationsAutomationTitle: 'Automazioni esterne',
  integrationsAutomationDescription: 'Prepara connessioni con Make, Zapier e n8n affinché i flussi MITIKUS possano attivare processi esterni in seguito.',
  integrationsMake: 'Make',
  integrationsZapier: 'Zapier',
  integrationsN8n: 'n8n',
  integrationsAccountingTitle: 'Contabilità',
  integrationsAccountingDescription: 'Prepara esportazioni e futura sincronizzazione con strumenti contabili usati da freelance, agenzie e PMI.',
  integrationsHolded: 'Holded',
  integrationsSage: 'Sage',
  integrationsQuipu: 'Quipu',
  integrationsAnfix: 'Anfix',
  integrationsContasimple: 'Contasimple',
  integrationsEcommerceTitle: 'E-commerce',
  integrationsEcommerceDescription: 'Prepara connessioni con negozi online per importare clienti, ordini, prodotti e vendite pronte per la fatturazione.',
  integrationsShopify: 'Shopify',
  integrationsWooCommerce: 'WooCommerce',
  integrationsPrestashop: 'Prestashop',
  integrationsPaymentsTitle: 'Pagamenti fatture',
  integrationsPaymentsDescription: 'Prepara futuri link di pagamento affinché i clienti possano pagare le fatture emesse da questo workspace.',
  integrationsStripeConnect: 'Stripe Connect',
  integrationsPaypal: 'PayPal',
  integrationsRedsys: 'Redsys',
  integrationsComingSoon: 'Prossimamente',
  integrationsRequiresSetup: 'Richiede la configurazione OAuth prima che gli utenti possano collegare il proprio account.',
  integrationsConfigured: 'Configurato',
  integrationsNotConfigured: 'Non configurato',
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

const todayLocaleOverrides: Partial<Record<Locale, Partial<DashboardTranslations>>> = {
  fr: {
    todayGreetingMorning: 'Bonjour',
    todayGreetingAfternoon: 'Bon après-midi',
    todayGreetingEvening: 'Bonsoir',
    todayFallbackName: 'utilisateur',
    todayTimeTracking: 'Suivi du temps',
    todayViewHistory: 'Voir l’historique',
    todayAllCaughtUpTitle: 'Tout est à jour. Beau travail.',
    todayAllCaughtUpDescription: 'Vous n’avez aucune étape ni aucun workflow en attente.',
    todayAskArkosMission: 'Demander une nouvelle mission à Arkos',
    todayClockNotStarted: 'Non pointé',
    todayClockElapsedPrefix: 'Temps enregistré',
    todayClockInLabel: 'Entrée',
    todayClockCompleted: 'Session terminée',
    todayClockInAction: 'Pointer',
    todayClockOutAction: 'Arrêter',
    todayClockWorking: 'En cours',
    todayClockInError: 'Impossible de pointer.',
    todayClockOutError: 'Impossible d’arrêter le suivi.',
  },
  de: {
    todayGreetingMorning: 'Guten Morgen',
    todayGreetingAfternoon: 'Guten Tag',
    todayGreetingEvening: 'Guten Abend',
    todayFallbackName: 'Nutzer',
    todayTimeTracking: 'Zeiterfassung',
    todayViewHistory: 'Verlauf ansehen',
    todayAllCaughtUpTitle: 'Alles ist aktuell. Gute Arbeit.',
    todayAllCaughtUpDescription: 'Sie haben keine offenen Schritte oder Workflows.',
    todayAskArkosMission: 'Arkos um eine neue Mission bitten',
    todayClockNotStarted: 'Nicht eingestempelt',
    todayClockElapsedPrefix: 'Erfasste Zeit',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Sitzung abgeschlossen',
    todayClockInAction: 'Einstempeln',
    todayClockOutAction: 'Ausstempeln',
    todayClockWorking: 'Läuft',
    todayClockInError: 'Einstempeln nicht möglich.',
    todayClockOutError: 'Ausstempeln nicht möglich.',
  },
  it: {
    todayGreetingMorning: 'Buongiorno',
    todayGreetingAfternoon: 'Buon pomeriggio',
    todayGreetingEvening: 'Buonasera',
    todayFallbackName: 'utente',
    todayTimeTracking: 'Monitoraggio tempo',
    todayViewHistory: 'Vedi cronologia',
    todayAllCaughtUpTitle: 'È tutto aggiornato. Ottimo lavoro.',
    todayAllCaughtUpDescription: 'Non hai passaggi o flussi in sospeso.',
    todayAskArkosMission: 'Chiedi ad Arkos una nuova missione',
    todayClockNotStarted: 'Non timbrato',
    todayClockElapsedPrefix: 'Tempo registrato',
    todayClockInLabel: 'Entrata',
    todayClockCompleted: 'Sessione completata',
    todayClockInAction: 'Timbra entrata',
    todayClockOutAction: 'Timbra uscita',
    todayClockWorking: 'In corso',
    todayClockInError: 'Impossibile timbrare l’entrata.',
    todayClockOutError: 'Impossibile timbrare l’uscita.',
  },
  nl: {
    todayGreetingMorning: 'Goedemorgen',
    todayGreetingAfternoon: 'Goedemiddag',
    todayGreetingEvening: 'Goedenavond',
    todayFallbackName: 'gebruiker',
    todayTimeTracking: 'Tijdregistratie',
    todayViewHistory: 'Geschiedenis bekijken',
    todayAllCaughtUpTitle: 'Alles is bijgewerkt. Goed gedaan.',
    todayAllCaughtUpDescription: 'Je hebt geen open stappen of workflows.',
    todayAskArkosMission: 'Vraag Arkos om een nieuwe missie',
    todayClockNotStarted: 'Niet ingeklokt',
    todayClockElapsedPrefix: 'Geregistreerde tijd',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Sessie voltooid',
    todayClockInAction: 'Inklokken',
    todayClockOutAction: 'Uitklokken',
    todayClockWorking: 'Bezig',
    todayClockInError: 'Inklokken is niet gelukt.',
    todayClockOutError: 'Uitklokken is niet gelukt.',
  },
  pl: {
    todayGreetingMorning: 'Dzień dobry',
    todayGreetingAfternoon: 'Dzień dobry',
    todayGreetingEvening: 'Dobry wieczór',
    todayFallbackName: 'użytkownik',
    todayTimeTracking: 'Rejestracja czasu',
    todayViewHistory: 'Zobacz historię',
    todayAllCaughtUpTitle: 'Wszystko aktualne. Dobra robota.',
    todayAllCaughtUpDescription: 'Nie masz oczekujących kroków ani przepływów.',
    todayAskArkosMission: 'Poproś Arkos o nową misję',
    todayClockNotStarted: 'Nie rozpoczęto pracy',
    todayClockElapsedPrefix: 'Zarejestrowany czas',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Sesja zakończona',
    todayClockInAction: 'Rozpocznij',
    todayClockOutAction: 'Zakończ',
    todayClockWorking: 'W toku',
    todayClockInError: 'Nie udało się rozpocząć pracy.',
    todayClockOutError: 'Nie udało się zakończyć pracy.',
  },
  ro: {
    todayGreetingMorning: 'Bună dimineața',
    todayGreetingAfternoon: 'Bună ziua',
    todayGreetingEvening: 'Bună seara',
    todayFallbackName: 'utilizator',
    todayTimeTracking: 'Pontaj',
    todayViewHistory: 'Vezi istoricul',
    todayAllCaughtUpTitle: 'Totul este la zi. Bună treabă.',
    todayAllCaughtUpDescription: 'Nu ai pași sau fluxuri în așteptare.',
    todayAskArkosMission: 'Cere-i lui Arkos o misiune nouă',
    todayClockNotStarted: 'Nepontat',
    todayClockElapsedPrefix: 'Timp înregistrat',
    todayClockInLabel: 'Intrare',
    todayClockCompleted: 'Sesiune finalizată',
    todayClockInAction: 'Pontează intrarea',
    todayClockOutAction: 'Pontează ieșirea',
    todayClockWorking: 'În lucru',
    todayClockInError: 'Nu s-a putut ponta intrarea.',
    todayClockOutError: 'Nu s-a putut ponta ieșirea.',
  },
  sv: {
    todayGreetingMorning: 'God morgon',
    todayGreetingAfternoon: 'God eftermiddag',
    todayGreetingEvening: 'God kväll',
    todayFallbackName: 'användare',
    todayTimeTracking: 'Tidsregistrering',
    todayViewHistory: 'Visa historik',
    todayAllCaughtUpTitle: 'Allt är uppdaterat. Bra jobbat.',
    todayAllCaughtUpDescription: 'Du har inga väntande steg eller arbetsflöden.',
    todayAskArkosMission: 'Be Arkos om ett nytt uppdrag',
    todayClockNotStarted: 'Inte instämplad',
    todayClockElapsedPrefix: 'Registrerad tid',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Pass slutfört',
    todayClockInAction: 'Stämpla in',
    todayClockOutAction: 'Stämpla ut',
    todayClockWorking: 'Pågår',
    todayClockInError: 'Kunde inte stämpla in.',
    todayClockOutError: 'Kunde inte stämpla ut.',
  },
  da: {
    todayGreetingMorning: 'Godmorgen',
    todayGreetingAfternoon: 'God eftermiddag',
    todayGreetingEvening: 'Godaften',
    todayFallbackName: 'bruger',
    todayTimeTracking: 'Tidsregistrering',
    todayViewHistory: 'Se historik',
    todayAllCaughtUpTitle: 'Alt er ajour. Godt arbejde.',
    todayAllCaughtUpDescription: 'Du har ingen ventende trin eller arbejdsflows.',
    todayAskArkosMission: 'Bed Arkos om en ny mission',
    todayClockNotStarted: 'Ikke stemplet ind',
    todayClockElapsedPrefix: 'Registreret tid',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Session afsluttet',
    todayClockInAction: 'Stempl ind',
    todayClockOutAction: 'Stempl ud',
    todayClockWorking: 'I gang',
    todayClockInError: 'Kunne ikke stemple ind.',
    todayClockOutError: 'Kunne ikke stemple ud.',
  },
  no: {
    todayGreetingMorning: 'God morgen',
    todayGreetingAfternoon: 'God ettermiddag',
    todayGreetingEvening: 'God kveld',
    todayFallbackName: 'bruker',
    todayTimeTracking: 'Tidsregistrering',
    todayViewHistory: 'Se historikk',
    todayAllCaughtUpTitle: 'Alt er oppdatert. Godt jobbet.',
    todayAllCaughtUpDescription: 'Du har ingen ventende steg eller arbeidsflyter.',
    todayAskArkosMission: 'Be Arkos om et nytt oppdrag',
    todayClockNotStarted: 'Ikke stemplet inn',
    todayClockElapsedPrefix: 'Registrert tid',
    todayClockInLabel: 'Start',
    todayClockCompleted: 'Økt fullført',
    todayClockInAction: 'Stemple inn',
    todayClockOutAction: 'Stemple ut',
    todayClockWorking: 'Pågår',
    todayClockInError: 'Kunne ikke stemple inn.',
    todayClockOutError: 'Kunne ikke stemple ut.',
  },
  hu: {
    todayGreetingMorning: 'Jó reggelt',
    todayGreetingAfternoon: 'Jó napot',
    todayGreetingEvening: 'Jó estét',
    todayFallbackName: 'felhasználó',
    todayTimeTracking: 'Időnyilvántartás',
    todayViewHistory: 'Előzmények megtekintése',
    todayAllCaughtUpTitle: 'Minden naprakész. Szép munka.',
    todayAllCaughtUpDescription: 'Nincsenek függőben lévő lépések vagy munkafolyamatok.',
    todayAskArkosMission: 'Kérj új küldetést Arkostól',
    todayClockNotStarted: 'Nincs bejelentkezve',
    todayClockElapsedPrefix: 'Rögzített idő',
    todayClockInLabel: 'Kezdés',
    todayClockCompleted: 'Munkamenet befejezve',
    todayClockInAction: 'Bejelentkezés',
    todayClockOutAction: 'Kijelentkezés',
    todayClockWorking: 'Folyamatban',
    todayClockInError: 'Nem sikerült bejelentkezni.',
    todayClockOutError: 'Nem sikerült kijelentkezni.',
  },
  cs: {
    todayGreetingMorning: 'Dobré ráno',
    todayGreetingAfternoon: 'Dobré odpoledne',
    todayGreetingEvening: 'Dobrý večer',
    todayFallbackName: 'uživatel',
    todayTimeTracking: 'Evidence času',
    todayViewHistory: 'Zobrazit historii',
    todayAllCaughtUpTitle: 'Vše je aktuální. Dobrá práce.',
    todayAllCaughtUpDescription: 'Nemáte žádné čekající kroky ani pracovní postupy.',
    todayAskArkosMission: 'Požádat Arkos o novou misi',
    todayClockNotStarted: 'Nepřihlášeno',
    todayClockElapsedPrefix: 'Zaznamenaný čas',
    todayClockInLabel: 'Začátek',
    todayClockCompleted: 'Relace dokončena',
    todayClockInAction: 'Přihlásit příchod',
    todayClockOutAction: 'Přihlásit odchod',
    todayClockWorking: 'Probíhá',
    todayClockInError: 'Příchod se nepodařilo zaznamenat.',
    todayClockOutError: 'Odchod se nepodařilo zaznamenat.',
  },
  sk: {
    todayGreetingMorning: 'Dobré ráno',
    todayGreetingAfternoon: 'Dobré popoludnie',
    todayGreetingEvening: 'Dobrý večer',
    todayFallbackName: 'používateľ',
    todayTimeTracking: 'Evidencia času',
    todayViewHistory: 'Zobraziť históriu',
    todayAllCaughtUpTitle: 'Všetko je aktuálne. Dobrá práca.',
    todayAllCaughtUpDescription: 'Nemáte žiadne čakajúce kroky ani pracovné postupy.',
    todayAskArkosMission: 'Požiadať Arkos o novú misiu',
    todayClockNotStarted: 'Neprihlásené',
    todayClockElapsedPrefix: 'Zaznamenaný čas',
    todayClockInLabel: 'Začiatok',
    todayClockCompleted: 'Relácia dokončená',
    todayClockInAction: 'Zaznamenať príchod',
    todayClockOutAction: 'Zaznamenať odchod',
    todayClockWorking: 'Prebieha',
    todayClockInError: 'Príchod sa nepodarilo zaznamenať.',
    todayClockOutError: 'Odchod sa nepodarilo zaznamenať.',
  },
  el: {
    todayGreetingMorning: 'Καλημέρα',
    todayGreetingAfternoon: 'Καλό απόγευμα',
    todayGreetingEvening: 'Καλησπέρα',
    todayFallbackName: 'χρήστης',
    todayTimeTracking: 'Καταγραφή χρόνου',
    todayViewHistory: 'Προβολή ιστορικού',
    todayAllCaughtUpTitle: 'Όλα είναι ενημερωμένα. Καλή δουλειά.',
    todayAllCaughtUpDescription: 'Δεν έχετε εκκρεμή βήματα ή ροές εργασίας.',
    todayAskArkosMission: 'Ζητήστε νέα αποστολή από το Arkos',
    todayClockNotStarted: 'Δεν έχει γίνει έναρξη',
    todayClockElapsedPrefix: 'Καταγεγραμμένος χρόνος',
    todayClockInLabel: 'Έναρξη',
    todayClockCompleted: 'Η συνεδρία ολοκληρώθηκε',
    todayClockInAction: 'Έναρξη χρόνου',
    todayClockOutAction: 'Λήξη χρόνου',
    todayClockWorking: 'Σε εξέλιξη',
    todayClockInError: 'Δεν ήταν δυνατή η έναρξη χρόνου.',
    todayClockOutError: 'Δεν ήταν δυνατή η λήξη χρόνου.',
  },
  fi: {
    todayGreetingMorning: 'Hyvää huomenta',
    todayGreetingAfternoon: 'Hyvää iltapäivää',
    todayGreetingEvening: 'Hyvää iltaa',
    todayFallbackName: 'käyttäjä',
    todayTimeTracking: 'Työajan seuranta',
    todayViewHistory: 'Näytä historia',
    todayAllCaughtUpTitle: 'Kaikki on ajan tasalla. Hyvää työtä.',
    todayAllCaughtUpDescription: 'Sinulla ei ole odottavia vaiheita tai työnkulkuja.',
    todayAskArkosMission: 'Pyydä Arkosilta uusi tehtävä',
    todayClockNotStarted: 'Ei kirjautunut sisään',
    todayClockElapsedPrefix: 'Kirjattu aika',
    todayClockInLabel: 'Aloitus',
    todayClockCompleted: 'Istunto valmis',
    todayClockInAction: 'Kirjaudu sisään',
    todayClockOutAction: 'Kirjaudu ulos',
    todayClockWorking: 'Käynnissä',
    todayClockInError: 'Sisäänkirjaus epäonnistui.',
    todayClockOutError: 'Uloskirjaus epäonnistui.',
  },
  hr: {
    todayGreetingMorning: 'Dobro jutro',
    todayGreetingAfternoon: 'Dobar dan',
    todayGreetingEvening: 'Dobra večer',
    todayFallbackName: 'korisnik',
    todayTimeTracking: 'Praćenje vremena',
    todayViewHistory: 'Prikaži povijest',
    todayAllCaughtUpTitle: 'Sve je ažurno. Dobar posao.',
    todayAllCaughtUpDescription: 'Nemate koraka ni tijekova rada na čekanju.',
    todayAskArkosMission: 'Zatraži novu misiju od Arkosa',
    todayClockNotStarted: 'Nije prijavljeno',
    todayClockElapsedPrefix: 'Zabilježeno vrijeme',
    todayClockInLabel: 'Početak',
    todayClockCompleted: 'Sesija dovršena',
    todayClockInAction: 'Prijavi početak',
    todayClockOutAction: 'Prijavi kraj',
    todayClockWorking: 'U tijeku',
    todayClockInError: 'Nije moguće prijaviti početak.',
    todayClockOutError: 'Nije moguće prijaviti kraj.',
  },
  bg: {
    todayGreetingMorning: 'Добро утро',
    todayGreetingAfternoon: 'Добър ден',
    todayGreetingEvening: 'Добър вечер',
    todayFallbackName: 'потребител',
    todayTimeTracking: 'Отчитане на време',
    todayViewHistory: 'Виж история',
    todayAllCaughtUpTitle: 'Всичко е актуално. Добра работа.',
    todayAllCaughtUpDescription: 'Нямате чакащи стъпки или работни потоци.',
    todayAskArkosMission: 'Помолете Arkos за нова мисия',
    todayClockNotStarted: 'Не е стартирано',
    todayClockElapsedPrefix: 'Отчетено време',
    todayClockInLabel: 'Начало',
    todayClockCompleted: 'Сесията е завършена',
    todayClockInAction: 'Започни отчитане',
    todayClockOutAction: 'Спри отчитане',
    todayClockWorking: 'В ход',
    todayClockInError: 'Неуспешно стартиране на отчитането.',
    todayClockOutError: 'Неуспешно спиране на отчитането.',
  },
  sl: {
    todayGreetingMorning: 'Dobro jutro',
    todayGreetingAfternoon: 'Dober dan',
    todayGreetingEvening: 'Dober večer',
    todayFallbackName: 'uporabnik',
    todayTimeTracking: 'Sledenje času',
    todayViewHistory: 'Prikaži zgodovino',
    todayAllCaughtUpTitle: 'Vse je posodobljeno. Dobro opravljeno.',
    todayAllCaughtUpDescription: 'Nimate čakajočih korakov ali delovnih tokov.',
    todayAskArkosMission: 'Prosite Arkos za novo misijo',
    todayClockNotStarted: 'Ni prijavljeno',
    todayClockElapsedPrefix: 'Zabeležen čas',
    todayClockInLabel: 'Začetek',
    todayClockCompleted: 'Seja zaključena',
    todayClockInAction: 'Prijavi začetek',
    todayClockOutAction: 'Prijavi konec',
    todayClockWorking: 'V teku',
    todayClockInError: 'Začetka ni bilo mogoče prijaviti.',
    todayClockOutError: 'Konca ni bilo mogoče prijaviti.',
  },
  ja: {
    todayGreetingMorning: 'おはようございます',
    todayGreetingAfternoon: 'こんにちは',
    todayGreetingEvening: 'こんばんは',
    todayFallbackName: 'ユーザー',
    todayTimeTracking: '時間記録',
    todayViewHistory: '履歴を見る',
    todayAllCaughtUpTitle: 'すべて最新です。よくできました。',
    todayAllCaughtUpDescription: '保留中のステップやワークフローはありません。',
    todayAskArkosMission: 'Arkos に新しいミッションを依頼',
    todayClockNotStarted: '未開始',
    todayClockElapsedPrefix: '記録済み時間',
    todayClockInLabel: '開始',
    todayClockCompleted: 'セッション完了',
    todayClockInAction: '開始する',
    todayClockOutAction: '終了する',
    todayClockWorking: '作業中',
    todayClockInError: '開始を記録できませんでした。',
    todayClockOutError: '終了を記録できませんでした。',
  },
  zh: {
    todayGreetingMorning: '早上好',
    todayGreetingAfternoon: '下午好',
    todayGreetingEvening: '晚上好',
    todayFallbackName: '用户',
    todayTimeTracking: '时间记录',
    todayViewHistory: '查看历史',
    todayAllCaughtUpTitle: '一切都是最新的。做得好。',
    todayAllCaughtUpDescription: '没有待处理的步骤或工作流。',
    todayAskArkosMission: '让 Arkos 创建新任务',
    todayClockNotStarted: '尚未打卡',
    todayClockElapsedPrefix: '已记录时间',
    todayClockInLabel: '开始',
    todayClockCompleted: '会话已完成',
    todayClockInAction: '打卡开始',
    todayClockOutAction: '打卡结束',
    todayClockWorking: '进行中',
    todayClockInError: '无法打卡开始。',
    todayClockOutError: '无法打卡结束。',
  },
}

const toolsLocaleOverrides: Partial<Record<Locale, Partial<DashboardTranslations>>> = {
  fr: {
    toolsInstalledTitle: 'Outils installés',
    toolsInstalledDescription: 'Les outils que vous utilisez dans ce workspace.',
    toolsGenerate: 'Générer',
    toolsAdd: 'Ajouter',
    toolsActive: 'actifs',
    toolsOpen: 'Ouvrir',
    toolsEmptyTitle: 'Installez votre premier outil',
    toolsEmptyDescription: 'Créez un outil avec l’IA ou choisissez-en un dans le catalogue.',
    toolNewEntry: 'Nouvelle entrée',
    toolAiIdeas: 'Idées IA',
    toolImportCsv: 'Importer CSV',
    toolNoRecords: 'Aucun enregistrement dans cet outil pour le moment.',
    toolType: 'Type',
    toolDate: 'Date',
    toolActions: 'Actions',
    toolForm: 'Formulaire',
    toolRun: 'Exécuter',
    toolGenerating: 'Génération...',
    toolHistoryTitle: 'Historique des exécutions IA',
    toolRunNow: 'Exécuter maintenant',
  },
  de: {
    toolsInstalledTitle: 'Installierte Tools',
    toolsInstalledDescription: 'Die Tools, die Sie in diesem Workspace verwenden.',
    toolsGenerate: 'Generieren',
    toolsAdd: 'Hinzufügen',
    toolsActive: 'aktiv',
    toolsOpen: 'Öffnen',
    toolsEmptyTitle: 'Installieren Sie Ihr erstes Tool',
    toolsEmptyDescription: 'Erstellen Sie ein Tool mit KI oder wählen Sie eines aus dem Katalog.',
    toolNewEntry: 'Neuer Eintrag',
    toolAiIdeas: 'KI-Ideen',
    toolImportCsv: 'CSV importieren',
    toolNoRecords: 'Noch keine Einträge in diesem Tool.',
    toolType: 'Typ',
    toolDate: 'Datum',
    toolActions: 'Aktionen',
    toolForm: 'Formular',
    toolRun: 'Ausführen',
    toolGenerating: 'Wird generiert...',
    toolHistoryTitle: 'KI-Ausführungsverlauf',
    toolRunNow: 'Jetzt ausführen',
  },
  pt: {
    toolsInstalledTitle: 'Ferramentas instaladas',
    toolsInstalledDescription: 'As ferramentas que usa neste workspace.',
    toolsGenerate: 'Gerar',
    toolsAdd: 'Adicionar',
    toolsActive: 'ativas',
    toolsOpen: 'Abrir',
    toolsEmptyTitle: 'Instale a sua primeira ferramenta',
    toolsEmptyDescription: 'Crie uma ferramenta com IA ou escolha uma do catálogo.',
    toolNewEntry: 'Nova entrada',
    toolAiIdeas: 'Ideias IA',
    toolImportCsv: 'Importar CSV',
    toolNoRecords: 'Ainda não há registos nesta ferramenta.',
    toolType: 'Tipo',
    toolDate: 'Data',
    toolActions: 'Ações',
    toolForm: 'Formulário',
    toolRun: 'Executar',
    toolGenerating: 'A gerar...',
    toolHistoryTitle: 'Histórico de execuções IA',
    toolRunNow: 'Executar agora',
  },
  it: {
    toolsInstalledTitle: 'Strumenti installati',
    toolsInstalledDescription: 'Gli strumenti che usi in questo workspace.',
    toolsGenerate: 'Genera',
    toolsAdd: 'Aggiungi',
    toolsActive: 'attivi',
    toolsOpen: 'Apri',
    toolsEmptyTitle: 'Installa il tuo primo strumento',
    toolsEmptyDescription: 'Crea uno strumento con l’IA o scegline uno dal catalogo.',
    toolNewEntry: 'Nuova voce',
    toolAiIdeas: 'Idee IA',
    toolImportCsv: 'Importa CSV',
    toolNoRecords: 'Non ci sono ancora record in questo strumento.',
    toolType: 'Tipo',
    toolDate: 'Data',
    toolActions: 'Azioni',
    toolForm: 'Modulo',
    toolRun: 'Esegui',
    toolGenerating: 'Generazione...',
    toolHistoryTitle: 'Cronologia esecuzioni IA',
    toolRunNow: 'Esegui ora',
  },
  nl: {
    toolsInstalledTitle: 'Geïnstalleerde tools',
    toolsInstalledDescription: 'De tools die je in deze workspace gebruikt.',
    toolsGenerate: 'Genereren',
    toolsAdd: 'Toevoegen',
    toolsActive: 'actief',
    toolsOpen: 'Openen',
    toolsEmptyTitle: 'Installeer je eerste tool',
    toolsEmptyDescription: 'Maak een tool met AI of kies er een uit de catalogus.',
    toolNewEntry: 'Nieuw item',
    toolAiIdeas: 'AI-ideeën',
    toolImportCsv: 'CSV importeren',
    toolNoRecords: 'Nog geen records in deze tool.',
    toolType: 'Type',
    toolDate: 'Datum',
    toolActions: 'Acties',
    toolForm: 'Formulier',
    toolRun: 'Uitvoeren',
    toolGenerating: 'Genereren...',
    toolHistoryTitle: 'AI-uitvoeringsgeschiedenis',
    toolRunNow: 'Nu uitvoeren',
  },
  pl: {
    toolsInstalledTitle: 'Zainstalowane narzędzia',
    toolsInstalledDescription: 'Narzędzia używane w tym workspace.',
    toolsGenerate: 'Generuj',
    toolsAdd: 'Dodaj',
    toolsActive: 'aktywne',
    toolsOpen: 'Otwórz',
    toolsEmptyTitle: 'Zainstaluj pierwsze narzędzie',
    toolsEmptyDescription: 'Utwórz narzędzie z AI albo wybierz je z katalogu.',
    toolNewEntry: 'Nowy wpis',
    toolAiIdeas: 'Pomysły AI',
    toolImportCsv: 'Importuj CSV',
    toolNoRecords: 'To narzędzie nie ma jeszcze rekordów.',
    toolType: 'Typ',
    toolDate: 'Data',
    toolActions: 'Akcje',
    toolForm: 'Formularz',
    toolRun: 'Uruchom',
    toolGenerating: 'Generowanie...',
    toolHistoryTitle: 'Historia uruchomień AI',
    toolRunNow: 'Uruchom teraz',
  },
  ro: {
    toolsInstalledTitle: 'Instrumente instalate',
    toolsInstalledDescription: 'Instrumentele pe care le folosești în acest workspace.',
    toolsGenerate: 'Generează',
    toolsAdd: 'Adaugă',
    toolsActive: 'active',
    toolsOpen: 'Deschide',
    toolsEmptyTitle: 'Instalează primul instrument',
    toolsEmptyDescription: 'Creează un instrument cu IA sau alege unul din catalog.',
    toolNewEntry: 'Intrare nouă',
    toolAiIdeas: 'Idei IA',
    toolImportCsv: 'Importă CSV',
    toolNoRecords: 'Nu există încă înregistrări în acest instrument.',
    toolType: 'Tip',
    toolDate: 'Dată',
    toolActions: 'Acțiuni',
    toolForm: 'Formular',
    toolRun: 'Execută',
    toolGenerating: 'Se generează...',
    toolHistoryTitle: 'Istoric execuții IA',
    toolRunNow: 'Execută acum',
  },
  sv: {
    toolsInstalledTitle: 'Installerade verktyg',
    toolsInstalledDescription: 'Verktygen du använder i denna workspace.',
    toolsGenerate: 'Generera',
    toolsAdd: 'Lägg till',
    toolsActive: 'aktiva',
    toolsOpen: 'Öppna',
    toolsEmptyTitle: 'Installera ditt första verktyg',
    toolsEmptyDescription: 'Skapa ett verktyg med AI eller välj ett från katalogen.',
    toolNewEntry: 'Ny post',
    toolAiIdeas: 'AI-idéer',
    toolImportCsv: 'Importera CSV',
    toolNoRecords: 'Det finns inga poster i detta verktyg än.',
    toolType: 'Typ',
    toolDate: 'Datum',
    toolActions: 'Åtgärder',
    toolForm: 'Formulär',
    toolRun: 'Kör',
    toolGenerating: 'Genererar...',
    toolHistoryTitle: 'AI-körningshistorik',
    toolRunNow: 'Kör nu',
  },
  da: {
    toolsInstalledTitle: 'Installerede værktøjer',
    toolsInstalledDescription: 'De værktøjer du bruger i dette workspace.',
    toolsGenerate: 'Generér',
    toolsAdd: 'Tilføj',
    toolsActive: 'aktive',
    toolsOpen: 'Åbn',
    toolsEmptyTitle: 'Installer dit første værktøj',
    toolsEmptyDescription: 'Opret et værktøj med AI eller vælg et fra kataloget.',
    toolNewEntry: 'Ny post',
    toolAiIdeas: 'AI-idéer',
    toolImportCsv: 'Importér CSV',
    toolNoRecords: 'Der er endnu ingen poster i dette værktøj.',
    toolType: 'Type',
    toolDate: 'Dato',
    toolActions: 'Handlinger',
    toolForm: 'Formular',
    toolRun: 'Kør',
    toolGenerating: 'Genererer...',
    toolHistoryTitle: 'AI-kørselshistorik',
    toolRunNow: 'Kør nu',
  },
  no: {
    toolsInstalledTitle: 'Installerte verktøy',
    toolsInstalledDescription: 'Verktøyene du bruker i denne workspacen.',
    toolsGenerate: 'Generer',
    toolsAdd: 'Legg til',
    toolsActive: 'aktive',
    toolsOpen: 'Åpne',
    toolsEmptyTitle: 'Installer ditt første verktøy',
    toolsEmptyDescription: 'Lag et verktøy med AI eller velg et fra katalogen.',
    toolNewEntry: 'Ny oppføring',
    toolAiIdeas: 'AI-ideer',
    toolImportCsv: 'Importer CSV',
    toolNoRecords: 'Det finnes ingen oppføringer i dette verktøyet ennå.',
    toolType: 'Type',
    toolDate: 'Dato',
    toolActions: 'Handlinger',
    toolForm: 'Skjema',
    toolRun: 'Kjør',
    toolGenerating: 'Genererer...',
    toolHistoryTitle: 'AI-kjøringshistorikk',
    toolRunNow: 'Kjør nå',
  },
  hu: {
    toolsInstalledTitle: 'Telepített eszközök',
    toolsInstalledDescription: 'Az ebben a workspace-ben használt eszközök.',
    toolsGenerate: 'Generálás',
    toolsAdd: 'Hozzáadás',
    toolsActive: 'aktív',
    toolsOpen: 'Megnyitás',
    toolsEmptyTitle: 'Telepítse az első eszközt',
    toolsEmptyDescription: 'Hozzon létre eszközt AI-val, vagy válasszon egyet a katalógusból.',
    toolNewEntry: 'Új bejegyzés',
    toolAiIdeas: 'AI-ötletek',
    toolImportCsv: 'CSV importálása',
    toolNoRecords: 'Ebben az eszközben még nincsenek rekordok.',
    toolType: 'Típus',
    toolDate: 'Dátum',
    toolActions: 'Műveletek',
    toolForm: 'Űrlap',
    toolRun: 'Futtatás',
    toolGenerating: 'Generálás...',
    toolHistoryTitle: 'AI futtatási előzmények',
    toolRunNow: 'Futtatás most',
  },
  cs: {
    toolsInstalledTitle: 'Nainstalované nástroje',
    toolsInstalledDescription: 'Nástroje, které používáte v tomto workspace.',
    toolsGenerate: 'Generovat',
    toolsAdd: 'Přidat',
    toolsActive: 'aktivní',
    toolsOpen: 'Otevřít',
    toolsEmptyTitle: 'Nainstalujte první nástroj',
    toolsEmptyDescription: 'Vytvořte nástroj pomocí AI nebo vyberte jeden z katalogu.',
    toolNewEntry: 'Nový záznam',
    toolAiIdeas: 'Nápady AI',
    toolImportCsv: 'Importovat CSV',
    toolNoRecords: 'V tomto nástroji zatím nejsou žádné záznamy.',
    toolType: 'Typ',
    toolDate: 'Datum',
    toolActions: 'Akce',
    toolForm: 'Formulář',
    toolRun: 'Spustit',
    toolGenerating: 'Generuje se...',
    toolHistoryTitle: 'Historie spuštění AI',
    toolRunNow: 'Spustit nyní',
  },
  sk: {
    toolsInstalledTitle: 'Nainštalované nástroje',
    toolsInstalledDescription: 'Nástroje, ktoré používate v tomto workspace.',
    toolsGenerate: 'Generovať',
    toolsAdd: 'Pridať',
    toolsActive: 'aktívne',
    toolsOpen: 'Otvoriť',
    toolsEmptyTitle: 'Nainštalujte prvý nástroj',
    toolsEmptyDescription: 'Vytvorte nástroj pomocou AI alebo vyberte jeden z katalógu.',
    toolNewEntry: 'Nový záznam',
    toolAiIdeas: 'Nápady AI',
    toolImportCsv: 'Importovať CSV',
    toolNoRecords: 'V tomto nástroji zatiaľ nie sú žiadne záznamy.',
    toolType: 'Typ',
    toolDate: 'Dátum',
    toolActions: 'Akcie',
    toolForm: 'Formulár',
    toolRun: 'Spustiť',
    toolGenerating: 'Generuje sa...',
    toolHistoryTitle: 'História spustení AI',
    toolRunNow: 'Spustiť teraz',
  },
  el: {
    toolsInstalledTitle: 'Εγκατεστημένα εργαλεία',
    toolsInstalledDescription: 'Τα εργαλεία που χρησιμοποιείτε σε αυτό το workspace.',
    toolsGenerate: 'Δημιουργία',
    toolsAdd: 'Προσθήκη',
    toolsActive: 'ενεργά',
    toolsOpen: 'Άνοιγμα',
    toolsEmptyTitle: 'Εγκαταστήστε το πρώτο σας εργαλείο',
    toolsEmptyDescription: 'Δημιουργήστε ένα εργαλείο με AI ή επιλέξτε ένα από τον κατάλογο.',
    toolNewEntry: 'Νέα εγγραφή',
    toolAiIdeas: 'Ιδέες AI',
    toolImportCsv: 'Εισαγωγή CSV',
    toolNoRecords: 'Δεν υπάρχουν ακόμη εγγραφές σε αυτό το εργαλείο.',
    toolType: 'Τύπος',
    toolDate: 'Ημερομηνία',
    toolActions: 'Ενέργειες',
    toolForm: 'Φόρμα',
    toolRun: 'Εκτέλεση',
    toolGenerating: 'Δημιουργία...',
    toolHistoryTitle: 'Ιστορικό εκτελέσεων AI',
    toolRunNow: 'Εκτέλεση τώρα',
  },
  fi: {
    toolsInstalledTitle: 'Asennetut työkalut',
    toolsInstalledDescription: 'Työkalut, joita käytät tässä workspace-tilassa.',
    toolsGenerate: 'Luo',
    toolsAdd: 'Lisää',
    toolsActive: 'aktiivista',
    toolsOpen: 'Avaa',
    toolsEmptyTitle: 'Asenna ensimmäinen työkalusi',
    toolsEmptyDescription: 'Luo työkalu AI:lla tai valitse yksi katalogista.',
    toolNewEntry: 'Uusi merkintä',
    toolAiIdeas: 'AI-ideat',
    toolImportCsv: 'Tuo CSV',
    toolNoRecords: 'Tässä työkalussa ei ole vielä merkintöjä.',
    toolType: 'Tyyppi',
    toolDate: 'Päivämäärä',
    toolActions: 'Toiminnot',
    toolForm: 'Lomake',
    toolRun: 'Suorita',
    toolGenerating: 'Luodaan...',
    toolHistoryTitle: 'AI-suoritushistoria',
    toolRunNow: 'Suorita nyt',
  },
  hr: {
    toolsInstalledTitle: 'Instalirani alati',
    toolsInstalledDescription: 'Alati koje koristite u ovom workspaceu.',
    toolsGenerate: 'Generiraj',
    toolsAdd: 'Dodaj',
    toolsActive: 'aktivni',
    toolsOpen: 'Otvori',
    toolsEmptyTitle: 'Instalirajte prvi alat',
    toolsEmptyDescription: 'Izradite alat pomoću AI-ja ili odaberite jedan iz kataloga.',
    toolNewEntry: 'Novi zapis',
    toolAiIdeas: 'AI ideje',
    toolImportCsv: 'Uvezi CSV',
    toolNoRecords: 'Još nema zapisa u ovom alatu.',
    toolType: 'Tip',
    toolDate: 'Datum',
    toolActions: 'Radnje',
    toolForm: 'Obrazac',
    toolRun: 'Pokreni',
    toolGenerating: 'Generiranje...',
    toolHistoryTitle: 'Povijest AI izvršavanja',
    toolRunNow: 'Pokreni sada',
  },
  bg: {
    toolsInstalledTitle: 'Инсталирани инструменти',
    toolsInstalledDescription: 'Инструментите, които използвате в този workspace.',
    toolsGenerate: 'Генерирай',
    toolsAdd: 'Добави',
    toolsActive: 'активни',
    toolsOpen: 'Отвори',
    toolsEmptyTitle: 'Инсталирайте първия си инструмент',
    toolsEmptyDescription: 'Създайте инструмент с AI или изберете един от каталога.',
    toolNewEntry: 'Нов запис',
    toolAiIdeas: 'AI идеи',
    toolImportCsv: 'Импортирай CSV',
    toolNoRecords: 'Все още няма записи в този инструмент.',
    toolType: 'Тип',
    toolDate: 'Дата',
    toolActions: 'Действия',
    toolForm: 'Формуляр',
    toolRun: 'Изпълни',
    toolGenerating: 'Генериране...',
    toolHistoryTitle: 'История на AI изпълненията',
    toolRunNow: 'Изпълни сега',
  },
  sl: {
    toolsInstalledTitle: 'Nameščena orodja',
    toolsInstalledDescription: 'Orodja, ki jih uporabljate v tem workspaceu.',
    toolsGenerate: 'Ustvari',
    toolsAdd: 'Dodaj',
    toolsActive: 'aktivna',
    toolsOpen: 'Odpri',
    toolsEmptyTitle: 'Namestite prvo orodje',
    toolsEmptyDescription: 'Ustvarite orodje z AI ali izberite eno iz kataloga.',
    toolNewEntry: 'Nov zapis',
    toolAiIdeas: 'AI ideje',
    toolImportCsv: 'Uvozi CSV',
    toolNoRecords: 'V tem orodju še ni zapisov.',
    toolType: 'Vrsta',
    toolDate: 'Datum',
    toolActions: 'Dejanja',
    toolForm: 'Obrazec',
    toolRun: 'Zaženi',
    toolGenerating: 'Ustvarjanje...',
    toolHistoryTitle: 'Zgodovina AI izvajanj',
    toolRunNow: 'Zaženi zdaj',
  },
  ja: {
    toolsInstalledTitle: 'インストール済みツール',
    toolsInstalledDescription: 'この workspace で使用しているツールです。',
    toolsGenerate: '生成',
    toolsAdd: '追加',
    toolsActive: '有効',
    toolsOpen: '開く',
    toolsEmptyTitle: '最初のツールをインストール',
    toolsEmptyDescription: 'AIでツールを作成するか、カタログから選択してください。',
    toolNewEntry: '新しいレコード',
    toolAiIdeas: 'AIアイデア',
    toolImportCsv: 'CSVをインポート',
    toolNoRecords: 'このツールにはまだレコードがありません。',
    toolType: 'タイプ',
    toolDate: '日付',
    toolActions: '操作',
    toolForm: 'フォーム',
    toolRun: '実行',
    toolGenerating: '生成中...',
    toolHistoryTitle: 'AI実行履歴',
    toolRunNow: '今すぐ実行',
  },
  zh: {
    toolsInstalledTitle: '已安装工具',
    toolsInstalledDescription: '你在此 workspace 中使用的工具。',
    toolsGenerate: '生成',
    toolsAdd: '添加',
    toolsActive: '活跃',
    toolsOpen: '打开',
    toolsEmptyTitle: '安装你的第一个工具',
    toolsEmptyDescription: '使用 AI 创建工具，或从目录中选择一个。',
    toolNewEntry: '新记录',
    toolAiIdeas: 'AI 想法',
    toolImportCsv: '导入 CSV',
    toolNoRecords: '此工具中还没有记录。',
    toolType: '类型',
    toolDate: '日期',
    toolActions: '操作',
    toolForm: '表单',
    toolRun: '运行',
    toolGenerating: '正在生成...',
    toolHistoryTitle: 'AI 执行历史',
    toolRunNow: '立即运行',
  },
}

const accountLocaleOverrides: Partial<Record<Locale, Partial<DashboardTranslations>>> = {
  fr: { accountMenu: 'Mon compte', accountMenuOpen: 'Ouvrir le menu du compte', accountPersonalData: 'Données personnelles', accountProfilePhoto: 'Photo de profil', accountSignOut: 'Se déconnecter' },
  de: { accountMenu: 'Mein Konto', accountMenuOpen: 'Kontomenü öffnen', accountPersonalData: 'Persönliche Daten', accountProfilePhoto: 'Profilfoto', accountSignOut: 'Abmelden' },
  pt: { accountMenu: 'A minha conta', accountMenuOpen: 'Abrir menu da conta', accountPersonalData: 'Dados pessoais', accountProfilePhoto: 'Foto de perfil', accountSignOut: 'Terminar sessão' },
  it: { accountMenu: 'Il mio account', accountMenuOpen: 'Apri menu account', accountPersonalData: 'Dati personali', accountProfilePhoto: 'Foto profilo', accountSignOut: 'Disconnetti' },
  nl: { accountMenu: 'Mijn account', accountMenuOpen: 'Accountmenu openen', accountPersonalData: 'Persoonlijke gegevens', accountProfilePhoto: 'Profielfoto', accountSignOut: 'Uitloggen' },
  pl: { accountMenu: 'Moje konto', accountMenuOpen: 'Otwórz menu konta', accountPersonalData: 'Dane osobowe', accountProfilePhoto: 'Zdjęcie profilowe', accountSignOut: 'Wyloguj' },
  ro: { accountMenu: 'Contul meu', accountMenuOpen: 'Deschide meniul contului', accountPersonalData: 'Date personale', accountProfilePhoto: 'Fotografie de profil', accountSignOut: 'Deconectare' },
  sv: { accountMenu: 'Mitt konto', accountMenuOpen: 'Öppna kontomeny', accountPersonalData: 'Personuppgifter', accountProfilePhoto: 'Profilbild', accountSignOut: 'Logga ut' },
  da: { accountMenu: 'Min konto', accountMenuOpen: 'Åbn kontomenu', accountPersonalData: 'Personlige data', accountProfilePhoto: 'Profilfoto', accountSignOut: 'Log ud' },
  no: { accountMenu: 'Min konto', accountMenuOpen: 'Åpne kontomeny', accountPersonalData: 'Personopplysninger', accountProfilePhoto: 'Profilbilde', accountSignOut: 'Logg ut' },
  hu: { accountMenu: 'Saját fiók', accountMenuOpen: 'Fiókmenü megnyitása', accountPersonalData: 'Személyes adatok', accountProfilePhoto: 'Profilkép', accountSignOut: 'Kijelentkezés' },
  cs: { accountMenu: 'Můj účet', accountMenuOpen: 'Otevřít nabídku účtu', accountPersonalData: 'Osobní údaje', accountProfilePhoto: 'Profilová fotka', accountSignOut: 'Odhlásit se' },
  sk: { accountMenu: 'Môj účet', accountMenuOpen: 'Otvoriť ponuku účtu', accountPersonalData: 'Osobné údaje', accountProfilePhoto: 'Profilová fotka', accountSignOut: 'Odhlásiť sa' },
  el: { accountMenu: 'Ο λογαριασμός μου', accountMenuOpen: 'Άνοιγμα μενού λογαριασμού', accountPersonalData: 'Προσωπικά δεδομένα', accountProfilePhoto: 'Φωτογραφία προφίλ', accountSignOut: 'Αποσύνδεση' },
  fi: { accountMenu: 'Oma tili', accountMenuOpen: 'Avaa tilivalikko', accountPersonalData: 'Henkilötiedot', accountProfilePhoto: 'Profiilikuva', accountSignOut: 'Kirjaudu ulos' },
  hr: { accountMenu: 'Moj račun', accountMenuOpen: 'Otvori izbornik računa', accountPersonalData: 'Osobni podaci', accountProfilePhoto: 'Profilna fotografija', accountSignOut: 'Odjava' },
  bg: { accountMenu: 'Моят акаунт', accountMenuOpen: 'Отвори менюто на акаунта', accountPersonalData: 'Лични данни', accountProfilePhoto: 'Профилна снимка', accountSignOut: 'Изход' },
  sl: { accountMenu: 'Moj račun', accountMenuOpen: 'Odpri meni računa', accountPersonalData: 'Osebni podatki', accountProfilePhoto: 'Profilna fotografija', accountSignOut: 'Odjava' },
  ja: { accountMenu: 'マイアカウント', accountMenuOpen: 'アカウントメニューを開く', accountPersonalData: '個人データ', accountProfilePhoto: 'プロフィール写真', accountSignOut: 'サインアウト' },
  zh: { accountMenu: '我的账户', accountMenuOpen: '打开账户菜单', accountPersonalData: '个人资料', accountProfilePhoto: '头像', accountSignOut: '退出登录' },
}

const translations: Record<Locale, DashboardTranslations> = {
  en, es, fr, de, pt, it, nl, pl, ro, sv, da, no, hu, cs, sk, el, fi, hr, bg, sl, ja, zh,
}

const downloadFallback: Pick<DashboardTranslations, 'navDownload' | 'descDownload'> = {
  navDownload: 'Desktop App',
  descDownload: 'Download the MITIKUS desktop app for Windows',
}

const hrFallback: Pick<DashboardTranslations, 'groupHR' | 'navEmployees' | 'navPayroll' | 'navLeaves' | 'navLeads' | 'descEmployees' | 'descPayroll' | 'descLeaves' | 'descLeads'> = {
  groupHR: 'HR',
  navEmployees: 'Employees',
  navPayroll: 'Payroll',
  navLeaves: 'Time Off',
  navLeads: 'Leads',
  descEmployees: 'Manage your team, contracts and payroll settings',
  descPayroll: 'Generate and approve monthly payrolls',
  descLeaves: 'Manage vacation, sick leave and absences',
  descLeads: 'Contacts captured via your forms webhook',
}

export function getDashboardTranslations(locale: Locale): DashboardTranslations {
  const base = translations[locale] ?? en
  return {
    ...downloadFallback,
    ...hrFallback,
    ...base,
    ...(todayLocaleOverrides[locale] ?? {}),
    ...(toolsLocaleOverrides[locale] ?? {}),
    ...(accountLocaleOverrides[locale] ?? {}),
  }
}


