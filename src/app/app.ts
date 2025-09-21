import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Widget, Template, WidgetType, TemplateResponse, TemplateWrapper, BarcodeType } from './models/template.model';
import { TemplateService } from './service/template.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from './canvas/canvas.component';
import { HeaderComponent } from './header/header.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { WidgetsPanelComponent } from './widgets-panel/widgets-panel.component';
import { SaveTemplateDialogComponent } from './save-template-dialog/save-template-dialog.component';
import * as XLSX from 'xlsx';
import { ImportTemplateDialogComponent } from './app-import-template-dialog/app-import-template-dialog';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { DataService } from './service/data.service';
import { HttpClientModule } from '@angular/common/http';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { Product } from './models/product.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    HeaderComponent,
    WidgetsPanelComponent,
    CanvasComponent,
    SaveTemplateDialogComponent,
    PropertiesPanelComponent,
    ImportTemplateDialogComponent,
    ConfirmationDialogComponent],
  styleUrls: ['./app.scss'],
})
export class AppComponent implements OnInit {
  currentTemplate!: TemplateWrapper;
  templateName = '';
  widgets: Widget[] = [];
  templates: TemplateWrapper[] = [];
  selectedWidget: Widget | null = null;
  isDragOver = false;
  draggedWidgetType: WidgetType | null = null;
  nextId = 1;
  jsonPreview = '';
  showImportDialog = false;
  importedData: any;
  widgets2: Widget[] = [];  deletionFailed: string = '';
  deletionFailedTimeout: any;
  showConfirmationDialog: boolean = false;
  templateToBeDeleted!: TemplateWrapper;
  selectedBarcodeType: BarcodeType = 'CODE128';

  constructor(private templateService: TemplateService, private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.dataService.getAllTemplates().subscribe((templates: TemplateResponse[]) => {
      this.templates = templates.map(t => ({
        referenceId: t.templateReferenceId,
        templateDetails: JSON.parse(t.templateJson)
      }));
      this.cdr.detectChanges()
    });
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

  getBarcodeType(barcodeType: BarcodeType) {
    this.selectedBarcodeType = barcodeType;
  }

  createWidget(
    type: WidgetType,
    position: { x: number; y: number },
    savedData?: Partial<Widget>
  ): Widget {
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
      barcodeType: savedData?.barcodeType || 'CODE128',
      productId: savedData?.productId || '',
      hasBarcode: savedData?.hasBarcode || false,
      // Image properties
      imageData: savedData?.imageData || '',
      imageName: savedData?.imageName || '',
      // Style properties
      fontSize: savedData?.fontSize || '14px',
      fontWeight: savedData?.fontWeight || 'normal',
      //separator properties
      orientation: savedData?.orientation || 'horizontal',
      hasQr: savedData?.hasQr || false,
      qrData: savedData?.qrData || '',

      descriptionLabelText: savedData?.labelText || 'Label',
      descriptionInputValue: savedData?.inputValue || '',
      descriptionHideLabel: savedData?.hideLabel || false,
      descriptionLabelPosition: savedData?.labelPosition || 'left',
    };
    return widget;
  }

  private getDefaultWidth(type: WidgetType): number {
    const widthMap = {
      separator: 200,
      'labeled-input': 260,
      'qr-code': 100,
      'description-input': 260,
      image: 200,
      barcode: 150,
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
        this.updateJsonPreview();
      }
    }
  }

  moveWidget(event: { widget: Widget; left: number; top: number }) {
    const widget = this.widgets.find((w) => w.id === event.widget.id);
    if (widget) {
      widget.left = event.left;
      widget.top = event.top;
    }
  }

  resizeWidget(event: { widget: Widget; width: number; height: number | 'auto' }) {
    const widget = this.widgets.find((w) => w.id === event.widget.id);
    if (widget) {
      widget.width = event.width;
      widget.height = event.height;
    }
  }

  updateWidget(event: { widget: Widget; updates: Partial<Widget> }) {
    const widget = this.widgets.find((w) => w.id === event.widget.id);
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
      updates: { imageData: event.imageData, imageName: event.imageName },
    });
  }

