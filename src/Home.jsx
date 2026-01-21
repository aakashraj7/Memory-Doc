import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from './assets/logo.png';
import './Home.css';

function Home() {
    const [msg, setMsg] = useState("");
    
    useEffect(() => {
        const interval = setInterval(() => {
            setMsg(prevMsg => {
                if (prevMsg === "...") {
                    return "";
                }
                return prevMsg + ".";
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <div className="row">
                <img className="col-12 col-md-12 col-lg-6" id="hmlogo" src={logo} alt="Logo" />
                <div className="col p-4 p-ld-5 pe-lg-5">
                    <div className="save-here-card lft">
                        <h2 className="save-here-title">Save Here</h2>
                        <p className="save-here-text">Capture your precious moments and memories in one secure place.</p>
                    </div>
                    <div className="secured-auth-card rgt">
                        <h2 className="secured-auth-title">Secured Authentication</h2>
                        <p className="secured-auth-text">Your memories are safe with Google's Firebase authentication system.</p>
                    </div>
                    <div className="user-friendly-card lft">
                        <h2 className="user-friendly-title">User-Friendly Interface</h2>
                        <p className="user-friendly-text">Enjoy a seamless experience with our intuitive and easy-to-use design.</p>
                    </div>
                    <div className="col-12 mt-5 text-center">
                        <NavLink className="get-started" to="/signup">Get Started <br />.{msg}</NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;