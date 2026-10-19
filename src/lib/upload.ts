export async function uploadProof(uri: string): Promise<string> {
  const cloud = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) throw new Error('Image upload is not set up yet. Add your Cloudinary keys to .env.');
  const form = new FormData();
  form.append('file', { uri, name: 'proof.jpg', type: 'image/jpeg' } as any);
  form.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message || 'Image upload failed.');
  return json.secure_url as string;
}
