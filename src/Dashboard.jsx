import React, { useState, useEffect } from 'react';
import { getAuth, updateProfile, sendPasswordResetEmail, deleteUser, signOut } from "firebase/auth";
import { app } from './fbconfig.jsx';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const auth = getAuth(app);
    const user = auth.currentUser;

    const [displayName, setDisplayName] = useState("");
    const [originalName, setOriginalName] = useState("");
    
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            const currentName = user.displayName || "";
            setDisplayName(currentName);
            setOriginalName(currentName);
        } else {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (statusMsg.text) {
            const timer = setTimeout(() => {
                setStatusMsg({ type: "", text: "" });
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const isChanged = displayName.trim() !== "" && displayName !== originalName;

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (!displayName.trim()) {
            setStatusMsg({ type: "error", text: "Display Name cannot be empty." });
            return;
        }

        setLoading(true);
        try {
            await updateProfile(user, { displayName: displayName });
            setOriginalName(displayName); 
            setStatusMsg({ type: "success", text: "Profile updated successfully!" });
        } catch (error) {
            setStatusMsg({ type: "error", text: "Failed to update profile." });
        }
        setLoading(false);
    };

    const handleResetPassword = async () => {
        if (!user.email) return;
        const confirmReset = window.confirm(`Send password reset link to ${user.email}?`);
        if (confirmReset) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                setStatusMsg({ type: "success", text: "Password reset email sent! Check your inbox." });
            } catch (error) {
                setStatusMsg({ type: "error", text: "Error sending reset email." });
            }
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm(
            "⚠️ DANGER: This will permanently delete your account AND all your memories. Are you sure?"
        );

        if (confirmDelete) {
            setLoading(true);
            const db = getFirestore(app);

            try {
                const q = query(collection(db, "memories"), where("userId", "==", user.uid));
                const querySnapshot = await getDocs(q);

                const deletePromises = querySnapshot.docs.map((document) => 
                    deleteDoc(doc(db, "memories", document.id))
                );
                
                await Promise.all(deletePromises);

                await deleteUser(user);
                
                alert("Account and data deleted successfully.");
                navigate('/login');

            } catch (error) {
                console.error("Delete Error:", error);
                if (error.code === 'auth/requires-recent-login') {
                    alert("Security Check: Please log out and log back in, then try again.");
                } else {
                    alert("Failed to delete account data.");
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLogout = async () => {
        navigate('/logout');
    };

    const styles = {
        pageWrapper: {
            minHeight: '100vh',
            backgroundColor: 'transparent',
            color: '#e0e0e0',
            fontFamily: '"Space Mono", monospace',
            paddingTop: '40px',
            paddingBottom: '40px'
        },
        card: {
            backgroundColor: '#1e1e2e',
            border: '1px solid #333',
            borderRadius: '12px',
            color: '#fff',
            marginBottom: '20px',
            padding: '20px'
        },
        headerText: { color: 'orange', marginBottom: '10px', fontWeight: 'bold' },
        inputDark: { backgroundColor: '#2a2a3a', border: '1px solid #444', color: 'white' },
        label: { color: '#aaa', fontSize: '0.9rem', marginBottom: '5px' },
        dangerZone: { border: '1px solid #ff4d4d', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '20px', borderRadius: '12px' },
        saveBtn: {
            opacity: isChanged ? 1 : 0.5,
            cursor: isChanged ? 'pointer' : 'not-allowed',
            transition: 'opacity 0.3s ease'
        }
    };

    return (
        <div style={styles.pageWrapper} className='animate-bottom'> 
            <div className="container">
                
                <div className="row mb-4 text-center">
                    <div className="col-12">
                        <h1 className="fw-bold text-white" style={{letterSpacing: '3px'}}>DASHBOARD</h1>
                        <p className="text-secondary">Manage your vault and identity</p>
                    </div>
                </div>

                {statusMsg.text && (
                    <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'} text-center`} role="alert">
                        {statusMsg.text}
                    </div>
                )}

                <div className="row g-4">
                    <div className="col-lg-5 col-md-12">
                        <div style={styles.card} className="text-center shadow-lg">
                            <h3 style={styles.headerText}>📸 Capture Moments</h3>
                            <p className="text-secondary mb-4">Upload photos & videos to your secure vault.</p>
                            <div className="d-grid">
                                <button 
                                    onClick={() => navigate('/create-memory')} 
                                    className="btn btn-lg fw-bold"
                                    style={{backgroundColor: 'orange', color: '#1e1e2e', border:'none'}}
                                >
                                    + CREATE NEW MEMORY
                                </button>
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h5 className="mb-3 text-white">Quick Actions</h5>
                            <div className="d-grid gap-2">
                                <button onClick={() => navigate('/memories')} className="btn btn-outline-light">
                                    📂 View My Gallery
                                </button>
                                <button onClick={handleLogout} className="btn btn-outline-secondary">
                                    🚪 Log Out
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-7 col-md-12">
                        <div style={styles.card}>
                            <h4 className="mb-4 text-white border-bottom border-secondary pb-2">Edit Profile</h4>
                            
                            <form onSubmit={handleUpdateProfile}>
                                <div className="mb-3">
                                    <label style={styles.label}>Email Address</label>
                                    <input type="email" className="form-control" style={{...styles.inputDark, opacity: 0.7}} value={user?.email || ""} disabled />
                                    <div className="form-text text-secondary">Email cannot be changed directly.</div>
                                </div>

                                <div className="mb-4">
                                    <label style={styles.label}>Display Name</label>
                                    <input type="text" className="form-control" style={styles.inputDark} value={displayName}onChange={(e) => setDisplayName(e.target.value)} placeholder="Enter your name"/>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <button type="submit" className="btn btn-primary" disabled={!isChanged || loading} >
                                        {loading ? "Updating..." : "Save Changes"}
                                    </button>

                                    <button type="button" className="btn btn-link text-warning text-decoration-none" onClick={handleResetPassword}>
                                        Reset Password?
                                    </button>
                                </div>
                            </form>

                            <div style={styles.dangerZone} className="mt-5">
                                <h5 className="text-danger fw-bold">⚠️ Danger Zone</h5>
                                <p className="text-secondary small">
                                    Once you delete your account, there is no going back.
                                </p>
                                <button onClick={handleDeleteAccount} className="btn btn-outline-danger btn-sm">
                                    Deactivate Account
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;