import { Context } from '@dead-simple-ai-agent/framework/executor'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

export async function save(context: Context) {
  const db = new Low<Context>(new JSONFile(`context-${context.id}.json`), context)
  await db.write()
}

export async function load(context: Context): Promise<Context> {
  const db = new Low<Context>(new JSONFile(`context-${context.id}.json`), {} as Context)
  await db.read()
  return { ...db.data, ...context } // because team members are not serializable
}
