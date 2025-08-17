export interface AnalyticsClient {
  init: (key: string, config: any) => void;
  identify: (userId?: string, properties?: any) => void;
  capture: (name: string, properties?: any) => void;
}

export function setAnalyticsClient(_client: AnalyticsClient) {}

export async function captureEvent(
  _name: string,
  _properties?: Record<string, any>
): Promise<void> {}

export async function captureMainFeatureEvent(
  _name: string,
  _properties?: Record<string, any>
): Promise<void> {}
