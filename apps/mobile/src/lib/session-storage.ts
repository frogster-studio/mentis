import * as SecureStore from "expo-secure-store";
import { createChunkedStorage } from "./chunked-storage";

export const sessionStorage = createChunkedStorage({
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
});
