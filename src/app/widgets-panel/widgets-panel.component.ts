import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Template, TemplateWrapper, WidgetType } from '../models/template.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widgets-panel',
  templateUrl: './widgets-panel.component.html',
    standalone:true,
  imports:[CommonModule],
  styleUrls: ['./widgets-panel.component.scss']
})
export class WidgetsPanelComponent {
  @Input() deletionFailed: string = '';
  @Input() templates!: TemplateWrapper[];
  @Output() widgetDragStart = new EventEmitter<WidgetType>();
  @Output() loadTemplate = new EventEmitter<TemplateWrapper>();
  @Output() deleteTemplate = new EventEmitter<TemplateWrapper>();

  onDragStart(widgetType: WidgetType, event: DragEvent) {
    this.widgetDragStart.emit(widgetType);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onDeleteTemplate(template: TemplateWrapper, event: Event) {
    event.stopPropagation();
    this.deleteTemplate.emit(template);
  }
}