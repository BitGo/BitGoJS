import React, { FunctionComponent } from 'react';
import Navbar from '../Navbar/index';
import { AppContainer, RouteContainer } from './styles';

const Layout: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  return (
    <AppContainer>
      <Navbar />
      <RouteContainer>{children}</RouteContainer>
    </AppContainer>
  );
};

export default Layout;
