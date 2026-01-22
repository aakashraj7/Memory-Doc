import React, { useState, useEffect } from 'react';
import { 
    getFirestore, collection, query, where, getDocs, 
    doc, deleteDoc, updateDoc, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from './fbconfig.jsx';
import { useNavigate } from 'react-router-dom';

const MemoryGallery = () => {
    const navigate = useNavigate();
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 

    const db = getFirestore(app);
    const auth = getAuth(app);

    const CLOUD_NAME = "dvsr6htve";
    const UPLOAD_PRESET = "memory-doc";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await fetchMemories(user.uid);
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchMemories = async (userId) => {
        try {
            const q = query(collection(db, "memories"), where("userId", "==", userId));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setMemories(data);
        } catch (error) {
            console.error("Error fetching memories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMemory = async (memoryId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this ENTIRE memory?");
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "memories", memoryId));
                setMemories(prev => prev.filter(mem => mem.id !== memoryId));
            } catch (error) {
                alert("Failed to delete memory.");
            }
        }
    };

    const handleDeleteSingleMedia = async (memoryId, mediaUrl) => {
        const confirm = window.confirm("Remove this specific file?");
        if (!confirm) return;

        try {
            const memoryRef = doc(db, "memories", memoryId);
            await updateDoc(memoryRef, { images: arrayRemove(mediaUrl) });

            setMemories(prev => prev.map(mem => {
                if (mem.id === memoryId) {
                    return { 
                        ...mem, 
                        images: mem.images.filter(img => img !== mediaUrl) 
                    };
                }
                return mem;
            }));

        } catch (error) {
            console.error("Error removing file:", error);
            alert("Could not remove file.");
        }
    };

    const uploadToCloudinary = (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
            xhr.open("POST", url, true);
            xhr.onload = () => {
                if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
                else reject("Upload failed");
            };
            xhr.onerror = () => reject("Network Error");
            xhr.send(formData);
        });
    };

    const handleAddMore = async (e, memoryId) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploadingId(memoryId); 

        try {
            const newFiles = Array.from(files);
            const newImageUrls = await Promise.all(newFiles.map(file => uploadToCloudinary(file)));
            
            const memoryRef = doc(db, "memories", memoryId);
            await updateDoc(memoryRef, { images: arrayUnion(...newImageUrls) });

            setMemories(prev => prev.map(mem => {
                if (mem.id === memoryId) {
                    return { ...mem, images: [...mem.images, ...newImageUrls] };
                }
                return mem;
            }));
            alert("Files added!");
        } catch (error) {
            alert("Failed to upload new files.");
        } finally {
            setUploadingId(null); 
        }
    };

    const isVideo = (url) => {
        if (!url) return false;
        return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("/video/upload/");
    };

    const styles = {
        pageContainer: { minHeight: '100vh', backgroundColor: 'transparent', color: '#e0e0e0', fontFamily: 'Arial, sans-serif', padding: '20px' },
        header: { textAlign: 'center', marginBottom: '40px', color: '#fff', fontSize: '2rem', letterSpacing: '2px' },
        
        memoryCard: { 
            backgroundColor: '#1e1e2e', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '30px', 
            border: '1px solid #333',
            position: 'relative' 
        },
        
        cardHeader: { 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' 
        },
        
        memoryTitle: { fontSize: '1.5rem', color: 'orange', fontWeight: 'bold', margin: 0 },
        dateText: { fontSize: '0.8rem', color: '#aaa', display: 'block' },
        
        // --- 1. UPDATED GRID STYLE ---
        imageGrid: { 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '10px',
            gridAutoFlow: 'dense' // This fills empty gaps if videos take 2 slots
        },
        
        mediaWrapper: { position: 'relative', width: '100%', height: '100%' }, // Changed height to 100% to fill grid slot

        // --- 2. UPDATED ITEM STYLE ---
        mediaItem: { 
            width: '100%', 
            height: '120px', 
            objectFit: 'cover', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            backgroundColor: '#000',
            display: 'block' // Removes tiny bottom gap
        },
        
        removeSingleBtn: {
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            zIndex: 10 // Ensure it sits on top
        },

        footerActions: { marginTop: '15px', display: 'flex', gap: '10px', paddingTop: '10px', borderTop: '1px solid #444' },
        addBtn: { backgroundColor: '#28a745', color: '#fff', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'inline-block', fontWeight: 'bold' },
        deleteBtn: { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
    };

    if (loading) return <h2 className='animate-bottom' style={{textAlign:'center', color:'white'}}>Loading...</h2>;

    return (
        <div style={styles.pageContainer}>
            <h1 className='animate-bottom' style={styles.header}>MEMORY VAULT</h1>

            {memories.length === 0 ? (
                <div className='animate-bottom' style={{textAlign: 'center', color: '#888'}}><h3>No memories found.</h3></div>
            ) : (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {memories.map((memory) => (
                        <div className='animate-bottom' key={memory.id} style={styles.memoryCard}>
                            
                            <div style={styles.cardHeader}>
                                <div>
                                    <div style={styles.memoryTitle}>{memory.title}</div>
                                    <span style={styles.dateText}>{new Date(memory.createdAt).toLocaleDateString()}</span>
                                </div>
                                <button style={styles.deleteBtn} onClick={() => handleDeleteMemory(memory.id)}>
                                    DELETE MEMORY 🗑️
                                </button>
                            </div>

                            <div style={styles.imageGrid}>
                                {memory.images && memory.images.map((mediaUrl, index) => {
                                    const isVid = isVideo(mediaUrl);
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            style={{
                                                ...styles.mediaWrapper,
                                                // --- 3. VIDEO WIDTH LOGIC ---
                                                // If it's a video, span 2 columns. If photo, span 1.
                                                gridColumn: isVid ? 'span 2' : 'auto' 
                                            }}
                                        >
                                            {isVid ? (
                                                <video 
                                                    src={mediaUrl} 
                                                    style={styles.mediaItem}
                                                    // --- 4. CLICK TO OPEN LOGIC ---
                                                    onClick={() => window.open(mediaUrl, '_blank')}
                                                    // Removed 'controls' so clicking anywhere on the video opens it
                                                    title="Click to watch video"
                                                />
                                            ) : (
                                                <img 
                                                    src={mediaUrl} 
                                                    style={styles.mediaItem} 
                                                    onClick={() => window.open(mediaUrl, '_blank')} 
                                                    alt="memory"
                                                />
                                            )}

                                            <button 
                                                style={styles.removeSingleBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    handleDeleteSingleMedia(memory.id, mediaUrl);
                                                }}
                                                title="Remove this file"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={styles.footerActions}>
                                <input 
                                    type="file" 
                                    id={`add-file-${memory.id}`} 
                                    multiple 
                                    accept="image/*, video/*" 
                                    style={{display: 'none'}}
                                    onChange={(e) => handleAddMore(e, memory.id)}
                                />
                                <label htmlFor={`add-file-${memory.id}`} style={styles.addBtn}>
                                    {uploadingId === memory.id ? "Uploading..." : "+ ADD FILES"}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemoryGallery;