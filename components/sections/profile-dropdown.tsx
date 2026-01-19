"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUser, SignOutButton, useClerk } from '@clerk/nextjs';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileDropdown() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 px-2 p-2 rounded-lg animate-pulse">
        <div className="w-8 h-8 rounded-full bg-zinc-800" />
        <div className="w-24 h-4 bg-zinc-800 rounded" />
      </div>
    );
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if (user?.firstName) return user.firstName;
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.split('@')[0];
    }
    return 'User';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors w-full"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
            {getInitials()}
          </div>
        )}
        <span className="text-sm font-medium flex-1 text-left truncate">{getDisplayName()}</span>
        <ChevronDown 
          size={14} 
          className={`opacity-40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
          <button
            onClick={() => {
              setIsOpen(false);
              openUserProfile();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors text-sm"
          >
            <User size={16} className="text-zinc-400" />
            <span className="text-white">Profile</span>
          </button>
          
          <SignOutButton>
            <button className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors text-sm border-t border-white/5">
              <LogOut size={16} className="text-zinc-400" />
              <span className="text-white">Log out</span>
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
