import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 right-0 p-[16px] pointer-events-none md:p-[24px]">
      <div className="flex justify-end items-center">
        <span 
          className="text-footer select-none"
          style={{
            fontSize: '11px',
            color: '#999999',
            fontWeight: 400,
            lineHeight: '1',
            fontFamily: 'var(--font-sans)',
          }}
        >
          © 2025 Weavy. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;