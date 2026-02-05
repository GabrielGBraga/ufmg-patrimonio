import * as ImagePicker from 'expo-image-picker';
import { Alert } from "react-native";
import { supabase } from '@/utils/supabase';
import * as ImageManipulator from 'expo-image-manipulator';

type imageData = {
    uri: string;
    width: number;
    height: number;
};
/**
 * Launches the image picker asynchronously and processes the selected image.
 *
 * This function opens the device's image gallery or camera for the user to select an image.
 * After selection, it processes the image by calculating a new width and height
 * to maintain the aspect ratio, while restricting it to specified maximum dimensions.
 * The processed image URI and its adjusted dimensions are then returned.
 *
 * The function does not allow media editing during selection and only accepts
 * images as media type. The resulting image is configured for high quality.
 *
 * Updates variables after selection:
 * - Updates the image URI using `setImage`.
 * - Updates form data to include the new image width and height
 *   within the `image` property.
 *
 * Note: If the user cancels selection or no asset is returned, no update occurs.
 */
export const getImage = async (selectionType: 'Camera' | 'Gallery'): Promise<imageData | undefined> => {
    try {
        const imageFunction = {
            'Camera': ImagePicker.launchCameraAsync,
            'Gallery': ImagePicker.launchImageLibraryAsync
        };

        const result = await imageFunction[selectionType]({
            mediaTypes: 'images',
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const { uri, width, height } = result.assets[0];
            const maxWidth = 300; // Max width
            const maxHeight = 300; // Max height

            // Calculate new width and height proportionally
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

        return undefined; // Returns undefined if no image or user cancelled

    } catch (error) {
        console.error("Error trying to capture image: ", error)
    }
};

/**
 * Uploads an image to Supabase storage.
 * @param image URI of the image to upload
 * @returns fileName if successful, undefined otherwise
 */
export const uploadImage = async (image: string): Promise<string | undefined> => {
    try {
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
            // Success
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
            console.error("Error deleting image: ", error);
            Alert.alert("Error", "Error deleting image");
        }
    } catch (error: any) {
        console.error("Error deleting image: ", error);
        Alert.alert("Error deleting image!", error.message);
    }
};

