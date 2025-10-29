import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen({ onBarcodeScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ type, data }) => {
    setIsScanned(true);
    if (onBarcodeScanned) {
      onBarcodeScanned({ type, data });
    }
  };
  
  const isPortrait = screenDimensions.height > screenDimensions.width;
  const overlayWidth = isPortrait ? screenDimensions.width * 0.7 : screenDimensions.width * 0.4;
  const overlayHeight = isPortrait ? screenDimensions.height * 0.2 : screenDimensions.height * 0.6;

  const focusedStyle = {
    width: overlayWidth,
    height: overlayHeight,
    borderWidth: 5,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    borderRadius: 10,
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
        facing='back'
        onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code93", "code128"],
        }}
      />

      <View style={styles.overlay}>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          <View style={focusedStyle} />
        </View>
      </View>

      <Text style={styles.overlayText}>Posicione o código de barras no centro da área</Text>
      
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
    // Removido justifyContent e alignItems para permitir a estrutura de flexbox
  },
  middleContainer: {
    // A altura é definida pelo 'focusedStyle' e a largura é flexível
    flexDirection: 'row',
  },
  overlayText: {
    position: 'absolute',
    bottom: '25%',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    alignSelf: 'center', // Garante que o texto fique centralizado
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