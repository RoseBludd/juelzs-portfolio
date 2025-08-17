'use client';

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button 
      variant="destructive" 
      onClick={handleSignOut}
      className="bg-red-600 hover:bg-red-700"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Sign Out
    </Button>
  );
} 