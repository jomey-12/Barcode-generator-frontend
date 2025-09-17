import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Template, WidgetType } from '../models/template.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widgets-panel',
  templateUrl: './widgets-panel.component.html',
    standalone:true,
  imports:[CommonModule],
  styleUrls: ['./widgets-panel.component.scss']
})
export class WidgetsPanelComponent {
  @Input() templates!: Template[];
  @Output() widgetDragStart = new EventEmitter<WidgetType>();
  @Output() loadTemplate = new EventEmitter<Template>();
  @Output() deleteTemplate = new EventEmitter<Template>();

  onDragStart(widgetType: WidgetType, event: DragEvent) {
    this.widgetDragStart.emit(widgetType);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDeleteTemplate(template: Template, event: Event) {
    event.stopPropagation();
    this.deleteTemplate.emit(template);
  }
}