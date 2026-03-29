export interface StepResult {
  success: boolean;
  pause?: boolean;
  error?: string | undefined;
  data?: any;
}
