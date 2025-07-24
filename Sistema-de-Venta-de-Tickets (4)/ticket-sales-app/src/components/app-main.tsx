'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { initializeDefaultData } from '@/lib/database';
import Login from './login';
import AppLayout from './app-layout';
import AppViews from './app-views';

export default function AppMain() {
  const { isAuthenticated, currentUser } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeView, setActiveView] = useState('sales');

  // Inicializar base de datos
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDefaultData();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        setIsInitialized(true); // Continuar incluso si hay error
      }
    };

    initialize();
  }, []);

  // Establecer vista inicial basada en rol
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveView('dashboard');
      } else {
        setActiveView('sales');
      }
    }
  }, [currentUser]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Iniciando aplicación...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      <AppViews activeView={activeView} setActiveView={setActiveView} />
    </AppLayout>
  );
}
