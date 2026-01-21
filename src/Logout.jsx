import { useState,useEffect, use } from "react";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {app} from './fbconfig.jsx'
import { initializeApp } from 'firebase/app'
const auth = getAuth(app);
function Logout(){
    const navigate = useNavigate();
    useEffect(()=>{
        signOut(auth).then(() => {
            alert("Logged Out Successfully !");
            navigate('/');
        }).catch((error) => {
            console.log(error);
            alert("Error in Logging Out. Please Try Again !");
        });
    },[]);
    return(
        <>
            <h1>Logging Out...</h1>
        </>
    )
}

export default Logout;