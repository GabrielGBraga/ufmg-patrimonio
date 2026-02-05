import { StyleSheet, FlatList, View, Alert, TouchableOpacity, ActivityIndicator, ScrollView, useWindowDimensions } from "react-native";
import { Image } from 'expo-image';
import React, { useEffect, useState } from "react";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedTextInput } from "@/components/ui/ThemedTextInput";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedButton } from "@/components/ui/ThemedButton";
import { labelPatrimonio, patrimonio } from "@/constants/Patrimonio"; // Importando do seu arquivo
import { Camera } from "expo-camera";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedHeader } from "@/components/ui/ThemedHeader";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import CameraScreen from "@/components/ui/CameraScreen";
import { supabase } from "@/utils/supabase";
import { useAccessControl } from "@/hooks/useAccessControl";

// Helper functions inlined
const formatAtmNum = (atmNum: string): string => {
  const atmLimpo = String(atmNum || '').replace(/[^a-zA-Z0-9]/g, '');
  let resultado = atmLimpo.slice(0, 3);
  if (atmLimpo.length > 3) resultado += ' ' + atmLimpo.slice(3, 9);
  if (atmLimpo.length > 9) resultado += ' ' + atmLimpo.slice(9, 10);
  return resultado;
}

const formatPatNum = (patNum: string): string => {
  const digitosApenas = String(patNum || '').replace(/[^0-9]/g, '');
  if (!digitosApenas && digitosApenas.length > 10) return '';
  const digitosLimitados = digitosApenas.slice(0, 10);
  const numeroPreenchido = digitosLimitados.padStart(10, '0');
  const parte1 = numeroPreenchido.substring(0, 9);
  const parte2 = numeroPreenchido.substring(9);
  return `${parte1}-${parte2}`;
}

const formatInputForSearch = (input: string): string => {
  const cleanedInput = String(input || '').replace(/[^a-zA-Z0-9]/g, '');
  const hasLetters = /[a-zA-Z]/.test(cleanedInput);
  let formattedResult = '';
  if (hasLetters) formattedResult = formatAtmNum(input);
  else formattedResult = formatPatNum(input);

  if (formattedResult === '') Alert.alert("Erro de Formatação", "O número inserido não é um formato de ATM ou Patrimônio válido.");
  return formattedResult;
};

const PermissionButton = ({ owner_id }: { owner_id: string }) => {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user?.id === owner_id) {
        setIsOwner(true);
      }
    };
    checkOwnership();
  }, [owner_id]);

  if (!isOwner) return null;

  return (
    <ThemedButton
      onPress={() => { /* Edit permissions logic */ }}

      style={{ marginTop: 10 }}
    >
      <ThemedText>Editar Permissões</ThemedText>
    </ThemedButton>
  );
};

// Card Component

const PatrimonioCard = ({ item, onEdit, isEditable }: { item: any, onEdit: (id: string) => void, isEditable: boolean }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const getUrl = async () => {
      if (item.image?.fileName) {
        setIsLoading(true);
        const { data, error } = await supabase.storage.from('images').createSignedUrl(item.image.fileName, 60);
        if (isActive && data?.signedUrl) setImageUrl(data.signedUrl);
        setIsLoading(false);
      }
    };
    getUrl();
    return () => { isActive = false; };
  }, [item.image?.fileName]);

  return (
    <ThemedView style={styles.patrimonioContainer}>
      <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
        <View style={styles.imageContainer}>
          {isLoading ? <ActivityIndicator color="#fff" /> : imageUrl && (
            <Image source={{ uri: imageUrl }} style={{ height: 200, width: '100%' }} contentFit="contain" />
          )}
        </View>

        {Object.keys(labelPatrimonio).map((key) => {
          // Ignore technical fields

          if (['image', 'lastEditedBy', 'lastEditedAt'].includes(key)) return null;

          // Special Handling for Owner (owner_id)

          if (key === 'owner_id') {
            return (
              <View style={styles.detailRow} key={key}>
                <View style={styles.labelContainer}>
                  <ThemedText style={styles.label}>{labelPatrimonio[key]}:</ThemedText>
                </View>
                <View style={styles.dataContainer}>
                  {/* Here we show the name from the Join (dono.full_name) and not the UUID */}

                  <ThemedText style={styles.data}>{item.dono?.full_name || "Não definido"}</ThemedText>
                </View>
              </View>
            );
          }

          // Standard Fields

          return (
            <View style={styles.detailRow} key={key}>
              <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>{labelPatrimonio[key]}:</ThemedText>
              </View>
              <View style={styles.dataContainer}>
                <ThemedText style={styles.data}>{item[key]}</ThemedText>
              </View>
            </View>
          );
        })}

        <View style={styles.detailRow}>
          <ThemedText style={styles.label}>Última Edição: </ThemedText>
          <ThemedText style={styles.data}>{item.lastEditedBy} - {new Date(item.lastEditedAt).toLocaleDateString()}</ThemedText>
        </View>

        {isEditable ? (
          <TouchableOpacity style={styles.editButton} onPress={() => onEdit(item.id)}>
            <Ionicons name="pencil" size={25} color="black" />
            <ThemedText style={{ marginLeft: 8 }}>Editar</ThemedText>
          </TouchableOpacity>
        ) : (
          <View style={{ alignItems: 'center', opacity: 0.5, padding: 10 }}>
            <Ionicons name="lock-closed" size={20} color="white" />
            <ThemedText style={{ fontSize: 12 }}>Somente Leitura</ThemedText>
          </View>
        )}

        <PermissionButton owner_id={item.owner_id}></PermissionButton>

      </ScrollView>
    </ThemedView>
  );
};

