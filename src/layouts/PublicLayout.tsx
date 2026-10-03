import React, { useState } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { IntroAnimation } from '../components/common/IntroAnimation';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [, setIntroFinished] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-ink selection:bg-brand-blue selection:text-white">
      {/* First-load Hospital Opening Animation */}
      <IntroAnimation onComplete={() => setIntroFinished(true)} />

      {/* Public Header & Nav */}
      <TopBar />
      <Navbar />

      {/* Main Page Content */}
      <div className="flex-grow">
        {children}
      </div>

      {/* Public Footer */}
      <Footer />
    </div>
  );
};
