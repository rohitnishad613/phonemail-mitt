import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";

export function AppMenu() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 hover:text-white"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {open && (
        <div className="text-black fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />

          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <span className="text-lg font-semibold">PhoneMail</span>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-3">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm hover:bg-muted"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
