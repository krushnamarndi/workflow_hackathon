import React from 'react';

const BrandingLogo = () => {
  return (
    <div className="fixed top-0 left-0 p-[24px] pointer-events-none select-none z-50">
      <div className="flex items-center gap-[12px]">
        {/* Abstract Horizontal Bar Icon Branding */}
        <div className="flex flex-col gap-[2px]">
          <div className="h-[24px] w-[5px] bg-[#1a1a1a]"></div>
          <div className="h-[12px] w-[5px] bg-[#1a1a1a]"></div>
        </div>
        
        {/* Visual Separator & Text Branding */}
        <div className="flex items-center">
          <div className="flex flex-col">
            <span 
              className="text-[#1a1a1a] font-medium tracking-[0.1em] text-[12px] leading-tight"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              WEAVY
            </span>
          </div>
          
          {/* Vertical Divider Line */}
          <div className="h-[28px] w-[1px] bg-[#f0f0f0] mx-[12px]"></div>
          
          <div className="flex flex-col">
            <span 
              className="text-[#1a1a1a] font-normal tracking-[0.05em] text-[10px] leading-[1.2]"
              style={{ fontFamily: 'var(--font-sans)', width: '70px' }}
            >
              ARTISTIC INTELLIGENCE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingLogo;