import {
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
  View,
  Alert,
  TouchableOpacity,
} from "react-native";
import React, { use, useEffect, useState } from "react";
import { db } from "@/FirebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth, reload } from "firebase/auth";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { patrimonio, Patrimonio } from "@/constants/Patrimonio";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  Camera,
} from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedHeader } from "@/components/ui/ThemedHeader";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { CameraScreen } from "@/components/ui/CameraScreen";
import { getImageUrl } from "@/hooks/ImageHandler";

/**
 * Este componente renderiza uma tela para pesquisar e exibir patrimônios pelo número.
 * Ele inclui um campo de busca, um botão e uma lista de patrimônios buscados no Firestore.
 */
export default function listing() {
  // Estado para armazenar o número do patrimônio a ser pesquisado
  const [patNum, setPatNum] = useState("");
  // Estado para armazenar a lista de patrimônios buscados
  const [patrimonioList, setPatrimonioList] = useState<Patrimonio>(patrimonio);
  // Váriavel boleana que define se o scan está ativado ou não
  const [scanBool, setScanBool] = useState(false);
  // ID do documento pesquisado
  const [docId, setDocId] = useState("");
  //Verifica se um patrimonio foi editado
  const [editado, setEditado] = useState(false);
  //Imagem do patrimonio
  const [image, setImage] = useState<any>();
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const patrimonioCollection = collection(db, "patrimonios");

  useEffect(() => {
    if (isFocused && editado) {
      setPatrimonioList(patrimonio);
    }
    if(!scanBool){
      setPatrimonioList(patrimonio);
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    if(patrimonioList.image.ref){
      setImage(getImageUrl(patrimonioList.image.ref));
    }
  }, [patrimonioList]);

  if (hasPermission === null) {
    return <ThemedText>Requesting camera permissions...</ThemedText>;
  }
  
  if (hasPermission === false) {
    return <ThemedText>No access to camera</ThemedText>;
  }

  /**
   * Busca patrimônios no Firestore que correspondem ao número digitado.
   * Limpa o campo de entrada após a busca.
   */
  const fetchPatrimonio = async () => {
    if (user && patNum !== "") {
      try {
        const q = query(patrimonioCollection, where("patNum", "==", patNum));
        const data = await getDocs(q);
        if (data.empty) {
          Alert.alert("Nenhum patrimônio encontrado.");
          return;
        }
        data.forEach((doc) => {
          setDocId(doc.id);
        });
        let patrimonioData = data.docs[0].data() as Patrimonio;
        setPatrimonioList(patrimonioData);
        setPatNum("");
      } catch (error) {
        console.error("Erro ao buscar patrimônios: ", error);
      }
    } else {
      patNum === ""
        ? Alert.alert("Numero de Patrimonio deve ter valor.")
        : console.log("Nenhum usuário logado");
    }
  };

  const editPat = () => {
    router.push({
      pathname: "/managePat",
      params: {
        mode: "edit",
        patrimonioParam: JSON.stringify(patrimonioList),
        patrimonioId: JSON.stringify(docId),
      },
    });
    setEditado(true);
  };

  /**
   * Renderiza um item individual de patrimônio na lista.
   * Mapeia dinamicamente as propriedades de um patrimônio.
   * @param item - Dados do patrimônio a serem renderizados
   */
  const renderItem = ({ item }) => (
    <View style={styles.renderContainer}>
      <ThemedView style={styles.patrimonioContainer}>
        <View style={styles.row}>
          <Image
            source={{ uri: item.image.url }}
            style={{ height: item.image.height, width: item.image.width }}
          />
        </View>
        {Object.keys(patrimonio).map((key) =>
          key !== "image" && key !== "email" ? (
            <View style={styles.row} key={key}>
              <ThemedText style={styles.label}>
                {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
              </ThemedText>
              <ThemedText style={styles.data}> {item[key]} </ThemedText>
            </View>
          ) : null
        )}
        <View style={styles.row}>
          <ThemedText style={styles.label}>Último Editor</ThemedText>
          <ThemedText style={styles.data}>{item.email}</ThemedText>
          <Ionicons
            name="pencil"
            size={25}
            onPress={() => editPat()}
            color="black"
          />
        </View>
      </ThemedView>
    </View>
  );

  return scanBool ? (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header da página */}
      <ThemedHeader title="Escanear Patrimonio" arrowBack={() => {setScanBool(false)}}/>
      
      <CameraScreen
        onBarcodeScanned={({ type, data }) => {
          console.log(`Scanned: ${type} - ${data}`);
        }}
      />
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.safeArea}>
        {/* Header da página */}
        <ThemedHeader title="Pesquisar Patrimonio" arrowBack={() => {router.back()}}/>

        {/* Input do número de patrimonio */}
        <ThemedView style={styles.row}>
          <ThemedTextInput
            placeholder="Número do Patrimônio"
            value={patNum}
            onChangeText={(themedText) => setPatNum(themedText)}
            style={styles.input}
          />

          <ThemedButton  onPress={fetchPatrimonio}>
            <ThemedText type="defaultSemiBold">Pesquisar</ThemedText>
          </ThemedButton>
        </ThemedView>

        {/* Botão de escanear */}
        <ThemedButton
          
          onPress={() => {
            setScanBool(true);
          }}
        >
          <ThemedText type="defaultSemiBold">Escanear</ThemedText>
        </ThemedButton>

        {/* Listagem do patrimonio */}
        <FlatList
          data={[patrimonioList]}
          renderItem={renderItem}
          keyExtractor={(item) => docId}
          contentContainerStyle={styles.listContainer}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Estilo geral da área segura
  safeArea: {
    flex: 1,
  },
  // Estilo das linhas dentro do contêiner do patrimônio
  row: {
    flexDirection: "row",
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  // Estilo do campo de entrada
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  // Estilo do botão de pesquisa
  searchButton: {
    marginRight: 20,
    marginLeft: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  // Estilo do botão de scannear
  scanButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  // Estilo do contêiner da lista
  listContainer: {
    marginTop: 20,
    width: "100%",
  },
  // Estilo do contêiner de cada patrimônio
  patrimonioContainer: {
    flex: 1,
    width: "80%",
    alignItems: "center",
    backgroundColor: "#7d7d7d",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  // Estilo das labels nos detalhes do patrimônio
  label: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  // Estilo dos textos dos dados do patrimônio
  data: {
    fontSize: 16,
    flex: 2,
  },
  renderContainer: {
    flex: 1,
    alignItems: "center",
  },
  scanningIndicator: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 10,
  },
  scanningText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanningFrame: {
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
});
