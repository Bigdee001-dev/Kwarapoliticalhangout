import { supabase } from './supabase';

export const ImageUploadService = {
  async getAuthenticationParameters() {
    const { data, error } = await supabase.functions.invoke('imagekit-auth', {
      method: 'GET',
    });

    if (error) {
      throw new Error(`Failed to get ImageKit auth params: ${error.message}`);
    }

    return data; // { token, expire, signature }
  },

  async uploadImage(file: File, folder: string = '/kph-uploads'): Promise<string> {
    try {
      const authParams = await this.getAuthenticationParameters();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
      formData.append('signature', authParams.signature);
      formData.append('expire', authParams.expire.toString());
      formData.append('token', authParams.token);
      formData.append('fileName', file.name || 'image.jpg');
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');

      const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw error;
    }
  }
};
