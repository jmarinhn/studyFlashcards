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

  return (
    <div {...getRootProps({ className: 'dropzone' })}>
      <input {...getInputProps()} />
      <p>Drop or select a JSON file here</p>
    </div>
  );
};

export default FileDropzone;
