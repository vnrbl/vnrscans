export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_pages: {
        Row: {
          chapter_id: string
          id: string
          image_url: string
          page_number: number
        }
        Insert: {
          chapter_id: string
          id?: string
          image_url: string
          page_number: number
        }
        Update: {
          chapter_id?: string
          id?: string
          image_url?: string
          page_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapter_pages_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          chapter_type: Database["public"]["Enums"]["chapter_type"]
          created_at: string
          id: string
          novel_content: string | null
          scheduled_at: string | null
          series_id: string
          slug: string
          status: Database["public"]["Enums"]["chapter_status"]
          title: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          chapter_number: number
          chapter_type?: Database["public"]["Enums"]["chapter_type"]
          created_at?: string
          id?: string
          novel_content?: string | null
          scheduled_at?: string | null
          series_id: string
          slug: string
          status?: Database["public"]["Enums"]["chapter_status"]
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          chapter_number?: number
          chapter_type?: Database["public"]["Enums"]["chapter_type"]
          created_at?: string
          id?: string
          novel_content?: string | null
          scheduled_at?: string | null
          series_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["chapter_status"]
          title?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          chapter_id: string | null
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          series_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          series_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          series_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          chapter_id: string
          id: string
          progress: number
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          id?: string
          progress?: number
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          id?: string
          progress?: number
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      series: {
        Row: {
          alternative_titles: string | null
          artist: string | null
          author: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_hidden: boolean
          is_trending: boolean
          rating_average: number
          release_year: number | null
          slug: string
          status: Database["public"]["Enums"]["series_status"]
          title: string
          type: Database["public"]["Enums"]["series_type"]
          updated_at: string
          view_count: number
        }
        Insert: {
          alternative_titles?: string | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_trending?: boolean
          rating_average?: number
          release_year?: number | null
          slug: string
          status?: Database["public"]["Enums"]["series_status"]
          title: string
          type?: Database["public"]["Enums"]["series_type"]
          updated_at?: string
          view_count?: number
        }
        Update: {
          alternative_titles?: string | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_trending?: boolean
          rating_average?: number
          release_year?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["series_status"]
          title?: string
          type?: Database["public"]["Enums"]["series_type"]
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      series_genres: {
        Row: {
          genre_id: string
          id: string
          series_id: string
        }
        Insert: {
          genre_id: string
          id?: string
          series_id: string
        }
        Update: {
          genre_id?: string
          id?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_genres_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chapter_view: {
        Args: {
          _chapter_id: string
        }
        Returns: undefined
      }
      increment_series_view: {
        Args: {
          _series_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "uploader"
      chapter_status: "draft" | "published" | "scheduled"
      chapter_type: "image" | "novel"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      series_status: "ongoing" | "completed" | "hiatus"
      series_type: "manga" | "manhwa" | "manhua" | "novel"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "moderator", "admin", "uploader"],
      chapter_status: ["draft", "published", "scheduled"],
      chapter_type: ["image", "novel"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      series_status: ["ongoing", "completed", "hiatus"],
      series_type: ["manga", "manhwa", "manhua", "novel"],
    },
  },
} as const
