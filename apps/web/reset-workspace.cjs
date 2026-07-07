const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()
const WS_ID = 'cmqse2hzl0004c63w79vowk9d'

async function main() {
  await db.copilotConversation.deleteMany({ where: { workspaceId: WS_ID } })
  await db.missionTimelineEvent.deleteMany({ where: { objective: { workspaceId: WS_ID } } })
  await db.missionStep.deleteMany({ where: { objective: { workspaceId: WS_ID } } })
  await db.missionIntelligence.deleteMany({ where: { objective: { workspaceId: WS_ID } } })
  await db.companyObjective.deleteMany({ where: { workspaceId: WS_ID } })
  await db.toolRecord.deleteMany({ where: { toolInstance: { workspaceId: WS_ID } } })
  await db.toolInstance.deleteMany({ where: { workspaceId: WS_ID } })
  await db.client.deleteMany({ where: { workspaceId: WS_ID } })
  await db.companyProfile.deleteMany({ where: { workspaceId: WS_ID } })
  console.log('Workspace reseteado.')
}

main().catch(console.error).finally(() => db.$disconnect())
