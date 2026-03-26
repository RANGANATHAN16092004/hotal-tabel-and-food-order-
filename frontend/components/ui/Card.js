'use client'

export default function Card({ children, className = '' }) {
  return (
    <div className={`border rounded-lg p-4 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}
