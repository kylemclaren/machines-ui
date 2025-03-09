'use client';

import React, { ReactNode } from 'react';
import { CopyButton } from './copy-button';

interface CopyableCodeProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function CopyableCode({ value, children, className = '' }: CopyableCodeProps) {
  return (
    <span className="inline-flex items-start gap-1 max-w-full">
      <code className={`overflow-hidden text-ellipsis ${className}`}>{children}</code>
      <CopyButton value={value} className="flex-shrink-0 mt-0.5" />
    </span>
  );
} 