import './style.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Vidia AI — automatic video editor', description: 'Turn long videos into engaging stories with AI.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
