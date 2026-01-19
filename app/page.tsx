"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SigninCard from "@/components/sections/signin-card";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-[#666666]">Loading...</div>
      </main>
    );
  }

  if (isSignedIn) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-[#666666]">Redirecting...</div>
      </main>
    );
  }

  return (
    <main>
      <SigninCard />
    </main>
  );
}
