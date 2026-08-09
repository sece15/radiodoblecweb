// Utilidades de diseño y estilos Neo-Brutalistas

const CARD_ROTATIONS = [-0.6, 0.7, -0.4, 0.5, -0.8, 0.3];

export function getCardRotation(idx: number): number {
  return CARD_ROTATIONS[Math.abs(idx) % CARD_ROTATIONS.length];
}

export function getRotationStyle(idx: number, isSelected = false): { transform: string } {
  if (isSelected) {
    return { transform: "translate(3px, 3px) rotate(0deg)" };
  }
  return { transform: `rotate(${getCardRotation(idx)}deg)` };
}
