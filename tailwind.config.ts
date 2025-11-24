import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        'gradient-epic': 'var(--gradient-epic)',
        'gradient-glow': 'var(--gradient-glow)',
        'gradient-veil': 'var(--gradient-veil)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'epic': 'var(--shadow-epic)',
        'deep': 'var(--shadow-deep)',
        'glow': 'var(--shadow-glow)',
      },
      fontFamily: {
        'cinzel': ['Cinzel', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "flame-pulse": {
          "0%, 100%": {
            transform: "scale(0.9)",
            filter: "brightness(1)",
          },
          "25%": {
            transform: "scale(1.1) translateY(-2px)",
            filter: "brightness(1.3)",
          },
          "50%": {
            transform: "scale(1) translateY(0)",
            filter: "brightness(1.1)",
          },
          "75%": {
            transform: "scale(1.05) translateY(-1px)",
            filter: "brightness(1.2)",
          },
        },
        "flame-flicker": {
          "0%, 100%": {
            opacity: "0.8",
            transform: "scale(0.95)",
          },
          "50%": {
            opacity: "1",
            transform: "scale(1.05)",
          },
        },
        "spark-1": {
          "0%": {
            transform: "translate(0, 0) scale(0)",
            opacity: "0",
          },
          "50%": {
            transform: "translate(8px, -8px) scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(12px, -12px) scale(0)",
            opacity: "0",
          },
        },
        "spark-2": {
          "0%": {
            transform: "translate(0, 0) scale(0)",
            opacity: "0",
          },
          "50%": {
            transform: "translate(-6px, 6px) scale(1)",
            opacity: "1",
          },
          "100%": {
            transform: "translate(-10px, 10px) scale(0)",
            opacity: "0",
          },
        },
        "energy-ring": {
          "0%": {
            transform: "scale(1)",
            opacity: "0.5",
          },
          "50%": {
            transform: "scale(1.2)",
            opacity: "0.2",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "0.5",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flame-pulse": "flame-pulse 0.8s ease-in-out infinite",
        "flame-flicker": "flame-flicker 0.3s ease-in-out infinite",
        "spark-1": "spark-1 1.5s ease-in-out infinite",
        "spark-2": "spark-2 1.8s ease-in-out infinite 0.3s",
        "energy-ring": "energy-ring 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
