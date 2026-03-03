/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

// Augment ImportMeta so import.meta.env is typed (Vite provides env at runtime)
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
