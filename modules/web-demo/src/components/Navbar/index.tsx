import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavbarContainer, NavItem } from './styles';

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <NavbarContainer>
      <NavItem
        activeRoute={pathname === 'home' || pathname === '/'}
        onClick={() => navigate('/')}
      >
        Home
      </NavItem>
      <NavItem
        activeRoute={pathname === '/bitgo-js'}
        onClick={() => navigate('/bitgo-js')}
      >
        BitGoJS
      </NavItem>
      <NavItem
        activeRoute={pathname === '/bitgo-api'}
        onClick={() => navigate('/bitgo-api')}
      >
        BitGo API
      </NavItem>
      <NavItem
        activeRoute={pathname === '/coins'}
        onClick={() => navigate('/coins')}
      >
        Coins
      </NavItem>
      <NavItem
        activeRoute={pathname === '/keycard'}
        onClick={() => navigate('/keycard')}
      >
        Key Card
      </NavItem>
      <NavItem
        activeRoute={pathname === '/ecdsachallenge'}
        onClick={() => navigate('/ecdsachallenge')}
      >
        Generate Ecdsa Challenge
      </NavItem>
    </NavbarContainer>
  );
};

export default Navbar;
