import 'reflect-metadata';
import './controllers/UserController';
import { createMiniNestApp } from "../app/App";

const app = createMiniNestApp({
    port: 433,
    https: {
        key: "./certs/key.pem",
        cert: "./certs/cert.pem",
    },
});

app.listen(() => {
    console.log("HTTPS server is running on port 8443");
});