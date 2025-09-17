import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Widget, WidgetType } from '../models/template.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WidgetComponent } from '../widget/widget.component';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
    standalone:true,
  imports:[CommonModule, FormsModule, DragDropModule, WidgetComponent],
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent {
  @Input() widgets!: Widget[];
  @Input() isDragOver!: boolean;
  @Input() selectedWidget!: Widget | null;
  @Input() draggedWidgetType!: WidgetType | null;

  @Output() canvasDrop = new EventEmitter<{x: number, y: number}>();
  @Output() canvasDragOver = new EventEmitter<DragEvent>();
  @Output() canvasDragLeave = new EventEmitter<void>();
  @Output() widgetSelect = new EventEmitter<Widget>();
  @Output() widgetDelete = new EventEmitter<Widget>();
  @Output() widgetMove = new EventEmitter<{widget: Widget, left: number, top: number}>();
  @Output() widgetResize = new EventEmitter<{widget: Widget, width: number, height: number | 'auto'}>();
  @Output() imageUpload = new EventEmitter<{widget: Widget, imageData: string, imageName: string}>();
  @Output() deselectWidget = new EventEmitter<void>();

  onDrop(event: DragEvent) {
    event.preventDefault();
    
    if (this.draggedWidgetType) {
      const canvas = event.currentTarget as HTMLElement;
      const rect = canvas.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      this.canvasDrop.emit(position);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
    this.canvasDragOver.emit(event);
  }

  onDragLeave(event: DragEvent) {
    this.canvasDragLeave.emit();
  }

  trackByWidgetId(index: number, widget: Widget): number {
    return widget.id;
  }
}