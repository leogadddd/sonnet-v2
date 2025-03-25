import { useSupabase as UseSupabase } from "../supabase/supabase-client";
import { User } from "../system/user/user";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EmailAddress = {
  created_at: number;
  email_address: string;
  id: string;
  linked_to: { id: string; type: string }[];
  matches_sso_connection: boolean;
  object: string;
  reserved: boolean;
  updated_at: number;
  verification: {
    attempts: number | null;
    expire_at: number | null;
    status: string;
    strategy: string;
  };
};

const CRYPTO_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY;

if (!CRYPTO_KEY) {
  throw new Error("CRYPTO_KEY is not defined");
}

// Convert Base64 key to Uint8Array
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function encryptData(data: string) {
  const encoder = new TextEncoder();
  const keyData = base64ToUint8Array(process.env.NEXT_PUBLIC_CRYPTO_KEY!); // Convert Base64 key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data),
  );
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  });
}

async function decryptData(encryptedData: string) {
  const decoder = new TextDecoder();
  const parsed = JSON.parse(encryptedData);
  const iv = new Uint8Array(parsed.iv);
  const data = new Uint8Array(parsed.data);
  const keyData = base64ToUint8Array(process.env.NEXT_PUBLIC_CRYPTO_KEY!); // Convert Base64 key
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );
  return decoder.decode(decrypted);
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  setUserByClerkId: (clerkId: string) => Promise<void>;
}

export const useUser = create<UserStore>()(
  persist(
    (set) => ({
      user: null,

      setUser: (user) => set({ user }),

      setUserByClerkId: async (clerkId) => {
        const supabase = await UseSupabase();

        const { data, error } = await supabase
          .from("users")
          .select("*, email_addresses")
          .eq("clerk_id", clerkId)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (!data) {
          set({
            user: null,
          });
          return;
        }

        set({
          user: data,
        });
      },
    }),
    {
      name: "user-storage",
      storage: {
        getItem: async (name) => {
          const encryptedData = localStorage.getItem(name);
          if (!encryptedData) return null;

          try {
            return JSON.parse(await decryptData(encryptedData));
          } catch (error) {
            console.error("Error decrypting user data:", error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            const encryptedData = await encryptData(JSON.stringify(value));
            localStorage.setItem(name, encryptedData);
          } catch (error) {
            console.error("Error encrypting user data:", error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
