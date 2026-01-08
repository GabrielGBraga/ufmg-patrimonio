import {
  StyleSheet,
  FlatList,
  View,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Image } from 'expo-image';
import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { labelPatrimonio, patrimonio, Patrimonio } from "@/constants/Patrimonio";
import {
  Camera,
} from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedHeader } from "@/components/ui/ThemedHeader";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import CameraScreen from "@/components/ui/CameraScreen";
import { formatAtmNum, formatInputForSearch, formatPatNum } from "@/hooks/formating";
import { supabase } from "@/utils/supabase";

export default function listing() {
  const [search, setSearch] = useState("");
  const [patrimonioList, setPatrimonioList] = useState<Patrimonio[]>([]);
  const [scanBool, setScanBool] = useState(false);
  const [docId, setDocId] = useState("");
  const [editado, setEditado] = useState(false);
  const [image, setImage] = useState<any>();
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);


  const searchTypes = Object.entries(labelPatrimonio)
    .filter(([key, content]) => {
      // 1. Primeiro garantimos que é uma string (isso já elimina o objeto 'image' e números)
      // 2. Depois garantimos que a string não está vazia (elimina 'lastEditedBy')
      return typeof content === 'string' && content.length > 0;
    })
    .map(([key, label]) => ({
      label: label as string, 
      value: key,
    }));

  const [filter, setFilter] = useState<string>(searchTypes[0].value);

  const user = async () => {
    return (await supabase.auth.getUser()).data.user;
  }
  
  useEffect(() => {
    if (isFocused && editado) {
      setPatrimonioList([]);
      setEditado(false); 
    }
    if(!scanBool){
       // Lógica opcional
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  useEffect(() => {
    const getUrl = async () => {
      if (patrimonioList[0]?.image.fileName) {
        const { data, error } = await supabase
          .storage  
          .from('images')  
          .createSignedUrl(patrimonioList[0].image.fileName, 60)
        if (error) return console.error("Error fetching image URL: ", error);
        if (data?.signedUrl) {
          setImage(data.signedUrl);
        }
      }
    };
    getUrl();
  }, [patrimonioList[0]?.image.fileName]);

  if (hasPermission === null) {
    return <ThemedText>Requesting camera permissions...</ThemedText>;
  }
  
  if (hasPermission === false) {
    return <ThemedText>No access to camera</ThemedText>;
  }

  const fetchPatrimonio = async () => {
    if ((await user()) && search !== "") {
      try {
        let fetchedData : any[];

        let formatSearch = search;
        if (filter === "patNum" || filter === "atmNum") {
          formatSearch = formatInputForSearch(search);
        }
        
        const { data, error } = await supabase
          .from('patrimonios')
          .select()
          .eq(filter, formatSearch)

        console.log("Filtro de busca: ", filter);
        console.log("Valor de busca: ", formatSearch);
        console.log("Resultado da busca: ", data);
          
        if (error) return console.error("Erro ao buscar patrimônio: ", error);
        fetchedData = data;

        if (fetchedData.length === 0) {
          return Alert.alert("Patrimônio não encontrado.");
        }

        if (fetchedData && fetchedData.length > 0) {
          const { id, ...patrimonioData } = fetchedData[0];
          setDocId(id);
          setPatrimonioList([patrimonioData as Patrimonio]);
        }
      } catch (error) {
        console.error("Erro ao buscar patrimônios: ", error);
      }
    } else {
      search === ""
        ? Alert.alert("Numero de Patrimonio deve ter valor.")
        : console.log("Nenhum usuário logado");
    }
  };

  const editPat = () => {
    router.push({
      pathname: "/modalManagePat", 
      params: {
        mode: "edit",
        id: docId, 
      },
    });
    setEditado(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.renderContainer}>
      <ThemedView style={styles.patrimonioContainer}>
        {item.image.fileName !== "" && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: image }}
              style={{
                height: item.image.height,
                width: item.image.width,
                resizeMode: 'contain',
              }}
              contentFit="contain"
              transition={300} 
            />
          </View>
        )}
        
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

        <View style={styles.detailRow}>
            <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>Última Edição:</ThemedText>
            </View>
            <View style={styles.dataContainer}>
                <ThemedText style={styles.data}>{item.lastEditedBy} - {item.lastEditedAt}</ThemedText>
            </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={() => editPat()}>
            <Ionicons name="pencil" size={25} color="black" />
            <ThemedText style={{marginLeft: 8}}>Editar</ThemedText>
        </TouchableOpacity>

      </ThemedView>
    </View>
  );

  return scanBool ? (
    // Quando está na câmera, geralmente queremos a SafeArea total ou controlada pelo header
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Escanear Patrimonio" onPressIcon={() => {setScanBool(false)}} variant="back"/>
      <CameraScreen
        onBarcodeScanned={({ type, data }) => {
          setSearch(data);
          console.log(`Scanned: ${type} - ${data}`);
          setScanBool(false)
        }}
      />
    </ThemedView>
  ) : (
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Pesquisar Patrimonio" onPressIcon={() => router.push('/settings')}/>

      <ThemedView style={styles.row}>
        <ThemedTextInput
          placeholder="Digite a pesquisa aqui..."
          value={search}
          onChangeText={(themedText) => setSearch(themedText)}
          style={styles.input}

          filterData={searchTypes}
          filterValue={filter}
          onFilterChange={(item) => setFilter(item.value)}

          iconName="magnify"
          onIconPress={fetchPatrimonio}
        />
      </ThemedView>

      <ThemedButton
        onPress={() => {
          setScanBool(true);
        }}
      >
        <ThemedText type="defaultSemiBold">Escanear</ThemedText>
      </ThemedButton>

      <FlatList
        data={patrimonioList}
        renderItem={renderItem}
        keyExtractor={(item) => docId}
        contentContainerStyle={styles.listContainer}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 5,
  },
  row: {
    flexDirection: "row",
    margin: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchButton: {
    margin: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  scanButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  listContainer: {
    marginTop: 20,
    width: "100%",
    paddingBottom: 20, // Adicionei um paddingBottom extra para o último item não ficar colado
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
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10, 
    width: '100%',
    alignItems: 'flex-start',
  },
  labelContainer: {
    width: '35%', 
    paddingRight: 10,
  },
  dataContainer: {
    width: '65%', 
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
  },
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