import {
  StyleSheet,
  FlatList,
  Image,
  View,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { use, useEffect, useState } from "react";
import { supabase } from '@/utils/supabase';
import { getAuth, reload } from "firebase/auth";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { labelPatrimonio, patrimonio, Patrimonio } from "@/constants/Patrimonio";
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
import CameraScreen from "@/components/ui/CameraScreen";
import { ScrollableAreaView } from "@/components/layout/ScrollableAreaView";
import { formatAtmNum, formatInputForSearch, formatPatNum } from "@/hooks/formating";

/**
 * Este componente renderiza uma tela para pesquisar e exibir patrimônios pelo número.
 * Ele inclui um campo de busca, um botão e uma lista de patrimônios buscados no Firestore.
 */
export default function listing() {
  // Estado para armazenar o número do patrimônio a ser pesquisado
  const [patNum, setPatNum] = useState("");
  // Estado para armazenar a lista de patrimônios buscados
  const [patrimonioList, setPatrimonioList] = useState<Patrimonio[]>([]);
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

  const user = (supabase.auth.getUser()).data.user;


  useEffect(() => {
    if (isFocused && editado) {
      setPatrimonioList([]);
    }
    if(!scanBool){
      setPatrimonioList([]);
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // useEffect(() => {
  //   if(patNum.length >= 10){
  //     setPatNum(formatInputForSearch(patNum));
  //   }
  // }, [patNum]);

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
    if (await user?.id && patNum !== "") {
      try {
        // Try search by patNum first
        let { data, error } = await supabase
          .from('patrimonios')
          .select('*')
          .eq('patNum', formatPatNum(patNum));
        if (error) throw error;
        if (!data || data.length === 0) {
          const res = await supabase
            .from('patrimonios')
            .select('*')
            .eq('atmNum', formatAtmNum(patNum));
          if (res.error) throw res.error;
          data = res.data;
          if (!data || data.length === 0) {
            Alert.alert('Patrimônio não encontrado.');
            return;
          }
        }

        if (data && data.length > 0) {
          // use first result's id for navigation/edit
          setDocId((data[0] as any).id || '');
          setPatrimonioList(data as Patrimonio[]);
          setPatNum('');
        }

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
        patrimonioId: docId, // Enviamos apenas o ID, que já é uma string.
      },
    });
    setEditado(true);
  };

/**
   * Renderiza um item individual de patrimônio.
   * Cada par de rótulo-dado é uma linha com alinhamento vertical e horizontal garantido.
   * @param item - Dados do patrimônio a serem renderizados
   */
  const renderItem = ({ item }) => (
    <View style={styles.renderContainer}>
      <ThemedView style={styles.patrimonioContainer}>
        {/* Container para a imagem, se existir */}
        {item.image.url !== "" && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image.url }}
              style={{
                height: item.image.height,
                width: item.image.width,
                resizeMode: 'contain',
              }}
            />
          </View>
        )}
        
        {/* Renderiza cada detalhe como uma linha separada */}
        {Object.keys(patrimonio).map((key) =>
          key !== "image" && key !== "lastEditedBy" && key !== "lastEditedAt" ? (
            <View style={styles.detailRow} key={key}>
              <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>
                  {labelPatrimonio[key]}:
                </ThemedText>
              </View>
              <View style={styles.dataContainer}>
                <ThemedText style={styles.data}>{item[key]}</ThemedText>
              </View>
            </View>
          ) : null
        )}

        {/* Linha para a última edição */}
        <View style={styles.detailRow}>
            <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>Última Edição:</ThemedText>
            </View>
            <View style={styles.dataContainer}>
                <ThemedText style={styles.data}>{item.lastEditedBy} - {item.lastEditedAt}</ThemedText>
            </View>
        </View>

        {/* Ícone de edição */}
        <TouchableOpacity style={styles.editButton} onPress={() => editPat()}>
            <Ionicons name="pencil" size={25} color="black" />
            <ThemedText style={{marginLeft: 8}}>Editar</ThemedText>
        </TouchableOpacity>

      </ThemedView>
    </View>
  );

  return scanBool ? (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header da página */}
      <ThemedHeader title="Escanear Patrimonio" arrowBack={() => {setScanBool(false)}}/>
      
      <CameraScreen
        onBarcodeScanned={({ type, data }) => {
          setPatNum(data);
          console.log(`Scanned: ${type} - ${data}`);
          setScanBool(false)
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
          data={patrimonioList}
          renderItem={renderItem}
          keyExtractor={(item) => (item as any).id}
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
  patrimonioContainer: {
    width: "90%",
    backgroundColor: "#7d7d7d",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  // (NOVO) Estilo para cada linha de detalhe (Rótulo + Dado)
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10, // Espaço entre as linhas de detalhes
    width: '100%',
    alignItems: 'flex-start', // << PONTO CHAVE DA CORREÇÃO!
  },
  // (NOVO) Container para o texto do rótulo
  labelContainer: {
    width: '35%', // Define uma largura fixa para a coluna de rótulos
    paddingRight: 10, // Um respiro entre o rótulo e o dado
  },
  // (NOVO) Container para o texto do dado
  dataContainer: {
    width: '65%', // Define uma largura fixa para a coluna de dados
  },
  // Estilo das labels (AJUSTADO)
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
  // Estilo dos dados (AJUSTADO)
  data: {
    fontSize: 16,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#c7c7c7',
    borderRadius: 8,
    width: '100%',
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