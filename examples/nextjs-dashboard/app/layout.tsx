import type { ReactNode } from 'react';
import '../../shared/styles.css';

export const metadata = { title: 'Tevra Studio — Project tasks', description: 'A local task workspace used to exercise Tevra design and quality workflows.' };
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
