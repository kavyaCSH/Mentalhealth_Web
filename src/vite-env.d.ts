/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_DOMAIN: string;
  readonly VITE_API_TOKEN: string;
  // add any other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
