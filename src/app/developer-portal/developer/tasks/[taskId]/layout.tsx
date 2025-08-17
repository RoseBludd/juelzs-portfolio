import React from 'react';

export default function TaskDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <main>{children}</main>
    </div>
  );
} 