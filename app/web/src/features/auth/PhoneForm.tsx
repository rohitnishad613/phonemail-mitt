import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneFormProps {
  onSuccess: (
    phoneNumber: string,
    expiresInSeconds: number,
  ) => void;
  requestOtp: (
    phoneNumber: string,
  ) => Promise<{ expiresInSeconds: number }>;
}

function normalizePhone(value: string): string {
  const cleaned = value.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }

  return value.trim();
}

export function PhoneForm({
  onSuccess,
  requestOtp,
}: PhoneFormProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedPhone = normalizePhone(phone);

    if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
      setError(
        "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await requestOtp(normalizedPhone);

      onSuccess(
        normalizedPhone,
        response.expiresInSeconds,
      );
    } catch (error: any) {
      setError(
        error?.message ??
          "Unable to send OTP. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="phone">
          Mobile number
        </Label>

        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="9569077153"
          value={phone}
          onChange={(event) =>
            setPhone(event.target.value)
          }
          disabled={isSubmitting}
          aria-describedby="phone-help phone-error"
          className="h-12 text-base"
        />

        <p
          id="phone-help"
          className="text-sm text-muted-foreground"
        >
          We will send a one-time password to this number.
        </p>

        {error && (
          <p
            id="phone-error"
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
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending OTP..." : "Continue"}
      </Button>
    </form>
  );
}