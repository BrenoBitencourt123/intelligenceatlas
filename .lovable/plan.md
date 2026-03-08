

## Changes to `src/pages/Founders.tsx`

### 1. CTA Button animation — scale up/down instead of ping
Replace the `animate-ping` ring (line 272-273) with a `framer-motion` scale animation (`scale: [1, 1.08, 1]`) similar to the balloon, creating a smooth breathe effect instead of the current ping/pulse.

### 2. "20 vagas" styling on mobile — underline instead of badge
The current colored background box around "20 vagas" looks awkward on mobile. Replace the `rounded-md` + background approach with a simple underline/highlight: use a bottom border or `decoration` style in the amber color, keeping the text orange but removing the background box. This looks cleaner on small screens while still drawing attention.

### 3. Text below button
Already says "Entre no Grupo VIP" — no change needed here.

**Single file:** `src/pages/Founders.tsx`

