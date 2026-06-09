import prisma from "../lib/prisma.js";

const ROLE_HIERARCHY = { OWNER: 3, CAREGIVER: 2, VIEWER: 1 };

/**
 * Verifica se o usuário autenticado tem permissão sobre o paciente da rota.
 * Uso:
 *   requirePermission()              → qualquer role válida
 *   requirePermission('OWNER')       → somente OWNER
 *   requirePermission('OWNER', 'CAREGIVER') → OWNER ou CAREGIVER
 */
export function requirePermission(...allowedRoles) {
  return async (req, res, next) => {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: "patientId é obrigatório na rota." });
    }

    const permission = await prisma.permission.findUnique({
      where: { userId_patientId: { userId: req.user.id, patientId } },
    });

    if (!permission) {
      return res.status(403).json({ error: "Acesso negado a este paciente." });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(permission.role)) {
      const needed = allowedRoles
        .sort((a, b) => ROLE_HIERARCHY[b] - ROLE_HIERARCHY[a])
        .join(" ou ");
      return res.status(403).json({ error: `Permissão insuficiente. Necessário: ${needed}.` });
    }

    req.permission = permission;
    next();
  };
}
