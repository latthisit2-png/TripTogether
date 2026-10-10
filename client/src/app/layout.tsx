import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'TripTogether — นัดวันเที่ยวให้ตรงกัน',
  description: 'นัดวันเที่ยวให้ตรงกัน เพราะทุกคนควรมีวันที่สะดวก',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Noto Sans Thai', sans-serif",
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
