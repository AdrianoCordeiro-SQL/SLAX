import { setSessionToken } from "./session";
import { loginRequest, registerRequest, type LoginResponse } from "./auth-http";

export {
  accountSchema,
  accountUpdateSchema,
  passwordChangeSchema,
  loginResponseSchema,
  type AccountUpdateInput,
  type PasswordChangeInput,
  type Account,
  type LoginResponse,
  loginRequest,
  registerRequest,
  fetchMe,
  updateMe,
  changePassword,
} from "./auth-http";

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<LoginResponse> {
  const parsed = await registerRequest(name, email, password);
  setSessionToken(parsed.access_token);
  return parsed;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const parsed = await loginRequest(email, password);
  setSessionToken(parsed.access_token);
  return parsed;
}

export { getToken, logout } from "./session";