export default function listing() {
  const [search, setSearch] = useState("");
  const [patrimonioList, setPatrimonioList] = useState<any[]>([]);
  const [scanBool, setScanBool] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const { canEdit } = useAccessControl();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = width * 0.85;
  const CARD_MARGIN = 10;
  const SNAP_INTERVAL = CARD_WIDTH + (CARD_MARGIN * 2);
  const SIDE_SPACING = (width - CARD_WIDTH) / 2 - CARD_MARGIN;

  const searchTypes = Object.entries(labelPatrimonio)
    .filter(([key, content]) => typeof content === 'string' && content.length > 0 && key !== 'image' && key !== 'lastEditedBy' && key !== 'lastEditedAt')
    .map(([key, label]) => ({ label: label as string, value: key }));
  const [filter, setFilter] = useState<string>(searchTypes[0]?.value || 'patNum');

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
        if (filter === "patNum" || filter === "atmNum") formatSearch = formatInputForSearch(search);

        // --- SEARCH WITH JOIN ---
        // Fetch everything from patrimonios AND full_name from profiles table referenced by owner_id

        const { data, error } = await supabase
          .from('patrimonios')
          .select('*, dono:profiles(full_name)')
          .ilike(filter, `%${formatSearch}%`);

        if (error) throw error;
        if (!data || data.length === 0) return Alert.alert("Nenhum patrimônio encontrado.");
        setPatrimonioList(data);
      } catch (error) {
        console.error(error);
      }
    } else {
      Alert.alert("Digite um valor.");
    }
  };

  const editPat = (id: string) => {
    router.push({ pathname: "/modalManagePat", params: { mode: "edit", id: id } });
  };

  if (hasPermission === null) return <ThemedText>Requesting permissions...</ThemedText>;
  if (hasPermission === false) return <ThemedText>No access to camera</ThemedText>;

  return scanBool ? (
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Escanear" onPressIcon={() => setScanBool(false)} variant="back" />
      <CameraScreen onBarcodeScanned={({ data }) => { setSearch(data); setScanBool(false); }} />
    </ThemedView>
  ) : (
    <ThemedView style={styles.safeArea}>
      <ThemedHeader title="Pesquisar" onPressIcon={() => router.push('/settings')} />
      <View>
        <ThemedView style={styles.row}>
          <ThemedTextInput
            placeholder="Pesquisar..."
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            filterData={searchTypes}
            filterValue={filter}
            onFilterChange={(item: any) => setFilter(item.value)}
            iconName="magnify"
            onIconPress={fetchPatrimonio}
          />
        </ThemedView>
        <ThemedButton onPress={() => setScanBool(true)}><ThemedText>Escanear</ThemedText></ThemedButton>
      </View>

      <FlatList
        data={patrimonioList}
        renderItem={({ item }) => {
          const isEditable = canEdit(item.owner_id, item.id);
          return (
            <View style={[styles.renderContainer, { width: CARD_WIDTH, marginHorizontal: 10 }]}>
              <PatrimonioCard item={item} onEdit={editPat} isEditable={isEditable} />
            </View>
          );
        }}
        keyExtractor={(item) => item.id.toString()}
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
        ListEmptyComponent={<ThemedText style={{ textAlign: 'center', marginTop: 20 }}>Sem resultados</ThemedText>}
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
    height: '100%',
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
    paddingRight: 0,
    marginRight: 10,
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