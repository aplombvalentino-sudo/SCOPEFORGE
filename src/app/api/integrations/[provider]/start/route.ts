/* ================================================================
   GET /api/integrations/[provider]/start?capabilities=a,b

   Begins the OAuth dance. Live mode: signs the state, stores it with
   the PKCE verifier in an httpOnly SameSite=Lax cookie scoped to
   /api/integrations, and 302s to the provider's consent screen.
   Sandbox mode (env absent): responds with JSON so the client store
   runs its simulated consent instead — no fake redirects.

   Production swap points: workspaceId comes from the session instead
   of DEFAULT_WORKSPACE_ID.
   ================================================================ */

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_WORKSPACE_ID,
  getIntegrationsService,
  isIntegrationProvider,
  parseCapabilityKeys,
} from "@/server/integrations/service";
import { ProviderError } from "@/server/integrations/types";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await context.params;
  if (!isIntegrationProvider(provider)) {
    return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  }

  const service = getIntegrationsService();
  const capabilities = parseCapabilityKeys(
    request.nextUrl.searchParams.get("capabilities")
  );

  try {
    const begin = service.beginConnect(provider, capabilities, {
      workspaceId: DEFAULT_WORKSPACE_ID,
      returnTo: "/integrations",
    });

    if (begin.mode === "sandbox") {
      return NextResponse.json({ mode: "sandbox", message: begin.message });
    }

    const response = NextResponse.redirect(begin.authUrl, 302);
    response.cookies.set({
      name: begin.stateCookie.name,
      value: begin.stateCookie.value,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/api/integrations",
      maxAge: begin.stateCookie.maxAgeSeconds,
    });
    return response;
  } catch (error) {
    // Misconfiguration (origin allowlist, missing secret) surfaces as a
    // typed code — never a stack trace.
    const code = error instanceof ProviderError ? error.code : "unexpected";
    return NextResponse.json({ error: code }, { status: 500 });
  }
}
