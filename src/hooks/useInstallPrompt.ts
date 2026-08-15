import { useState, useEffect } from 'react';

// Define the type for the BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useInstallPrompt() {
  const [promptable, setPromptable] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNavigator = (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMedia || isStandaloneNavigator);
    };

    checkStandalone();

    const ready = (e: Event) => {
      e.preventDefault();
      setPromptable(e as BeforeInstallPromptEvent);
    };

    const installed = () => {
      setPromptable(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', ready);
    window.addEventListener('appinstalled', installed);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', ready);
      window.removeEventListener('appinstalled', installed);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkStandalone);
    };
  }, []);

  return { promptable, isStandalone };
}
