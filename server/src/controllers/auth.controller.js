import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { catchAsync } from "../lib/catchAsync.js";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export const register = catchAsync(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "name, email e password são obrigatórios." });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "E-mail já cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken(user);

  return res.status(201).json({ token, user });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "email e password são obrigatórios." });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Mensagem genérica para não revelar se o e-mail existe
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});
