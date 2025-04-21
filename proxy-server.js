const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());

app.use(
  "/fhir",
  createProxyMiddleware({
    target: "https://hapi.fhir.org",    
    changeOrigin: true,
    pathRewrite: {
      "^/fhir": "/baseR4"                
    },
  })
);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`FHIR proxy server running on http://localhost:${PORT}/fhir`);
});
