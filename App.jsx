import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  LabelList,
} from "recharts";

// ==============================
// Constants & Helpers
// ==============================
const DEFAULT_SERVER_TZ = "America/New_York";
const EPICS = [
  "Queen Ant",
  "Core",
  "Orfen",
  "Zaken",
  "Baium",
  "Frintezza",
  "Antharas",
  "Valakas",
];
const ROLES = [
  "Tank",
  "Healer",
  "Support",
  "Melee DPS",
  "Ranged DPS",
  "Mage DPS",
  "Crafter",
  "Spoiler",
  "Other",
];
const CLASS_TO_ROLE = {
  // Tanks
  Paladin: "Tank",
  "Dark Avenger": "Tank",
  "Temple Knight": "Tank",
  "Shillien Knight": "Tank",
  // Healers / Support
  Bishop: "Healer",
  "Elven Elder": "Support",
  "Shillien Elder": "Support",
  Prophet: "Support",
  Warcryer: "Support",
  Overlord: "Support",
  // Dances / Songs
  "Blade Dancer": "Support",
  "Sword Singer": "Support",
  // Mages
  Spellhowler: "Mage DPS",
  Sorcerer: "Mage DPS",
  Spellsinger: "Mage DPS",
  Necromancer: "Mage DPS",
  Warlock: "Mage DPS",
  "Elemental Summoner": "Mage DPS",
  "Phantom Summoner": "Mage DPS",
  // Archers
  Hawkeye: "Ranged DPS",
  "Silver Ranger": "Ranged DPS",
  "Phantom Ranger": "Ranged DPS",
  // Daggers
  "Treasure Hunter": "Melee DPS",
  "Abyss Walker": "Melee DPS",
  "Plains Walker": "Melee DPS",
  // Fighters
  Gladiator: "Melee DPS",
  Warlord: "Melee DPS",
  Tyrant: "Melee DPS",
  Destroyer: "Melee DPS",
  // Craft/Spoil
  Warsmith: "Crafter",
  "Bounty Hunter": "Spoiler",
};
// ... rest of the code is very long ...
// For brevity, you would paste the full canvas content here
