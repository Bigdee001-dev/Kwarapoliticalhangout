import { supabase } from './supabase';

const MAX_VIDEO_SIZE_MB = 100;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];

export const VideoUploadService = {
  validateVideo(file: File): void {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error(`Unsupported video format. Allowed: MP4, WebM, OGG, MOV, AVI.`);
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      throw new Error(`Video too large (${sizeMB.toFixed(1)} MB). Max size is ${MAX_VIDEO_SIZE_MB} MB.`);
    }
  },

  async getAuthenticationParameters() {
    const { data, error } = await supabase.functions.invoke('imagekit-auth', {
      method: 'GET',
    });

    if (error) {
      throw new Error(`Failed to get ImageKit auth params: ${error.message}`);
    }

    return data; // { token, expire, signature }
  },

  async uploadVideo(
    file: File,
    folder: string = '/kph-videos',
    onProgress?: (pct: number, loaded: number, total: number) => void
  ): Promise<string> {
    this.validateVideo(file);

    const authParams = await this.getAuthenticationParameters();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
    formData.append('signature', authParams.signature);
    formData.append('expire', authParams.expire.toString());
    formData.append('token', authParams.token);
    formData.append('fileName', file.name || 'video.mp4');
    formData.append('folder', folder);
    formData.append('useUniqueFileName', 'true');

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100), e.loaded, e.total);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result.url);
          } catch {
            reject(new Error('Invalid response from upload server.'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')));

      xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
      xhr.send(formData);
    });
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};
