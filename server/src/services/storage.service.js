import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { r2 } from "../lib/r2.js";

const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, ""); // remove trailing slash

/**
 * Faz upload de um arquivo para o R2.
 * @param {object} file  - Objeto do multer: { buffer, mimetype, originalname }
 * @param {string} folder - Pasta dentro do bucket (ex: "patients/abc123")
 * @returns {{ key: string, url: string }}
 */
export async function uploadFile(file, folder = "uploads") {
  const ext = path.extname(file.originalname).toLowerCase();
  const key = `${folder}/${randomUUID()}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: `${PUBLIC_URL}/${key}`,
  };
}

/**
 * Remove um arquivo do R2 pelo key.
 * @param {string} key - Caminho do arquivo no bucket
 */
export async function deleteFile(key) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Extrai o key do R2 a partir da URL pública.
 * @param {string} url
 * @returns {string}
 */
export function keyFromUrl(url) {
  return url.replace(`${PUBLIC_URL}/`, "");
}
