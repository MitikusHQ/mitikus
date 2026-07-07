/**
 * Memory Service — API pública del Business Memory Engine.
 *
 * Punto de entrada único. Nunca expone detalles internos.
 * Consumidores: Intent Engine, Planning Engine, Execution Engine, rutas API.
 */

export { getBusinessContext }        from './business-context'
export { summarizeContext, contextToPromptString, contextToRecord } from './memory-summary'
export { getOrCreateProfile, getProfile, updateProfile } from './company-profile'
export { getObjectives, createObjective, updateObjectiveProgress, upsertObjectiveByGoal } from './company-objectives'
export { getAssets, upsertAsset }     from './company-assets'
export { getProcesses, upsertProcess } from './company-processes'
export { getRisks, registerRisk, resolveRisk } from './company-risks'
export {
  updateMemoryFromExecution,
  updateMemoryFromIntent,
  updateMemoryFromWorkflow,
} from './memory-updater'
