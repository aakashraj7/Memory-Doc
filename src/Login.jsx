import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from './assets/logo.png';

import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, getAdditionalUserInfo } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD0FIhK2YppIFZdMfFxidx3R3LrkAVO0sU",
  authDomain: "memory-doc.firebaseapp.com",
  projectId: "memory-doc",
  storageBucket: "memory-doc.firebasestorage.app",
  messagingSenderId: "733651483559",
  appId: "1:733651483559:web:be93cd4e383123898a9482",
  measurementId: "G-8NF9BQE1QT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



function Login(){
    const [buttonText, setButtonText] = useState('Submit');
    const [userEmail,setUserEmail] = useState('');
    const [userPass,setUserPass] = useState('');
    const [resetMsg, setResetMsg] = useState('Reset Here');
    const navigate = useNavigate();
    function applyValidations(){
        if(userEmail === '' || userPass === ''){
            alert("All Fields are Required !");
            setButtonText('Submit');
            return false;
        }else if(!userEmail.includes('@') && !userEmail.includes('.')){
            alert("Enter a Valid Email Address !");
            setButtonText('Submit');
            return false;
        }else{
            setButtonText('Checking Credentials...');
            traditionalHandler();
        }
    }
    async function traditionalHandler(){
        try{
            const userCredentials = await signInWithEmailAndPassword(auth, userEmail, userPass);
            const user = userCredentials.user;
            window.dispatchEvent(new Event('authChange'));
            navigate('/dashboard');
        }catch(error){
            const errorCode = error.code;
            if(errorCode === 'auth/invalid-credential'){
                alert("Check Your Email and Password.");
                setButtonText('Submit');
                return;
            }else if(errorCode === 'auth/user-not-found'){
                alert("User Not Found. Please Sign Up !!");
                setButtonText('Submit');
                return;
            }else if(errorCode === 'auth/wrong-password'){
                alert("Incorrect Password. Try Again !"); 
                setButtonText('Submit');
                return;
            }else{
                setButtonText('Submit');
                console.log("Error Occurred: " + error.message); 
            }
        }
    }
    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try{
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;
            const { isNewUser } = getAdditionalUserInfo(result);
            if(isNewUser){
                const uName = user.displayName;
                const uEmail = user.email;
                const userRef = doc(db, "users", uid);
                await setDoc(userRef, {
                    name: uName,
                    email: uEmail,
                    createdAt: new Date().toLocaleDateString()
                });
                localStorage.setItem('uid', uid);
                window.dispatchEvent(new Event('authChange'));
                navigate('/dashboard');
            }else{
                localStorage.setItem('uid', uid);
                window.dispatchEvent(new Event('authChange'));
                navigate('/dashboard');
            }
        }catch(error){
            console.log("Error Occurred: ",error);
        }
    }
    async function sendResetLink(email) {
        if(email === ''){
            alert("Please Enter Your Email Address !");
            return;
        }else if(!email.includes('@') && !email.includes('.')){
            alert("Enter a Valid Email Address !");
            return;
        }
        try{
            setResetMsg('Sending Link...');
            await sendPasswordResetEmail(auth, email);
            alert("Password Reset Link Sent to Your Email, Please Check your Inbox !");
            setResetMsg('Reset Here');
        }catch(error){
            if(error.code === 'auth/user-not-found'){
                let op = confirm("User Not Found. Please Sign Up !!");
                if(op){
                    navigate('/signup');
                }else{
                    setResetMsg('Reset Here')
                }
            }else{
                console.log("Error Occurred: ",error);
            }
        }
    }
    return(
        <>
            <div className="container-md flex-column justify-content-center align-items-center mt-5 d-flex">
                <form action="" className="col-12 col-md-8 s-form p-3 p-md-4 px-md-5 shadow-lg" onSubmit={(e) => e.preventDefault()}>
                    <h1 style={{color: 'black'}}>Login</h1>
                    <h4>Welcome Back! Please Login to Access Your Secure Memory Space.</h4>
                    <div className="row">
                        <div className="inp-cont flex-column mt-3 d-flex col-12 col-md-6 form-ele">
                            <input onChange={(event) => {
                                setUserEmail(event.target.value);
                            }} className="inp mt-3" type="email" placeholder="Email" id="uEmail" />
                            <input onChange={(event) => {
                                setUserPass(event.target.value);
                            }} className="inp mt-3" type="password" placeholder="Password" id="uPass" />
                            <div style={{cursor: 'pointer'}} className="m-3 h5 sbmt" onClick={() => {
                                setButtonText('Validating...');
                                applyValidations();
                            }}>{buttonText}</div>
                        </div>
                        <div className="col">
                            <h3 className="mt-5 text-center">Log In with</h3>
                            <div className="d-flex align-items-center justify-content-center">
                                <span style={{cursor: 'pointer'}} onClick={(event) => {
                                    event.target.style.color = 'wheat';
                                    signInWithGoogle();
                                }} className="spanner"><i className="fa-brands fa-google"></i></span>
                            </div>
                        </div>
                    </div>
                    <h5 className="mt-4">Forgot Your Password ? <div onClick={() => sendResetLink(userEmail)} style={{color: "black",fontWeight: '800', display: 'inline-block',cursor: 'pointer'}}>{resetMsg}</div></h5>
                    <h4 className="">Not a part of our Family ? <NavLink style={{color: "black",fontWeight: '800'}} className="text-decoration-none h3" to="/signup">Sign Up</NavLink></h4>
                </form>
            </div>
        </>
    )
}

export default Login;