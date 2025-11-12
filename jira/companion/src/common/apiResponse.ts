export interface ApiResponse<T> {
  message: string | null;
  data: T | null;
  errors: string[] | null;
}
