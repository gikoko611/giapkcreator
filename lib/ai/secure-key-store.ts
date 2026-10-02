import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY_NAME = "giapkcreator.ai.provider-key.v1";
let webSessionKey = "";

export function canPersistKeysSecurely(): boolean {
  return Platform.OS !== "web";
}

export async function readProviderKey(): Promise<string> {
  if (Platform.OS === "web") return webSessionKey;
  return (await SecureStore.getItemAsync(KEY_NAME)) ?? "";
}

export async function hasProviderKey(): Promise<boolean> {
  if (Platform.OS === "web") return Boolean(webSessionKey);
  return Boolean(await SecureStore.getItemAsync(KEY_NAME));
}

export async function saveProviderKey(value: string): Promise<void> {
  const trimmed = value.trim();
  if (Platform.OS === "web") {
    webSessionKey = trimmed;
    return;
  }
  if (!trimmed) {
    await SecureStore.deleteItemAsync(KEY_NAME);
    return;
  }
  await SecureStore.setItemAsync(KEY_NAME, trimmed, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearProviderKey(): Promise<void> {
  if (Platform.OS === "web") {
    webSessionKey = "";
    return;
  }
  await SecureStore.deleteItemAsync(KEY_NAME);
}
