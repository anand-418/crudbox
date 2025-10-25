'use client';

import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-900">User not found</h2>
          <p className="mt-2 text-gray-600">Please sign in again to view your settings.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-black/10 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Account Settings</h1>

          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Profile</h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1 text-base font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="mt-1 text-base font-medium text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="mt-1 text-base font-medium text-gray-900">{new Date(user.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Organisations</h2>
              {user.organisations && user.organisations?.length > 0 ? (
                <div className="mt-4 space-y-4">
                  {user.organisations?.map((organisation) => (
                    <div key={organisation.uuid} className="border border-black/10 rounded-lg p-4">
                      <p className="text-base font-medium text-gray-900">{organisation.name}</p>
                      <p className="text-sm text-gray-500">Created: {new Date(organisation.created_at).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Updated: {new Date(organisation.updated_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-600">No organisations associated with this account.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
