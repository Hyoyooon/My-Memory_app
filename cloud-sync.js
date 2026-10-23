/**
 * cloud-sync.js
 * Offline-First Storage (LocalStorage) + Supabase Cloud DB Real-time Sync
 * Works seamlessly on both file:// (double-click index.html) and https:// (GitHub Pages / PWA)
 */

(function (global) {
  const STORAGE_KEYS = {
    PIECES: "my_journal_pieces_v1",
    CHECKLISTS: "my_journal_checklists_v1",
    CLOUD_CONFIG: "my_journal_cloud_config_v1",
  };

  class JournalStorageSync {
    constructor(onDataChanged) {
      this.onDataChanged = onDataChanged;
      this.supabase = null;
      this.realtimeChannel = null;
      this.isOnlineSynced = false;
      this.memoryFallback = {};
      this.config = this.loadCloudConfig();
    }

    safeGetItem(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return this.memoryFallback[key] || null;
      }
    }

    safeSetItem(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (e) {
        this.memoryFallback[key] = val;
      }
    }

    loadCloudConfig() {
      try {
        const raw = this.safeGetItem(STORAGE_KEYS.CLOUD_CONFIG);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn("Failed to parse cloud config", e);
      }
      return {
        supabaseUrl: "",
        supabaseAnonKey: "",
        workspaceId: "personal-default",
      };
    }

    saveCloudConfig(newConfig) {
      this.config = {
        supabaseUrl: (newConfig.supabaseUrl || "").trim(),
        supabaseAnonKey: (newConfig.supabaseAnonKey || "").trim(),
        workspaceId: (newConfig.workspaceId || "personal-default").trim(),
      };
      this.safeSetItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(this.config));
    }

    hasValidCloudConfig() {
      return Boolean(
        this.config.supabaseUrl &&
          this.config.supabaseUrl.startsWith("http") &&
          this.config.supabaseAnonKey &&
          global.supabase
      );
    }

    async initCloud() {
      if (!this.hasValidCloudConfig()) {
        this.isOnlineSynced = false;
        this.notifyStatus();
        return false;
      }

      try {
        const { createClient } = global.supabase;
        this.supabase = createClient(
          this.config.supabaseUrl,
          this.config.supabaseAnonKey
        );

        await this.pullAndMergeFromCloud();

        if (this.realtimeChannel) {
          this.supabase.removeChannel(this.realtimeChannel);
        }

        this.realtimeChannel = this.supabase
          .channel("journal-realtime-sync")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "journal_pieces",
              filter: `workspace_id=eq.${this.config.workspaceId}`,
            },
            () => {
              this.pullAndMergeFromCloud();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "journal_checklists",
              filter: `workspace_id=eq.${this.config.workspaceId}`,
            },
            () => {
              this.pullAndMergeFromCloud();
            }
          )
          .subscribe((status) => {
            this.isOnlineSynced = status === "SUBSCRIBED";
            this.notifyStatus();
          });

        this.isOnlineSynced = true;
        this.notifyStatus();
        return true;
      } catch (err) {
        console.error("Cloud init error:", err);
        this.isOnlineSynced = false;
        this.notifyStatus();
        return false;
      }
    }

    notifyStatus() {
      if (typeof this.onDataChanged === "function") {
        this.onDataChanged({ type: "status", isOnline: this.isOnlineSynced });
      }
    }

    getLocalPieces() {
      try {
        const raw = this.safeGetItem(STORAGE_KEYS.PIECES);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error("Error reading local pieces", e);
        return null;
      }
    }

    saveLocalPieces(pieces) {
      try {
        this.safeSetItem(STORAGE_KEYS.PIECES, JSON.stringify(pieces));
      } catch (e) {
        console.error("Quota or storage error saving pieces", e);
      }
    }

    getLocalChecklists() {
      try {
        const raw = this.safeGetItem(STORAGE_KEYS.CHECKLISTS);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error("Error reading local checklists", e);
        return null;
      }
    }

    saveLocalChecklists(checklists) {
      try {
        this.safeSetItem(STORAGE_KEYS.CHECKLISTS, JSON.stringify(checklists));
      } catch (e) {
        console.error("Error saving checklists", e);
      }
    }

    async pullAndMergeFromCloud() {
      if (!this.supabase) return;

      try {
        const [piecesRes, checkRes] = await Promise.all([
          this.supabase
            .from("journal_pieces")
            .select("*")
            .eq("workspace_id", this.config.workspaceId),
          this.supabase
            .from("journal_checklists")
            .select("*")
            .eq("workspace_id", this.config.workspaceId),
        ]);

        if (!piecesRes.error && Array.isArray(piecesRes.data)) {
          const localPieces = this.getLocalPieces() || [];
          const map = new Map();
          localPieces.forEach((p) => map.set(p.id, p));

          piecesRes.data.forEach((row) => {
            const remotePiece = row.payload;
            if (!remotePiece || !remotePiece.id) return;
            const existing = map.get(remotePiece.id);
            if (
              !existing ||
              new Date(remotePiece.updatedAt || 0) >=
                new Date(existing.updatedAt || 0)
            ) {
              map.set(remotePiece.id, remotePiece);
            }
          });

          const mergedPieces = Array.from(map.values()).filter((p) => !p.deleted);
          this.saveLocalPieces(mergedPieces);
        }

        if (!checkRes.error && Array.isArray(checkRes.data)) {
          const localChecks = this.getLocalChecklists() || [];
          const cMap = new Map();
          localChecks.forEach((c) => cMap.set(c.id, c));

          checkRes.data.forEach((row) => {
            const remoteCheck = row.payload;
            if (!remoteCheck || !remoteCheck.id) return;
            const existing = cMap.get(remoteCheck.id);
            if (
              !existing ||
              new Date(remoteCheck.updatedAt || 0) >=
                new Date(existing.updatedAt || 0)
            ) {
              cMap.set(remoteCheck.id, remoteCheck);
            }
          });

          const mergedChecks = Array.from(cMap.values()).filter((c) => !c.deleted);
          this.saveLocalChecklists(mergedChecks);
        }

        if (typeof this.onDataChanged === "function") {
          this.onDataChanged({ type: "merged" });
        }
      } catch (err) {
        console.warn("Cloud pull failed:", err);
      }
    }

    async upsertPieceToCloud(piece) {
      if (!this.supabase || !this.isOnlineSynced) return;
      try {
        await this.supabase.from("journal_pieces").upsert(
          {
            id: piece.id,
            workspace_id: this.config.workspaceId,
            category: piece.category,
            date: piece.date,
            bookmarked: Boolean(piece.bookmarked),
            updated_at: piece.updatedAt || new Date().toISOString(),
            payload: piece,
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.warn("Failed to upsert piece to cloud:", err);
      }
    }

    async deletePieceFromCloud(pieceId) {
      if (!this.supabase || !this.isOnlineSynced) return;
      try {
        await this.supabase
          .from("journal_pieces")
          .delete()
          .eq("id", pieceId)
          .eq("workspace_id", this.config.workspaceId);
      } catch (err) {
        console.warn("Failed to delete piece from cloud:", err);
      }
    }

    async upsertChecklistToCloud(item) {
      if (!this.supabase || !this.isOnlineSynced) return;
      try {
        await this.supabase.from("journal_checklists").upsert(
          {
            id: item.id,
            workspace_id: this.config.workspaceId,
            category: item.category,
            date: item.date,
            updated_at: item.updatedAt || new Date().toISOString(),
            payload: item,
          },
          { onConflict: "id" }
        );
      } catch (err) {
        console.warn("Failed to upsert checklist to cloud:", err);
      }
    }

    async deleteChecklistFromCloud(itemId) {
      if (!this.supabase || !this.isOnlineSynced) return;
      try {
        await this.supabase
          .from("journal_checklists")
          .delete()
          .eq("id", itemId)
          .eq("workspace_id", this.config.workspaceId);
      } catch (err) {
        console.warn("Failed to delete checklist from cloud:", err);
      }
    }

    async pushAllLocalToCloud(pieces, checklists) {
      if (!this.supabase) return false;
      try {
        if (pieces.length > 0) {
          const pieceRows = pieces.map((p) => ({
            id: p.id,
            workspace_id: this.config.workspaceId,
            category: p.category,
            date: p.date,
            bookmarked: Boolean(p.bookmarked),
            updated_at: p.updatedAt || new Date().toISOString(),
            payload: p,
          }));
          await this.supabase
            .from("journal_pieces")
            .upsert(pieceRows, { onConflict: "id" });
        }
        if (checklists.length > 0) {
          const checkRows = checklists.map((c) => ({
            id: c.id,
            workspace_id: this.config.workspaceId,
            category: c.category,
            date: c.date,
            updated_at: c.updatedAt || new Date().toISOString(),
            payload: c,
          }));
          await this.supabase
            .from("journal_checklists")
            .upsert(checkRows, { onConflict: "id" });
        }
        return true;
      } catch (e) {
        console.error("Failed pushing all local data to cloud:", e);
        return false;
      }
    }
  }

  const SUPABASE_SETUP_SQL = `-- Supabase SQL Editor에 아래 쿼리를 복사하여 실행하세요:
create table if not exists public.journal_pieces (
  id text primary key,
  workspace_id text not null default 'personal-default',
  category text,
  date text,
  bookmarked boolean default false,
  updated_at timestamptz default now(),
  payload jsonb not null
);

create table if not exists public.journal_checklists (
  id text primary key,
  workspace_id text not null default 'personal-default',
  category text,
  date text,
  updated_at timestamptz default now(),
  payload jsonb not null
);

alter table public.journal_pieces enable row level security;
alter table public.journal_checklists enable row level security;

create policy "Allow public access by workspace_id" on public.journal_pieces
  for all using (true) with check (true);

create policy "Allow public access by workspace_id" on public.journal_checklists
  for all using (true) with check (true);`;

  global.JournalStorageSync = JournalStorageSync;
  global.SUPABASE_SETUP_SQL = SUPABASE_SETUP_SQL;
})(window);
