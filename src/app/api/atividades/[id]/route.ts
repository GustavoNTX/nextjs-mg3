// app/api/atividades/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// -------- helpers --------
async function getEmpresaIdFromRequest(): Promise<string | null> {
  const h = await headers();

  // 1) x-user-id
  const userId = h.get("x-user-id") ?? undefined;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { empresaId: true },
    });
    if (u?.empresaId) return u.empresaId;
  }

  // 2) Authorization: Bearer <jwt>
  const auth = h.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const [, payloadB64] = token.split(".");
      if (payloadB64) {
        const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
        const json = Buffer.from(b64, "base64").toString("utf8");
        const payload = JSON.parse(json);
        const sub = payload?.sub as string | undefined;
        const email = payload?.email as string | undefined;

        if (sub) {
          const u = await prisma.user.findUnique({
            where: { id: sub },
            select: { empresaId: true },
          });
          if (u?.empresaId) return u.empresaId;
        }
        if (email) {
          const u = await prisma.user.findUnique({
            where: { email },
            select: { empresaId: true },
          });
          if (u?.empresaId) return u.empresaId;
        }
      }
    } catch {
      // silencioso
    }
  }
  return null;
}

// ---- zod helpers ----
const StatusEnum = z.enum(["PROXIMAS", "EM_ANDAMENTO", "PENDENTE", "HISTORICO"]);

// Normaliza boolean vindo como string "true"/"false"
const boolFlex = z.preprocess((v) => {
  if (typeof v === "string") {
    if (v.toLowerCase() === "true") return true;
    if (v.toLowerCase() === "false") return false;
  }
  return v;
}, z.boolean());

const dateFlex = () =>
  z.preprocess((v) => (v ? new Date(v as any) : null), z.date().nullable());

// Aceita status como boolean OU enum string
const patchSchema = z
  .object({
    status: z.union([boolFlex, StatusEnum]).optional(),
    expectedDate: dateFlex().optional(),
    startAt: dateFlex().optional(),
    endAt: dateFlex().optional(),
    completedAt: dateFlex().optional(),

    prioridade: z.string().optional(),
    budgetStatus: z.string().optional(),
    appliedStandard: z.string().optional(),
    observacoes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict();

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

// ---------- GET ----------
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

    const { id } = await ctx.params;
    const item = await prisma.atividade.findFirst({
      where: { id, empresaId },
      include: { condominio: { select: { id: true, name: true } } },
    });
    if (!item) return json(404, { error: "Atividade não encontrada" });
    return NextResponse.json(item);
  } catch (e) {
    console.error("Atividade.GET error:", e);
    return json(500, { error: "Falha ao buscar a atividade." });
  }
}

// ---------- PATCH ----------
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

    const { id } = await ctx.params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: "JSON malformado" });
    }

    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return json(422, { error: "Validação falhou", issues: parsed.error.flatten() });
    }

    const current = await prisma.atividade.findFirst({
      where: { id, empresaId },
    });
    if (!current) {
      return json(404, { error: "Atividade não encontrada ou não pertence à sua empresa." });
    }

    // Monta 'data' só com campos presentes
    const d: any = {};
    const b = parsed.data;

    // status: aceita boolean (mapeado) ou enum diretamente
    if (b.status !== undefined) {
      if (typeof b.status === "boolean") {
        // true -> EM_ANDAMENTO | false -> PENDENTE
        d.status = b.status ? "EM_ANDAMENTO" : "PENDENTE";
        // (opcional) automatismos de data:
        // if (b.status === true && !current.startAt) d.startAt = new Date();
        // if (b.status === false) d.completedAt = null; // não finalize automatico
      } else {
        d.status = b.status; // já é enum válido
      }
    }

    if ("expectedDate" in b) d.expectedDate = b.expectedDate;
    if ("startAt" in b) d.startAt = b.startAt;
    if ("endAt" in b) d.endAt = b.endAt;
    if ("completedAt" in b) d.completedAt = b.completedAt;

    if (b.prioridade !== undefined) d.prioridade = b.prioridade as any;
    if (b.budgetStatus !== undefined) d.budgetStatus = b.budgetStatus as any;
    if (b.appliedStandard !== undefined) d.appliedStandard = b.appliedStandard;
    if (b.observacoes !== undefined) d.observacoes = b.observacoes;
    if (b.tags !== undefined) d.tags = b.tags;

    if (Object.keys(d).length === 0) {
      return json(400, { error: "Nenhum campo para atualizar." });
    }

    const updated = await prisma.atividade.update({
      where: { id },
      data: d,
      include: { condominio: { select: { id: true, name: true } } },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Atividade.PATCH error:", e);
    const msg =
      e?.meta?.cause ||
      e?.message ||
      "Não foi possível atualizar a atividade.";
    return json(500, { error: msg });
  }
}

// ---------- DELETE ----------
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const empresaId = await getEmpresaIdFromRequest();
    if (!empresaId) return json(401, { error: "Não autorizado" });

    const { id } = await ctx.params;
    const deleted = await prisma.atividade.deleteMany({
      where: { id, empresaId },
    });
    if (deleted.count === 0) {
      return json(404, { error: "Atividade não encontrada ou não pertence à sua empresa." });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("Atividade.DELETE error:", e);
    return json(500, { error: "Não foi possível excluir a atividade." });
  }
}
