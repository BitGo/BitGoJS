import type { ReactNode } from 'react';
import Navbar from '../Navbar/index';
import { AppContainer, RouteContainer } from './styles';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <AppContainer>
      <Navbar />
      <RouteContainer>{children}</RouteContainer>
    </AppContainer>
  );
};

export default Layout;
