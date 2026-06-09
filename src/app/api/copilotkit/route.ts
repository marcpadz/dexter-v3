import { copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { runtime } from "@/lib/copilot/runtime";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
