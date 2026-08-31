"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { ChevronDown } from "lucide-react";

/**
 * Form controls mobile-friendly: label selalu ada (a11y), input tinggi 44px+,
 * type tel/number/enterKeyHint untuk keyboard Android yang tepat.
 */

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClasses =
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = "", id, required, ...rest }: TextInputProps) {
  const input = (
    <input
      id={id}
      required={required}
      aria-invalid={error ? true : undefined}
      className={`${inputClasses} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-500/25" : ""} ${className}`}
      {...rest}
    />
  );
  if (!label) return input;
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required}>
      {input}
    </Field>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className = "", id, required, rows = 3, ...rest }: TextAreaProps) {
  const area = (
    <textarea
      id={id}
      rows={rows}
      required={required}
      aria-invalid={error ? true : undefined}
      className={`w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
        error ? "border-red-400" : ""
      } ${className}`}
      {...rest}
    />
  );
  if (!label) return area;
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required}>
      {area}
    </Field>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Select({ label, hint, error, className = "", id, required, children, ...rest }: SelectProps) {
  const select = (
    <div className="relative">
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        className={`${inputClasses} appearance-none pr-10 ${
          error ? "border-red-400" : ""
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
  if (!label) return select;
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={required}>
      {select}
    </Field>
  );
}
