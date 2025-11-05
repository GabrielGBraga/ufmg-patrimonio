import * as ImagePicker from 'expo-image-picker';
import {Alert} from "react-native";
import {getDownloadURL, ref, StorageReference, uploadBytes, deleteObject} from "firebase/storage";
import { supabase } from '@/utils/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

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

            const manipulatorResult = await ImageManipulator.manipulateAsync(
                uri,
                [
                    { resize: { width: 1024 } } // Resize to max width of 1024px
                ],
                {
                    compress: 0.7, // 70% quality
                    format: ImageManipulator.SaveFormat.JPEG,
                }
            );

            return { uri: manipulatorResult.uri, width: newWidth, height: newHeight };
        }
    
        return undefined; // Retorna undefined caso não haja imagem ou se o usuário cancelar
    } catch (error) {
        console.error("Erro ao tentar capturar a imagem: ", error)
    }
};

/**
 * 
 * @param image 
 * @returns fileName || undefined
 */
export const uploadImage = async (image: string): Promise<string | undefined> => {
    try {
        console.log("Tentando fazer upload da imagem.")
        const response = await fetch(image);
        const blob = await response.blob();
        
        const arrayBuffer = await new Response(blob).arrayBuffer();
        const fileName = `patPhotos/${Date.now()}.jpg`;
        const { error } = await supabase.storage
            .from('images')
            .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: false });
        if (error) {
            console.error('Error uploading image: ', error);
        } else {
            console.log('Image uploaded successfully: ', fileName);
        }
        return fileName;
    } catch (error: any) {
        console.error('Error uploading image: ', error);
        Alert.alert('Upload failed!', error.message);
        return undefined;
    }
};


export const deleteImage = async (fileName: string): Promise<void> => {
    try {
        const { data, error } = await supabase
            .storage
            .from('images')
            .remove([fileName])
        
        if (error) {
            console.error("Erro ao deletar a imagem: ", error);
            Alert.alert("Erro", "Erro ao deletar a imagem");
        }
    } catch (error: any) {
        console.error("Erro ao deletar a imagem: ", error);
        Alert.alert("Erro ao deletar a imagem!", error.message);
    }
};
