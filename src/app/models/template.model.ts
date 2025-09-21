export type WidgetType = 'labeled-input' | 'barcode' | 'image' | 'separator' | 'qr-code' | 'description-input';

export type LabelPosition = 'left' | 'right' | 'top' | 'bottom';

export type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'UPC' | 'ITF14';

export interface Widget {
  id: number;
  type: WidgetType;
  left: number;
  top: number;
  width: number;
  height: number | 'auto';
  
  // Common properties
  content?: string;
  
  // Labeled input properties
  labelText?: string;
  inputValue?: string;
  hideLabel?: boolean;
  labelPosition?: LabelPosition;
  
  // Barcode properties
  barcodeType?: BarcodeType;
  productId?: string;
  hasBarcode?: boolean;
  
  // Image properties
  imageData?: string;
  imageName?: string;
  imageLabel?: string;
  // Style properties
  fontSize?: string;
  fontWeight?: string;
  //separator properties
  orientation?: string;

  hasQr?: boolean;
  qrData?: string;

  descriptionLabelText?: string;
  descriptionInputValue?: string;
  descriptionHideLabel?: boolean;
  descriptionLabelPosition?: LabelPosition;
}

export interface Template {
  id: number;
  name: string;
  widgets: Widget[];
  createdAt: string;
}

export interface TemplateWrapper {
  referenceId: string,
  templateDetails: Template
}

export interface TemplateRequest {
  name: string;
  templateJson: Template;
}

export interface TemplateResponse {
  templateReferenceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  templateJson: string;
}