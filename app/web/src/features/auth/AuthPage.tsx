import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneForm } from "./PhoneForm";
import { OtpForm } from "./OtpForm";
import {
  requestOtp,
  verifyOtp,
} from "./auth-api";
import { useAuth } from "./AuthContext";

export function AuthPage() {
  const { refreshUser } = useAuth();

  const [phoneNumber, setPhoneNumber] =
    useState<string | null>(null);

  const [expiresInSeconds, setExpiresInSeconds] =
    useState(300);

  async function handlePhoneSuccess(
    phone: string,
    expires: number,
  ) {
    setPhoneNumber(phone);
    setExpiresInSeconds(expires);
  }

  async function handleVerified() {
    await refreshUser();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">
              {phoneNumber
                ? "Verify your number"
                : "Welcome to PhoneMail"}
            </CardTitle>

            <p className="text-sm text-muted-foreground">
              {phoneNumber
                ? "Enter the OTP sent to your mobile number."
                : "Use your mobile number to sign in or create your account."}
            </p>
          </CardHeader>

          <CardContent>
            {phoneNumber ? (
              <OtpForm
                phoneNumber={phoneNumber}
                expiresInSeconds={expiresInSeconds}
                onVerified={handleVerified}
                onBack={() => setPhoneNumber(null)}
                requestOtp={requestOtp}
                verifyOtp={verifyOtp}
              />
            ) : (
              <PhoneForm
                onSuccess={handlePhoneSuccess}
                requestOtp={requestOtp}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}