import { File } from 'expo-file-system';

export async function uploadProof(uri: string): Promise<string> {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error('Image upload is not set up yet. Add your Cloudinary keys to .env.');
  const form = new FormData();
  // Expo's fetch needs a real file object (a Blob-like), not a { uri, name, type } object.
  form.append('file', new File(uri) as any);
  form.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Image upload failed.');
  return json.secure_url as string;
}
