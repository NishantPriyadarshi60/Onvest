"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id?: string;
  label: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  children: React.ReactElement;
  className?: string;
}

export function FormField({
  id,
  label,
  error,
  success,
  required,
  children,
  className,
}: FormFieldProps) {
  const child = children as React.ReactElement<{ id?: string; className?: string }>;
  const fieldId = id ?? child.props?.id;
  const extraProps: Record<string, unknown> = {
    id: fieldId,
    className: cn(
      child.props?.className,
      error && "border-red-500 focus-visible:ring-red-500",
      success && !error && "border-green-500 focus-visible:ring-green-500 pr-9"
    ),
  };
  if (error) {
    extraProps["aria-invalid"] = true;
    if (fieldId) extraProps["aria-describedby"] = `${fieldId}-error`;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
        {required && " *"}
      </label>
      <div className="relative">
        {React.cloneElement(child, extraProps as React.Attributes)}
        {success && !error && (
          <div
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-green-600"
            aria-hidden
          >
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>
      {error && (
        <p
          id={fieldId ? `${fieldId}-error` : undefined}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
