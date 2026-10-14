import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "giapkcreator.installation-token.v1";
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
let cachedToken = "";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createToken(): Promise<string> {
  return bytesToHex(await Crypto.getRandomBytesAsync(32));
}

/** A per-installation bearer credential; the server stores only its SHA-256 owner scope. */
export async function getInstallationToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  if (Platform.OS === "web") {
    try {
      const stored = window.sessionStorage.getItem(TOKEN_KEY);
      if (stored && TOKEN_PATTERN.test(stored)) {
        cachedToken = stored;
        return cachedToken;
      }
      cachedToken = await createToken();
      window.sessionStorage.setItem(TOKEN_KEY, cachedToken);
      return cachedToken;
    } catch {
      cachedToken = await createToken();
      return cachedToken;
    }
  }

  const stored = await SecureStore.getItemAsync(TOKEN_KEY);
  if (stored && TOKEN_PATTERN.test(stored)) {
    cachedToken = stored;
    return cachedToken;
  }
  cachedToken = await createToken();
  await SecureStore.setItemAsync(TOKEN_KEY, cachedToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return cachedToken;
}
