import document from "../data/dictionary.json";
import { createCatalog } from "./catalog";
import type { DictionaryDocument } from "./types";

export const catalog = createCatalog(document as DictionaryDocument);
