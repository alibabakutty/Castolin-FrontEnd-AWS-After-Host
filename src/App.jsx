// src/App.js
import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import routes from './routesConfig';
import ProtectedRoutes from './context/ProtectedRoutes';
import NotFound from './components/NotFound';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {routes.map(({ path, element: Component, roles }, idx) => (
          <Route
            key={idx}
            path={path}
            element={
              roles ? (
                <ProtectedRoutes roles={roles}>
                  <Component />
                </ProtectedRoutes>
              ) : (
                <Component />
              )
            }
          />
        ))}
        {/* 404 fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
