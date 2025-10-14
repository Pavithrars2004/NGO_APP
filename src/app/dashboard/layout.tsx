'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect from the old dashboard root to the create page.
  useEffect(() => {
    if (pathname === '/dashboard') {
      router.replace('/dashboard/create');
    }
  }, [pathname, router]);

  // If we are at the old dashboard root, render nothing to avoid flash of content.
  if (pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline">
              Post an Opportunity
            </h1>
            <p className="text-muted-foreground">
              Fill out the form below to attract volunteers to your cause.
            </p>
        </div>
        <div>{children}</div>
    </div>
  )
}
