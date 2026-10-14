import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ProviderId } from "@/lib/ai/providers";

const KEY_PREFIX = "giapkcreator.ai.provider-key.v1.";
const webSessionKeys = new Map<ProviderId, string>();

function keyName(providerId: ProviderId): string {
  return `${KEY_PREFIX}${providerId}`;
}

export function canPersistKeysSecurely(): boolean {
  return Platform.OS !== "web";
}

export async function readProviderKey(providerId: ProviderId): Promise<string> {
  if (Platform.OS === "web") return webSessionKeys.get(providerId) ?? "";
  return (await SecureStore.getItemAsync(keyName(providerId))) ?? "";
}

export async function hasProviderKey(providerId: ProviderId): Promise<boolean> {
  if (Platform.OS === "web") return Boolean(webSessionKeys.get(providerId));
  return Boolean(await SecureStore.getItemAsync(keyName(providerId)));
}

export async function saveProviderKey(providerId: ProviderId, value: string): Promise<void> {
  const trimmed = value.trim();
  if (Platform.OS === "web") {
    if (trimmed) webSessionKeys.set(providerId, trimmed);
    else webSessionKeys.delete(providerId);
    return;
  }
  if (!trimmed) {
    await SecureStore.deleteItemAsync(keyName(providerId));
    return;
  }
  await SecureStore.setItemAsync(keyName(providerId), trimmed, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearProviderKey(providerId: ProviderId): Promise<void> {
  if (Platform.OS === "web") {
    webSessionKeys.delete(providerId);
    return;
  }
  await SecureStore.deleteItemAsync(keyName(providerId));
}
