import { useState,useEffect, use } from "react";
import { NavLink,useNavigate, BrowserRouter } from "react-router-dom";
import logo from './assets/logo.png';
import './Signup.css';

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { log } from "firebase/firestore/pipelines";

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


function Signup() {
    const [fName,setFName] = useState('');
    const [userEmail,setUserEmail] = useState('');
    const [userPass,setUserPass] = useState('');
    const [buttonText, setButtonText] = useState('Submit');
    const navigate = useNavigate();
    function applyValidations(){
        if(fName === '' || userEmail === '' || userPass === ''){
            alert("All Fields are Required !");
            setButtonText('Submit');
            return false;
        }else if(!userEmail.includes('@') && !userEmail.includes('.')){
            alert("Enter a Valid Email Address !");
            setButtonText('Submit');
            return false;
        }else if(userPass.length < 6){
            alert("Password must be at least 6 characters long !");
            setButtonText('Submit');
            return false;
        }else{
            setButtonText('Creating Account...');
            traditionalHandler();
        }
    }
    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try{
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const uid = user.uid;
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
        }catch(error){
            console.log("Error Occurred: ",error);
        }
    }
    async function traditionalHandler(){
        try{
            const userCredentials = await createUserWithEmailAndPassword(auth,userEmail,userPass);
            const user = userCredentials.user;
            const uid = user.uid;
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, {
                name: fName,
                email: userEmail,
                createdAt: new Date().toLocaleDateString()
            });
            alert("Account Created Successfully !");
            setFName('');
            setUserEmail('');
            setUserPass('');
            setButtonText('Submit');
            window.dispatchEvent(new Event('authChange'));
            localStorage.setItem('uid', uid);
            navigate('/dashboard');
        }catch(error){
            setButtonText('Submit');
        }
    }
    return(
        <>
            <div className="container-md flex-column justify-content-center align-items-center mt-5 d-flex">
                <form action="" className="col-12 col-md-8 s-form p-3 p-md-4 px-md-5 shadow-lg" onSubmit={(e) => e.preventDefault()}>
                    <h1 style={{color: 'black'}}>Sign Up</h1>
                    <h4>Necessary Step for Giving Your Memories a New Life with a Secure Space !</h4>
                    <div className="row">
                        <div className="inp-cont flex-column mt-3 d-flex col-12 col-md-6 form-ele">
                            <input onChange={(event) => {
                                setFName(event.target.value);
                            }} className="inp" type="text" placeholder="Name" id="uName" />
                            <input onChange={(event) => {
                                setUserEmail(event.target.value);
                            }} className="inp mt-3" type="email" placeholder="Email" id="uEmail" />
                            <input onChange={(event) => {
                                setUserPass(event.target.value);
                            }} className="inp mt-3" type="password" placeholder="Password" id="uPass" />
                            <div style={{cursor: 'pointer'}} className="m-3 h5 sbmt" onClick={() => {
                                setButtonText('Validating...');
                                applyValidations()
                            }}>{buttonText}</div>
                        </div>
                        <div className="col">
                            <h3 className="mt-5 text-center">Sign Up with</h3>
                            <div className="d-flex align-items-center justify-content-center">
                                <span style={{cursor: 'pointer'}} onClick={(event) => {
                                    event.target.style.color = 'wheat';
                                    signInWithGoogle();
                                }} className="spanner"><i className="fa-brands fa-google"></i></span>
                            </div>
                        </div>
                    </div>
                    <h4 className="mt-3">Already a part of our Family ? <NavLink style={{color: "black",fontWeight: '800'}} className="text-decoration-none h3" to="/login">Login</NavLink></h4>
                </form>
            </div>
        </>
    );
}
export default Signup;