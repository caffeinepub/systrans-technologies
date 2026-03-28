import { HttpAgent } from "@icp-sdk/core/agent";
import { useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";

export function useFileUpload() {
  const [storageClient, setStorageClient] = useState<StorageClient | null>(
    null,
  );

  useEffect(() => {
    loadConfig().then((config) => {
      const agent = new HttpAgent({ host: config.backend_host });
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      setStorageClient(client);
    });
  }, []);

  const uploadFile = async (
    file: File,
    onProgress?: (p: number) => void,
  ): Promise<string> => {
    if (!storageClient) throw new Error("Storage not initialized");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await storageClient.putFile(bytes, onProgress);
    return hash;
  };

  const getFileUrl = async (hash: string): Promise<string> => {
    if (!storageClient) throw new Error("Storage not initialized");
    return storageClient.getDirectURL(hash);
  };

  return { uploadFile, getFileUrl, ready: !!storageClient };
}
