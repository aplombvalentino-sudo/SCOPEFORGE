/* ================================================================
   GET /api/integrations/[provider]/callback

   The OAuth return leg. Every path — success, user denial, admin
   policy block, tampered state, exchange failure — ends in a redirect
   to /integrations with a typed outcome. Nothing on this route ever
   renders a stack trace or an error page; the state cookie is cleared
   on every exit.

   Outcomes: ?outcome=connected | denied | admin_required |
             error&code=<taxonomy code>

   Production swap points: workspaceId fallback comes from the session
   instead of DEFAULT_WORKSPACE_ID (the signed state already carries
   the real one).
   ================================================================ */

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_WORKSPACE_ID,
  STATE_COOKIE_NAME,
  getIntegrationsService,
  isIntegrationProvider,
} from "@/server/integrations/service";
import { ProviderError } from "@/server/integrations/types";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
): Promise<NextResponse> {
  const { provider } = await context.params;

  const redirectTo = (query: string): NextResponse => {
    const response = NextResponse.redirect(
      new URL(`/integrations?${query}`, request.nextUrl.origin),
      302
    );
    // One-shot cookie: cleared on every exit from the callback.
    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: "",
      path: "/api/integrations",
      maxAge: 0,
    });
    return response;
  };

  if (!isIntegrationProvider(provider)) {
    return redirectTo("outcome=error&code=unknown_provider");
  }

  try {
    const params = request.nextUrl.searchParams;
    const result = await getIntegrationsService().handleCallback({
      provider,
      params: {
        code: params.get("code") ?? undefined,
        state: params.get("state") ?? undefined,
        error: params.get("error") ?? undefined,
        errorDescription: params.get("error_description") ?? undefined,
      },
      stateCookie: request.cookies.get(STATE_COOKIE_NAME)?.value ?? null,
      workspaceId: DEFAULT_WORKSPACE_ID,
    });

    if (result.outcome === "connected") return redirectTo("outcome=connected");
    if (result.outcome === "denied") return redirectTo("outcome=denied");
    if (result.outcome === "admin_required") {
      return redirectTo("outcome=admin_required");
    }
    return redirectTo(`outcome=error&code=${encodeURIComponent(result.code)}`);
  } catch (error) {
    // Catch-all: the user always lands back in the app with a typed
    // outcome, never on a raw error page.
    const code = error instanceof ProviderError ? error.code : "unexpected";
    return redirectTo(`outcome=error&code=${code}`);
  }
}
