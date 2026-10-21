import React, { useState, useEffect, useCallback } from 'react';
import type { Category, Guide } from './types';
import {
  getSupabaseCredentials,
  fetchCategories,
  fetchGuides,
  fetchGuideById,
  checkIsAdmin,
  signOutAdmin,
  getSupabase,
  isSchemaMissing,
  isTableMissingError
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SetupNotice } from './components/SetupNotice';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { HomePage } from './pages/HomePage';
import { GuideReadingPage } from './pages/GuideReadingPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminGuideEditorPage } from './pages/AdminGuideEditorPage';

export default function App() {
  // Navigation: 'home' | 'guide-[id]' | 'admin-login' | 'admin-dashboard' | 'admin-create' | 'admin-edit-[id]'
  const [currentView, setCurrentView] = useState<string>('home');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);

  // App data state
  const [guides, setGuides] = useState<Guide[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [schemaMissingState, setSchemaMissingState] = useState<boolean>(false);

  // Auth / Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState<boolean>(true);

  // Filtering on homepage
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category manager modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Supabase connection state
  const [credentialsConfigured, setCredentialsConfigured] = useState<boolean>(() => {
    return getSupabaseCredentials().isConfigured;
  });

  // URL Hash routing synchronization
  const parseRouteFromUrl = useCallback(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      setCurrentView('home');
      setActiveGuideId(null);
      return;
    }

    if (hash.startsWith('guide/')) {
      const gId = hash.replace('guide/', '');
      setActiveGuideId(gId);
      setCurrentView(`guide-${gId}`);
    } else if (hash === 'login') {
      setCurrentView('admin-login');
      setActiveGuideId(null);
    } else if (hash === 'admin') {
      setCurrentView('admin-dashboard');
      setActiveGuideId(null);
    } else if (hash === 'admin/create') {
      setCurrentView('admin-create');
      setActiveGuideId(null);
    } else if (hash.startsWith('admin/edit/')) {
      const gId = hash.replace('admin/edit/', '');
      setActiveGuideId(gId);
      setCurrentView(`admin-edit-${gId}`);
    } else {
      setCurrentView('home');
      setActiveGuideId(null);
    }
  }, []);

  const navigateTo = (view: string, guideId?: string) => {
    if (view === 'home') {
      window.location.hash = '';
      setCurrentView('home');
      setActiveGuideId(null);
    } else if (view.startsWith('guide-') || (view === 'guide' && guideId)) {
      const id = guideId || view.replace('guide-', '');
      window.location.hash = `guide/${id}`;
      setActiveGuideId(id);
      setCurrentView(`guide-${id}`);
    } else if (view === 'admin-login') {
      window.location.hash = 'login';
      setCurrentView('admin-login');
      setActiveGuideId(null);
    } else if (view === 'admin-dashboard') {
      window.location.hash = 'admin';
      setCurrentView('admin-dashboard');
      setActiveGuideId(null);
    } else if (view === 'admin-create') {
      window.location.hash = 'admin/create';
      setCurrentView('admin-create');
      setActiveGuideId(null);
    } else if (view.startsWith('admin-edit-') || (view === 'admin-edit' && guideId)) {
      const id = guideId || view.replace('admin-edit-', '');
      window.location.hash = `admin/edit/${id}`;
      setActiveGuideId(id);
      setCurrentView(`admin-edit-${id}`);
    }
  };

  useEffect(() => {
    parseRouteFromUrl();
    window.addEventListener('hashchange', parseRouteFromUrl);
    return () => window.removeEventListener('hashchange', parseRouteFromUrl);
  }, [parseRouteFromUrl]);

  // Verify Admin authorization on mount and auth state changes
  const verifyAdmin = useCallback(async () => {
    setIsCheckingAdmin(true);
    try {
      const authorized = await checkIsAdmin();
      setIsAdmin(authorized);
    } catch (err) {
      if (!isTableMissingError(err)) {
        console.error('Failed to verify admin status:', err);
      }
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  // Fetch guides and categories from Supabase
  const loadData = useCallback(async () => {
    const creds = getSupabaseCredentials();
    setCredentialsConfigured(creds.isConfigured);

    if (!creds.isConfigured) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setDataError(null);

    try {
      // Admins can see draft guides as well
      const adminStatus = await checkIsAdmin();
      setIsAdmin(adminStatus);

      const [cats, gds] = await Promise.all([
        fetchCategories(),
        fetchGuides(adminStatus),
      ]);

      const missing = isSchemaMissing();
      setSchemaMissingState(missing);

      setCategories(cats);
      setGuides(gds);
    } catch (err: unknown) {
      if (isTableMissingError(err)) {
        setSchemaMissingState(true);
        setDataError(null);
      } else {
        console.error('Error fetching data from Supabase:', err);
        setDataError(
          err instanceof Error
            ? err.message
            : 'Failed to load guides from database. Please check your Supabase connection.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
    verifyAdmin();

    const client = getSupabase();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange(async () => {
        await verifyAdmin();
        loadData();
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [loadData, verifyAdmin]);

  const handleSignOut = async () => {
    await signOutAdmin();
    setIsAdmin(false);
    navigateTo('home');
  };

  const handleCredentialsUpdated = () => {
    const creds = getSupabaseCredentials();
    setCredentialsConfigured(creds.isConfigured);
    loadData();
    verifyAdmin();
  };

  // Find active guide for reading or editing
  const currentGuide = guides.find((g) => g.id === activeGuideId) || null;

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EF] text-[#493D61]">
      {/* Top Banner for Supabase credentials or schema migration if needed */}
      <SetupNotice
        onCredentialsUpdated={handleCredentialsUpdated}
        schemaMissing={schemaMissingState}
        onRetry={loadData}
        isOpenControlled={isSetupModalOpen}
        onOpenControlledChange={setIsSetupModalOpen}
      />

      {/* Top Bar Header */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
      />

      {/* Main Content Router */}
      <div className="flex-1">
        {currentView === 'home' && (
          <HomePage
            guides={guides}
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            isLoading={isLoading}
            error={dataError}
            onRefresh={loadData}
            onOpenGuide={(id) => navigateTo('guide', id)}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            isSupabaseConfigured={credentialsConfigured}
            isSchemaMissing={schemaMissingState}
            onOpenSetupModal={() => setIsSetupModalOpen(true)}
          />
        )}

        {currentView.startsWith('guide-') && currentGuide && (
          <GuideReadingPage
            guide={currentGuide}
            onBack={() => navigateTo('home')}
            isAdmin={isAdmin}
            onEditGuide={(id) => navigateTo('admin-edit', id)}
          />
        )}

        {currentView.startsWith('guide-') && !currentGuide && !isLoading && (
          <div className="max-w-xl mx-auto px-4 py-20 text-center">
            <h2 className="text-lg font-bold text-[#493D61] mb-2">Guide not found</h2>
            <p className="text-xs text-[#81758F] mb-4">
              The requested printing guide may have been removed or updated.
            </p>
            <button
              onClick={() => navigateTo('home')}
              className="px-4 py-2 bg-[#EDE5FF] text-[#493D61] text-xs font-semibold rounded-xl"
            >
              Return to All Guides
            </button>
          </div>
        )}

        {currentView === 'admin-login' && (
          <AdminLoginPage
            onLoginSuccess={() => {
              setIsAdmin(true);
              verifyAdmin();
              navigateTo('admin-dashboard');
            }}
            onBackToHome={() => navigateTo('home')}
            isSupabaseConfigured={credentialsConfigured}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboardPage
            guides={guides}
            categories={categories}
            onOpenCreate={() => navigateTo('admin-create')}
            onOpenEdit={(id) => navigateTo('admin-edit', id)}
            onOpenGuideReading={(id) => navigateTo('guide', id)}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            onRefresh={loadData}
            onSignOut={handleSignOut}
            isLoading={isLoading}
          />
        )}

        {currentView === 'admin-create' && (
          <AdminGuideEditorPage
            categories={categories}
            onSaveSuccess={(saved) => {
              loadData();
              navigateTo('guide', saved.id);
            }}
            onCancel={() => navigateTo('admin-dashboard')}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        )}

        {currentView.startsWith('admin-edit-') && (
          <AdminGuideEditorPage
            initialGuide={currentGuide}
            categories={categories}
            onSaveSuccess={(saved) => {
              loadData();
              navigateTo('guide', saved.id);
            }}
            onCancel={() => navigateTo('admin-dashboard')}
            onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
          />
        )}
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={() => {
          loadData();
        }}
      />

      {/* Footer with Tagline and discreet Admin Login */}
      <Footer isAdmin={isAdmin} onNavigate={navigateTo} />
    </div>
  );
}