handleSeparatorOrientation(event:{widget: Widget, orientation: string}){
    this.updateWidget({
      widget: event.widget,
    updates: {orientation: event.orientation}
  })
  }

  generateBarcode() {
    if (this.selectedWidget?.type === 'barcode') {
      this.selectedWidget.productId = this.templateService.generateProductIdByFormat(this.selectedBarcodeType);
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasBarcode: true },
      });
    }
  }

  clearBarcode() {
    if (this.selectedWidget?.type === 'barcode') {
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasBarcode: false, productId: '' },
      });
    }
  }
    generateQr(qrData: string) {
    if (this.selectedWidget?.type === 'qr-code') {
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasQr: true , qrData: this.jsonPreview},
      });
    }
  }

  clearQr() {
    if (this.selectedWidget?.type === 'qr-code') {
      this.updateWidget({
        widget: this.selectedWidget,
        updates: { hasQr: false, qrData:'' },
      });
    }
  }
  showSaveDialog = false;

  openSaveDialog() {
    this.showSaveDialog = true;
  }

  handleSave(name: string) {
    this.showSaveDialog = false;

    const template: Template = {
      id: Date.now(),
      name,
      widgets: [...this.widgets],
      createdAt: new Date().toISOString(),
    };

    //reset input values
    const templateCopy: Template = {
      ...template,
      widgets: template.widgets.map(widget => ({
        ...widget,
        inputValue: undefined,
        productId: undefined,
        imageData: undefined,
        imageName: undefined,
        hasBarcode: undefined
      }))
    };

    this.dataService.createTemplate({
        name: name,
      templateJson: templateCopy
    }).subscribe((saved: TemplateResponse) => {
        this.currentTemplate = {
          referenceId: saved.templateReferenceId,
        templateDetails: JSON.parse(saved.templateJson)
      }
        this.templateName = name;
        this.templates = [...this.templates, this.currentTemplate];
        this.cdr.detectChanges();
      });
  }

  loadTemplate(template: TemplateWrapper) {
    this.templateName = template.templateDetails.name;
    this.currentTemplate = template;
    this.widgets = template.templateDetails.widgets.map((w) => this.createWidget(w.type, { x: 0, y: 0 }, w));
    this.selectedWidget = null;
    this.updateJsonPreview();

    // Update next ID to avoid conflicts
    const maxId = Math.max(...this.widgets.map((w) => w.id), 0);
    this.nextId = maxId + 1;
  }

  openDeleteConfirmationDialog(template: TemplateWrapper): void {
    this.showConfirmationDialog = true;
    this.templateToBeDeleted = template;
  }

  deleteTemplate() {
    this.showConfirmationDialog = false;
    this.dataService.deleteTemplate(this.templateToBeDeleted.referenceId).subscribe(
      () => {
        this.templates = this.templates.filter(
          (t) => t.referenceId !== this.templateToBeDeleted.referenceId
        );

        if (this.currentTemplate?.referenceId === this.templateToBeDeleted.referenceId) {
          this.templateName = '';
          this.clearCanvas();
        }

        this.cdr.detectChanges();
      },
      () => {
        this.deletionFailed = this.templateToBeDeleted.referenceId;
        this.cdr.detectChanges();

        if (this.deletionFailedTimeout) {
          clearTimeout(this.deletionFailedTimeout);
        }

        this.deletionFailedTimeout = setTimeout(() => {
          this.deletionFailed = '';
          this.deletionFailedTimeout = null;
          this.cdr.detectChanges();
        }, 2000);
      }
    );
  }

  clearCanvas() {
    this.widgets = [];
    this.selectedWidget = null;
  }

  exportTemplate() {
    const template: Template = {
      id: Date.now(),
      name: this.templateName,
      widgets: [...this.widgets],
      createdAt: new Date().toISOString(),
    };

    this.templateService.exportTemplate(this.templateName);
  }

  updateJsonPreview() {
    const labeledInputs = this.widgets.filter((w) => w.type === 'labeled-input');
    const jsonData: any = {
      productId: this.selectedWidget?.productId || '',
      timestamp: new Date().toISOString(),
    };

    // Add labeled-input widgets as before
    labeledInputs.forEach((widget) => {
      if (widget.labelText) {
        jsonData[widget.labelText] = widget.inputValue ?? null;
      }
    });

    // Add image widgets with keys "image1", "image2", ...
    const imageWidgets = this.widgets.filter((w) => w.type === 'image');
    imageWidgets.forEach((widget, index) => {
      const key = `image${index + 1}`;
      if (widget.imageData) {
        jsonData[key] = widget.imageData;
      }
    });

    // Only remove undefined (not null/empty string)
    Object.keys(jsonData).forEach((key) => {
      if (jsonData[key] === undefined && key !== 'productId' && key !== 'timestamp') {
        delete jsonData[key];
      }
    });

    this.jsonPreview = JSON.stringify(jsonData, null, 2);
  }

  openImportDialog() {
    this.showImportDialog = true;
  }

  //   handleImportConfirmed(data: any) {
  //   this.importedData = data;
  //   this.showImportDialog = false;

  //   if (!Array.isArray(data) || data.length < 2) {
  //     alert('The imported file does not contain data rows.');
  //     return;
  //   }

  //   const headers: string[] = data[0];
  //   const rows: any[][] = data.slice(1);

  //   // Prepare an array to hold all JSON objects from each row
  //   const allJsonData: any[] = [];

  //   rows.forEach(row => {
  //     const jsonData: any = {
  //       productId: '', // Fill if applicable
  //       timestamp: new Date().toISOString()
  //     };

  //     headers.forEach((header, idx) => {
  //       if (/^image/i.test(header.trim())) {
  //         jsonData[header] = row[idx] || null;
  //       } else {
  //         jsonData[header] = row[idx] || null;
  //       }
  //     });

  //     // Remove undefined values except reserved keys
  //     Object.keys(jsonData).forEach(key => {
  //       if (jsonData[key] === undefined && key !== 'productId' && key !== 'timestamp') {
  //         delete jsonData[key];
  //       }
  //     });

  //     allJsonData.push(jsonData);
  //   });

  //   // Convert all imported rows to formatted JSON string for display
  //   this.jsonPreview = JSON.stringify(allJsonData, null, 2);

  //   alert('Import successful. Processed JSON data:\n' + this.jsonPreview);

  //   // Optional: further processing to update widgets or UI state with allJsonData
  // }

  handleImportCancel() {
    this.showImportDialog = false;
  }

  //   handleImportConfirmed(data: any) {
  //   this.importedData = data;
  //   this.showImportDialog = false;

  //   if (!Array.isArray(data) || data.length < 2) {
  //     alert('The imported file does not contain data rows.');
  //     return;
  //   }

  //   // Call PDF + ZIP generation
  //   this.generatePDFsAndDownloadZip(data);
  // }

  //   async generatePDFsAndDownloadZip(data: any[][]): Promise<void> {
  //     if (!data || data.length < 2) {
  //       alert('No data to generate PDFs.');
  //       return;
  //     }

  //     const headers: string[] = data[0];
  //     const rows: any[][] = data.slice(1);

  //     // Create a new ZIP archive
  //     const zip = new JSZip();

  //     for (let i = 0; i < rows.length; i++) {
  //       const row = rows[i];

  //       // Map row data to key-value object by headers
  //       const rowData: any = {};
  //       headers.forEach((header, idx) => {
  //         rowData[header] = row[idx] || '';
  //       });

  //       // Generate PDF content from template and rowData
  //       // For simplicity, here's a basic example generating text-based PDF
  //       const pdf = new jsPDF();

  //       pdf.setFontSize(16);
  //       pdf.text(`Template: ${this.templateName}`, 10, 10);

  //       let yPos = 20;
  //       for (const key of headers) {
  //         const value = rowData[key];
  //         pdf.setFontSize(12);
  //         pdf.text(`${key}: ${value}`, 10, yPos);
  //         yPos += 10;
  //       }

  //       // Generate PDF as Blob
  //       const pdfBlob = pdf.output('blob');

  //       // Add this PDF to the ZIP file, name with row number or unique ID
  //       zip.file(`template_${i + 1}.pdf`, pdfBlob);
  //     }

  //     // Generate ZIP Blob
  //     const zipBlob = await zip.generateAsync({ type: 'blob' });

  //     // Trigger download of ZIP file
  //     saveAs(zipBlob, `${this.templateName}_bulk_pdfs.zip`);
  //   }

  // handleImportConfirmed(data: any) {
  //   this.importedData = data;
  //   this.showImportDialog = false;

  //   if (!Array.isArray(data) || data.length < 2) {
  //     alert('The imported file does not contain data rows.');
  //     return;
  //   }

  //   // Assuming selectedTemplateId is currently selected template's ID in your app
  //   const selectedTemplateId = this.templates.find((t) => t.name === this.templateName)?.id;

  //   if (!selectedTemplateId) {
  //     alert('No template selected.');
  //     return;
  //   }

  //   // this.generateBulkPdfsZip(data, selectedTemplateId);
  // }

  // async generateBulkPdfsZip(data: any[][], selectedTemplateId: number) {
  //   if (!Array.isArray(data) || data.length < 2) {
  //     alert('No data to generate PDFs.');
  //     return;
  //   }

  //   const headers: string[] = data[0];
  //   const rows: any[][] = data.slice(1);

  //   const zip = new JSZip();

  //   // Load base template widgets (deep clone)
  //   const baseWidgets = this.templateService.getTemplateById(selectedTemplateId);

  //   for (let i = 0; i < rows.length; i++) {
  //     const row = rows[i];
  //     // Convert row to JSON object by headers
  //     const rowData: any = {};
  //     headers.forEach((h, k) => (rowData[h] = row[k] || ''));

  //     // Fill widgets with row data
  //     const filledWidgets = this.fillWidgetsWithRowData(baseWidgets, rowData);

  //     // Generate PDF Blob
  //     const pdfBlob = await this.generatePdfFromWidgets(filledWidgets, `template_${i + 1}.pdf`);

  //     // Add PDF blob to ZIP
  //     zip.file(`template_${i + 1}.pdf`, pdfBlob);
  //   }

  //   // Generate ZIP and trigger download
  //   const zipBlob = await zip.generateAsync({ type: 'blob' });
  //   saveAs(zipBlob, `BulkTemplates_${new Date().toISOString()}.zip`);
  // }
  fillWidgetsWithRowData(widgets: Widget[], rowData: any): Widget[] {
    return widgets.map((widget) => {
      const clone = { ...widget };

      if (
        clone.type === 'labeled-input' &&
        clone.labelText &&
        rowData.hasOwnProperty(clone.labelText)
      ) {
        clone.inputValue = rowData[clone.labelText];
      } else if (clone.type === 'image') {
        // Use imageLabel if defined, else fallback key pattern
        const imageKey = clone.imageLabel || `image${clone.id}`;
        if (rowData.hasOwnProperty(imageKey)) {
          clone.imageData = rowData[imageKey];
        }
      }
      // map other widget types if needed...

      return clone;
    });
  }
  generatePdfFromWidgets(widgets: Widget[], fileName: string): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new jsPDF();

      widgets.forEach((widget) => {
        if (widget.type === 'labeled-input') {
          const fontSize = widget.fontSize ? parseInt(widget.fontSize, 10) : 12;
          doc.setFontSize(fontSize);
          doc.text(widget.inputValue || '', widget.left, widget.top);
        } else if (widget.type === 'image' && widget.imageData) {
          // Add 'PNG' or 'JPEG' depending on actual data if needed
          try {
            doc.addImage(
              widget.imageData,
              'PNG',
              widget.left,
              widget.top,
              widget.width,
              widget.height as number
            );
          } catch (e) {
            console.warn('Failed to add image to PDF:', e);
          }
        }
        // Additional widget types as needed
      });

      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  }
  handleImportConfirmed(data: any) {
    this.importedData = data;
    this.showImportDialog = false;

    if (!Array.isArray(data) || data.length < 2) {
      alert('The imported file does not contain data rows.');
      return;
    }

    // Enhance data with productId FIRST, before any other processing
    const enhancedData = this.addProductIdsToData(data);
    this.importedData = enhancedData;

    // Log image statistics
    const headers = enhancedData[0];
    const imageColumns = headers.filter((h: string) => h.toLowerCase().includes('image'));
    const imageCount = this.getImageCountFromData(enhancedData);

  console.log(`Processing data with ${imageColumns.length} image columns and ${imageCount} images`);

    this.onJsonImported(enhancedData);

    const jsonObjects = this.convertToJsonObjects(enhancedData);
    const productRequests: Product[] = this.convertToProductRequests(jsonObjects);
    this.saveProductDetails(productRequests);
  }
  async onJsonImported(products2D: any[]) {
    const selectedTemplateId = this.templates.find(
      (t) => t.templateDetails.name === this.templateName
    )?.referenceId;
    if (!selectedTemplateId) {
      return;
    }
    this.dataService.getTemplateById(selectedTemplateId).subscribe( async (response: TemplateResponse) => {
      const template = JSON.parse(response.templateJson);
      if (!template || products2D.length === 0) {
        console.warn('Missing template or product data');
        return;
      }

      try {
        // Extract headers (first row)
        const headers = products2D[0];

        // Convert each subsequent row to an object based on headers
        const products = products2D.slice(1).map((row) => {
          const product: any = {};
          row.forEach((cell: string | number, index: number) => {
            product[headers[index]] = cell;
          });
          return product;
        });
        await this.templateService.exportMultipleTemplatesWithProducts(
          template,
          products,
          'TemplateExport'
        );
        this.widgets2 = this.templateService.widgets();

        console.log('PDF export success');
      } catch (error) {
        console.error('PDF export failed:', error);
      }
    });
  }

  private addProductIdsToData(data: any[]): any[] {
    if (!Array.isArray(data) || data.length < 2) {
      return data;
    }

    const enhancedData = [...data];
    
    // Add productId to headers if not present
    const headers = [...data[0]];
    if (!headers.includes('productId')) {
      headers.push('productId');
      enhancedData[0] = headers;
    }

    // Add productId to each data row
    for (let i = 1; i < enhancedData.length; i++) {
      const row = [...data[i]];

      const productIdIndex = data[0].indexOf('productId');
      if (productIdIndex === -1) {
        row.push(this.templateService.generateProductIdByFormat(this.selectedBarcodeType));
      } else if (!row[productIdIndex]) {
        row[productIdIndex] = this.templateService.generateProductIdByFormat(this.selectedBarcodeType);
      }
      
      enhancedData[i] = row;
    }

    return enhancedData;
  }

  convertToJsonObjects(data: any[][]): any[] {
    if (!data || data.length === 0) {
      return [];
    }

    const headers = data[0];
    const jsonObjects = data.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return jsonObjects;
  }

  convertToProductRequests(
    jsonObjects: any[] 
  ): Product[] {
    return jsonObjects.map(obj => {
      const productId = String(obj.productId || obj.ProductId || obj.id || '').trim();
      
      if (!productId) {
        throw new Error('ProductId not found in object: ' + JSON.stringify(obj));
      }

      return {
        productId: productId,
        productDetails: obj,
        templateReferenceId: this.currentTemplate.referenceId
      };
    });
  }

  saveProductDetails(products: Product[]): void {
    this.dataService.createProducts(products).subscribe();
  }

  private getImageCountFromData(data: any[][]): number {
    let count = 0;
  data.slice(1).forEach(row => {
    row.forEach(cell => {
        if (typeof cell === 'string' && cell.startsWith('data:image/')) {
          count++;
        }
      });
    });
    return count;
  }
}
