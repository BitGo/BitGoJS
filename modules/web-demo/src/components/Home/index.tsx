import React from 'react';
import { HomeContainer } from './styles';

const Home = () => {
  return (
    <HomeContainer>
      <h3>Welcome to the BitGoJS web demo.</h3>
      <br />
      <p>
        Open the network tab (F12) & inspect requests as you navigate throuh the
        app.
      </p>
    </HomeContainer>
  );
};

export default Home;
