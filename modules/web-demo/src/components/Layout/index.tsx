import React, { FC, PropsWithChildren } from 'react';
import Navbar from '../Navbar/index';
import { AppContainer, RouteContainer } from './styles';

const Layout: FC<PropsWithChildren<unknown>> = ({ children }) => {
  return (
    <AppContainer>
      <Navbar />
      <RouteContainer>{children}</RouteContainer>
    </AppContainer>
  );
};

export default Layout;
