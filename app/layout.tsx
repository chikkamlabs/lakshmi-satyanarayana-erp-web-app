import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Lakshmi Satyanarayana ERP Web App',
  description: 'Lakshmi Satyanarayana ERP Web Application',
  openGraph: {
    title: 'Lakshmi Satyanarayana ERP Web App',
    description: 'Lakshmi Satyanarayana ERP Web Application',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lakshmi Satyanarayana ERP Web App',
    description: 'Lakshmi Satyanarayana ERP Web Application',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
