import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentFlow Studio',
  description: 'Next-gen AI orchestration UI starter built with Next.js, Tailwind CSS, BullMQ, Redis, and React Flow.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
