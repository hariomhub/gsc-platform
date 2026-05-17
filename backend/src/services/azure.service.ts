import { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob';
import { env } from '../config/env.js';

let client: BlobServiceClient | null = null;
let sharedKeyCredential: StorageSharedKeyCredential | null = null;

function getClient(): BlobServiceClient {
  if (client) return client;
  sharedKeyCredential = new StorageSharedKeyCredential(
    env.AZURE_STORAGE_ACCOUNT_NAME,
    env.AZURE_STORAGE_ACCOUNT_KEY,
  );
  client = new BlobServiceClient(
    `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredential,
  );
  return client;
}

function getContainerClient() {
  return getClient().getContainerClient(env.AZURE_STORAGE_CONTAINER_NAME);
}

export function generateBlobName(folder: string, originalName: string): string {
  const ext  = originalName.split('.').pop() || 'bin';
  const ts   = Date.now();
  const rand = Math.random().toString(36).substring(2, 8);
  return `${folder}/${ts}-${rand}.${ext}`;
}

export async function uploadStreamToAzure(
  folder: string,
  originalName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const blobName   = generateBlobName(folder, originalName);
  const container  = getContainerClient();
  const blockBlob  = container.getBlockBlobClient(blobName);
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });
  return blockBlob.url;
}

export async function uploadFileToAzure(
  folder: string,
  originalName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  return uploadStreamToAzure(folder, originalName, buffer, mimeType);
}

export async function deleteFromAzure(blobUrl: string): Promise<void> {
  try {
    const url = new URL(blobUrl);
    const blobName = url.pathname.replace(`/${env.AZURE_STORAGE_CONTAINER_NAME}/`, '');
    const container = getContainerClient();
    await container.getBlockBlobClient(blobName).deleteIfExists();
  } catch (err: any) {
    console.warn('Azure delete failed:', err.message);
  }
}

export async function generateSasUrl(blobUrl: string, expiryMinutes = 60): Promise<string> {
  if (!sharedKeyCredential) getClient(); // initialise
  const url      = new URL(blobUrl);
  const blobName = url.pathname.replace(`/${env.AZURE_STORAGE_CONTAINER_NAME}/`, '');
  const sasQuery = generateBlobSASQueryParameters(
    {
      containerName: env.AZURE_STORAGE_CONTAINER_NAME,
      blobName,
      permissions:   BlobSASPermissions.parse('r'),
      startsOn:      new Date(),
      expiresOn:     new Date(Date.now() + expiryMinutes * 60_000),
    },
    sharedKeyCredential!,
  );
  return `${blobUrl}?${sasQuery.toString()}`;
}

export async function getBlobMetadata(blobUrl: string): Promise<Record<string, string>> {
  const url      = new URL(blobUrl);
  const blobName = url.pathname.replace(`/${env.AZURE_STORAGE_CONTAINER_NAME}/`, '');
  const container = getContainerClient();
  const props = await container.getBlockBlobClient(blobName).getProperties();
  return (props.metadata as Record<string, string>) || {};
}

// Backward-compat aliases for controllers that still use old names
export const uploadToBlob  = uploadFileToAzure;
export const deleteFromBlob = deleteFromAzure;
export const getBlobSasUrl  = generateSasUrl;
export const getBlobStream  = getBlobMetadata; // stub
