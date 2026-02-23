/**
 * Generate item-metadata.json from LPC sheet_definitions
 * Based on Universal-LPC-Spritesheet-Character-Generator/scripts/generate_sources.js
 * 
 * Usage: npx ts-node scripts/generate-metadata.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const LPC_ROOT = 'temp/Universal-LPC-Spritesheet-Character-Generator-master';
const SHEETS_DIR = path.resolve(__dirname, '../assets/sheet_definitions');
const OUTPUT_FILE = path.resolve(__dirname, '../public/spritesheets/item-metadata.json');
const CATEGORY_OUTPUT_FILE = path.resolve(__dirname, '../public/spritesheets/category-tree.json');

interface LayerDefinition {
  zPos?: number;
  male?: string;
  female?: string;
  teen?: string;
  muscular?: string;
  pregnant?: string;
  child?: string;
  skeleton?: string;
  zombie?: string;
  [key: string]: string | number | undefined;
}

interface CreditDefinition {
  file: string;
  notes: string;
  authors: string[];
  licenses: string[];
  urls: string[];
}

interface SheetDefinition {
  name: string;
  priority?: number;
  type_name: string;
  layer_1: LayerDefinition;
  layer_2?: LayerDefinition;
  layer_3?: LayerDefinition;
  variants: string[];
  animations?: string[];
  credits: CreditDefinition[];
  path?: string[];
  tags?: string[];
  required_tags?: string[];
  excluded_tags?: string[];
  replace_in_path?: Record<string, string>;
  preview_row?: number;
  preview_column?: number;
  preview_x_offset?: number;
  preview_y_offset?: number;
  match_body_color?: boolean;
  ignore?: boolean;
}

interface MetaDefinition {
  label?: string;
  priority?: number;
  required?: string[];
  animations?: string[];
}

interface ItemMetadata {
  itemId: string;
  name: string;
  priority: number | null;
  typeName: string;
  required: string[];
  animations: string[];
  tags: string[];
  requiredTags: string[];
  excludedTags: string[];
  path: string[];
  replaceInPath: Record<string, string>;
  variants: string[];
  layers: Record<string, LayerDefinition>;
  credits: CreditDefinition[];
  previewRow: number;
  previewColumn: number;
  previewXOffset: number;
  previewYOffset: number;
  matchBodyColor: boolean;
}

interface CategoryTree {
  label?: string;
  priority?: number | null;
  required?: string[];
  animations?: string[];
  items: string[];
  children: Record<string, CategoryTree>;
}

const itemMetadata: Record<string, ItemMetadata> = {};
const categoryTree: CategoryTree = { items: [], children: {} };
const DEFAULT_ANIMATIONS = [
  'spellcast',
  'thrust', 
  'walk',
  'slash',
  'shoot',
  'hurt',
  'watering'
];

const SEXES = ['male', 'female', 'teen', 'child', 'muscular', 'pregnant'];

function parseMetaFile(filePath: string, fileName: string): void {
  const fullPath = path.join(filePath, fileName);
  let meta: MetaDefinition;
  
  try {
    meta = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    console.error(`Error parsing meta file: ${fullPath}`);
    return;
  }

  const categoryPath = filePath.replace(SHEETS_DIR + path.sep, '').split(path.sep);
  const treeId = filePath.split(path.sep).pop() || '';
  
  let current = categoryTree;
  for (const segment of categoryPath) {
    if (!current.children[segment]) {
      current.children[segment] = {
        items: [],
        children: {}
      };
      
      if (segment === treeId) {
        current.children[segment].label = meta.label;
        current.children[segment].priority = meta.priority ?? null;
        current.children[segment].required = meta.required || [];
        current.children[segment].animations = meta.animations || [];
      }
    }
    current = current.children[segment];
  }
}

function parseSheetFile(filePath: string, fileName: string): void {
  const fullPath = path.join(filePath, fileName);
  const itemId = fileName.replace('.json', '');
  
  let definition: SheetDefinition;
  try {
    definition = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    console.error(`Error parsing sheet file: ${fullPath}`);
    return;
  }

  if (definition.ignore === true) {
    return;
  }

  const { 
    variants = [], 
    name, 
    credits = [], 
    replace_in_path = {},
    priority,
    type_name: typeName,
    animations = DEFAULT_ANIMATIONS,
    tags = [],
    required_tags = [],
    excluded_tags = [],
    preview_row = 2,
    preview_column = 0,
    preview_x_offset = 0,
    preview_y_offset = 0,
    match_body_color = false
  } = definition;

  const requiredSexes: string[] = [];
  for (const sex of SEXES) {
    if (definition.layer_1?.[sex]) {
      requiredSexes.push(sex);
    }
  }

  const treePath = filePath.replace(SHEETS_DIR + path.sep, '').split(path.sep);
  treePath.push(itemId);

  const layers: Record<string, LayerDefinition> = {};
  for (let i = 1; i < 10; i++) {
    const layerDef = (definition as unknown as Record<string, unknown>)[`layer_${i}`] as LayerDefinition | undefined;
    if (layerDef) {
      layers[`layer_${i}`] = layerDef;
    } else {
      break;
    }
  }

  itemMetadata[itemId] = {
    itemId,
    name,
    priority: priority ?? null,
    typeName,
    required: requiredSexes,
    animations,
    tags,
    requiredTags: required_tags,
    excludedTags: excluded_tags,
    path: definition.path ?? treePath,
    replaceInPath: replace_in_path,
    variants,
    layers,
    credits,
    previewRow: preview_row,
    previewColumn: preview_column,
    previewXOffset: preview_x_offset,
    previewYOffset: preview_y_offset,
    matchBodyColor: match_body_color
  };

  const categoryPath = (definition.path ?? treePath).slice(0, -1);
  let current = categoryTree;
  for (const segment of categoryPath) {
    if (!current.children[segment]) {
      current.children[segment] = { items: [], children: {} };
    }
    current = current.children[segment];
  }
  current.items.push(itemId);
}

function sortCategoryTree(node: CategoryTree): void {
  const sortedChildren = Object.entries(node.children || {}).sort(
    ([keyA, valA], [keyB, valB]) => {
      const a = valA.priority ?? Number.POSITIVE_INFINITY;
      const b = valB.priority ?? Number.POSITIVE_INFINITY;
      if (a !== b) return a - b;
      const labelA = valA.label ?? keyA;
      const labelB = valB.label ?? keyB;
      return labelA.localeCompare(labelB);
    }
  );

  const reordered: Record<string, CategoryTree> = {};
  for (const [key, child] of sortedChildren) {
    sortCategoryTree(child);
    reordered[key] = child;
  }
  node.children = reordered;

  if (node.items) {
    node.items.sort((idA, idB) => {
      const metaA = itemMetadata[idA] || {};
      const metaB = itemMetadata[idB] || {};
      const a = metaA.priority ?? Number.POSITIVE_INFINITY;
      const b = metaB.priority ?? Number.POSITIVE_INFINITY;
      if (a !== b) return a - b;
      const nameA = metaA.name ?? idA;
      const nameB = metaB.name ?? idB;
      return nameA.localeCompare(nameB);
    });
  }
}

function main(): void {
  console.log('Scanning sheet_definitions...');
  
  if (!fs.existsSync(SHEETS_DIR)) {
    console.error(`Sheet definitions directory not found: ${SHEETS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SHEETS_DIR, { 
    recursive: true,
    withFileTypes: true 
  }) as fs.Dirent[];

  for (const file of files) {
    if (!file.isFile()) continue;
    
    const fullPath = path.join(file.path, file.name);
    
    if (file.name.startsWith('meta_')) {
      parseMetaFile(file.path, file.name);
    } else if (file.name.endsWith('.json')) {
      parseSheetFile(file.path, file.name);
    }
  }

  sortCategoryTree(categoryTree);

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(itemMetadata, null, 2));
  console.log(`Generated ${OUTPUT_FILE} with ${Object.keys(itemMetadata).length} items`);

  fs.writeFileSync(CATEGORY_OUTPUT_FILE, JSON.stringify(categoryTree, null, 2));
  console.log(`Generated ${CATEGORY_OUTPUT_FILE}`);
}

main();
