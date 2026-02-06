// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AMANA - Sharia-Native Macro Reserve',
  description: 'Decentralized reserve system for the Internet of Agents',
  keywords: ['AMANA', 'DeFi', 'Sharia', 'Islamic Finance', 'Solana', 'Ethereum'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${jetbrains.variable} font-sans antialiased min-h-screen bg-neutral-50 dark:bg-neutral-950`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h1 className="font-display font-semibold text-xl text-neutral-900 dark:text-white">
                    AMANA
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Sharia-Native Macro Reserve
                  </p>
                </div>
              </div>
              <nav className="flex items-center gap-6">
                <a
                  href="/"
                  className="text-sm font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/dao"
                  className="text-sm font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-600 transition-colors"
                >
                  Governance
                </a>
                <a
                  href="/treasury"
                  className="text-sm font-medium text-neutral-700 hover:text-primary-700 dark:text-neutral-300 dark:hover:text-primary-600 transition-colors"
                >
                  Treasury
                </a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 py-6 mt-auto">
            <div className="container mx-auto px-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              <p>
                &copy; {new Date().getFullYear()} AMANA Protocol. Built with Sharia-compliant principles.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
