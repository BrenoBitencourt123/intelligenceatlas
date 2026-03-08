

## Changes to `src/pages/Founders.tsx`

### 1. Balloon adjustments
- Raise higher: change `-top-11` to `-top-14`
- Rotate opposite direction: change `rotate: "-6deg"` to `rotate: "6deg"`

### 2. Button styling
- Make it more pill-shaped like the reference image (more rounded, slightly larger)
- Keep orange color as-is

### 3. Animation
- The current animation already uses `scale: [1, 1.12, 1]` which is increase/decrease — this is correct. The `ease: "easeInOut"` should keep it smooth. No change needed here.

### 4. Text below button
- Replace the price line (`50% OFF vitalício · R$49,90 R$24,95/mês`) with "Entre no Grupo VIP"

All changes in a single file: `src/pages/Founders.tsx`.

