import { processQueuedMail } from '../src/lib/mail/delivery'

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : 10

processQueuedMail(Number.isFinite(limit) && limit > 0 ? limit : 10)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
