export interface StepResult {
  success: boolean;
  pause?: boolean;
  error?: string | null | undefined;
  data?: any;
}
