import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import './QuestionLibrary.css';

const QuestionLibrary = ({ onSelectJSON, onBack, user }) => {
    const [jsonFiles, setJsonFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [description, setDescription] = useState('');
    const [jsonName, setJsonName] = useState('');

    useEffect(() => {
        // Load JSON list from Firestore
        const q = query(collection(db, 'question_sets'), orderBy('uploadedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const files = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setJsonFiles(files);
        }, (error) => {
            console.error('Error loading question sets:', error);
        });

        return () => unsubscribe();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setUploadError('Please upload a JSON file');
            return;
        }

        if (!jsonName.trim()) {
            setUploadError('Please enter a name for this question set');
            return;
        }

        setUploading(true);
        setUploadError('');

        try {
            // Read and validate JSON
            const text = await file.text();
            const jsonData = JSON.parse(text);
            const questionCount = Object.keys(jsonData).length;

            // Check size (Firestore limit is 1MB per document)
            const sizeInBytes = new Blob([text]).size;
            const sizeInKB = sizeInBytes / 1024;
            if (sizeInKB > 900) { // Leave some margin
                setUploadError(`File too large (${Math.round(sizeInKB)}KB). Maximum is 900KB.`);
                setUploading(false);
                return;
            }

            // Save to Firestore directly
            await addDoc(collection(db, 'question_sets'), {
                name: jsonName,
                description: description || 'No description provided',
                questionCount: questionCount,
                questionData: jsonData, // Store JSON directly in Firestore
                uploadedBy: user.displayName || user.email,
                uploadedById: user.uid,
                uploadedAt: serverTimestamp(),
                sizeKB: Math.round(sizeInKB)
            });

            // Reset form
            setJsonName('');
            setDescription('');
            event.target.value = '';
            alert('Question set uploaded successfully!');
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleUseJSON = (jsonFile) => {
        try {
            onSelectJSON(jsonFile.questionData, jsonFile.name);
        } catch (error) {
            console.error('Error loading JSON:', error);
            alert('Failed to load this question set');
        }
    };

    return (
        <div className="library-container">
            <h1>📚 Question Library</h1>
            <p>Share and use question sets with your team</p>

            <div className="upload-section">
                <h3>Upload New Question Set</h3>
                <input
                    type="text"
                    placeholder="Question set name (e.g., AWS SAA Practice)"
                    value={jsonName}
                    onChange={(e) => setJsonName(e.target.value)}
                    className="name-input"
                />
                <textarea
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="description-input"
                    rows="3"
                />
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="file-input"
                />
                <p className="size-hint">Maximum file size: 900KB</p>
                {uploadError && <div className="error-message">{uploadError}</div>}
                {uploading && <div className="uploading-message">Uploading...</div>}
            </div>

            <div className="json-list">
                <h3>Available Question Sets ({jsonFiles.length})</h3>
                {jsonFiles.length === 0 ? (
                    <p className="no-files">No question sets available yet. Be the first to upload!</p>
                ) : (
                    jsonFiles.map((file) => (
                        <div key={file.id} className="json-card">
                            <div className="json-header">
                                <h4>{file.name}</h4>
                                <span className="question-count">{file.questionCount} questions</span>
                            </div>
                            <p className="json-description">{file.description}</p>
                            <div className="json-footer">
                                <div className="json-meta">
                                    <span className="uploader">By {file.uploadedBy}</span>
                                    {file.sizeKB && <span className="file-size">{file.sizeKB}KB</span>}
                                </div>
                                <button onClick={() => handleUseJSON(file)} className="use-button">
                                    Use This Set →
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button onClick={onBack} className="back-button">← Back to Menu</button>
        </div>
    );
};

export default QuestionLibrary;
