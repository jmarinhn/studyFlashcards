import React, { useState } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';

const UploadJson = ({ onFileSelected }) => {
  const [fileName, setFileName] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelected(file);
    }
  };

  return (
    <div>
      <input type="file" accept="application/json" onChange={handleFileChange} />
      {fileName && <p>Uploaded: {fileName}</p>}
    </div>
  );
  
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default UploadJson;
