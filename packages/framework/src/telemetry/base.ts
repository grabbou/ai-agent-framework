export type TelemetryEvent = {
  type: string
  timestamp: number
  data: Record<string, any>
}

export type Telemetry = {
  record: (event: Omit<TelemetryEvent, 'timestamp'>) => void
}

export const noopTelemetry: Telemetry = {
  record: () => {},
}
