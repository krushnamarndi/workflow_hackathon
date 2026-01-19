"use client";

import React from 'react';
import Image from 'next/image';
import { useSignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface SigninButtonProps {
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
}

const SigninButton = ({ icon, label, variant, onClick, disabled }: SigninButtonProps) => {
  const baseStyles = "flex items-center justify-center w-full h-[40px] px-4 rounded-[8px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles = variant === 'primary' 
    ? "bg-[#2C2C2C] text-white hover:bg-[#1A1A1A] border-none" 
    : "bg-white text-[#1A1A1A] border border-[#E0E0E0] hover:bg-[#F9F9F9]";

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variantStyles}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[14px] font-normal leading-none tracking-tight">{label}</span>
      </div>
    </button>
  );
};

const FigmaIcon = () => (
  <svg width="12" height="18" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 28.5C19 23.2533 14.7467 19 9.5 19C4.2533 19 0 23.2533 0 28.5C0 33.7467 4.2533 38 9.5 38C14.7467 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
    <path d="M0 47.5C0 42.2533 4.2533 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.2533 57 0 52.7467 0 47.5Z" fill="#0AC17E"/>
    <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.2533 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
    <path d="M0 9.5C0 14.7467 4.2533 19 9.5 19H19V0H9.5C4.2533 0 0 4.2533 0 9.5Z" fill="#F24E1E"/>
    <path d="M19 19V38H28.5C33.7467 38 38 33.7467 38 28.5C38 23.2533 33.7467 19 28.5 19H19Z" fill="#A259FF"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h11v11H0z" fill="#F25022"/>
    <path d="M12 0h11v11H12z" fill="#7FBA00"/>
    <path d="M0 12h11v11H0z" fill="#00A4EF"/>
    <path d="M12 12h11v11H12z" fill="#FFB900"/>
  </svg>
);

const SigninCard = () => {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  // Redirect if already signed in
  React.useEffect(() => {
    if (userLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, userLoaded, router]);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || isSignedIn) return;
    
    setIsSigningIn(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setIsSigningIn(false);
    }
  };

  // Don't render signin form if already signed in
  if (!userLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-[#666666]">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-[#666666]">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white relative">
      {/* Repeating Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: 'url("https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/3dd6d092-2c22-4a28-936f-8fad4b845145-app-weavy-ai/assets/images/681ccdbeb607e939f7db68fa_BG_20NET_20Hero-2.avif")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain'
        }}
      />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-[12px] border border-[#F0F0F0] overflow-hidden shadow-sm">
        {/* Top Image */}
        <div className="w-full h-[240px] relative p-4 pb-0">
          <div className="relative w-full h-full overflow-hidden rounded-[8px]">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/3dd6d092-2c22-4a28-936f-8fad4b845145-app-weavy-ai/assets/images/weavy-sign-in-back-1.png"
              alt="Sign in cover"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center px-8 pt-8 pb-12 text-center">
          <h1 className="text-[32px] font-medium leading-[1.25] tracking-tight text-[#1A1A1A] mb-2">
            Welcome to Weavy
          </h1>
          <p className="text-[16px] font-normal leading-normal text-[#666666] mb-8">
            Start building your design machine
          </p>

          {/* Social Buttons Container */}
          <div className="w-full space-y-3">
            <SigninButton 
              label="Log in with Google" 
              variant="primary" 
              icon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={!isLoaded || isSigningIn}
            />
            
            <div className="flex items-center justify-center py-2">
              <span className="text-[12px] font-normal text-[#999999]">
                {isSigningIn ? "Redirecting to Google..." : "Secure sign in with Google"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding (Floating Top Left) */}
      <div className="absolute top-10 left-10 flex items-center gap-4 z-20">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold tracking-[0.2em] text-[#1A1A1A]">WEAVY</span>
        </div>
        <div className="h-[24px] w-[1px] bg-[#E0E0E0]" />
        <div className="flex flex-col">
          <span className="text-[11px] font-medium tracking-[0.1em] text-[#666666]">ARTISTIC</span>
          <span className="text-[11px] font-medium tracking-[0.1em] text-[#666666]">INTELLIGENCE</span>
        </div>
      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-6 right-8">
        <span className="text-[11px] text-[#999999] font-normal">
          © 2025 Weavy. All rights reserved.
        </span>
      </div>
    </div>
  );
};

export default SigninCard;