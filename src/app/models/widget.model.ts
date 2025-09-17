export type WidgetType = 'labeled-input' | 'barcode' | 'image' | 'separator';

export interface Widget {
   id: number;
  type: string;
  top: number;
  left: number;
  width: number;
  height: number;
  label?: string;
  productId?: string;
  src?: string;
}
