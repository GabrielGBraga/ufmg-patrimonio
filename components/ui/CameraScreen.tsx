import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height} = Dimensions.get('window');
const overlayWidth = width * 0.5;
const overlayHeight = height * 0.4;

export default function CameraScreen({ onBarcodeScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // A função agora recebe { type, data } diretamente, como esperado pela CameraView
  const handleBarCodeScanned = ({ type, data }) => {
    setIsScanned(true);
    if (onBarcodeScanned) {
      onBarcodeScanned({ type, data });
    }
  };

  if (!permission) {
    return <Text style={styles.permissionText}>Verificando permissão da câmera...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Sem acesso à câmera. Por favor, permita o acesso nas configurações do seu dispositivo.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}>
          <View style={styles.unfocused} />
          <View style={styles.middleContainer}>
            <View style={styles.unfocused} />
            <View style={styles.focused} />
            <View style={styles.unfocused} />
          </View>
          <View style={styles.unfocused} />
        </View>
        <Text style={styles.overlayText}>Posicione o código de barras no centro da área</Text>
      </View>

      {isScanned && (
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => setIsScanned(false)}>
          <Text style={styles.scanAgainText}>Escanear Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  permissionButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unfocusedContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  unfocused: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  middleContainer: {
    flexDirection: 'row',
  },
  focused: {
    width: overlayWidth,
    height: overlayHeight,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  overlayText: {
    color: '#fff',
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});