import type { ResourceDef } from './types';

export const RESOURCES: ResourceDef[] = [
  {
    id: 'beef',
    name: 'Beef',
    description: 'Premium cuts for burger patties',
    basePricePerUnit: 15,
    unitWeight: 1.0,
  },
  {
    id: 'chicken',
    name: 'Chicken',
    description: 'Fresh poultry for frying',
    basePricePerUnit: 12,
    unitWeight: 1.0,
  },
  {
    id: 'greens',
    name: 'Greens',
    description: 'Lettuce, tomatoes, and vegetables',
    basePricePerUnit: 8,
    unitWeight: 1.0,
  },
  {
    id: 'tortillas',
    name: 'Tortillas',
    description: 'Fresh flour and corn tortillas',
    basePricePerUnit: 5,
    unitWeight: 1.0,
  },
  {
    id: 'packaging',
    name: 'Packaging',
    description: 'Boxes, bags, and wrappers',
    basePricePerUnit: 3,
    unitWeight: 1.0,
  },
  {
    id: 'fuel',
    name: 'Fuel',
    description: 'Gasoline for vehicles and delivery',
    basePricePerUnit: 20,
    unitWeight: 1.0,
  },
  {
    id: 'cleaning',
    name: 'Cleaning Supplies',
    description: 'Maintenance and sanitation',
    basePricePerUnit: 10,
    unitWeight: 1.0,
  },
];

export const RESOURCE_MAP = Object.fromEntries(RESOURCES.map((r) => [r.id, r]));
