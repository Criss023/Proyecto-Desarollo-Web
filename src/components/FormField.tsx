// src/components/FormField.tsx
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

export default FormField;
