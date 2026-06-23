'use client';

import { useApp } from '@/lib/state';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {toast}
    </div>
  );
}
