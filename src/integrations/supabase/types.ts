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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ability_checks: {
        Row: {
          ability: string
          advantage: boolean | null
          character_id: string | null
          character_name: string
          check_type: string
          created_at: string | null
          dc: number | null
          description: string | null
          disadvantage: boolean | null
          id: string
          is_secret: boolean | null
          modifier: number
          npc_id: string | null
          requested_by_gm: boolean | null
          roll_result: number
          room_id: string
          success: boolean | null
          total: number
        }
        Insert: {
          ability: string
          advantage?: boolean | null
          character_id?: string | null
          character_name: string
          check_type: string
          created_at?: string | null
          dc?: number | null
          description?: string | null
          disadvantage?: boolean | null
          id?: string
          is_secret?: boolean | null
          modifier: number
          npc_id?: string | null
          requested_by_gm?: boolean | null
          roll_result: number
          room_id: string
          success?: boolean | null
          total: number
        }
        Update: {
          ability?: string
          advantage?: boolean | null
          character_id?: string | null
          character_name?: string
          check_type?: string
          created_at?: string | null
          dc?: number | null
          description?: string | null
          disadvantage?: boolean | null
          id?: string
          is_secret?: boolean | null
          modifier?: number
          npc_id?: string | null
          requested_by_gm?: boolean | null
          roll_result?: number
          room_id?: string
          success?: boolean | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ability_checks_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ability_checks_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ability_checks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      action_rounds: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          id: string
          prompt: string
          room_id: string
          round_number: number
          use_initiative_order: boolean
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          prompt: string
          room_id: string
          round_number?: number
          use_initiative_order?: boolean
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          prompt?: string
          room_id?: string
          round_number?: number
          use_initiative_order?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "action_rounds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      character_items: {
        Row: {
          character_id: string
          created_at: string | null
          description: string | null
          equipped: boolean | null
          id: string
          item_name: string
          item_type: string
          properties: Json | null
          quantity: number
          updated_at: string | null
          weight: number
        }
        Insert: {
          character_id: string
          created_at?: string | null
          description?: string | null
          equipped?: boolean | null
          id?: string
          item_name: string
          item_type?: string
          properties?: Json | null
          quantity?: number
          updated_at?: string | null
          weight?: number
        }
        Update: {
          character_id?: string
          created_at?: string | null
          description?: string | null
          equipped?: boolean | null
          id?: string
          item_name?: string
          item_type?: string
          properties?: Json | null
          quantity?: number
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          armor_class: number
          background: string | null
          backstory: string | null
          carrying_capacity: number | null
          charisma: number
          class: string
          constitution: number
          copper_pieces: number | null
          created_at: string
          current_hit_dice: number | null
          current_hp: number
          current_spell_slots: Json | null
          dexterity: number
          electrum_pieces: number | null
          equipped_weapon: Json | null
          experience_points: number | null
          experience_to_next_level: number | null
          gold_pieces: number | null
          hit_dice: string | null
          id: string
          inspiration: boolean
          intelligence: number
          level: number
          max_hp: number
          name: string
          platinum_pieces: number | null
          proficiency_bonus: number
          race: string
          saving_throws: Json | null
          silver_pieces: number | null
          spell_slots: Json | null
          strength: number
          updated_at: string
          user_id: string
          wisdom: number
        }
        Insert: {
          armor_class?: number
          background?: string | null
          backstory?: string | null
          carrying_capacity?: number | null
          charisma: number
          class: string
          constitution: number
          copper_pieces?: number | null
          created_at?: string
          current_hit_dice?: number | null
          current_hp: number
          current_spell_slots?: Json | null
          dexterity: number
          electrum_pieces?: number | null
          equipped_weapon?: Json | null
          experience_points?: number | null
          experience_to_next_level?: number | null
          gold_pieces?: number | null
          hit_dice?: string | null
          id?: string
          inspiration?: boolean
          intelligence: number
          level?: number
          max_hp: number
          name: string
          platinum_pieces?: number | null
          proficiency_bonus?: number
          race: string
          saving_throws?: Json | null
          silver_pieces?: number | null
          spell_slots?: Json | null
          strength: number
          updated_at?: string
          user_id: string
          wisdom: number
        }
        Update: {
          armor_class?: number
          background?: string | null
          backstory?: string | null
          carrying_capacity?: number | null
          charisma?: number
          class?: string
          constitution?: number
          copper_pieces?: number | null
          created_at?: string
          current_hit_dice?: number | null
          current_hp?: number
          current_spell_slots?: Json | null
          dexterity?: number
          electrum_pieces?: number | null
          equipped_weapon?: Json | null
          experience_points?: number | null
          experience_to_next_level?: number | null
          gold_pieces?: number | null
          hit_dice?: string | null
          id?: string
          inspiration?: boolean
          intelligence?: number
          level?: number
          max_hp?: number
          name?: string
          platinum_pieces?: number | null
          proficiency_bonus?: number
          race?: string
          saving_throws?: Json | null
          silver_pieces?: number | null
          spell_slots?: Json | null
          strength?: number
          updated_at?: string
          user_id?: string
          wisdom?: number
        }
        Relationships: []
      }
      check_requests: {
        Row: {
          ability: string
          check_type: string
          completed: boolean | null
          created_at: string | null
          created_by: string
          dc: number
          description: string | null
          expires_at: string | null
          id: string
          room_id: string
          target_all: boolean | null
          target_character_id: string | null
        }
        Insert: {
          ability: string
          check_type: string
          completed?: boolean | null
          created_at?: string | null
          created_by: string
          dc: number
          description?: string | null
          expires_at?: string | null
          id?: string
          room_id: string
          target_all?: boolean | null
          target_character_id?: string | null
        }
        Update: {
          ability?: string
          check_type?: string
          completed?: boolean | null
          created_at?: string | null
          created_by?: string
          dc?: number
          description?: string | null
          expires_at?: string | null
          id?: string
          room_id?: string
          target_all?: boolean | null
          target_character_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_requests_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_log: {
        Row: {
          action_type: string
          character_name: string
          created_at: string
          damage: number | null
          description: string
          id: string
          roll_result: number | null
          room_id: string
          round_number: number
          target_name: string | null
        }
        Insert: {
          action_type: string
          character_name: string
          created_at?: string
          damage?: number | null
          description: string
          id?: string
          roll_result?: number | null
          room_id: string
          round_number: number
          target_name?: string | null
        }
        Update: {
          action_type?: string
          character_name?: string
          created_at?: string
          damage?: number | null
          description?: string
          id?: string
          roll_result?: number | null
          room_id?: string
          round_number?: number
          target_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combat_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_rewards: {
        Row: {
          amount: number
          awarded_by: string
          character_id: string
          created_at: string | null
          id: string
          reason: string | null
          room_id: string
        }
        Insert: {
          amount: number
          awarded_by: string
          character_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          room_id: string
        }
        Update: {
          amount?: number
          awarded_by?: string
          character_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_rewards_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_rewards_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      gm_messages: {
        Row: {
          character_name: string
          content: string
          created_at: string
          id: string
          player_id: string
          room_id: string
          sender: string
          type: string
        }
        Insert: {
          character_name: string
          content: string
          created_at?: string
          id?: string
          player_id: string
          room_id: string
          sender: string
          type?: string
        }
        Update: {
          character_name?: string
          content?: string
          created_at?: string
          id?: string
          player_id?: string
          room_id?: string
          sender?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gm_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      item_rewards: {
        Row: {
          auto_added: boolean
          awarded_by: string
          character_id: string
          created_at: string
          description: string | null
          id: string
          item_name: string
          item_type: string
          properties: Json | null
          quantity: number
          reason: string | null
          room_id: string
          weight: number
        }
        Insert: {
          auto_added?: boolean
          awarded_by: string
          character_id: string
          created_at?: string
          description?: string | null
          id?: string
          item_name: string
          item_type?: string
          properties?: Json | null
          quantity?: number
          reason?: string | null
          room_id: string
          weight?: number
        }
        Update: {
          auto_added?: boolean
          awarded_by?: string
          character_id?: string
          created_at?: string
          description?: string | null
          id?: string
          item_name?: string
          item_type?: string
          properties?: Json | null
          quantity?: number
          reason?: string | null
          room_id?: string
          weight?: number
        }
        Relationships: []
      }
      item_trades: {
        Row: {
          completed_at: string | null
          created_at: string
          from_character_id: string
          id: string
          item_id: string
          item_name: string
          quantity: number
          room_id: string
          status: string
          to_character_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          from_character_id: string
          id?: string
          item_id: string
          item_name: string
          quantity?: number
          room_id: string
          status?: string
          to_character_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          from_character_id?: string
          id?: string
          item_id?: string
          item_name?: string
          quantity?: number
          room_id?: string
          status?: string
          to_character_id?: string
        }
        Relationships: []
      }
      npcs: {
        Row: {
          armor_class: number
          attack_bonus: number
          charisma: number
          conditions: Json | null
          constitution: number
          created_at: string
          creature_type: string
          current_hp: number
          damage_dice: string
          damage_type: string
          dexterity: number
          id: string
          initiative: number | null
          initiative_bonus: number
          intelligence: number
          max_hp: number
          name: string
          notes: string | null
          room_id: string
          strength: number
          updated_at: string
          wisdom: number
        }
        Insert: {
          armor_class?: number
          attack_bonus?: number
          charisma?: number
          conditions?: Json | null
          constitution?: number
          created_at?: string
          creature_type?: string
          current_hp: number
          damage_dice?: string
          damage_type?: string
          dexterity?: number
          id?: string
          initiative?: number | null
          initiative_bonus?: number
          intelligence?: number
          max_hp: number
          name: string
          notes?: string | null
          room_id: string
          strength?: number
          updated_at?: string
          wisdom?: number
        }
        Update: {
          armor_class?: number
          attack_bonus?: number
          charisma?: number
          conditions?: Json | null
          constitution?: number
          created_at?: string
          creature_type?: string
          current_hp?: number
          damage_dice?: string
          damage_type?: string
          dexterity?: number
          id?: string
          initiative?: number | null
          initiative_bonus?: number
          intelligence?: number
          max_hp?: number
          name?: string
          notes?: string | null
          room_id?: string
          strength?: number
          updated_at?: string
          wisdom?: number
        }
        Relationships: [
          {
            foreignKeyName: "npcs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      player_actions: {
        Row: {
          action_round_id: string
          action_text: string
          character_id: string
          id: string
          initiative: number | null
          player_id: string
          submitted_at: string
        }
        Insert: {
          action_round_id: string
          action_text: string
          character_id: string
          id?: string
          initiative?: number | null
          player_id: string
          submitted_at?: string
        }
        Update: {
          action_round_id?: string
          action_text?: string
          character_id?: string
          id?: string
          initiative?: number | null
          player_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_actions_action_round_id_fkey"
            columns: ["action_round_id"]
            isOneToOne: false
            referencedRelation: "action_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      player_reactions: {
        Row: {
          character_name: string
          created_at: string
          expires_at: string
          id: string
          player_id: string
          reaction_content: string
          reaction_type: string
          room_id: string
          target_message_id: string | null
        }
        Insert: {
          character_name: string
          created_at?: string
          expires_at?: string
          id?: string
          player_id: string
          reaction_content: string
          reaction_type: string
          room_id: string
          target_message_id?: string | null
        }
        Update: {
          character_name?: string
          created_at?: string
          expires_at?: string
          id?: string
          player_id?: string
          reaction_content?: string
          reaction_type?: string
          room_id?: string
          target_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_reactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_chat_messages: {
        Row: {
          character_name: string
          created_at: string
          id: string
          is_narrative: boolean | null
          message: string
          room_id: string
          user_id: string
        }
        Insert: {
          character_name: string
          created_at?: string
          id?: string
          is_narrative?: boolean | null
          message: string
          room_id: string
          user_id: string
        }
        Update: {
          character_name?: string
          created_at?: string
          id?: string
          is_narrative?: boolean | null
          message?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          character_id: string
          conditions: Json | null
          id: string
          initiative: number | null
          is_ready: boolean
          joined_at: string
          room_id: string
          temp_hp: number | null
          user_id: string
        }
        Insert: {
          character_id: string
          conditions?: Json | null
          id?: string
          initiative?: number | null
          is_ready?: boolean
          joined_at?: string
          room_id: string
          temp_hp?: number | null
          user_id: string
        }
        Update: {
          character_id?: string
          conditions?: Json | null
          id?: string
          initiative?: number | null
          is_ready?: boolean
          joined_at?: string
          room_id?: string
          temp_hp?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_players_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          combat_active: boolean
          created_at: string
          current_turn: number | null
          gm_id: string
          id: string
          initiative_order: Json | null
          room_code: string
          session_active: boolean
        }
        Insert: {
          combat_active?: boolean
          created_at?: string
          current_turn?: number | null
          gm_id: string
          id?: string
          initiative_order?: Json | null
          room_code: string
          session_active?: boolean
        }
        Update: {
          combat_active?: boolean
          created_at?: string
          current_turn?: number | null
          gm_id?: string
          id?: string
          initiative_order?: Json | null
          room_code?: string
          session_active?: boolean
        }
        Relationships: []
      }
      session_snapshots: {
        Row: {
          combat_round: number | null
          created_at: string
          id: string
          message_count: number
          notes: string | null
          room_id: string
          session_data: Json
        }
        Insert: {
          combat_round?: number | null
          created_at?: string
          id?: string
          message_count?: number
          notes?: string | null
          room_id: string
          session_data: Json
        }
        Update: {
          combat_round?: number | null
          created_at?: string
          id?: string
          message_count?: number
          notes?: string | null
          room_id?: string
          session_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "session_snapshots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_modifier: { Args: { ability_score: number }; Returns: number }
      cleanup_expired_reactions: { Args: never; Returns: undefined }
      generate_room_code: { Args: never; Returns: string }
      user_is_in_room: {
        Args: { room_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
