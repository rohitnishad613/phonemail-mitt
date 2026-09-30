import { api } from "../../lib/api";
import type {
  RequestOtpResponse,
  User,
  VerifyOtpResponse,
} from "./auth-types";

export function requestOtp(
  phoneNumber: string,
): Promise<RequestOtpResponse> {
  return api<RequestOtpResponse>("/auth/request-otp", {
    method: "POST",
    body: JSON.stringify({
      phoneNumber,
    }),
  });
}

export function verifyOtp(
  phoneNumber: string,
  otp: string,
): Promise<VerifyOtpResponse> {
  return api<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phoneNumber,
      otp,
    }),
  });
}

export function getMe(): Promise<{ user: User }> {
  return api<{ user: User }>("/users/me");
}

export function logout(): Promise<void> {
  return api<void>("/auth/logout", {
    method: "POST",
  });
}