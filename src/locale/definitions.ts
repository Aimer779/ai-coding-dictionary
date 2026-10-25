import partA from "./zh-a.json";
import partB from "./zh-b.json";
import partC from "./zh-c.json";
import partD from "./zh-d.json";

export const zhDefinition: Record<string, string> = {
  ...partA,
  ...partB,
  ...partC,
  ...partD,
};
