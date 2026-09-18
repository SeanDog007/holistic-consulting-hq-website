function unsupported() {
  throw new Error("sharp is stubbed in this deploy (text embeddings only).");
}

export default function sharp() {
  return new Proxy(
    {},
    {
      get() {
        return unsupported;
      },
    },
  );
}
