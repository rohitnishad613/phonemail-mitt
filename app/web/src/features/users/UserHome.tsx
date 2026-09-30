import Header from "@/features/users/components/Header.js";
import TopBar from "@/features/users/components/TopBar.js";
import { useAuth } from "../auth/AuthContext";
import { MailPage } from "@/features/mail/pages/MailPage";

export function UserHome() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="min-h-screen">
      <Header />
      <div>
        <TopBar />
      </div>
      <div className="mx-auto max-w-5xl px-8">
        <MailPage
          currentEmail={
            user.emailAddress
          }
        />
      </div>
    </main>
  );
}
