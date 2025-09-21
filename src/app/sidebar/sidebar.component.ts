import { Component, EventEmitter, Output } from '@angular/core';
import { Widget, WidgetType } from '../models/widget.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule]
})
export class SidebarComponent {
  @Output() widgetAdded = new EventEmitter<Widget>();
  @Output() save = new EventEmitter<void>();
  @Output() load = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();

  // Add this property to fix the template error
  widgetTypes: WidgetType[] = ['labeled-input', 'barcode', 'image'];

  addWidget(type: Widget['type']) {
    const widget: Widget = {
      id: Date.now(),
      type,
      top: 50,
      left: 50,
      width: 150,
      height: 50,
      ...(type === 'labeled-input' ? { label: 'Label' } : {}),
      ...(type === 'barcode' ? { productId: '123456789' } : {}),
      ...(type === 'image' ? { src: '' } : {})
    };
    this.widgetAdded.emit(widget);
  }
}
