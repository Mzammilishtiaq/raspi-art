import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from 'react-router-dom'

import App from './App'
import VideoPlayer from './components/videos/VideoPlayer';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <Navigate to='/' />
  },
  {
    path: '/playback',
    element: <VideoPlayer />
  }
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
      <RouterProvider router={router} />
  </React.StrictMode>
);