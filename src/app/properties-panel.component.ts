import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Widget } from './template.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.component.html',
    standalone:true,
  imports:[CommonModule],
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent {
  @Input() selectedWidget!: Widget | null;
  @Input() jsonPreview!: string;

  @Output() widgetUpdate = new EventEmitter<{widget: Widget, updates: Partial<Widget>}>();
  @Output() generateBarcode = new EventEmitter<void>();
  @Output() clearBarcode = new EventEmitter<void>();
  @Output() imageUpload = new EventEmitter<{widget: Widget, imageData: string, imageName: string}>();

  onPropertyChange(property: string, value: any) {
    if (this.selectedWidget) {
      const updates: Partial<Widget> = {};
      updates[property as keyof Widget] = value;
      this.widgetUpdate.emit({ widget: this.selectedWidget, updates });
    }
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