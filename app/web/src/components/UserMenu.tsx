import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/AuthContext';

interface UserMenuProps {
  email: string;
}

export function UserMenu({
  email,
}: UserMenuProps) {
    const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="h-10 w-10 rounded-full p-0 hover:bg-white/10"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open account menu"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">
          A
        </div>
      </Button>

      {open && (
        <div className="text-black">
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close account menu"
          />

          <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border bg-white p-2 shadow-lg">
            <div className="border-b px-3 py-3">
              <p className="truncate text-sm font-medium">
                {email}
              </p>
            </div>

            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}