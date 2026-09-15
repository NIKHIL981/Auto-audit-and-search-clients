import React, { createContext, useContext, useState, useCallback } from 'react';
import { SeoGlossaryModal } from '../components/SeoGlossaryModal';

interface SeoGlossaryContextType {
  openGlossary: (termId?: string) => void;
  closeGlossary: () => void;
  isGlossaryOpen: boolean;
  activeTermId?: string;
}

const SeoGlossaryContext = createContext<SeoGlossaryContextType>({
  openGlossary: () => {},
  closeGlossary: () => {},
  isGlossaryOpen: false,
});

export const useSeoGlossary = () => useContext(SeoGlossaryContext);

export const SeoGlossaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTermId, setActiveTermId] = useState<string | undefined>(undefined);

  const openGlossary = useCallback((termId?: string) => {
    setActiveTermId(termId);
    setIsOpen(true);
  }, []);

  const closeGlossary = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <SeoGlossaryContext.Provider
      value={{
        openGlossary,
        closeGlossary,
        isGlossaryOpen: isOpen,
        activeTermId,
      }}
    >
      {children}
      <SeoGlossaryModal
        isOpen={isOpen}
        onClose={closeGlossary}
        initialTermId={activeTermId}
      />
    </SeoGlossaryContext.Provider>
  );
};
