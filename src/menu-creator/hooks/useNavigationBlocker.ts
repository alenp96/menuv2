import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to prevent navigation when there are unsaved changes
 */
const useNavigationBlocker = (
  shouldBlock: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser back/forward buttons and tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  // Always define these callbacks regardless of shouldBlock to maintain consistent hook order
  const confirmNavigation = useCallback((callback: () => void) => {
    if (!shouldBlock || window.confirm(message)) {
      callback();
    }
  }, [shouldBlock, message]);

  const handleNavigateTo = useCallback((to: string) => {
    confirmNavigation(() => navigate(to));
  }, [confirmNavigation, navigate]);

  const handleNavigateBack = useCallback(() => {
    confirmNavigation(() => navigate(-1));
  }, [confirmNavigation, navigate]);

  // Handle in-app navigation - always define this effect regardless of shouldBlock
  useEffect(() => {
    // This is a placeholder for when useBlocker becomes stable in React Router v6
    return () => {}; // Always return a cleanup function for consistent hook behavior
  }, [shouldBlock, navigate, location]);

  return useMemo(() => ({
    confirmNavigation,
    handleNavigateTo,
    handleNavigateBack
  }), [confirmNavigation, handleNavigateTo, handleNavigateBack]);
};

export default useNavigationBlocker; 