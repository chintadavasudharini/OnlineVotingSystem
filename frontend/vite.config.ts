import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const APP_RUN_ID = Date.now().toString()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vite-plugin-fresh-dev-run',
      transformIndexHtml(html) {
        return html.replace(
          '<head>',
          `<head>\n    <script>\n      (function() {\n        var currentRunId = "${APP_RUN_ID}";\n        var previousRunId = localStorage.getItem("voting_system_run_id");\n        if (previousRunId !== currentRunId) {\n          localStorage.clear();\n          sessionStorage.clear();\n          localStorage.setItem("voting_system_run_id", currentRunId);\n        }\n      })();\n    </script>`
        );
      },
    },
  ],
  define: {
    __APP_RUN_ID__: JSON.stringify(APP_RUN_ID),
  },
})
