import React from 'react';
import Image from 'next/image';

const SignInLayout = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white selection:bg-gray-200">
      {/* Background Grid Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-100"
        style={{
          backgroundImage: `url('https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/3dd6d092-2c22-4a28-936f-8fad4b845145-app-weavy-ai/assets/images/681ccdbeb607e939f7db68fa_BG_20NET_20Hero-2.avif')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        
        {/* Header / Logo Section (Top Left) */}
        <div className="absolute left-6 top-6 flex items-start gap-4 md:left-12 md:top-12">
          {/* Weavy Icon Logo */}
          <div className="flex h-10 w-10 items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <title>Weavy Logo</title>
              <rect width="6.17143" height="36" rx="1" fill="#1A1A1A" />
              <rect x="14.9141" width="6.17143" height="36" rx="1" fill="#1A1A1A" />
              <rect x="29.8286" width="6.17143" height="36" rx="1" fill="#1A1A1A" />
              <rect x="7.45703" y="0.51416" width="6.17143" height="17" rx="1" fill="#1A1A1A" />
              <rect x="22.3711" y="18.5142" width="6.17143" height="17" rx="1" fill="#1A1A1A" />
            </svg>
          </div>
          
          {/* Logo Text & Tagline */}
          <div className="flex items-center gap-3 self-center">
            <span className="text-[13px] font-bold tracking-[0.15em] text-[#1A1A1A] uppercase">WEAVY</span>
            <div className="h-4 w-[1px] bg-gray-300" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-medium tracking-[0.05em] text-[#666666] uppercase">ARTISTIC</span>
              <span className="text-[9px] font-medium tracking-[0.05em] text-[#666666] uppercase">INTELLIGENCE</span>
            </div>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="w-full max-w-[400px] overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
          {/* Card Image */}
          <div className="relative h-[240px] w-full">
            <Image 
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/3dd6d092-2c22-4a28-936f-8fad4b845145-app-weavy-ai/assets/images/681ccdbeb607e939f7db68fa_BG_20NET_20Hero-2.avif"
              alt="Sign in cover"
              fill
              className="object-cover"
              priority
            />
            {/* Visual placeholder for the 3D element if the specific asset isn't matched exactly, but using the grid as instructed */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Card Content */}
          <div className="flex flex-col items-center p-8 pt-10">
            <h1 className="text-center text-[28px] font-medium tracking-[-0.02em] text-[#1A1A1A]">
              Welcome to Weavy
            </h1>
            <p className="mt-2 text-center text-[16px] font-normal leading-[1.5] text-[#666666]">
              Start building your design machine
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex w-full flex-col gap-4">
              {/* Figma Login */}
              <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#252429] transition-all duration-200 hover:bg-[#333238] active:scale-[0.98]">
                <svg width="20" height="20" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-[2px]">
                  <path d="M19 19C19 13.7533 14.7467 9.5 9.5 9.5C4.2533 9.5 0 13.7533 0 19C0 24.2467 4.2533 28.5 9.5 28.5H19V19Z" fill="#F24E1E"/>
                  <path d="M19 0C13.7533 0 9.5 4.2533 9.5 9.5C9.5 14.7467 13.7533 19 19 19H28.5V9.5C28.5 4.2533 24.2467 0 19 0Z" fill="#FF7262"/>
                  <path d="M19 38C19 32.7533 14.7467 28.5 9.5 28.5C4.2533 28.5 0 32.7533 0 38C0 43.2467 4.2533 47.5 9.5 47.5C14.7467 47.5 19 43.2467 19 38Z" fill="#1ABCFE"/>
                  <path d="M19 38V57L28.5 47.5H19Z" fill="#0ACF83"/>
                  <path d="M38 38C38 32.7533 33.7467 28.5 28.5 28.5C23.2533 28.5 19 32.7533 19 38C19 43.2467 23.2533 47.5 28.5 47.5C33.7467 47.5 38 43.2467 38 38Z" fill="#A259FF"/>
                </svg>
                <span className="text-[14px] font-medium text-white">Log in with Figma</span>
              </button>

              <div className="flex items-center justify-center py-1">
                <span className="text-[13px] font-normal text-[#666666]">or</span>
              </div>

              {/* Google Login */}
              <button className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-[#E0E0E0] bg-white transition-all duration-200 hover:bg-[#F5F5F5] active:scale-[0.98]">
              <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
                  <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.173.282-1.712V4.956H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.044l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.161 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                <span className="text-[14px] font-medium text-[#1A1A1A]">Log in with Google</span>
              </button>

              {/* Microsoft Login */}
              <button className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-[#E0E0E0] bg-white transition-all duration-200 hover:bg-[#F5F5F5] active:scale-[0.98]">
              <svg width="20" height="20" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
                <span className="text-[14px] font-medium text-[#1A1A1A]">Log in with Microsoft</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 right-6 md:right-12">
          <span className="text-[11px] font-normal tracking-normal text-[#8E8E93]">
            © 2025 Weavy. All rights reserved.
          </span>
        </div>
      </main>
    </div>
  );
};

export default SignInLayout;