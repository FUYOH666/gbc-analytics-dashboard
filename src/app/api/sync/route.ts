import type { NextRequest } from "next/server";

import { readEnv } from "@/lib/env";
import { isAuthorizedByBearerSecret } from "@/lib/request-auth";
import { syncRetailCrmOrders } from "@/lib/orders/sync";

export const runtime = "nodejs";
export const maxDuration = 60;

function verifyCronRequest(request: NextRequest) {
  const env = readEnv();
  const authHeader = request.headers.get("authorization");
  return isAuthorizedByBearerSecret(authHeader, env.CRON_SECRET);
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyCronRequest(request)) {
      return Response.json(
        {
          status: "error",
          mode: "manual",
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const result = await syncRetailCrmOrders("manual");

    return Response.json({
      status: "ok",
      mode: "manual",
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        mode: "manual",
        message: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  let isAuthorized = false;

  try {
    isAuthorized = verifyCronRequest(request);
  } catch (error) {
    return Response.json(
      {
        status: "error",
        mode: "cron",
        message:
          error instanceof Error ? error.message : "Cron verification failed",
      },
      { status: 500 },
    );
  }

  if (!isAuthorized) {
    return Response.json(
      {
        status: "error",
        mode: "cron",
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    const result = await syncRetailCrmOrders("cron");

    return Response.json({
      status: "ok",
      mode: "cron",
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        mode: "cron",
        message: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 500 },
    );
  }
}
