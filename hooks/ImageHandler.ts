import * as ImagePicker from 'expo-image-picker';
import {Alert} from "react-native";
import {getDownloadURL, ref, StorageReference, uploadBytes, deleteObject} from "firebase/storage";
import {storage} from "@/FirebaseConfig";

type imageData = {
    uri: string;
    width: number;
    height: number;
};
/**
 * Lança o seletor de imagens de forma assíncrona e processa a imagem selecionada.
 *
 * Esta função abre a galeria de imagens do dispositivo para que o usuário selecione uma imagem.
 * Após a seleção, ela processa a imagem calculando uma nova largura e altura
 * para manter a proporção (_aspect ratio_), enquanto a restringe a dimensões máximas especificadas.
 * O URI da imagem processada e suas dimensões ajustadas são então armazenados em variáveis de estado.
 *
 * A função não permite edição da mídia durante a seleção e só aceita
 * imagens como tipo de mídia. A imagem resultante é configurada para a maior qualidade.
 *
 * Variáveis atualizadas após a seleção:
 * - Atualiza o URI da imagem usando `setImage`.
 * - Atualiza os dados do formulário para incluir a nova largura e altura da imagem
 *   dentro da propriedade `image`.
 *
 * Nota: Se o usuário cancelar a seleção ou nenhum ativo for retornado, nenhuma atualização ocorrerá.
 */
export const getImage = async (selectionType: 'Camera'|'Gallery'): Promise<imageData | undefined> => {
    try {        
        console.log(selectionType)
        const imageFunction = {
            'Camera': ImagePicker.launchCameraAsync,
            'Gallery': ImagePicker.launchImageLibraryAsync
        };
    
        const result = await imageFunction[selectionType]({
            mediaTypes: 'images',
        });
    
        console.log("Image selected: ", !!result);
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const { uri, width, height } = result.assets[0];
            const maxWidth = 300; // Largura máxima
            const maxHeight = 300; // Altura máxima
    
            // Calcula nova largura e altura proporcionalmente
            let newWidth = width;
            let newHeight = height;
            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;
                if (aspectRatio > 1) {
                    newWidth = maxWidth;
                    newHeight = maxWidth / aspectRatio;
                } else {
                    newHeight = maxHeight;
                    newWidth = maxHeight * aspectRatio;
                }
            }
            return { uri, width: newWidth, height: newHeight };
        }
    
        return undefined; // Retorna undefined caso não haja imagem ou se o usuário cancelar
    } catch (error) {
        console.error("Erro ao tentar capturar a imagem: ", error)
    }
};

/**
 * Faz o upload de uma imagem para o armazenamento e atualiza o estado com a URL da imagem.
 *
 * Esta função verifica se há um usuário autenticado e uma imagem selecionada.
 * Se alguma dessas condições não for atendida, exibe um alerta e encerra a execução.
 * Caso contrário, realiza o seguinte fluxo:
 *
 * Fluxo:
 * 1. Obtém o arquivo da imagem a partir do URI usando `fetch` e converte para um blob.
 * 2. Cria uma referência no armazenamento Firebase com um caminho exclusivo baseado no ID do usuário e timestamp.
 * 3. Envia o blob para o armazenamento Firebase usando `uploadBytes`.
 * 4. Obtém a URL pública da imagem com `getDownloadURL`.
 * 5. Atualiza o estado do formulário (`formData`) para incluir a URL da imagem no campo `image`.
 *
 * Tratamento de erros:
 * - Qualquer erro durante o upload é capturado e exibido no console e em um alerta para o usuário.
 *
 * Nota: Certifique-se de que o Firebase Storage esteja configurado corretamente no projeto.
 */
export const uploadImage = async (userId: string, image: string): Promise<string | undefined> => {

    try {
        console.log("Tentando fazer upload da imagem.")
        const response = await fetch(image);
        console.log("Fetch: ", !!response);
        const blob = await response.blob();
        console.log("Blob: ", !!blob);
        const storageRef = ref(storage, `images/${userId}/${Date.now()}`);
        console.log("Ref: ", !!storageRef);
        await uploadBytes(storageRef, blob);
        console.log("Upload feito!")
        const imageUrl = await getDownloadURL(storageRef);
        console.log("URL: ", imageUrl);
        return imageUrl;
    } catch (error: any) {
        console.error('Error uploading image: ', error);
        Alert.alert('Upload failed!', error.message);
        return undefined;
    }
};

/**
 * Deleta uma imagem do armazenamento Firebase com base na URL salva.
 *
 * Esta função extrai o caminho do arquivo da URL fornecida, cria uma referência
 * ao arquivo no armazenamento Firebase e o exclui.
 *
 * Tratamento de erros:
 * - Qualquer erro durante a exclusão é capturado e exibido no console e em um alerta para o usuário.
 *
 * Nota: Certifique-se de que o Firebase Storage esteja configurado corretamente no projeto.
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
        console.log("Tentando deletar a imagem.");

        // Base URL do Firebase Storage
        const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
        if (!imageUrl.startsWith(baseUrl)) {
            throw new Error("URL inválida do Firebase Storage.");
        }

        // Extrai o caminho do arquivo da URL
        const pathWithParams = imageUrl.replace(baseUrl, "").split("/o/")[1];
        const filePath = decodeURIComponent(pathWithParams.split("?")[0]);

        // Cria uma referência ao arquivo no armazenamento
        const fileRef = ref(storage, filePath);

        // Deleta o arquivo
        await deleteObject(fileRef);
        console.log("Imagem deletada com sucesso!");
        return true;
    } catch (error: any) {
        console.error("Erro ao deletar a imagem: ", error);
        Alert.alert("Erro ao deletar a imagem!", error.message);
        return false;
    }
};