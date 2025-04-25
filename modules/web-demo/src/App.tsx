import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Layout from './components/Layout/index';

const Home = lazy(() => import('@components/Home'));
const BGComponent = lazy(() => import('@components/BitGoJS'));
const BGApiComponent = lazy(() => import('@components/BitGoAPI'));
const CoinsComponent = lazy(() => import('@components/Coins'));
const KeyCardComponent = lazy(() => import('@components/KeyCard'));
const WasmMiniscriptComponent = lazy(
  () => import('@components/WasmMiniscript'),
);
const EcdsaChallengeComponent = lazy(
  () => import('@components/EcdsaChallenge'),
);

const Loading = () => <div>Loading route...</div>;

const AppLayout = () => {
  return (
    <Layout>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'bitgo-js',
        element: <BGComponent />,
      },
      {
        path: 'bitgo-api',
        element: <BGApiComponent />,
      },
      {
        path: 'coins',
        element: <CoinsComponent />,
      },
      {
        path: 'keycard',
        element: <KeyCardComponent />,
      },
      {
        path: 'wasm-miniscript',
        element: <WasmMiniscriptComponent />,
      },
      {
        path: 'ecdsachallenge',
        element: <EcdsaChallengeComponent />,
      },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
