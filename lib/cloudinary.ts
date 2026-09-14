const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'foundit_items';

interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}

const isCloudinaryConfigured = Boolean(
  CLOUD_NAME &&
  CLOUD_NAME.trim() !== '' &&
  CLOUD_NAME !== 'your-cloud-name'
);

/**
 * Upload a single file.
 * Tries Cloudinary first (if configured); automatically falls back to
 * local server storage (/api/upload -> public/uploads/) if Cloudinary
 * credentials are not present or encounter an error.
 */
export async function uploadToCloudinary(file: File): Promise<UploadResult> {
  // 1. If Cloudinary is configured, attempt unsigned upload
  if (isCloudinaryConfigured) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'foundit/items');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (response.ok) {
        return response.json();
      }

      console.warn('Cloudinary upload returned non-OK, falling back to local upload...');
    } catch (err) {
      console.warn('Cloudinary upload network error, falling back to local upload:', err);
    }
  }

  // 2. Built-in local upload fallback (works out of the box with zero external accounts)
  const localFormData = new FormData();
  localFormData.append('file', file);

  const localResponse = await fetch('/api/upload', {
    method: 'POST',
    body: localFormData,
  });

  if (!localResponse.ok) {
    const error = await localResponse.json();
    throw new Error(error.error || 'Failed to upload photo');
  }

  return localResponse.json();
}

/** Upload multiple files in parallel (max 5) */
export async function uploadMultipleToCloudinary(
  files: File[]
): Promise<UploadResult[]> {
  const limited = files.slice(0, 5);
  return Promise.all(limited.map(uploadToCloudinary));
}
