import {
  StyleSheet,
  FlatList,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions, // <--- 1. Import this hook
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

// --- SUB-COMPONENTE ---
const PatrimonioCard = ({ item, onEdit }: { item: any, onEdit: (id: string) => void }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true; 
    const getUrl = async () => {
      if (item.image?.fileName) {
        setIsLoading(true);
        const { data, error } = await supabase
          .storage
          .from('images')
          .createSignedUrl(item.image.fileName, 60);
          
        if (isActive) {
          if (error) console.error("Error fetching image URL: ", error);
          else if (data?.signedUrl) setImageUrl(data.signedUrl);
          setIsLoading(false);
        }
      }
    };
    getUrl();
    return () => { isActive = false; };
  }, [item.image?.fileName]);

  return (
    <ThemedView style={styles.patrimonioContainer}>
      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
        nestedScrollEnabled={true}
      >
        <View style={styles.imageContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#ffffff" style={{ marginVertical: 20 }} />
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                height: item.image?.height || 200,
                width: '100%',
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
      </ScrollView>
    </ThemedView>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function listing() {
  const [search, setSearch] = useState("");
  const [patrimonioList, setPatrimonioList] = useState<any[]>([]);
  const [scanBool, setScanBool] = useState(false);
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // --- 2. Dynamic Dimensions Calculation ---
  const { width } = useWindowDimensions(); 
  
  // Calculate sizes based on the CURRENT width (rotates automatically)
  const CARD_WIDTH = width * 0.85; 
  const CARD_MARGIN = 10;
  const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2); 
  const SIDE_SPACING = (width - CARD_WIDTH) / 2 - CARD_MARGIN;

  const searchTypes = Object.entries(labelPatrimonio)
    .filter(([key, content]) => typeof content === 'string' && content.length > 0)
    .map(([key, label]) => ({ label: label as string, value: key }));

  const [filter, setFilter] = useState<string>(searchTypes[0].value);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const fetchPatrimonio = async () => {
    if ((await supabase.auth.getUser()).data.user && search !== "") {
      try {
        let formatSearch = search;
        if (filter === "patNum" || filter === "atmNum") {
          formatSearch = formatInputForSearch(search);
        }
        const { data, error } = await supabase
          .from('patrimonios')
          .select()
          .ilike(filter, `%${formatSearch}%`);
        
        if (error) return console.error("Erro: ", error);
        
        const fetchedData = data || [];
        if (fetchedData.length === 0) {
          setPatrimonioList([]);
          return Alert.alert("Nenhum patrimônio encontrado.");
        }
        setPatrimonioList(fetchedData);
      } catch (error) {
        console.error("Erro: ", error);
      }
    } else {
      search === "" ? Alert.alert("Digite um valor.") : null;
    }
  };

  const editPat = (id: string) => {
    router.push({ pathname: "/modalManagePat", params: { mode: "edit", id: id } });
  };

  if (hasPermission === null) return <ThemedText>Requesting permissions...</ThemedText>;
  if (hasPermission === false) return <ThemedText>No access to camera</ThemedText>;

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

      <View style={{ flexShrink: 0 }}> 
        <ThemedView style={styles.row}>
          <ThemedTextInput
            placeholder="Digite a pesquisa aqui..."
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            filterData={searchTypes}
            filterValue={filter}
            onFilterChange={(item) => setFilter(item.value)}
            iconName="magnify"
            onIconPress={fetchPatrimonio}
          />
        </ThemedView>

        <ThemedButton onPress={() => setScanBool(true)}>
          <ThemedText type="defaultSemiBold">Escanear</ThemedText>
        </ThemedButton>
      </View>

      <FlatList
        data={patrimonioList}
        renderItem={({ item }) => (
          // --- 3. Dynamic Styling Wrapper ---
          // We apply the width dynamically here instead of in StyleSheet
          <View style={[
            styles.renderContainer, 
            { width: CARD_WIDTH, marginHorizontal: CARD_MARGIN } 
          ]}>
            <PatrimonioCard item={item} onEdit={editPat} />
          </View>
        )}
        keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        
        // Dynamic Spacing Logic
        contentContainerStyle={{
          paddingHorizontal: SIDE_SPACING,
          paddingBottom: 20,
          marginTop: 10,
        }}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="center"
        decelerationRate="fast"
        pagingEnabled={false}

        ListEmptyComponent={
          <View style={{ width: width - 20, alignItems: 'center' }}>
            <ThemedText style={{textAlign: 'center', marginTop: 20, opacity: 0.5}}>
              Nenhum resultado para exibir
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: 5,
    backgroundColor: '#000',
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
  renderContainer: {
    // Width and Margin are now handled dynamically in renderItem
    height: '90%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  patrimonioContainer: {
    width: "100%",
    height: "100%", 
    backgroundColor: "#7d7d7d",
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    overflow: 'hidden', 
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 50,
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
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#c7c7c7',
    borderRadius: 8,
    width: '100%',
  },
});