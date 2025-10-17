import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Theme, ThemePanel } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme
      appearance="dark"
      accentColor="iris"
      grayColor="slate"
      radius="medium"
      scaling="100%"
      panelBackground="solid"
    >
      <App />
      {/* Theme customization panel - remove in production */}
      <ThemePanel defaultOpen={false} />
    </Theme>
  </React.StrictMode>
);
