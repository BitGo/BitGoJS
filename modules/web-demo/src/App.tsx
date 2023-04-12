import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/index';

const Home = lazy(() => import('@components/Home'));
const BGComponent = lazy(() => import('@components/BitGoJS'));
const BGApiComponent = lazy(() => import('@components/BitGoAPI'));
const CoinsComponent = lazy(() => import('@components/Coins'));
const KeyCardComponent = lazy(() => import('@components/KeyCard'));
const EcdsaChallengeComponent = lazy(
  () => import('@components/EcdsaChallenge'),
);

const Loading = () => <div>Loading route...</div>;

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bitgo-js" element={<BGComponent />} />
            <Route path="/bitgo-api" element={<BGApiComponent />} />
            <Route path="/coins" element={<CoinsComponent />} />
            <Route path="/keycard" element={<KeyCardComponent />} />
            <Route
              path="/ecdsachallenge"
              element={<EcdsaChallengeComponent />}
            />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
