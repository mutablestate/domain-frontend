import "./assets/css/style.css";
// @ts-ignore
import App from "./App.svelte";

const app = new App({
  target: document.getElementById("app"),
});

export default app;
