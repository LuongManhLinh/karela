// Common types
export interface BasicResponse<T = any> {
  detail?: string;
  data?: T;
  errors?: any[];
}
