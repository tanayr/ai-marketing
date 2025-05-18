import { db } from "@/db";
import { files } from "@/db/schema/files";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

/**
 * Service for managing uploads
 */
export class UploadsService {
  /**
   * Save upload record to database
   */
  static async saveUpload({
    organizationId,
    userId,
    fileName,
    fileKey,
    fileUrl,
    contentType,
    filePath,
    fileSize,
  }: {
    organizationId: string;
    userId: string;
    fileName: string;
    fileKey: string;
    fileUrl: string;
    contentType: string;
    filePath: string;
    fileSize?: string;
  }) {
    return await db.insert(files).values({
      organizationId,
      userId,
      fileName,
      fileKey,
      fileUrl,
      contentType,
      filePath,
      fileSize,
    }).returning();
  }

  /**
   * Get all uploads for an organization
   */
  static async getUploadsForOrganization(organizationId: string) {
    return await db
      .select()
      .from(files)
      .where(eq(files.organizationId, organizationId))
      .orderBy(files.createdAt);
  }

  /**
   * Get a specific upload by id
   */
  static async getUpload(id: string, organizationId: string) {
    const [upload] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.organizationId, organizationId)
        )
      );
    
    if (!upload) {
      notFound();
    }
    
    return upload;
  }

  /**
   * Delete an upload
   */
  static async deleteUpload(id: string, organizationId: string) {
    const [upload] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, id),
          eq(files.organizationId, organizationId)
        )
      );
    
    if (!upload) {
      notFound();
    }
    
    // Delete from database
    await db
      .delete(files)
      .where(eq(files.id, id));
    
    return upload;
  }
}
