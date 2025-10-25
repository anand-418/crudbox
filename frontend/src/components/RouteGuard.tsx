'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // Still loading, don't redirect yet

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Organization creation route - allowed for authenticated users without organizations
    const isOrganisationRoute = pathname === '/organisation';

    if (!user) {
      // Not logged in
      if (!isPublicRoute) {
        router.push('/login');
      }
      return;
    }

    // User is logged in
    const organisations = user.organisations || [];
    const hasOrganisations = organisations?.length > 0;

    if (!hasOrganisations) {
      // User has no organizations
      if (!isOrganisationRoute) {
        // Only allow organization creation page
        router.push('/organisation');
      }
    } else {
      // User has organizations
      if (isOrganisationRoute) {
        // Don't allow access to organization creation if they already have organizations
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  return <>{children}</>;
}