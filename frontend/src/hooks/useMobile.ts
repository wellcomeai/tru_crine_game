import { useState, useEffect, useCallback } from 'react';

const MOBILE_BREAKPOINT = 1024;

interface MobileState {
  isMobile: boolean;
  isTouch: boolean;
  keyboardVisible: boolean;
  viewportHeight: number;
}

export function useMobile(): MobileState {
  const [state, setState] = useState<MobileState>(() => ({
    isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
    isTouch: typeof window !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false,
    keyboardVisible: false,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  const handleResize = useCallback(() => {
    setState(prev => ({
      ...prev,
      isMobile: window.innerWidth < MOBILE_BREAKPOINT,
      viewportHeight: window.visualViewport?.height ?? window.innerHeight,
    }));
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isMobile: e.matches }));
    };
    mql.addEventListener('change', onChange);

    // Track visual viewport for keyboard detection
    const vv = window.visualViewport;
    if (vv) {
      const onVVResize = () => {
        const fullHeight = window.innerHeight;
        const currentHeight = vv.height;
        const keyboardVisible = fullHeight - currentHeight > 150;
        setState(prev => ({
          ...prev,
          keyboardVisible,
          viewportHeight: currentHeight,
        }));
      };
      vv.addEventListener('resize', onVVResize);
      return () => {
        mql.removeEventListener('change', onChange);
        vv.removeEventListener('resize', onVVResize);
      };
    }

    window.addEventListener('resize', handleResize);
    return () => {
      mql.removeEventListener('change', onChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return state;
}
