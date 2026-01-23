import React, { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from './fbconfig.jsx';
import { useNavigate } from 'react-router-dom';

const MultiFileUpload = () => {
    const navigate = useNavigate();
    const [memoryName, setMemoryName] = useState(""); 
    
    const CLOUD_NAME = "dvsr6htve";
    const UPLOAD_PRESET = "memory-doc";

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [isUploading, setIsUploading] = useState(false);
    const [allSuccess, setAllSuccess] = useState(false);
    const [notification, setNotification] = useState(null);

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

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const incomingFiles = Array.from(e.target.files);
            let duplicateFound = false;

            const validTypeFiles = incomingFiles.filter(file => 
                file.type.startsWith('image/') || file.type.startsWith('video/')
            );

            const uniqueFiles = validTypeFiles.filter(newFile => {
                const isDuplicate = selectedFiles.some(existingFile => 
                    existingFile.name === newFile.name && existingFile.size === newFile.size
                );
                if (isDuplicate) duplicateFound = true;
                return !isDuplicate;
            });

            if (duplicateFound) {
                setNotification("⚠️ Duplicate file(s) ignored.");
            }

            setSelectedFiles((prev) => [...prev, ...uniqueFiles]);
            setAllSuccess(false);
            setProgressMap({});

            e.target.value = ""; 
        }
    };

    const removeFile = (indexToRemove) => {
        setSelectedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

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
                    resolve(response.secure_url);
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
            const uploadedImageUrls = await Promise.all(
                selectedFiles.map((file) => uploadToCloudinary(file))
            );

            await addDoc(collection(db, "memories"), {
                userId: user.uid,
                title: memoryName,        
                images: uploadedImageUrls, 
                thumbnail: uploadedImageUrls[0], 
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

    const styles = {
        container: { maxWidth: '600px', width: '90%', margin: '40px auto', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', position: 'relative' },
        inputWrapper: { border: '2px dashed #ccc', padding: '30px', textAlign: 'center', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer', backgroundColor: '#fafafa' },
        fileItem: { marginBottom: '10px', background: '#f9f9f9', padding: '10px', borderRadius: '6px', position: 'relative' }, 
        progressBarContainer: { width: '100%', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginTop: '5px', overflow: 'hidden' },
        progressBarFill: (percent) => ({ width: `${percent}%`, height: '100%', backgroundColor: percent === 100 ? '#28a745' : '#007bff', transition: 'width 0.3s ease' }),
        
        button: { fontFamily: '"Space Mono", monospace', width: '100%', padding: '12px', backgroundColor: isUploading ? '#6c757d' : '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontSize: '22px', letterSpacing: '1.2px', cursor: isUploading ? 'not-allowed' : 'pointer', marginTop: '20px' },
        
        successMsg: { marginTop: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '6px', textAlign: 'center' },
        textInput: { width: '100%', color: "black", padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '2px dashed #ccc', boxSizing: 'border-box', background: '#fefefe' },
        
        addMoreBtn: { display: 'inline-block', padding: '8px 16px', backgroundColor: 'orange', color: '#223', fontWeight: '700', letterSpacing: '1.2px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginTop: '10px', textAlign: 'center' },
        
        removeBtn: {
            marginLeft: '10px',
            backgroundColor: '#ff4d4d',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            lineHeight: '24px',
            textAlign: 'center',
            padding: 0
        },

        toast: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#333',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            animation: 'fadeIn 0.5s ease-in-out',
            fontSize: '14px'
        }
    };

    return (
        <div className='animate-bottom' style={styles.container}>
            {notification && (
                <div style={styles.toast}>
                    {notification}
                </div>
            )}

            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create New Memory</h2>

            <input
                type="text"
                placeholder="Memory Name (e.g. My Graduation)"
                value={memoryName}
                onChange={(e) => setMemoryName(e.target.value)}
                style={styles.textInput}
            />

            <input type="file" id='fileInput' multiple accept="image/*, video/*" onChange={handleFileChange} style={{ display: 'none' }} />

            {selectedFiles.length === 0 ? (
                <div style={styles.inputWrapper}>
                    <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'block', color: '#666' }}>
                        Click to Add Photos/Videos
                    </label>
                </div>
            ) : (
                <div style={{ marginBottom: '20px' }}>
                    <p style={{marginBottom: '10px', fontWeight: 'bold'}}>Selected Files ({selectedFiles.length}):</p>
                    
                    {selectedFiles.map((file, index) => (
                        <div key={index} style={styles.fileItem}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                                <span style={{maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                    {file.name}
                                </span>
                                <div style={{display: 'flex', alignItems: 'center'}}>
                                    <span>{progressMap[file.name] || 0}%</span>
                                    {!isUploading && (
                                        <button onClick={() => removeFile(index)} style={styles.removeBtn} title="Remove file">X</button>
                                    )}
                                </div>
                            </div>
                            <div style={styles.progressBarContainer}>
                                <div style={styles.progressBarFill(progressMap[file.name] || 0)}></div>
                            </div>
                        </div>
                    ))}

                    <div style={{ textAlign: 'center' }}>
                        <label htmlFor="fileInput" style={styles.addMoreBtn}>
                            + ADD MORE
                        </label>
                    </div>
                </div>
            )}

            <button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0} style={styles.button}>
                {isUploading ? "UPLOADING..." : "SAVE MEMORY"}
            </button>

            {allSuccess && <div style={styles.successMsg}>Memory Saved Securely !</div>}
        </div>
    );
};

export default MultiFileUpload;