"use client";
import * as React from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-300",
  secondary: "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-300",
  outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-50 focus-visible:ring-neutral-300",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} px-4 py-2 ${className}`} {...props} />;
}


