import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stackwise — DCA / VCA crypto tracker',
  description:
    'Suis tes investissements crypto en DCA ou VCA avec recommandation automatique du montant à investir chaque semaine.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg text-text font-sans antialiased">{children}</body>
    </html>
  );
}
