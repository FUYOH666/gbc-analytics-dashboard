import { readEnv } from "@/lib/env";
import { importMockOrdersToRetailCrm } from "@/lib/orders/import";
import { isAuthorizedByBearerSecret } from "@/lib/request-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const env = readEnv();

    if (
      !isAuthorizedByBearerSecret(
        request.headers.get("authorization"),
        env.CRON_SECRET,
      )
    ) {
      return Response.json(
        {
          status: "error",
          message: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const result = await importMockOrdersToRetailCrm();

    return Response.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown import error",
      },
      { status: 500 },
    );
  }
}
