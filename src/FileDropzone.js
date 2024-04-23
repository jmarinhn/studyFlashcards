import React from 'react';
import { useDropzone } from 'react-dropzone';
import './FileDropzone.css';

const FileDropzone = ({ onFileAccepted }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: 'application/json',
    onDropAccepted: (files) => {
      onFileAccepted(files[0]);
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileAccepted(file);
    }
  };

  console.log("Waiting for file...");
  
  return (
    <div {...getRootProps({ className: 'dropzone' })}>
      <input {...getInputProps()} onChange={handleFileChange}/>
      <p>Drop or select a JSON file here</p>
    </div>
  );
};

export default FileDropzone;
