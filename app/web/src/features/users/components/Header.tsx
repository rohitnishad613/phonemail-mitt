import { UserMenu } from "@/components/UserMenu.js";
import { useAuth } from "../../auth/AuthContext";
import { AppMenu } from "@/components/AppMenu.js";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-8">
        <div className="flex gap-2 items-center">
          <AppMenu />
          <h1 className="font-semibold text-lg">PhoneMail</h1>
        </div>

        {user && (
          <UserMenu
            email={user.emailAddress}
        />
        )}
      </div>
    </header>
  );
}
