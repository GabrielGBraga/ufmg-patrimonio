import {
  StyleSheet,
  FlatList,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator, // <--- 1. Import Added
} from "react-native";
import { Image } from 'expo-image';
import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { labelPatrimonio, patrimonio } from "@/constants/Patrimonio";
import { Camera } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedHeader } from "@/components/ui/ThemedHeader";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import CameraScreen from "@/components/ui/CameraScreen";
import { formatInputForSearch } from "@/hooks/formating";
import { supabase } from "@/utils/supabase";

// --- SUB-COMPONENTE: Para gerenciar a imagem de CADA item individualmente ---
const PatrimonioCard = ({ item, onEdit }: { item: any, onEdit: (id: string) => void }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // <--- 2. Loading State

  useEffect(() => {
    let isActive = true; 
    
    const getUrl = async () => {
      // Only start loading if there is a file to fetch
      if (item.image?.fileName) {
        setIsLoading(true); // <--- Start Loading

        const { data, error } = await supabase
          .storage
          .from('images')
          .createSignedUrl(item.image.fileName, 60);
          
        if (isActive) {
          if (error) {
            console.error("Error fetching image URL: ", error);
          } else if (data?.signedUrl) {
            setImageUrl(data.signedUrl);
          }
          setIsLoading(false); // <--- Stop Loading (Success or Error)
        }
      }
    };

    getUrl();
    return () => { isActive = false; };
  }, [item.image?.fileName]);

  return (
    <View style={styles.renderContainer}>
      <ThemedView style={styles.patrimonioContainer}>
        
        {/* --- 3. Image / Loading Logic --- */}
        <View style={styles.imageContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginVertical: 20 }} />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                height: item.image?.height || 200,
                width: item.image?.width || 200,
                resizeMode: 'contain',
              }}
              contentFit="contain"
              transition={300}
            />
          ) : null}
        </View>

        {Object.keys(patrimonio).map((key) =>
          key !== "image" && key !== "lastEditedBy" && key !== "lastEditedAt" ? (
            <View style={styles.detailRow} key={key}>
              <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>
                  {labelPatrimonio[key as keyof typeof labelPatrimonio] as string}:
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

        <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item.id)}>
          <Ionicons name="pencil" size={25} color="black" />
          <ThemedText style={{ marginLeft: 8 }}>Editar</ThemedText>
        </TouchableOpacity>

      </ThemedView>
    </View>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function listing() {
  const [search, setSearch] = useState("");
  const [patrimonioList, setPatrimonioList] = useState<any[]>([]);
  const [scanBool, setScanBool] = useState(false);
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const searchTypes = Object.entries(labelPatrimonio)
    .filter(([key, content]) => {
      return typeof content === 'string' && content.length > 0;
    })
    .map(([key, label]) => ({
      label: label as string,
      value: key,
    }));

  const [filter, setFilter] = useState<string>(searchTypes[0].value);

  const user = async () => {
    return (await supabase.auth.getUser()).data.user;
  };

  useEffect(() => {
    if (isFocused) {
      // Optional refresh logic
    }
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  if (hasPermission === null) {
    return <ThemedText>Requesting camera permissions...</ThemedText>;
  }

  if (hasPermission === false) {
    return <ThemedText>No access to camera</ThemedText>;
  }

  const fetchPatrimonio = async () => {
    if ((await user()) && search !== "") {
      try {
        let fetchedData: any[];
        let formatSearch = search;

        if (filter === "patNum" || filter === "atmNum") {
          formatSearch = formatInputForSearch(search);
        }

        const { data, error } = await supabase
          .from('patrimonios')
          .select()
          .ilike(filter, `%${formatSearch}%`);

        console.log("Filtro de busca: ", filter);
        console.log("Valor de busca (formatted): ", formatSearch);
        
        if (error) return console.error("Erro ao buscar patrimônio: ", error);
        
        fetchedData = data || [];

        if (fetchedData.length === 0) {
          setPatrimonioList([]);
          return Alert.alert("Nenhum patrimônio encontrado.");
        }

        setPatrimonioList(fetchedData);
        
      } catch (error) {
        console.error("Erro ao buscar patrimônios: ", error);
      }
    } else {
      search === ""
        ? Alert.alert("O campo de pesquisa deve ter valor.")
        : console.log("Nenhum usuário logado");
    }
  };

  const editPat = (id: string) => {
    router.push({
      pathname: "/modalManagePat",
      params: {
        mode: "edit",
        id: id,
      },
    });
  };

  return scanBool ? (
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Escanear Patrimonio" onPressIcon={() => { setScanBool(false) }} variant="back" />
      <CameraScreen
        onBarcodeScanned={({ type, data }) => {
          setSearch(data);
          setScanBool(false);
        }}
      />
    </ThemedView>
  ) : (
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Pesquisar Patrimonio" onPressIcon={() => router.push('/settings')} />

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
        renderItem={({ item }) => <PatrimonioCard item={item} onEdit={editPat} />}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <ThemedText style={{textAlign: 'center', marginTop: 20, opacity: 0.5}}>
            Nenhum resultado para exibir
          </ThemedText>
        }
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
  listContainer: {
    marginTop: 20,
    width: "100%",
    paddingBottom: 40,
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
    minHeight: 50, // Added minHeight so the loader doesn't collapse the view
    justifyContent: 'center',
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
});