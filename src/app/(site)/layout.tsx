
import Navbar from '@/components/shared/navbar';
import React from 'react';

const HomePageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <Navbar/>
      {children}
    </main>
  );
};

export default HomePageLayout;