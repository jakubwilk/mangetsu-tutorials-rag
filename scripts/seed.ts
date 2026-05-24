import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

import { PrismaClient } from "../src/generated/prisma/client";
import { chunkText } from "../src/lib/chunker";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const CONTENT_DIR = path.join(process.cwd(), "content");

const getTitle = (filePath: string): string => {
  const name = path.basename(filePath, ".md");
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const seedDocument = async (filePath: string, category: string) => {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  const title = getTitle(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkText(content);

  await db.document.upsert({
    where: { filePath: relativePath },
    update: { title, category },
    create: { title, category, filePath: relativePath },
  });

  const doc = await db.document.findUniqueOrThrow({ where: { filePath: relativePath } });

  await db.chunk.deleteMany({ where: { documentId: doc.id } });

  for (const chunk of chunks) {
    await db.chunk.create({
      data: {
        documentId: doc.id,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
      },
    });
  }

  console.log(`  [${category}] ${title} — ${chunks.length} chunks`);
};

const main = async () => {
  console.log("Seeding content...\n");

  const categories = fs.readdirSync(CONTENT_DIR).filter((entry) =>
    fs.statSync(path.join(CONTENT_DIR, entry)).isDirectory()
  );

  for (const category of categories) {
    const categoryDir = path.join(CONTENT_DIR, category);
    const files = fs
      .readdirSync(categoryDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => path.join(categoryDir, f));

    for (const file of files) {
      await seedDocument(file, category);
    }
  }

  const docCount = await db.document.count();
  const chunkCount = await db.chunk.count();
  console.log(`\nDone. ${docCount} documents, ${chunkCount} chunks total.`);
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
