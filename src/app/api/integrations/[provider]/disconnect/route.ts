/* ================================================================
   POST /api/integrations/[provider]/disconnect
   Body: { purgeImports: boolean }

   Disconnect order of operations (service.disconnect):
   1. best-effort revoke at the provider — failure never blocks 2–4
   2. delete the encrypted token set from the vault store
   3. optionally purge imported raw content (extracted briefs/scopes
      built from it are workspace data and stay)
   4. audit both the token purge and the disconnect

   In sandbox mode (no provider env) there is no server-side account —
   the client store owns the simulated connection — so this responds
   with mode: "sandbox" and does nothing.

   Production swap points: workspaceId from the session instead of
   DEFAULT_WORKSPACE_ID.
   ================================================================ */

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_WORKSPACE_ID,
  getIntegrationsService,
  isIntegrationProvider,
} from "@/server/integrations/service";
import { ProviderError } from "@/server/integrations/types";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await context.params;
  if (!isIntegrationProvider(provider)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }

  const service = getIntegrationsService();

  let purgeImports = false;
  try {
    const body = (await request.json()) as { purgeImports?: unknown };
    purgeImports = body.purgeImports === true;
  } catch {
    // empty or non-JSON body — keep imports by default
  }

  if (!service.providerConfigured(provider)) {
    return NextResponse.json({
      mode: "sandbox",
      message:
        "No live connection exists on this server — the sandbox connection is managed entirely by the client store.",
    });
  }

  try {
    const result = await service.disconnect(DEFAULT_WORKSPACE_ID, provider, {
      purgeImports,
    });
    return NextResponse.json({
      mode: "live",
      revokedAtProvider: result.revokedAtProvider,
      purgedRecords: result.purgedRecords,
    });
  } catch (error) {
    const code = error instanceof ProviderError ? error.code : "unexpected";
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
