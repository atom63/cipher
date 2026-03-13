import {
  Balls,
  BatteryCharge,
  Bolt,
  CaseRound,
  ChefHat,
  Code,
  Compass,
  Crown,
  CupHot,
  GraphUp,
  Hanger,
  HeartPulse,
  Hiking,
  HomeSmile,
  Laptop,
  Map as MapIcon,
  MedalRibbonStar,
  Perfume,
  Running,
  Sofa,
  SquareAcademicCap,
  Suitcase,
  Target,
  Wineglass,
} from "@solar-icons/react";
import type { ComponentType } from "react";
import type { Category } from "./data/cards";

type IconComponent = ComponentType<{
  className?: string;
  weight?:
    | "Bold"
    | "BoldDuotone"
    | "Broken"
    | "LineDuotone"
    | "Linear"
    | "Outline";
}>;

const CATEGORY_ICONS: Record<Category, IconComponent[]> = {
  trending: [GraphUp, Crown, MedalRibbonStar],
  beauty: [HeartPulse, Perfume, Hanger],
  tech: [Code, Laptop, BatteryCharge],
  career: [CaseRound, SquareAcademicCap, Target],
  living: [Sofa, HomeSmile, Bolt],
  travel: [Compass, MapIcon, Suitcase],
  sports: [Running, Hiking, Balls],
  food: [ChefHat, Wineglass, CupHot],
};

function getPosterIcon(category: Category, index: number): IconComponent {
  const icons = CATEGORY_ICONS[category];
  return icons[index % icons.length] ?? icons[0] ?? GraphUp;
}

export { CATEGORY_ICONS, getPosterIcon, type IconComponent };
