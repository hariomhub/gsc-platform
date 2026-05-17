import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { env } from './env.js';

const sharedKeyCredential = new StorageSharedKeyCredential(
  env.AZURE_STORAGE_ACCOUNT_NAME,
  env.AZURE_STORAGE_ACCOUNT_KEY,
);

export const blobServiceClient = new BlobServiceClient(
  `https://${env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  sharedKeyCredential,
);

export const containerClient = blobServiceClient.getContainerClient(
  env.AZURE_STORAGE_CONTAINER_NAME,
);
