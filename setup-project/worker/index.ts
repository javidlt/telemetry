type Member = {
  id: number;
  email: string;
  name: string;
  available: number;
};

async function listMembers(env: Env): Promise<Member[]> {
  const { results } = await env.ONCALL_DB.prepare(
    "SELECT id, email, name, available FROM members ORDER BY id ASC"
  ).all<Member>();
  return results ?? [];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/members") {
      const members = await listMembers(env);
      return Response.json({ members });
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({ name: "Cloudflare" });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
