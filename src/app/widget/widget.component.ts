import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';
import { Widget } from '../models/template.model';
import { CommonModule } from '@angular/common';
import { BarcodeDirective } from '../directives/barcode.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  standalone:true,
  imports:[CommonModule, BarcodeDirective, DragDropModule, FormsModule],
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements AfterViewInit {
  @Input() widget!: Widget;
  @Input() isSelected!: boolean;

  @Output() widgetSelect = new EventEmitter<Widget>();
  @Output() widgetDelete = new EventEmitter<Widget>();
  @Output() widgetMove = new EventEmitter<{widget: Widget, left: number, top: number}>();
  @Output() widgetResize = new EventEmitter<{widget: Widget, width: number, height: number | 'auto'}>();
  @Output() imageUpload = new EventEmitter<{widget: Widget, imageData: string, imageName: string}>();

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // Generate barcode if needed
    if (this.widget.type === 'barcode' && this.widget.hasBarcode && this.widget.productId) {
      this.generateBarcodeForWidget();
    }
  }

  onSelect(event: Event) {
    event.stopPropagation();
    this.widgetSelect.emit(this.widget);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.widgetDelete.emit(this.widget);
  }

  onMouseDown(event: MouseEvent) {
    if (event.target instanceof Element &&
        (event.target.closest('.delete-widget') ||
         event.target.closest('.image-upload-btn') ||
         event.target.closest('.resize-handle'))) {
      return;
    }

    event.preventDefault();
    this.widgetSelect.emit(this.widget);

    const startX = event.clientX - this.widget.left;
    const startY = event.clientY - this.widget.top;

    const onMouseMove = (e: MouseEvent) => {
      const newLeft = Math.max(0, e.clientX - startX);
      const newTop = Math.max(0, e.clientY - startY);
      this.widgetMove.emit({ widget: this.widget, left: newLeft, top: newTop });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onResizeStart(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.widget.width;
    const startHeight = this.widget.height;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      const newHeight = this.widget.type === 'image' && typeof startHeight === 'number'
        ? Math.max(50, startHeight + (e.clientY - startY))
        : startHeight;

      this.widgetResize.emit({ widget: this.widget, width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  onImageUpload(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const imageData = e.target?.result as string;
          this.imageUpload.emit({
            widget: this.widget,
            imageData: imageData,
            imageName: file.name
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.widget.inputValue = target.value;
  }

  private generateBarcodeForWidget() {
    setTimeout(() => {
      const svgElement = this.elementRef.nativeElement.querySelector(`#barcode-${this.widget.id}`);
      if (svgElement && (window as any).JsBarcode) {
        try {
          (window as any).JsBarcode(svgElement, this.widget.productId, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true
          });
        } catch (e) {
          console.error('Barcode generation error:', e);
        }
      }
    }, 100);
  }
}