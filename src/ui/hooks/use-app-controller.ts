import { useEffect } from 'react';
import { AppController } from '@application/index';
import { useSessionStore } from '@ui/store/session-store';

export function useAppController(appController: AppController): void {
  const setAppState = useSessionStore((state) => state.setAppState);

  useEffect(() => appController.subscribe(setAppState), [appController, setAppState]);
}
