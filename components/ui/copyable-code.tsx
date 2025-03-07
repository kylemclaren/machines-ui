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
    <span className="inline-flex items-center">
      <code className={className}>{children}</code>
      <CopyButton value={value} />
    </span>
  );
} 