import React from 'react';
import Image from 'next/image';

const AuthCard = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
      <div 
        className="w-[400px] bg-white rounded-[12px] border border-[#F0F0F0] overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)]"
        data-testid="signin-page-content"
      >
        {/* Header Image */}
        <div className="relative w-full h-[240px]">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/3dd6d092-2c22-4a28-936f-8fad4b845145-app-weavy-ai/assets/images/weavy-sign-in-back-1.png"
            alt="Sign in cover"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Card Content */}
        <div className="p-8 pt-8 flex flex-col items-center text-center">
          <h1 className="text-[28px] font-medium leading-[1.2] tracking-[-0.02em] text-[#1A1A1A] mb-2 font-display">
            Welcome to Weavy
          </h1>
          <p className="text-[16px] font-normal leading-[1.5] text-[#666666] mb-8">
            Start building your design machine
          </p>

          <div className="w-full flex flex-col gap-4">
            {/* Figma Button */}
            <button className="w-full bg-[#252429] hover:bg-[#333238] transition-colors h-[44px] rounded-[8px] flex items-center justify-center gap-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_2689_424)">
                  <path d="M7.5 10C7.5 8.61929 8.61929 7.5 10 7.5V10H7.5Z" fill="#1ABCFE"/>
                  <path d="M7.5 5C7.5 3.61929 8.61929 2.5 10 2.5V7.5H7.5V5Z" fill="#F24E1E"/>
                  <ellipse cx="12.5" cy="5" rx="2.5" ry="2.5" fill="#FF7262"/>
                  <path d="M12.5 10C13.8807 10 15 8.88071 15 7.5C15 6.11929 13.8807 5 12.5 5V10Z" fill="#A259FF"/>
                  <path d="M7.5 12.5C7.5 11.1193 8.61929 10 10 10V15C8.61929 15 7.5 13.8807 7.5 12.5Z" fill="#1ABCFE"/>
                  <path d="M12.5 15C13.8807 15 15 13.8807 15 12.5C15 11.1193 13.8807 10 12.5 10V15Z" fill="#0ACF83"/>
                </g>
                <defs>
                  <clipPath id="clip0_2689_424">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span className="text-white text-[14px] font-medium tracking-[0.01em]">Log in with Figma</span>
            </button>

            {/* Divider */}
            <span className="text-[13px] font-normal text-[#666666] font-divider">or</span>

            {/* Google Button */}
            <button className="w-full bg-white border border-[#E0E0E0] hover:bg-gray-50 transition-colors h-[44px] rounded-[8px] flex items-center justify-center gap-3">
              <svg width="20" height="20" viewBox="0 0 48 48">
                <title>Google logo</title>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span className="text-[#1A1A1A] text-[14px] font-medium tracking-[0.01em]">Log in with Google</span>
            </button>

            {/* Microsoft Button */}
            <button className="w-full bg-white border border-[#E0E0E0] hover:bg-gray-50 transition-colors h-[44px] rounded-[8px] flex items-center justify-center gap-3">
              <svg width="20" height="20" viewBox="0 0 23 23">
                <title>Microsoft logo</title>
                <path fill="#f3f3f3" d="M0 0h23v23H0z"></path>
                <path fill="#f35325" d="M1 1h10v10H1z"></path>
                <path fill="#81bc06" d="M12 1h10v10H12z"></path>
                <path fill="#05a6f0" d="M1 12h10v10H1z"></path>
                <path fill="#ffba08" d="M12 12h10v10H12z"></path>
              </svg>
              <span className="text-[#1A1A1A] text-[14px] font-medium tracking-[0.01em]">Log in with Microsoft</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCard;