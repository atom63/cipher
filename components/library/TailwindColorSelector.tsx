/**
 * Tailwind Color Selector Component
 * Select individual Tailwind color palettes to import
 */

import { useState } from 'react';
import { CheckboxWithLabel, Button, SectionHeader, Card, CardHeader, CardContent } from '../ui';
import {
  TAILWIND_COLOR_PALETTES,
  getTailwindPalettesByCategory,
  getTailwindColorTokenCount,
  generateTailwindColorTokens,
  getTailwindPalettePreview,
  type TailwindColorPalette,
} from '../../libraries/tailwind-data';
import type { DesignToken } from '../../types/tokens';
import styles from './TailwindColorSelector.module.css';

interface TailwindColorSelectorProps {
  onGenerate: (tokens: DesignToken[]) => void;
  onBack: () => void;
}

export function TailwindColorSelector({ onGenerate, onBack }: TailwindColorSelectorProps) {
  const [selectedPalettes, setSelectedPalettes] = useState<string[]>([]);
  
  const palettesByCategory = getTailwindPalettesByCategory();
  const tokenCount = getTailwindColorTokenCount(selectedPalettes);

  const togglePalette = (paletteName: string) => {
    setSelectedPalettes((prev) =>
      prev.includes(paletteName)
        ? prev.filter((p) => p !== paletteName)
        : [...prev, paletteName]
    );
  };

  const selectAllInCategory = (palettes: TailwindColorPalette[]) => {
    const paletteNames = palettes.map(p => p.name);
    setSelectedPalettes((prev) => {
      const newSet = new Set([...prev, ...paletteNames]);
      return Array.from(newSet);
    });
  };

  const deselectAllInCategory = (palettes: TailwindColorPalette[]) => {
    const paletteNames = palettes.map(p => p.name);
    setSelectedPalettes((prev) => prev.filter(p => !paletteNames.includes(p)));
  };

  const handleGenerate = () => {
    if (selectedPalettes.length === 0) return;
    
    const tokens = generateTailwindColorTokens(selectedPalettes, {
      namePrefix: 'tw',
    });
    
    onGenerate(tokens);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" size="sm" onClick={onBack} className={styles.backButton}>
          ← Back
        </Button>
        <div>
          <h2 className={styles.title}>Tailwind Colors</h2>
          <p className={styles.subtitle}>
            Select color palettes to import (11 shades each: 50-950)
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Gray Scales */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionHeader title="Gray Scales" />
            <div className={styles.sectionActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectAllInCategory(palettesByCategory.gray)}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deselectAllInCategory(palettesByCategory.gray)}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className={styles.paletteGrid}>
            {palettesByCategory.gray.map((palette) => (
              <Card 
                key={palette.name}
                variant={selectedPalettes.includes(palette.name) ? 'muted' : 'bordered'}
                padding="sm"
                hover={!selectedPalettes.includes(palette.name)}
                onClick={() => togglePalette(palette.name)}
                className={selectedPalettes.includes(palette.name) ? styles.selected : ''}
              >
                <CardHeader>
                  <CheckboxWithLabel
                    id={`palette-${palette.name}`}
                    label={palette.displayName}
                    checked={selectedPalettes.includes(palette.name)}
                    onChange={() => togglePalette(palette.name)}
                  />
                </CardHeader>
                <CardContent>
                  <div className={styles.colorSwatches}>
                    {getTailwindPalettePreview(palette.name).map((color, idx) => (
                      <div
                        key={idx}
                        className={styles.colorSwatch}
                        style={{ backgroundColor: color }}
                        title={`Shade ${['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'][idx]}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionHeader title="Colors" />
            <div className={styles.sectionActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectAllInCategory(palettesByCategory.color)}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deselectAllInCategory(palettesByCategory.color)}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className={styles.paletteGrid}>
            {palettesByCategory.color.map((palette) => (
              <Card 
                key={palette.name}
                variant={selectedPalettes.includes(palette.name) ? 'muted' : 'bordered'}
                padding="sm"
                hover={!selectedPalettes.includes(palette.name)}
                onClick={() => togglePalette(palette.name)}
                className={selectedPalettes.includes(palette.name) ? styles.selected : ''}
              >
                <CardHeader>
                  <CheckboxWithLabel
                    id={`palette-${palette.name}`}
                    label={palette.displayName}
                    checked={selectedPalettes.includes(palette.name)}
                    onChange={() => togglePalette(palette.name)}
                  />
                </CardHeader>
                <CardContent>
                  <div className={styles.colorSwatches}>
                    {getTailwindPalettePreview(palette.name).map((color, idx) => (
                      <div
                        key={idx}
                        className={styles.colorSwatch}
                        style={{ backgroundColor: color }}
                        title={`Shade ${['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'][idx]}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.tokenInfo}>
          <span className={styles.tokenCount}>
            {tokenCount} tokens ready
          </span>
          <span className={styles.selectedCount}>
            {selectedPalettes.length} palette{selectedPalettes.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onBack}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={selectedPalettes.length === 0}
          >
            Preview {tokenCount} Tokens →
          </Button>
        </div>
      </div>
    </div>
  );
}

