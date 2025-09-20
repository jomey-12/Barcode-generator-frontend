import { Component, OnInit } from '@angular/core';
import { Widget, Template, WidgetType } from './models/template.model';
import { TemplateService } from './service/template.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from './canvas/canvas.component';
import { HeaderComponent } from './header/header.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { WidgetsPanelComponent } from './widgets-panel/widgets-panel.component';
import { SaveTemplateDialogComponent } from './save-template-dialog/save-template-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    WidgetsPanelComponent,
    CanvasComponent,
    SaveTemplateDialogComponent,
    PropertiesPanelComponent],
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  templateName = 'My Template';
  widgets: Widget[] = [];
  templates: Template[] = [];
  selectedWidget: Widget | null = null;
  isDragOver = false;
  draggedWidgetType: WidgetType | null = null;
  nextId = 1;
  jsonPreview = '';

  constructor(private templateService: TemplateService) {}

  ngOnInit() {
    this.templates = this.templateService.getTemplates();
    this.updateJsonPreview();
  }

  onWidgetDragStart(widgetType: WidgetType) {
    this.draggedWidgetType = widgetType;
  }

  onCanvasDragOver(event: DragEvent) {
    this.isDragOver = true;
  }

  onCanvasDragLeave() {
    this.isDragOver = false;
  }

  onCanvasDrop(event: { x: number; y: number }) {
    this.isDragOver = false;
    
    if (this.draggedWidgetType) {
      const newWidget = this.createWidget(this.draggedWidgetType, event);
      this.widgets.push(newWidget);
      this.draggedWidgetType = null;
    }
    this.updateJsonPreview();
  }

  createWidget(type: WidgetType, position: { x: number; y: number }, savedData?: Partial<Widget>): Widget {
    const widget: Widget = {
      id: savedData?.id || this.nextId++,
      type,
      left: savedData?.left ?? position.x,
      top: savedData?.top ?? position.y,
      width: savedData?.width ?? this.getDefaultWidth(type),
      height: savedData?.height ?? this.getDefaultHeight(type),
      // Common properties
      content: savedData?.content || '',
      // Labeled input properties
      labelText: savedData?.labelText || 'Label',
      inputValue: savedData?.inputValue || '',
      hideLabel: savedData?.hideLabel || false,
      labelPosition: savedData?.labelPosition || 'left',
      // Barcode properties
      productId: savedData?.productId || '',
      hasBarcode: savedData?.hasBarcode || false,
      // Image properties
      imageData: savedData?.imageData || '',
      imageName: savedData?.imageName || '',
      // Style properties
      fontSize: savedData?.fontSize || '14px',
      fontWeight: savedData?.fontWeight || 'normal'
    };
    return widget;
  }

  private getDefaultWidth(type: WidgetType): number {
    const widthMap = {
      'separator': 200,
      'labeled-input': 250,
      'image': 200,
      'barcode': 150
    };
    return widthMap[type];
  }

  private getDefaultHeight(type: WidgetType): number | 'auto' {
    return type === 'image' ? 120 : 'auto';
  }

  selectWidget(widget: Widget) {
    this.selectedWidget = widget;
    this.updateJsonPreview();
  }

  deselectWidget() {
    this.selectedWidget = null;
  }

  deleteWidget(widget: Widget) {
    const index = this.widgets.indexOf(widget);
    if (index > -1) {
      this.widgets.splice(index, 1);
      if (this.selectedWidget?.id === widget.id) {
        this.selectedWidget = null;
      }
    }
  }

  moveWidget(event: { widget: Widget; left: number; top: number }) {
    const widget = this.widgets.find(w => w.id === event.widget.id);
    if (widget) {
      widget.left = event.left;
      widget.top = event.top;
    }
  }

  resizeWidget(event: { widget: Widget; width: number; height: number | 'auto' }) {
    const widget = this.widgets.find(w => w.id === event.widget.id);
    if (widget) {
      widget.width = event.width;
      widget.height = event.height;
    }
  }

  updateWidget(event: { widget: Widget; updates: Partial<Widget> }) {
    const widget = this.widgets.find(w => w.id === event.widget.id);
    if (widget) {
      Object.assign(widget, event.updates);
      if (this.selectedWidget?.id === widget.id) {
        Object.assign(this.selectedWidget, event.updates);
      }
      this.updateJsonPreview();
    }
  }

  handleImageUpload(event: { widget: Widget; imageData: string; imageName: string }) {
    this.updateWidget({
      widget: event.widget,
      updates: { imageData: event.imageData, imageName: event.imageName }
    });
  }

  generateBarcode() {
    if (this.selectedWidget?.type === 'barcode' && this.selectedWidget.productId) {
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasBarcode: true }
      });
    }
  }

  clearBarcode() {
    if (this.selectedWidget?.type === 'barcode') {
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasBarcode: false, productId: '' }
      });
    }
  }
showSaveDialog = false;
  saveTemplate() {
    const template: Template = {
      id: Date.now(),
      name: this.templateName,
      widgets: [...this.widgets],
      createdAt: new Date().toISOString()
    };
   // this.showSaveDialog = true;
    this.templates = this.templateService.saveTemplate(template);
    alert('Template saved successfully! hihiihihihih');
    this.showSaveDialog =false;
  }
  

openSaveDialog() {
  this.showSaveDialog = true;
}

handleSave(name: string) {
  this.showSaveDialog = false;

  const template: Template = {
    id: Date.now(),
    name,
    widgets: [...this.widgets],
    createdAt: new Date().toISOString()
  };

  this.templates = this.templateService.saveTemplate(template);
  alert('Template saved successfully!');
}

  loadTemplate(template: Template) {
    this.templateName = template.name;
    this.widgets = template.widgets.map(w => this.createWidget(w.type, { x: 0, y: 0 }, w));
    this.selectedWidget = null;
    
    // Update next ID to avoid conflicts
    const maxId = Math.max(...this.widgets.map(w => w.id), 0);
    this.nextId = maxId + 1;
  }

  deleteTemplate(template: Template) {
    if (confirm('Delete this template?')) {
      this.templates = this.templateService.deleteTemplate(template.id);
    }
  }

  clearCanvas() {
    if (confirm('Clear all widgets from canvas?')) {
      this.widgets = [];
      this.selectedWidget = null;
    }
  }

  exportTemplate() {
    const template: Template = {
      id: Date.now(),
      name: this.templateName,
      widgets: [...this.widgets],
      createdAt: new Date().toISOString()
    };

    this.templateService.exportTemplate( this.templateName);
  }

  updateJsonPreview() {
  const labeledInputs = this.widgets.filter(w => w.type === 'labeled-input');
  const jsonData: any = {
    productId: this.selectedWidget?.productId || '',
    timestamp: new Date().toISOString()
  };

  labeledInputs.forEach(widget => {
    if (widget.labelText) {
      jsonData[widget.labelText] = widget.inputValue ?? null;
    }
  });

  // Only remove undefined (not null/empty string)
  Object.keys(jsonData).forEach(key => {
    if (jsonData[key] === undefined && key !== 'productId' && key !== 'timestamp') {
      delete jsonData[key];
    }
  });

  this.jsonPreview = JSON.stringify(jsonData, null, 2);
}

}