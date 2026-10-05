/**
 * The contract with the BarberSaaS shell (barber-saas-front, src/app/core/remotes/mount-contract.ts).
 * Copied as types only: this app never imports the shell's code, it receives everything through
 * the MountContext. Keep in step with the shell.
 */
export interface FieldError {
  field: string;
  message: string;
}

/** Every failed request arrives with this shape; userMessage is already decided by the shell. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details: FieldError[];
  traceId: string;
  userMessage: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
}

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN_BARBERSHOP' | 'BARBER' | 'CLIENT';
  barbershopId: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: SessionUser;
}

export interface ShellSession {
  user(): SessionUser | null;
  signIn(auth: AuthResponse): void;
  signOut(): void;
  subscribe(listener: (user: SessionUser | null) => void): () => void;
  /**
   * Call before any tenant-scoped request made for a barbershop the user picked (DEC-AUTH-06).
   * For a CLIENT it gets a token bound to that barbershop, and `api` sends it from then on; staff
   * resolve at once. Rejects with the shell's ApiError: NOT_FOUND (closed or unknown barbershop),
   * SERVICE_UNAVAILABLE (it could not be checked).
   */
  enterBarbershop(barbershopId: string): Promise<void>;
  /** Staff: their own barbershop. Client: the one entered, while its token is valid. */
  barbershopId(): string | null;
}

export interface MountContext {
  api: ApiClient;
  session: ShellSession;
  basePath: string;
  initialPath: string;
  navigate(path: string): void;
}

export type Unmount = () => void;

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 'userMessage' in value && 'status' in value;
}
