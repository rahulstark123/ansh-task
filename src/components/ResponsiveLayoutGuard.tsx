"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  DevicePhoneMobileIcon, 
  WifiIcon, 
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

/** Only the marketing landing page is usable on small screens. */
const MOBILE_ALLOWED_PATHS = new Set(["/"]);

function isMobileAllowedPath(pathname: string) {
  return MOBILE_ALLOWED_PATHS.has(pathname);
}

interface ResponsiveLayoutGuardProps {
  children: React.ReactNode;
}

export function ResponsiveLayoutGuard({ children }: ResponsiveLayoutGuardProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const allowMobileView = isMobileAllowedPath(pathname);

  useEffect(() => {
    setMounted(true);
    
    // Check initial state
    setIsOffline(!navigator.onLine);
    setIsSmallScreen(window.innerWidth < 1024);

    // Event listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      const online = navigator.onLine;
      setIsOffline(!online);
      setRetrying(false);
    }, 800);
  };

  // Prevent server-side rendering mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // 1. Offline Mode Page
  if (isOffline) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-500/5 blur-[120px]" />

        <div className="relative w-full max-w-md p-8 rounded-3xl border border-white/[0.08] bg-zinc-900/60 backdrop-blur-xl text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping duration-1000" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
                <WifiIcon className="h-8 w-8 stroke-[1.5]" />
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold tracking-tight text-white mb-3">
            Something went wrong
          </h2>
          
          <p className="text-sm text-zinc-400 leading-relaxed mb-8">
            Your connection has been interrupted. Don't worry, we are looking into the concern. Please check your internet connection and try again.
          </p>

          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-rose-950/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <ArrowPathIcon className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Reconnecting..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  // 2. Small Screen Block Page (landing page only is exempt)
  if (isSmallScreen && !allowMobileView) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b] text-zinc-150 overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]" />

        <div className="relative w-full max-w-md p-8 rounded-3xl border border-white/[0.08] bg-[#121418]/60 backdrop-blur-xl text-center shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-indigo-500/15 animate-pulse duration-2000" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <DevicePhoneMobileIcon className="h-8 w-8 stroke-[1.5]" />
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl font-bold tracking-tight text-white mb-3">
            Mobile version in progress
          </h2>
          
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            For this screen size, our companion mobile application is in the building phase. We are crafting a tailored interface to deliver a premium workspace experience on smaller screens.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/[0.06] text-xs font-semibold text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            Desktop experience fully optimized
          </div>
        </div>
      </div>
    );
  }

  // 3. Render children as usual if online and on a desktop-sized viewport
  return <>{children}</>;
}
