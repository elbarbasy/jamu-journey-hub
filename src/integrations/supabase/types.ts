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
      app_config: {
        Row: {
          id: number
          nomor_antrian_counter: number
          threshold_urgensi_menit: number
          toko_status: Database["public"]["Enums"]["toko_status"]
          updated_at: string
        }
        Insert: {
          id?: number
          nomor_antrian_counter?: number
          threshold_urgensi_menit?: number
          toko_status?: Database["public"]["Enums"]["toko_status"]
          updated_at?: string
        }
        Update: {
          id?: number
          nomor_antrian_counter?: number
          threshold_urgensi_menit?: number
          toko_status?: Database["public"]["Enums"]["toko_status"]
          updated_at?: string
        }
        Relationships: []
      }
      filter_chips: {
        Row: {
          created_at: string
          id: string
          is_special: boolean
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_special?: boolean
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_special?: boolean
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          created_at: string
          id: string
          kategori: Database["public"]["Enums"]["ingredient_kategori"]
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          kategori: Database["public"]["Enums"]["ingredient_kategori"]
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          kategori?: Database["public"]["Enums"]["ingredient_kategori"]
          nama?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          customization: Json
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          customization?: Json
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          customization?: Json
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          customer_whatsapp: string
          id: string
          idempotency_key: string | null
          nomor_tampilan: Json | null
          notes: string | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_code: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_whatsapp: string
          id?: string
          idempotency_key?: string | null
          nomor_tampilan?: Json | null
          notes?: string | null
          order_number?: string
          order_type: Database["public"]["Enums"]["order_type"]
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_code?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_whatsapp?: string
          id?: string
          idempotency_key?: string | null
          nomor_tampilan?: Json | null
          notes?: string | null
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_code?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_filter_chips: {
        Row: {
          filter_chip_id: string
          product_id: string
        }
        Insert: {
          filter_chip_id: string
          product_id: string
        }
        Update: {
          filter_chip_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_filter_chips_filter_chip_id_fkey"
            columns: ["filter_chip_id"]
            isOneToOne: false
            referencedRelation: "filter_chips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_filter_chips_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          ingredient_id: string
          product_id: string
        }
        Insert: {
          ingredient_id: string
          product_id: string
        }
        Update: {
          ingredient_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string
          deskripsi_kontekstual: Json
          experience_tags: string[]
          filter_chip_unggulan_id: string | null
          flavor_tags: string[]
          id: string
          image_url: string | null
          ingredients: string[]
          is_active: boolean
          name: string
          price: number
          quiz_mapping: Json
          status_stok: Database["public"]["Enums"]["stok_status"]
          supports_creamy: boolean
          supports_sweetness: boolean
          supports_temperature: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          deskripsi_kontekstual?: Json
          experience_tags?: string[]
          filter_chip_unggulan_id?: string | null
          flavor_tags?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_active?: boolean
          name: string
          price: number
          quiz_mapping?: Json
          status_stok?: Database["public"]["Enums"]["stok_status"]
          supports_creamy?: boolean
          supports_sweetness?: boolean
          supports_temperature?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          deskripsi_kontekstual?: Json
          experience_tags?: string[]
          filter_chip_unggulan_id?: string | null
          flavor_tags?: string[]
          id?: string
          image_url?: string | null
          ingredients?: string[]
          is_active?: boolean
          name?: string
          price?: number
          quiz_mapping?: Json
          status_stok?: Database["public"]["Enums"]["stok_status"]
          supports_creamy?: boolean
          supports_sweetness?: boolean
          supports_temperature?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_filter_chip_unggulan_id_fkey"
            columns: ["filter_chip_unggulan_id"]
            isOneToOne: false
            referencedRelation: "filter_chips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      shift_notes: {
        Row: {
          created_at: string
          id: string
          kategori: Database["public"]["Enums"]["shift_note_kategori"]
          keterangan: string
          nominal: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          kategori: Database["public"]["Enums"]["shift_note_kategori"]
          keterangan?: string
          nominal?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          kategori?: Database["public"]["Enums"]["shift_note_kategori"]
          keterangan?: string
          nominal?: number | null
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Enums: {
      app_role: "owner" | "cashier"
      ingredient_kategori:
        | "rimpang_segar"
        | "rempah_kering"
        | "daun_bunga"
        | "asam_sitrus"
        | "pemanis"
      order_status:
        | "WAITING_PAYMENT"
        | "PAID"
        | "PROCESSING"
        | "READY_FOR_PICKUP"
        | "COMPLETED"
        | "CANCELLED"
      order_type: "DINE_IN" | "TAKE_AWAY"
      payment_method: "QRIS" | "CASH"
      payment_status: "PENDING" | "SUCCESS" | "FAILED"
      shift_note_kategori:
        | "pengeluaran"
        | "selisih_kas_kurang"
        | "selisih_kas_lebih"
        | "catatan_kas"
        | "lainnya"
      stok_status: "tersedia" | "habis_hari_ini"
      toko_status: "buka" | "tutup"
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
      app_role: ["owner", "cashier"],
      ingredient_kategori: [
        "rimpang_segar",
        "rempah_kering",
        "daun_bunga",
        "asam_sitrus",
        "pemanis",
      ],
      order_status: [
        "WAITING_PAYMENT",
        "PAID",
        "PROCESSING",
        "READY_FOR_PICKUP",
        "COMPLETED",
        "CANCELLED",
      ],
      order_type: ["DINE_IN", "TAKE_AWAY"],
      payment_method: ["QRIS", "CASH"],
      payment_status: ["PENDING", "SUCCESS", "FAILED"],
      shift_note_kategori: [
        "pengeluaran",
        "selisih_kas_kurang",
        "selisih_kas_lebih",
        "catatan_kas",
        "lainnya",
      ],
      stok_status: ["tersedia", "habis_hari_ini"],
      toko_status: ["buka", "tutup"],
    },
  },
} as const
