import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from '@/app/store';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ApplicationsPage } from '@/pages/applications/ApplicationsPage';
import { ToolsPage } from '@/pages/tools/ToolsPage';
import { AzizaPage } from '@/pages/aziza/AzizaPage';
import { FinancePage } from '@/pages/finance/FinancePage';
import { DocumentsPage } from '@/pages/documents/DocumentsPage';
import { HelpPage } from '@/pages/help/HelpPage';
import { DeclarantPage } from '@/pages/declarant/DeclarantPage';

export function App() {
  const { state } = useStore();

  useEffect(() => {
    document.documentElement.lang = state.lang;
  }, [state.lang]);

  if (!state.loggedIn) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {state.role === 'user' ? (
          <>
            <Route index element={<DashboardPage />} />
            <Route path='applications' element={<ApplicationsPage />} />
            <Route path='tools' element={<Navigate to='/tools/calculator' replace />} />
            <Route path='tools/:tool' element={<ToolsPage />} />
            <Route path='aziza' element={<AzizaPage />} />
            <Route path='finance' element={<FinancePage />} />
            <Route path='documents' element={<DocumentsPage />} />
            <Route path='help' element={<HelpPage />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </>
        ) : (
          <>
            <Route path='declarant/*' element={<DeclarantPage />} />
            <Route path='*' element={<Navigate to='/declarant' replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}
