'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { ArrowUp, RotateCw } from 'lucide-react';

// Error components must accept the error prop
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 overflow-hidden relative">
      {/* Background decoration - visible in both themes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-300/10 dark:bg-purple-900/20 blur-3xl -top-20 -left-20"></div>
        <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-300/10 dark:bg-purple-900/20 blur-3xl -bottom-20 -right-20"></div>
      </div>

      <div className="relative z-10 text-center max-w-3xl">
        <div className="mb-12 relative w-54 h-54 mx-auto select-none">
          <div className="absolute -inset-8 bg-purple-200/30 dark:bg-purple-900/30 rounded-full blur-xl"></div>
          <Image
            src="/static/images/frankie_error.png"
            alt="Purple balloon character looking confused"
            width={214}
            height={214}
            className="relative z-10 drop-shadow-xl"
            priority
          />
        </div>
        
        <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-3">
          500 Error
        </div>
        
        <h1 className="text-3xl md:text-5xl font-semibold text-foreground/90 mb-4 tracking-tight">
          Well this is awkward...
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Looks like Frankie is having some technical difficulties. 
          Our server encountered an unexpected error while processing your request.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer"
          >
            <RotateCw className="w-5 h-5 mr-2" />
            <span>Try Again</span>
          </button>
          
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <ArrowUp className="w-5 h-5 mr-2" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
      
      {/* Artwork credit at the bottom of the page */}
      <div className="absolute bottom-0 left-0 right-0 w-full text-center py-4 text-xs text-muted-foreground/60 z-20">
        Artwork by{" "}
        <a 
          href="https://annieruygtillustration.com/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-purple-600 dark:text-purple-400 hover:underline focus-visible:underline focus:outline-none"
        >
          Annie Ruygt
        </a>
      </div>
    </div>
  );
} 