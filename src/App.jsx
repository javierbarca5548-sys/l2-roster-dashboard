import React, { useState } from "react";
import { gearRecipes } from "./data/recipes";

export default function App() {
  const gearTypes = Object.keys(gearRecipes);
  const [gear, setGear] = useState(gearTypes[0]);
  const [quantity, setQuantity] = useState(1);

  const materials = gearRecipes[gear] || {};
  const totals = Object.entries(materials).map(([mat, qty]) => ({
    name: mat,
    amount: qty * quantity,
  }));

  return (
    <div style={{ padding: 20 }}>
      <h1>Lineage 2 Crafting Dashboard</h1>
      <div style={{ marginBottom: 20 }}>
        <label>
          Gear Type:&nbsp;
          <select value={gear} onChange={(e) => setGear(e.target.value)}>
            {gearTypes.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label>
          Quantity:&nbsp;
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </label>
      </div>
      <div>
        <h2>Materials Required</h2>
        <ul>
          {totals.map((item) => (
            <li key={item.name}>
              {item.name}: {item.amount}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
