

import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef } from '@angular/core';
import { Widget } from '../models/template.model';
import { CommonModule } from '@angular/common';
import { BarcodeDirective } from '../directives/barcode.directive';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  standalone: true,
  imports: [CommonModule, BarcodeDirective, DragDropModule, FormsModule, QRCodeComponent],
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent {
  @Input() widget!: Widget;
  @Input() isSelected!: boolean;

  @Output() widgetSelect = new EventEmitter<Widget>();
  @Output() widgetDelete = new EventEmitter<Widget>();
  @Output() widgetMove = new EventEmitter<{ widget: Widget, left: number, top: number }>();
  @Output() widgetResize = new EventEmitter<{ widget: Widget, width: number, height: number | 'auto' }>();
  @Output() imageUpload = new EventEmitter<{ widget: Widget, imageData: string, imageName: string }>();

  resizeDirection: string = '';
  isResizing: boolean = false;
  startX = 0;
  startY = 0;
  startWidth = 0;
  startHeight = 0;
  startLeft = 0;
  startTop = 0;

  constructor(private elementRef: ElementRef) {}

  get widgetWidth() {
  return this.widget.width;
}
get widgetHeight() {
  return this.widget.height === 'auto' ? null : this.widget.height;
}
get widgetHeightAuto() {
  return this.widget.height === 'auto' ? 'auto' : null;
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

onResizeStart(event: MouseEvent, direction: string) {
  event.preventDefault();
  event.stopPropagation();

  this.resizeDirection = direction;
  this.isResizing = true;
  this.startX = event.clientX;
  this.startY = event.clientY;
  this.startWidth = this.widget.width;
  
  // Handle the height properly - get actual DOM height if 'auto'
if (this.widget.height === 'auto') {
  const element = this.elementRef.nativeElement;
  this.startHeight = element.offsetHeight;
  this.widget.height = this.startHeight; // set numeric for resize
} else {
  this.startHeight = this.widget.height;
}

  
  this.startLeft = this.widget.left;
  this.startTop = this.widget.top;

  const onMouseMove = (e: MouseEvent) => this.resizeHandler(e);
  const onMouseUp = () => {
  
    this.isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

private resizeHandler(event: MouseEvent) {
  if (!this.isResizing) return;

  const dx = event.clientX - this.startX;
  const dy = event.clientY - this.startY;
  const minWidth = 50;
  const minHeight = 50;

  const oldValues = {
    width: this.widget.width,
    height: this.widget.height,
    left: this.widget.left,
    top: this.widget.top
  };

  switch (this.resizeDirection) {
    case 'right':
      this.widget.width = Math.max(minWidth, this.startWidth + dx);
      break;
      
    case 'left':
      const newWidthLeft = Math.max(minWidth, this.startWidth - dx);
      const actualDxLeft = this.startWidth - newWidthLeft;
      this.widget.width = newWidthLeft;
      this.widget.left = this.startLeft + actualDxLeft;
      break;
      
    case 'bottom':
      this.widget.height = Math.max(minHeight, this.startHeight + dy);

      break;
      
    case 'top':
      const newHeightTop = Math.max(minHeight, this.startHeight - dy);
      const actualDyTop = this.startHeight - newHeightTop;
      this.widget.height = newHeightTop;
      this.widget.top = this.startTop + actualDyTop;
      break;
      
    case 'bottom-right':
      this.widget.width = Math.max(minWidth, this.startWidth + dx);
      this.widget.height = Math.max(minHeight, this.startHeight + dy);
      break;
      
    case 'bottom-left':
      const newWidthBL = Math.max(minWidth, this.startWidth - dx);
      const actualDxBL = this.startWidth - newWidthBL;
      this.widget.width = newWidthBL;
      this.widget.left = this.startLeft + actualDxBL;
      this.widget.height = Math.max(minHeight, this.startHeight + dy);
      break;
      
    case 'top-right':
      this.widget.width = Math.max(minWidth, this.startWidth + dx);
      const newHeightTR = Math.max(minHeight, this.startHeight - dy);
      const actualDyTR = this.startHeight - newHeightTR;
      this.widget.height = newHeightTR;
      this.widget.top = this.startTop + actualDyTR;
      break;
      
    case 'top-left':
      const newWidthTL = Math.max(minWidth, this.startWidth - dx);
      const actualDxTL = this.startWidth - newWidthTL;
      this.widget.width = newWidthTL;
      this.widget.left = this.startLeft + actualDxTL;
      
      const newHeightTL = Math.max(minHeight, this.startHeight - dy);
      const actualDyTL = this.startHeight - newHeightTL;
      this.widget.height = newHeightTL;
      this.widget.top = this.startTop + actualDyTL;
      break;
  }

  // Debug logging for bottom resize specifically
  if (this.resizeDirection === 'bottom') {
    console.log('Bottom resize values:', {
      old: oldValues,
      new: {
        width: this.widget.width,
        height: this.widget.height,
        left: this.widget.left,
        top: this.widget.top
      }
    });
  }

  // Force change detection by emitting the resize event
  this.widgetResize.emit({
    widget: this.widget,
    width: this.widget.width,
    height: this.widget.height
  });
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
}
