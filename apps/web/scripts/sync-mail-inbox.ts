import { syncInboxReplies } from '../src/lib/mail/inbox-sync'

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 25

syncInboxReplies(Number.isFinite(limit) ? limit : 25)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })