import React, { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Switch, useLocation } from "react-router-dom"
import LoginPage from "./pages/LoginPage.jsx"
import ChatPage from "./pages/ChatPage"
import ForgotPass from "./pages/ForgotPass"
import SignUpPage from "./pages/SignUpPage";
import LogOutPage from "./pages/LogOutPage"
import Header from "./components/Header";
import Footer from "./components/Footer";
import { setUserDetails } from "./redux/actions/index"
import { useDispatch } from 'react-redux'
import Review from './pages/Review';

import SunsetLandingPage from "./pages/SunsetLandingPage";
import WhiteCreamLandingPage from "./pages/WhiteCreamLandingPage";
import AuraLandingPage from "./pages/AuraLandingPage";

function LayoutWrapper() {
  const location = useLocation();
  const isChatRoute = location.pathname === '/' || location.pathname === '/chats' || location.pathname === '/sunset' || location.pathname === '/aura' || location.pathname === '/landing';

  return (
    <>
      {!isChatRoute && <Header />}
      <Switch>
        <Route exact path="/" component={ChatPage} />
        <Route path="/chats" component={ChatPage} />
        <Route path="/sunset" component={SunsetLandingPage} />
        <Route path="/aura" component={AuraLandingPage} />
        <Route path="/classic" component={WhiteCreamLandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignUpPage} />
        <Route path="/change-password" component={ForgotPass} />
        <Route path="/loged-out" component={LoginPage} />
        <Route path="/review-page" component={Review} />
      </Switch>
      {!isChatRoute && <Footer />}
    </>
  );
}

const CloseButton = ({ closeToast }) => (
  <button
    type="button"
    aria-label="close toast"
    className="Toastify__close-button"
    onClick={closeToast}
  >
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z"/>
    </svg>
  </button>
);

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    dispatch(setUserDetails(user));
  }, []);

  return (
    <>
      <LayoutWrapper />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        limit={3}
        closeOnClick={true}
        draggable={true}
      />
    </>
  );
}
