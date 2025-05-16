import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

const { width } = Dimensions.get("window");
const FRAME_WIDTH = width * 0.5;
const FRAME_HEIGHT = FRAME_WIDTH * 0.5;
const CORNER_SIZE = 60;
const BORDER_WIDTH = 15;

export function CameraScreen({ onBarcodeScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleScanned = ({ data, type }) => {
    if (!scanned) {
      setScanned(true);
      onBarcodeScanned?.({ data, type });
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission || !permission.granted) {
    return <Text>Camera permission is required</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={handleScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "code128",
            "code39",
            "ean13",
            "ean8",
            "upc_a",
            "upc_e",
          ],
        }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          {/* Corner lines */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanArea: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: "relative",
  },
  corner: {
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    position: "absolute",
    borderColor: "#FFFFFF",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
  },
  instruction: {
    color: "#fff",
    marginTop: 24,
    fontSize: 16,
    fontWeight: "bold",
  },
});
