import { Telemetry } from './base.js'

export const logger: Telemetry = {
  record: (event) => {
    console.log(event)
  },
}
