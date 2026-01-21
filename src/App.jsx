import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import Home from './Home.jsx'
import logo from './assets/enlarged.png'
import Login from './Login.jsx'
import Signup from './Signup.jsx'
import CreateMemory from './createMemory.jsx'
import {app} from './fbconfig.jsx'
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import Logout from './Logout.jsx'
const auth = getAuth(app);
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = () => {
        const unSubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });
    };

    // Check on mount
    checkLoginStatus();

    // Listen for custom auth change event
    const handleAuthChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  return (
    <>
        <BrowserRouter>
            <header>
                <nav className='navbar navbar-dark navbar-expand-lg'>
                    <div className='container'>
                        <div className='navbar-brand d-flex align-items-end'>
                            <img src={logo} alt="Logo" />
                            <p style={{color: '#342f2f',letterSpacing: '1.3px'}}>Memory DOC</p>
                        </div>
                        <button className='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbarNav'><span className='navbar-toggler-icon'></span></button>
                        <div className='collapse navbar-collapse' id='navbarNav'>
                            <div className='navbar-nav ms-auto'>
                                <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/">Home</NavLink>
                                <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/memories">Memories</NavLink>
                                {isLoggedIn ? (
                                    <>
                                        <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/dashboard">Dashboard</NavLink>
                                        <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/logout">Logout</NavLink>
                                    </>
                                ) : (
                                    <>
                                        <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/login">Login</NavLink>
                                        <NavLink className={({isActive})=>isActive ? "nav-link nav-item butn actived" : "nav-link nav-item butn"} to="/signup">Sign Up</NavLink>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
            </header>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/create-memory" element={<CreateMemory />} />
                <Route path="/logout" element={<Logout />} />
            </Routes>
        </BrowserRouter>
    </>
  )
}

export default App
