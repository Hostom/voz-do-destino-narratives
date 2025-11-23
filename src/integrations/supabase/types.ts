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
      auction_bids: {
        Row: {
          auction_id: string
          bid_amount: number
          character_id: string
          created_at: string
          id: string
        }
        Insert: {
          auction_id: string
          bid_amount: number
          character_id: string
          created_at?: string
          id?: string
        }
        Update: {
          auction_id?: string
          bid_amount?: number
          character_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "merchant_auctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auction_bids_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
      crafting_recipes: {
        Row: {
          crafting_time_minutes: number
          created_at: string
          description: string | null
          difficulty_dc: number
          id: string
          name: string
          rarity: string
          required_items: Json
          required_skill: string | null
          result_item_name: string
          result_item_type: string
          result_quantity: number
          result_weight: number
        }
        Insert: {
          crafting_time_minutes?: number
          created_at?: string
          description?: string | null
          difficulty_dc?: number
          id?: string
          name: string
          rarity?: string
          required_items?: Json
          required_skill?: string | null
          result_item_name: string
          result_item_type?: string
          result_quantity?: number
          result_weight?: number
        }
        Update: {
          crafting_time_minutes?: number
          created_at?: string
          description?: string | null
          difficulty_dc?: number
          id?: string
          name?: string
          rarity?: string
          required_items?: Json
          required_skill?: string | null
          result_item_name?: string
          result_item_type?: string
          result_quantity?: number
          result_weight?: number
        }
        Relationships: []
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
      items: {
        Row: {
          atk: number | null
          created_at: string | null
          def: number | null
          description: string | null
          id: string
          lore: string | null
          name: string
          price: number
          rarity: string
          type: string
        }
        Insert: {
          atk?: number | null
          created_at?: string | null
          def?: number | null
          description?: string | null
          id?: string
          lore?: string | null
          name: string
          price: number
          rarity: string
          type: string
        }
        Update: {
          atk?: number | null
          created_at?: string | null
          def?: number | null
          description?: string | null
          id?: string
          lore?: string | null
          name?: string
          price?: number
          rarity?: string
          type?: string
        }
        Relationships: []
      }
      loot_checks: {
        Row: {
          character_id: string
          check_result: number
          created_at: string
          dc: number
          id: string
          item_description: string | null
          item_name: string
          item_type: string
          npc_id: string
          npc_name: string
          properties: Json | null
          quantity: number
          room_id: string
          success: boolean
          weight: number
        }
        Insert: {
          character_id: string
          check_result: number
          created_at?: string
          dc: number
          id?: string
          item_description?: string | null
          item_name: string
          item_type?: string
          npc_id: string
          npc_name: string
          properties?: Json | null
          quantity?: number
          room_id: string
          success: boolean
          weight?: number
        }
        Update: {
          character_id?: string
          check_result?: number
          created_at?: string
          dc?: number
          id?: string
          item_description?: string | null
          item_name?: string
          item_type?: string
          npc_id?: string
          npc_name?: string
          properties?: Json | null
          quantity?: number
          room_id?: string
          success?: boolean
          weight?: number
        }
        Relationships: []
      }
      loot_requests: {
        Row: {
          completed: boolean | null
          created_at: string | null
          created_by: string
          dc: number
          expires_at: string | null
          id: string
          item_description: string | null
          item_name: string
          item_type: string
          npc_id: string
          npc_name: string
          properties: Json | null
          quantity: number
          room_id: string
          target_character_id: string
          weight: number
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          created_by: string
          dc: number
          expires_at?: string | null
          id?: string
          item_description?: string | null
          item_name: string
          item_type?: string
          npc_id: string
          npc_name: string
          properties?: Json | null
          quantity?: number
          room_id: string
          target_character_id: string
          weight?: number
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string
          dc?: number
          expires_at?: string | null
          id?: string
          item_description?: string | null
          item_name?: string
          item_type?: string
          npc_id?: string
          npc_name?: string
          properties?: Json | null
          quantity?: number
          room_id?: string
          target_character_id?: string
          weight?: number
        }
        Relationships: []
      }
      merchant_auctions: {
        Row: {
          created_at: string
          created_by: string
          current_bidder_id: string | null
          current_price: number
          description: string | null
          end_time: string
          id: string
          item_name: string
          item_type: string
          properties: Json | null
          room_id: string
          start_time: string
          starting_price: number
          status: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          created_by: string
          current_bidder_id?: string | null
          current_price: number
          description?: string | null
          end_time: string
          id?: string
          item_name: string
          item_type?: string
          properties?: Json | null
          room_id: string
          start_time?: string
          starting_price: number
          status?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          current_bidder_id?: string | null
          current_price?: number
          description?: string | null
          end_time?: string
          id?: string
          item_name?: string
          item_type?: string
          properties?: Json | null
          room_id?: string
          start_time?: string
          starting_price?: number
          status?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "merchant_auctions_current_bidder_id_fkey"
            columns: ["current_bidder_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_auctions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_bargains: {
        Row: {
          character_id: string
          created_at: string
          discount_percent: number
          id: string
          merchant_item_id: string
          modifier: number
          roll_result: number
          room_id: string
          success: boolean
          total: number
        }
        Insert: {
          character_id: string
          created_at?: string
          discount_percent: number
          id?: string
          merchant_item_id: string
          modifier: number
          roll_result: number
          room_id: string
          success: boolean
          total: number
        }
        Update: {
          character_id?: string
          created_at?: string
          discount_percent?: number
          id?: string
          merchant_item_id?: string
          modifier?: number
          roll_result?: number
          room_id?: string
          success?: boolean
          total?: number
        }
        Relationships: []
      }
      merchant_items: {
        Row: {
          available: boolean
          base_price: number
          created_at: string
          current_price: number
          description: string | null
          id: string
          item_name: string
          item_type: string
          properties: Json | null
          rarity: string
          room_id: string
          stock: number
          updated_at: string
          weight: number
        }
        Insert: {
          available?: boolean
          base_price: number
          created_at?: string
          current_price: number
          description?: string | null
          id?: string
          item_name: string
          item_type?: string
          properties?: Json | null
          rarity?: string
          room_id: string
          stock?: number
          updated_at?: string
          weight?: number
        }
        Update: {
          available?: boolean
          base_price?: number
          created_at?: string
          current_price?: number
          description?: string | null
          id?: string
          item_name?: string
          item_type?: string
          properties?: Json | null
          rarity?: string
          room_id?: string
          stock?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      merchant_transactions: {
        Row: {
          character_id: string
          created_at: string
          id: string
          item_name: string
          merchant_item_id: string | null
          price: number
          quantity: number
          room_id: string
          transaction_type: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          item_name: string
          merchant_item_id?: string | null
          price: number
          quantity?: number
          room_id: string
          transaction_type: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          item_name?: string
          merchant_item_id?: string | null
          price?: number
          quantity?: number
          room_id?: string
          transaction_type?: string
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
          campaign_type: string | null
          combat_active: boolean
          created_at: string
          current_turn: number | null
          gm_id: string
          id: string
          initiative_order: Json | null
          merchant_active: boolean
          room_code: string
          session_active: boolean
          story_stage: number | null
        }
        Insert: {
          campaign_type?: string | null
          combat_active?: boolean
          created_at?: string
          current_turn?: number | null
          gm_id: string
          id?: string
          initiative_order?: Json | null
          merchant_active?: boolean
          room_code: string
          session_active?: boolean
          story_stage?: number | null
        }
        Update: {
          campaign_type?: string | null
          combat_active?: boolean
          created_at?: string
          current_turn?: number | null
          gm_id?: string
          id?: string
          initiative_order?: Json | null
          merchant_active?: boolean
          room_code?: string
          session_active?: boolean
          story_stage?: number | null
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
      shop_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string | null
          last_restock: string | null
          max_stage: number | null
          min_stage: number
          shop_id: string | null
          stock: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          last_restock?: string | null
          max_stage?: number | null
          min_stage?: number
          shop_id?: string | null
          stock?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string | null
          last_restock?: string | null
          max_stage?: number | null
          min_stage?: number
          shop_id?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_transactions: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          item_id: string
          item_name: string
          player_id: string
          price: number
          quantity: number
          room_id: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          item_id: string
          item_name: string
          player_id: string
          price: number
          quantity?: number
          room_id: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          item_id?: string
          item_name?: string
          player_id?: string
          price?: number
          quantity?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_transactions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          campaign_type: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          shop_type: string
          stage: number
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          shop_type: string
          stage?: number
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          shop_type?: string
          stage?: number
        }
        Relationships: []
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
