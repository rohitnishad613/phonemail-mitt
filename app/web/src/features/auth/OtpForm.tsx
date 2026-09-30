import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OtpFormProps {
  phoneNumber: string;
  expiresInSeconds: number;
  onVerified: () => Promise<void>;
  onBack: () => void;
  requestOtp: (
    phoneNumber: string,
  ) => Promise<{ expiresInSeconds: number }>;
  verifyOtp: (
    phoneNumber: string,
    otp: string,
  ) => Promise<unknown>;
}

export function OtpForm({
  phoneNumber,
  expiresInSeconds,
  onVerified,
  onBack,
  requestOtp,
  verifyOtp,
}: OtpFormProps) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] =
    useState(expiresInSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((seconds) =>
        Math.max(seconds - 1, 0),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  async function handleVerify(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setIsVerifying(true);

      await verifyOtp(phoneNumber, otp);

      await onVerified();
    } catch (error: any) {
      setError(
        error?.message ??
          "Invalid OTP. Please try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0 || isResending) return;

    setError("");

    try {
      setIsResending(true);

      const response = await requestOtp(phoneNumber);

      setOtp("");
      setSecondsLeft(response.expiresInSeconds);
    } catch (error: any) {
      setError(
        error?.message ??
          "Unable to resend OTP.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <form
      onSubmit={handleVerify}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="otp">
          Enter OTP
        </Label>

        <Input
          id="otp"
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(event) =>
            setOtp(
              event.target.value
                .replace(/\D/g, "")
                .slice(0, 6),
            )
          }
          disabled={isVerifying}
          className="h-12 text-center text-xl tracking-[0.35em]"
          aria-describedby="otp-help otp-error"
          autoFocus
        />

        <p
          id="otp-help"
          className="text-sm text-muted-foreground"
        >
          OTP sent to {phoneNumber}
        </p>

        {error && (
          <p
            id="otp-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="h-12 w-full text-base"
        disabled={isVerifying || otp.length !== 6}
      >
        {isVerifying ? "Verifying..." : "Verify OTP"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          onClick={onBack}
          className="underline underline-offset-4"
        >
          Change number
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0 || isResending}
          className="underline underline-offset-4 disabled:no-underline disabled:opacity-50"
        >
          {secondsLeft > 0
            ? `Resend in ${secondsLeft}s`
            : isResending
              ? "Sending..."
              : "Resend OTP"}
        </button>
      </div>
    </form>
  );
}