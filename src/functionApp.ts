import { app } from "@azure/functions";
import { azureMcpHttpHandler } from "./azure/httpTrigger.js";

app.http("peoplesafeMcp", {
  route: "mcp",
  authLevel: "function",
  methods: ["GET", "POST", "DELETE"],
  handler: azureMcpHttpHandler
});
