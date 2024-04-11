import React, { useState } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const UploadJson = ({ onFileSelected }) => {
  const [fileName, setFileName] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.json],
      });
      setFileName(result.name);
      onFileSelected(result.uri);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User canceled the picker');
      } else {
        throw err;
      }
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Upload JSON File" onPress={pickDocument} />
      {fileName ? <Text>Uploaded: {fileName}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default UploadJson;
