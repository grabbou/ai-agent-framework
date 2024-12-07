import z, { ZodTypeAny } from 'zod'

export type Tool<P extends ZodTypeAny = any> = {
  description: string
  parameters: P
  execute: (parameters: z.infer<P>) => Promise<string>
}

export const tool = <P extends ZodTypeAny>(tool: Tool<P>): Tool<P> => tool
