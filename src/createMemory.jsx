import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from './fbconfig.jsx';
import { useNavigate } from 'react-router-dom';

const MultiFileUpload = () => {
    const navigate = useNavigate();
    const [memoryName, setMemoryName] = useState(""); 
    
    // --- CONFIGURATION ---
    const CLOUD_NAME = "dvsr6htve";
    const UPLOAD_PRESET = "memory-doc";

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [allSuccess, setAllSuccess] = useState(false);

    const db = getFirestore(app);
    const auth = getAuth(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                alert("Please login first.");
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate, auth]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
            setAllSuccess(false);
            setProgressMap({});
        }
    };

    // Helper to upload one file
    const uploadToCloudinary = (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
            xhr.open("POST", url, true);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setProgressMap((prev) => ({ ...prev, [file.name]: percent }));
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response.secure_url); // We just return the URL
                } else {
                    reject("Upload failed");
                }
            };
            xhr.onerror = () => reject("Network Error");
            xhr.send(formData);
        });
    };

    const handleUpload = async () => {
        const user = auth.currentUser;
        if (!user) return;
        if (selectedFiles.length === 0) { alert("Select files first."); return; }
        if (!memoryName.trim()) { alert("Please enter a memory name."); return; }

        setIsUploading(true);
        setAllSuccess(false);

        try {
            // 1. Upload ALL files and wait for them to finish
            // This returns an array like: ["https://res.cloudinary...", "https://res.cloudinary..."]
            const uploadedImageUrls = await Promise.all(
                selectedFiles.map((file) => uploadToCloudinary(file))
            );

            // 2. Create ONE Document for the whole group
            await addDoc(collection(db, "memories"), {
                userId: user.uid,
                title: memoryName,        // "Paris Trip"
                images: uploadedImageUrls, // The Array of all links!
                thumbnail: uploadedImageUrls[0], // Use the first image as a cover photo
                createdAt: new Date().toISOString(),
                fileCount: uploadedImageUrls.length
            });

            setAllSuccess(true);
            setSelectedFiles([]);
            setMemoryName("");
            setProgressMap({});

        } catch (error) {
            console.error("Error:", error);
            alert("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // --- Styles ---
    const styles = {
        container: { maxWidth: '600px', width: '90%', margin: '40px auto', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif' },
        inputWrapper: { border: '2px dashed #ccc', padding: '30px', textAlign: 'center', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer' },
        fileItem: { marginBottom: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '6px' },
        progressBarContainer: { width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' },
        progressBarFill: (percent) => ({ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? '#28a745' : '#007bff', transition: 'width 0.3s ease' }),
        button: { width: '100%', padding: '12px', backgroundColor: isUploading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', cursor: isUploading ? 'not-allowed' : 'pointer', marginTop: '20px' },
        successMsg: { marginTop: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '6px', textAlign: 'center' },
        textInput: { width: '100%', color: "black", padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '2px dashed #ccc', boxSizing: 'border-box', background: '#fefefe' }
    };

    return (
        <div style={styles.container}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create New Memory</h2>

            <input
                type="text"
                placeholder="Memory Name (e.g. My Graduation)"
                value={memoryName}
                onChange={(e) => setMemoryName(e.target.value)}
                style={styles.textInput}
            />

            <div style={styles.inputWrapper}>
                <input type="file" id='fileInput' multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'block', color: '#666' }}>
                    {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : "Click to Add Photos/Videos"}
                </label>
            </div>

            {selectedFiles.map((file, index) => (
                <div key={index} style={styles.fileItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span>{file.name}</span>
                        <span>{progressMap[file.name] || 0}%</span>
                    </div>
                    <div style={styles.progressBarContainer}>
                        <div style={styles.progressBarFill(progressMap[file.name] || 0)}></div>
                    </div>
                </div>
            ))}

            <button onClick={handleUpload} disabled={isUploading} style={styles.button}>
                {isUploading ? "Uploading..." : "Save Memory"}
            </button>

            {allSuccess && <div style={styles.successMsg}>Memory Saved Securely !</div>}
        </div>
    );
};

export default MultiFileUpload;