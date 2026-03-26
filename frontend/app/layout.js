import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

import { ThemeProvider } from '@/context/ThemeContext'
import AITranslator from '@/components/AITranslator'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DineSmart | Premium Restaurant Experience',
  description: 'AI-Powered Table and food booking system for modern restaurants',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
        <Toaster position="top-right" />
        <AITranslator />
      </body>
    </html>
  )
}
