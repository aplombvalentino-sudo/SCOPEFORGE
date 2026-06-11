/* ================================================================
   GET /api/integrations/status

   Reports whether this server runs live (vault key + provider OAuth
   env present) or sandbox (the client store simulates everything),
   plus per-provider configuration flags. The client hub calls this to
   decide whether connect buttons hit real consent or the sandbox.

   Production swap points: add session auth and derive the workspace
   from it; the response shape is final.
   ================================================================ */

import { NextResponse } from "next/server";
import {
  getIntegrationsService,
} from "@/server/integrations/service";
import type { IntegrationProvider } from "@/lib/integrations";

export const runtime = "nodejs";

const PROVIDERS: IntegrationProvider[] = ["google", "microsoft"];

export async function GET(): Promise<NextResponse> {
  const service = getIntegrationsService();
  return NextResponse.json({
    mode: service.mode(),
    providers: PROVIDERS.map((provider) => ({
      provider,
      configured: service.providerConfigured(provider),
    })),
  });
}
