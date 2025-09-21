import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { BarcodeType, TemplateWrapper, Widget } from '../models/template.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../service/data.service';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
    standalone:true,
  imports:[CommonModule, FormsModule],
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent {
  @Input() currentTemplate!: TemplateWrapper | null;
  @Input() selectedWidget!: Widget | null;
  @Input() jsonPreview!: string;

  @Output() widgetUpdate = new EventEmitter<{widget: Widget, updates: Partial<Widget>}>();
  @Output() generateBarcode = new EventEmitter<void>();
  @Output() clearBarcode = new EventEmitter<void>();
  @Output() generateQr = new EventEmitter<string>();
  @Output() clearQr = new EventEmitter<void>();
  @Output() imageUpload = new EventEmitter<{widget: Widget, imageData: string, imageName: string}>();
  @Output() separatorOrientation = new EventEmitter<{widget: Widget, orientation: string}>();
  @Output() barcodeType = new EventEmitter<BarcodeType>();

  lineOrientation: 'horizontal' | 'vertical' = 'horizontal'; // default

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  showSuccess = false;
  isTemplateNull = false; 
  onPropertyChange(property: string, value: any) {
    if (this.selectedWidget) {
      const updates: Partial<Widget> = {};
      updates[property as keyof Widget] = value;
      this.widgetUpdate.emit({ widget: this.selectedWidget, updates });

      if (this.selectedWidget.hasBarcode) {
        this.barcodeType.emit(this.selectedWidget.barcodeType);
      }
    }
  }
successTimeout: any;
nullTemplateTimeout: any;

saveProductDetails() {
  if (this.currentTemplate === undefined) {
    this.isTemplateNull = true;

    if (this.nullTemplateTimeout) {
      clearTimeout(this.nullTemplateTimeout);
    }

    // Start a fresh timeout
    this.nullTemplateTimeout = setTimeout(() => {
      this.isTemplateNull = false;
      this.nullTemplateTimeout = null;
    }, 4000);
    return;
  }
  this.dataService.createProduct({
    productId: JSON.parse(this.jsonPreview).productId,
    productDetails: this.jsonPreview,
    templateReferenceId: this.currentTemplate?.referenceId ?? ""
  }).subscribe();

  this.showSuccess = true;

  // Clear any existing timeout
  if (this.successTimeout) {
    clearTimeout(this.successTimeout);
  }

  // Start a fresh timeout
  this.successTimeout = setTimeout(() => {
    this.showSuccess = false;
    this.successTimeout = null;
    this.cdr.detectChanges();
  }, 4000);
}

Test(){
  console.log();
}

onOrientationChange(event: Event) {
  if (!this.selectedWidget) return;

  const select = event.target as HTMLSelectElement;
  const newOrientation = select.value as 'horizontal' | 'vertical';

  // update selected widget directly
  this.selectedWidget.orientation = newOrientation;

  this.separatorOrientation.emit({
    widget: this.selectedWidget,
    orientation: newOrientation
  });
}


  onImageUpload() {
    if (!this.selectedWidget) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && this.selectedWidget) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const imageData = e.target?.result as string;
          this.imageUpload.emit({
            widget: this.selectedWidget!,
            imageData: imageData,
            imageName: file.name
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
}