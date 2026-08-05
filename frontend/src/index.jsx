import React from 'react';
import { createRoot } from 'react-dom/client';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import App from './App';
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from 'react-redux';
import store from "./redux/store";
import { ChakraProvider } from '@chakra-ui/react';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ChakraProvider>
          <App />
        </ChakraProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);

