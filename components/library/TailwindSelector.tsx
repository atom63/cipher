/**
 * Tailwind CSS Selector Component
 * Select Tailwind token categories to import
 */

import { useState } from 'react';
import { Button, SectionHeader, Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '../ui';
import { Checkbox } from '../ui';
import {
  TAILWIND_CATEGORIES,
  getTailwindTokenCount,
  generateTailwindTokens,
  getTailwindColorPreview,
} from '../../libraries/tailwind-data';
import type { DesignToken } from '../../types/tokens';
import styles from './TailwindSelector.module.css';

interface TailwindSelectorProps {
  onGenerate: (tokens: DesignToken[]) => void;
  onBack: () => void;
  onSelectColors?: () => void; // Navigate to color picker
}

export function TailwindSelector({ onGenerate, onBack, onSelectColors }: TailwindSelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['spacing']);

  const tokenCount = getTailwindTokenCount(selectedCategories);

  const toggleCategory = (categoryId: string) => {
    // If colors is clicked, navigate to color picker
    if (categoryId === 'colors' && onSelectColors) {
      onSelectColors();
      return;
    }
    
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectAll = () => {
    setSelectedCategories(TAILWIND_CATEGORIES.map((c) => c.id));
  };

  const clearAll = () => {
    setSelectedCategories([]);
  };

  const handleGenerate = () => {
    if (selectedCategories.length === 0) return;
    
    const tokens = generateTailwindTokens(selectedCategories, {
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
          <h2 className={styles.title}>Tailwind CSS</h2>
          <p className={styles.subtitle}>
            Select token categories to import
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {/* Categories */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <SectionHeader title="Token Categories" />
            <div className={styles.sectionActions}>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
              >
                Clear
              </Button>
            </div>
          </div>
          
          <div className={styles.categoryList}>
            {TAILWIND_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                variant={selectedCategories.includes(category.id) ? 'muted' : 'default'}
                padding="md"
                hover={!selectedCategories.includes(category.id)}
                onClick={() => toggleCategory(category.id)}
                className={`${styles.categoryCard} ${
                  selectedCategories.includes(category.id) ? styles.selected : ''
                }`}
              >
                <CardHeader>
                  <div className={styles.categoryTitleRow}>
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <CardTitle>{category.label}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Color preview for colors category */}
                {category.id === 'colors' && (
                  <CardContent>
                    <div className={styles.colorPreview}>
                      {getTailwindColorPreview().map((color, idx) => (
                        <div
                          key={idx}
                          className={styles.colorSwatch}
                          style={{ backgroundColor: color }}
                          title={`Color ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <div className={styles.colorHint}>
                      Click to select individual palettes →
                    </div>
                  </CardContent>
                )}
                
                <CardFooter className={styles.categoryFooter}>
                  <span className={styles.categoryTokenCount}>
                    {category.tokenCount} tokens
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            💡 <strong>Tip:</strong> Tailwind tokens match your development environment exactly. 
            All values are converted to pixels (assuming 1rem = 16px).
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.tokenInfo}>
          <span className={styles.tokenCount}>
            {tokenCount} tokens ready
          </span>
          <span className={styles.selectedCount}>
            {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
          </span>
        </div>
        
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onBack}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={selectedCategories.length === 0}
          >
            Preview {tokenCount} Tokens →
          </Button>
        </div>
      </div>
    </div>
  );
}

