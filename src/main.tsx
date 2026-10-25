import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./app.css";

const mono = new FontFace("Atlas Mono", `url(${import.meta.env.BASE_URL}fonts/mono/JetBrainsMono-Medium.ttf)`, {
  weight: "500",
  display: "swap",
});
void mono.load().then((face) => document.fonts.add(face));

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
