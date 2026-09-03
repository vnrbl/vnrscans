import { supabase } from "@/integrations/supabase/client";

export interface RecycleBinItem {
  id: string;
  item_type: "series" | "chapter" | "comment" | "banner" | "announcement" | "other";
  item_id: string;
  title: string;
  original_table: string;
  metadata: Record<string, any>;
  deleted_by: string | null;
  deleted_by_username: string | null;
  deleted_at: string;
  expires_at: string;
}

/**
 * Move any entity to the Recycle Bin prior to or during deletion
 */
export async function moveToRecycleBin(params: {
  itemType: "series" | "chapter" | "comment" | "banner" | "announcement" | "other";
  itemId: string;
  title: string;
  originalTable: string;
  metadata: Record<string, any>;
  deletedBy?: string | null;
  deletedByUsername?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any).from("recycle_bin").insert({
      item_type: params.itemType,
      item_id: params.itemId,
      title: params.title,
      original_table: params.originalTable,
      metadata: params.metadata,
      deleted_by: params.deletedBy || null,
      deleted_by_username: params.deletedByUsername || null,
      deleted_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      console.warn("[RecycleBin] Error moving item to recycle bin:", error);
      // Even if remote insert fails, log warning so deletion continues
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn("[RecycleBin] Exception moving item to recycle bin:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Restore an item from the Recycle Bin back to its primary table
 */
export async function restoreRecycleBinItem(item: RecycleBinItem): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try server RPC first
    const { error: rpcError } = await (supabase as any).rpc("restore_recycle_bin_item", {
      bin_id: item.id,
    });

    if (!rpcError) {
      return { success: true };
    }

    // 2. Fallback client restoration
    const meta = item.metadata || {};
    if (item.item_type === "series") {
      const { error: insertError } = await (supabase.from("series") as any).upsert({
        id: meta.id || item.item_id,
        title: meta.title || item.title,
        slug: meta.slug,
        description: meta.description,
        cover_url: meta.cover_url,
        banner_url: meta.banner_url,
        type: meta.type || "manhwa",
        status: meta.status || "ongoing",
        release_year: meta.release_year,
        author: meta.author,
        artist: meta.artist,
        serialization: meta.serialization,
        created_at: meta.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
    } else if (item.item_type === "chapter") {
      const { error: insertError } = await (supabase.from("chapters") as any).upsert({
        id: meta.id || item.item_id,
        series_id: meta.series_id,
        chapter_number: meta.chapter_number,
        title: meta.title || item.title,
        slug: meta.slug,
        status: meta.status || "published",
        created_at: meta.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
    } else if (item.item_type === "comment") {
      const { error: insertError } = await (supabase.from("comments") as any).insert({
        id: meta.id || item.item_id,
        user_id: meta.user_id,
        series_id: meta.series_id,
        chapter_id: meta.chapter_id,
        content: meta.content,
        parent_id: meta.parent_id,
        created_at: meta.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
    }

    // Delete from recycle bin after successful restoration
    await (supabase as any).from("recycle_bin").delete().eq("id", item.id);
    return { success: true };
  } catch (err: any) {
    console.error("[RecycleBin] Failed to restore item:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Permanently purge an item from the Recycle Bin
 */
export async function permanentlyDeleteItem(binId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any).from("recycle_bin").delete().eq("id", binId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Empty the entire Recycle Bin
 */
export async function emptyAllRecycleBin(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: rpcError } = await (supabase as any).rpc("empty_recycle_bin");
    if (!rpcError) return { success: true };

    const { error } = await (supabase as any).from("recycle_bin").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
