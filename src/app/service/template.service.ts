import { Injectable, signal, WritableSignal } from '@angular/core';
import { Template, Widget } from '../models/template.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
declare var JsBarcode: any;

@Injectable({
  providedIn: 'root',
})
export class TemplateService {
  private readonly STORAGE_KEY = 'templates';
  public widgets: WritableSignal<Widget[]> = signal<Widget[]>([]);

  // exportTemplate(template: Template, templateName: string) {
  //   const dataStr = JSON.stringify(template, null, 2);
  //   const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  //   const exportFileDefaultName = templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_template.json';

  //   const linkElement = document.createElement('a');
  //   linkElement.setAttribute('href', dataUri);
  //   linkElement.setAttribute('download', exportFileDefaultName);
  //   linkElement.click();
  // }

  exportTemplate(templateName: string) {
    const element = document.getElementById('canvas-container');

  if (!element) {
    console.error('Template canvas not found');
    return;
  }
  
  const canvasElement = document.getElementById('canvas') as HTMLElement;
  const inputElement = document.getElementById('textarea') as HTMLElement;
  const separatorElement = document.getElementById('widget-separator') as HTMLElement;

  // Save original styles
  const originalBorder = canvasElement.style.border;
  let inputElementOriginalBorder: string | undefined;

  if (inputElement) {
    inputElementOriginalBorder = inputElement.style.border;
  }

  // Get all selected widgets and store their transform info
  const selectedWidgets = Array.from(
    document.querySelectorAll<HTMLElement>('.dropped-widget')
  );

  // Store and enhance widget transform data
  const widgetTransformData = selectedWidgets.map(widget => {
    const computedStyle = window.getComputedStyle(widget);
    const currentTransform = widget.style.transform || computedStyle.transform;
    const transformOrigin = widget.style.transformOrigin || computedStyle.transformOrigin;
    
    return {
      element: widget,
      originalTransform: currentTransform,
      originalTransformOrigin: transformOrigin,
      computedTransform: computedStyle.transform
    };
  });

  // Save original widget styles (simplified since we're using CSS rule)
  const originalWidgetStyles = selectedWidgets.map((widget, index) => ({
    element: widget,
    transform: widget.style.transform,
    transformOrigin: widget.style.transformOrigin,
    willChange: widget.style.willChange,
    backfaceVisibility: widget.style.backfaceVisibility
  }));

  // Remove borders temporarily for PDF generation only
  const tempStyle = document.createElement('style');
  tempStyle.id = 'temp-export-style';
  tempStyle.innerHTML = `
    .dropped-widget {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }
    .dropped-widget * {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
    }
  `;
  document.head.appendChild(tempStyle);

  // Get delete widgets
  const deleteWidgets = Array.from(
    document.querySelectorAll<HTMLElement>('.delete-widget')
  );

  const originalDeleteWidgetStyles = deleteWidgets.map(widget => ({
    element: widget,
    display: widget.style.display,
  }));

  // Apply styles for capture
  canvasElement.style.setProperty('border', 'none', 'important');
  if (inputElement) {
    inputElement.style.setProperty('border', 'none', 'important');
  }

  // Hide delete widgets
  deleteWidgets.forEach(widget => {
    widget.style.setProperty('display', 'none', 'important');
  });

  // Ensure transforms are properly set for html2canvas capture
  selectedWidgets.forEach((widget, index) => {
    const transformData = widgetTransformData[index];
    
    if (transformData.originalTransform && transformData.originalTransform !== 'none') {
      // Ensure transform is applied as inline style (html2canvas reads this better)
      widget.style.setProperty('transform', transformData.originalTransform, 'important');
      
      // Set transform-origin if not already set
      if (transformData.originalTransformOrigin && transformData.originalTransformOrigin !== '50% 50%') {
        widget.style.setProperty('transform-origin', transformData.originalTransformOrigin, 'important');
      } else {
        widget.style.setProperty('transform-origin', 'center center', 'important');
      }
      
      // Additional properties that help with transform rendering
      widget.style.setProperty('will-change', 'transform', 'important');
      widget.style.setProperty('backface-visibility', 'visible', 'important');
    }
  });

  // Force multiple reflows and wait for styles to apply
  element.offsetHeight;
  element.offsetWidth;
  
  // Wait a moment for styles to fully apply
  setTimeout(() => {
    html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: true,
      scrollX: 0,
      scrollY: 0,
      // Better transform handling options
      foreignObjectRendering: false,
      ignoreElements: (element) => {
        return element.classList.contains('delete-widget');
      },
      onclone: (clonedDoc, clonedElement) => {
        // Replace textarea elements with divs containing their text values
        const originalTextareas = element.querySelectorAll('textarea');
        const clonedTextareas = clonedDoc.querySelectorAll('textarea');
        
        originalTextareas.forEach((originalTextarea, index) => {
          if (clonedTextareas[index]) {
            const textarea = originalTextarea as HTMLTextAreaElement;
            const clonedTextarea = clonedTextareas[index] as HTMLTextAreaElement;
            
            // Create a div to replace the textarea
            const div = clonedDoc.createElement('div');
            
            // Copy all styles from textarea to div
            const computedStyle = window.getComputedStyle(textarea);
            for (let i = 0; i < computedStyle.length; i++) {
              const property = computedStyle[i];
              div.style.setProperty(property, computedStyle.getPropertyValue(property));
            }
            
            // Set the text content
            div.textContent = textarea.value;
            
            // Ensure proper text rendering
            div.style.setProperty('white-space', 'pre-wrap', 'important');
            div.style.setProperty('word-wrap', 'break-word', 'important');
            div.style.setProperty('overflow', 'hidden', 'important');
            
            // Replace the textarea with the div
            if (clonedTextarea.parentNode) {
              clonedTextarea.parentNode.replaceChild(div, clonedTextarea);
            }
          }
        });

        // Ensure transforms are properly applied in the cloned document
        const clonedWidgets = clonedDoc.querySelectorAll('.dropped-widget');
        clonedWidgets.forEach((clonedWidget, index) => {
          if (index < widgetTransformData.length) {
            const transformData = widgetTransformData[index];
            
            if (transformData.originalTransform && transformData.originalTransform !== 'none') {
              (clonedWidget as HTMLElement).style.setProperty(
                'transform', 
                transformData.originalTransform, 
                'important'
              );
              
              // Ensure transform-origin is set
              const transformOrigin = transformData.originalTransformOrigin || 'center center';
              (clonedWidget as HTMLElement).style.setProperty(
                'transform-origin', 
                transformOrigin, 
                'important'
              );
              
              // Additional properties for better rendering
              (clonedWidget as HTMLElement).style.setProperty('will-change', 'transform', 'important');
              (clonedWidget as HTMLElement).style.setProperty('backface-visibility', 'visible', 'important');
              (clonedWidget as HTMLElement).style.setProperty('perspective', '1000px', 'important');
            }
          }
        });
      }
    }).then(canvas => {
      // IMPORTANT: Remove temporary style to restore original borders on screen
      const tempStyleElement = document.getElementById('temp-export-style');
      if (tempStyleElement) {
        tempStyleElement.remove();
      }

      // Restore all original styles
      canvasElement.style.setProperty('border', originalBorder || '', 'important');
      if (inputElement) {
        inputElement.style.setProperty('border', inputElementOriginalBorder || '', 'important');
      }

      // Restore widget styles (simplified)
      originalWidgetStyles.forEach(({ element, transform, transformOrigin, willChange, backfaceVisibility }) => {
        element.style.setProperty('transform', transform || '', 'important');
        element.style.setProperty('transform-origin', transformOrigin || '', 'important');
        element.style.setProperty('will-change', willChange || '', 'important');
        element.style.setProperty('backface-visibility', backfaceVisibility || '', 'important');
      });

      // Restore delete widgets
      originalDeleteWidgetStyles.forEach(({ element, display }) => {
        element.style.setProperty('display', display || '', 'important');
      });

      // Generate PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let position = 0;

      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      }

      const exportFileDefaultName =
        templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_template.pdf';

      pdf.save(exportFileDefaultName);
      
      console.log('PDF exported successfully with preserved transforms and no borders in PDF');
      
    }).catch(error => {
      console.error('Error generating PDF:', error);
      
      // IMPORTANT: Remove temporary style even if there's an error to restore borders
      const tempStyleElement = document.getElementById('temp-export-style');
      if (tempStyleElement) {
        tempStyleElement.remove();
      }
      
      // Restore styles even if there's an error
      canvasElement.style.setProperty('border', originalBorder || '', 'important');
      if (inputElement) {
        inputElement.style.setProperty('border', inputElementOriginalBorder || '', 'important');
      }
      
      originalWidgetStyles.forEach(({ element, transform, transformOrigin, willChange, backfaceVisibility }) => {
        element.style.setProperty('transform', transform || '', 'important');
        element.style.setProperty('transform-origin', transformOrigin || '', 'important');
        element.style.setProperty('will-change', willChange || '', 'important');
        element.style.setProperty('backface-visibility', backfaceVisibility || '', 'important');
      });
      
      originalDeleteWidgetStyles.forEach(({ element, display }) => {
        element.style.setProperty('display', display || '', 'important');
      });
    });
  }, 100); // Small delay to ensure CSS is applied
}

  generateCode128ProductId(): string {
    // Generate 3 random uppercase letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let alphabetPart = '';
    for (let i = 0; i < 3; i++) {
      alphabetPart += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 5 random digits
    let digitPart = '';
    for (let i = 0; i < 5; i++) {
      digitPart += Math.floor(Math.random() * 10).toString();
    }
    
    return alphabetPart + digitPart;
  }

  async exportMultipleTemplatesWithProducts(template: Template, products: any[], templateName: string) {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Clone the template deeply to modify safely
      const clonedTemplate: Template = JSON.parse(JSON.stringify(template));

      // Map product data to template widgets
      for (const widget of clonedTemplate.widgets) {
        if (widget.type === 'labeled-input' && widget.labelText) {
          // Map labelled-input widget inputValue from product JSON by labelName
          if (product.hasOwnProperty(widget.labelText)) {
            widget.inputValue = product[widget.labelText];
          }
        }

        if (widget.type === 'image') {
          // Enhanced multi-image mapping logic
          let imageData = '';
          
          // Get all available image columns for this product
          const imageColumns = Object.keys(product).filter(key => 
            key.toLowerCase().includes('image') && product[key] && 
            typeof product[key] === 'string' && product[key].startsWith('data:image/')
          );
          
          if (imageColumns.length > 0) {
            // Method 1: Try to map by widget ID or position
            const targetColumn = `image${widget.id}`;
            if (product[targetColumn]) {
              imageData = product[targetColumn];
            }
            // Method 2: Try imageName property if specified
            else if (widget.imageName && product[widget.imageName]) {
              imageData = product[widget.imageName];
            }
            // Method 3: Use available images in sequence
            else {
              // Find the first unused image column
              const availableColumn = imageColumns.find(col => product[col]);
              if (availableColumn) {
                imageData = product[availableColumn];
                // Mark as used by clearing it (prevents reuse)
                product[availableColumn] = '';
              }
            }
          }
          
          // Handle URL conversion if needed
          if (imageData && typeof imageData === 'string') {
            if (imageData.startsWith('http')) {
              try {
                imageData = await this.convertUrlToBase64(imageData);
              } catch (error) {
                console.warn(`Failed to load image from URL: ${imageData}`, error);
                imageData = '';
              }
            }
            widget.imageData = imageData;
          }
        }

        if (widget.type === 'barcode') {
          // Set barcode content from productId field
          if (product.productId) {
            widget.productId = product.productId;
            widget.hasBarcode = true;
          } else if (product.hasOwnProperty('productId')) {
            // Handle case where productId might be in a different field
            widget.productId = product['productId'] || product['sku'] || product['id'] || '';
            widget.hasBarcode = !!widget.productId;
          }
        }
      }

      // Create a temporary canvas container for this specific product
      const canvas = await this.createTemporaryCanvas(clonedTemplate.widgets);
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      // Handle content that might exceed page height
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
    }

    // Save/download the pdf file
    const exportFileDefaultName = templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_products.pdf';
    pdf.save(exportFileDefaultName);
  }

  // Helper method to convert URL to base64
  private async convertUrlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to convert URL to base64: ${error}`);
    }
  }

  // Alternative: Generate barcode using a simple Code128 implementation
  private generateSimpleBarcode(productId: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple barcode pattern
    ctx.fillStyle = '#000000';
    const barWidth = 2;
    const startX = 20;
    const barHeight = 50;

    // Create a simple pattern based on product ID
    for (let i = 0; i < productId.length * 8; i++) {
      const charCode = productId.charCodeAt(i % productId.length);
      if (charCode % 2 === 0) {
        ctx.fillRect(startX + i * barWidth, 10, barWidth, barHeight);
      }
    }

    // Add product ID text
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(productId, canvas.width / 2, 75);

    return canvas;
  }

  private async createTemporaryCanvas(widgets: Widget[]): Promise<HTMLCanvasElement> {
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '800px';
    tempContainer.style.minHeight = '600px';
    tempContainer.style.background = 'white';
    tempContainer.style.border = '2px dashed #cbd5e0';
    tempContainer.style.borderRadius = '10px';
    tempContainer.style.padding = '20px';

    // Create widgets HTML
    widgets.forEach((widget) => {
      const widgetElement = this.createWidgetElement(widget);
      tempContainer.appendChild(widgetElement);
    });

    // Append to body temporarily
    document.body.appendChild(tempContainer);

    try {
      // Capture the canvas
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: 'white',
        scale: 1,
        logging: false,
      });

      return canvas;
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  }

  private createWidgetElement(widget: Widget): HTMLElement {
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = `${widget.left}px`;
    element.style.top = `${widget.top}px`;
    element.style.width = `${widget.width}px`;
    if (typeof widget.height === 'number') {
      element.style.height = `${widget.height}px`;
    }
    element.style.fontSize = widget.fontSize || '14px';
    element.style.fontWeight = widget.fontWeight || 'normal';
    element.style.padding = '5px';
    element.style.minWidth = '100px';
    element.style.transition = 'all 0.2s ease';

    switch (widget.type) {
      case 'labeled-input':
        // Create container with proper positioning
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        
        // Apply positioning class logic
        const labelPosition = widget.labelPosition || 'left';
        switch (labelPosition) {
          case 'top':
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';
            break;
          case 'bottom':
            container.style.flexDirection = 'column-reverse';
            container.style.alignItems = 'flex-start';
            break;
          case 'left':
            container.style.flexDirection = 'row';
            break;
          case 'right':
            container.style.flexDirection = 'row-reverse';
            break;
        }

        // Create label if not hidden
        if (!widget.hideLabel && widget.labelText) {
          const label = document.createElement('div');
          label.textContent = widget.labelText;
          label.style.fontWeight = 'bold';
          label.style.color = '#2d3748';
          label.style.padding = '5px';
          label.style.display = 'inline-block';
          container.appendChild(label);
        }
        
        // Create input field
        const input = document.createElement('div');
        input.textContent = widget.inputValue || '';
        input.style.padding = '8px';
        input.style.border = '1px solid #cbd5e0';
        input.style.borderRadius = '4px';
        input.style.fontSize = '14px';
        input.style.background = 'white';
        input.style.width = '100%';
        input.style.minHeight = '20px';
        input.style.wordWrap = 'break-word';
        container.appendChild(input);
        
        element.appendChild(container);
        break;

      case 'separator':
        const separator = document.createElement('div');
        separator.style.width = '100%';
        separator.style.height = '2px';
        separator.style.background = '#cbd5e0';
        separator.style.margin = '10px 0';
        element.appendChild(separator);
        break;

      case 'image':
        element.style.padding = '20px';
        element.style.borderRadius = '4px';
        element.style.textAlign = 'center';
        element.style.minHeight = '120px';
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.color = '#718096';
        
        if (widget.imageData) {
          // Remove border when image is present
          element.style.border = 'none';
          const img = document.createElement('img');
          img.src = widget.imageData;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '200px';
          img.style.objectFit = 'contain';
          img.style.borderRadius = '4px';
          element.appendChild(img);
        } else {
          element.style.border = '2px dashed #cbd5e0';
          element.textContent = '🖼️ Image Placeholder';
        }
        break;

      case 'qr-code':
  element.style.background = '#f7fafc';
  element.style.padding = '10px';
  element.style.borderRadius = '4px';
  element.style.textAlign = 'center';
  element.style.minHeight = '80px';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.color = '#718096';
  element.style.flexDirection = 'column';

  if (widget.hasQr) {
    // Remove border when QR code is present
    element.style.border = 'none';

    // Generate actual QR code using canvas
    const qrcodeCanvas = this.generateQRCodeCanvas('name'); // synchronous
    if (qrcodeCanvas) {
      const qrcodeImg = document.createElement('img');
      qrcodeImg.src = qrcodeCanvas.toDataURL();
      qrcodeImg.style.maxWidth = '100%';
      qrcodeImg.style.height = 'auto';
      element.appendChild(qrcodeImg);
    } else {
      element.style.border = '2px dashed #cbd5e0';
      element.textContent = '🔳 QR Code Placeholder';
    }
  } else {
    element.style.border = '2px dashed #cbd5e0';
    element.textContent = '🔳 QR Code Placeholder';
  }
  break;


      case 'barcode':
        element.style.background = '#f7fafc';
        element.style.padding = '10px';
        element.style.borderRadius = '4px';
        element.style.textAlign = 'center';
        element.style.minHeight = '80px';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.color = '#718096';
        element.style.flexDirection = 'column';
        
        if (widget.hasBarcode) {
          widget.productId = this.generateCode128ProductId();
          // Remove border when barcode is present
          element.style.border = 'none';
          
          // Generate actual barcode using canvas
          const barcodeCanvas = this.generateBarcodeCanvas(widget.productId);
          if (barcodeCanvas) {
            const barcodeImg = document.createElement('img');
            barcodeImg.src = barcodeCanvas.toDataURL();
            barcodeImg.style.maxWidth = '100%';
            barcodeImg.style.height = 'auto';
            element.appendChild(barcodeImg);
                      } else {
            // Fallback to CSS barcode if canvas generation fails
            const barcodeContainer = document.createElement('div');
            barcodeContainer.style.display = 'flex';
            barcodeContainer.style.flexDirection = 'column';
            barcodeContainer.style.alignItems = 'center';
            
            const barcode = document.createElement('div');
            barcode.style.background = 'repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px)';
            barcode.style.height = '50px';
            barcode.style.width = '150px';
            barcode.style.marginBottom = '5px';
            barcodeContainer.appendChild(barcode);
            
            const productIdText = document.createElement('div');
            productIdText.textContent = widget.productId;
            productIdText.style.textAlign = 'center';
            productIdText.style.fontSize = '12px';
            productIdText.style.color = '#000';
            barcodeContainer.appendChild(productIdText);
            
            element.appendChild(barcodeContainer);
          }
        } else {
          element.style.border = '2px dashed #cbd5e0';
          element.textContent = '📊 Barcode Placeholder';
        }
        break;

      default:
        element.textContent = widget.content || '';
        break;
    }

    return element;
  }
  private generateBarcodeCanvas(productId: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');

    try {
      // Check if JsBarcode is available
      if (!(window as any).JsBarcode) {
        console.warn('JsBarcode library not found. Make sure it is loaded.');
      }

      // Create a temporary canvas
      canvas.width = 300;
      canvas.height = 100;

      // Generate barcode
      (window as any).JsBarcode(canvas, productId, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 5,
        background: '#ffffff',
        lineColor: '#000000',
      });
      return canvas;
    } catch (error) {
      console.error('Error generating barcode:', error);
    }
    return canvas;
  }
private generateQRCodeCanvas(data: any): HTMLCanvasElement {
  const canvas = document.createElement('canvas');

  try {
    // Check if QRCode library is available
    if (!(window as any).QRCode) {
      console.warn('QRCode library not found. Make sure it is loaded.');
    }

    // Convert JSON object to string if needed
    let qrText: string;
    if (typeof data === 'object') {
      qrText = JSON.stringify(data);
    } else {
      qrText = String(data);
    }

    // Set canvas size
    canvas.width = 100;
    canvas.height = 100;

    // Generate QR code synchronously on canvas
    (window as any).QRCode.toCanvas(canvas, qrText, {
      width: 100,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    }, function(err: any) {
      if (err) {
        console.error('Error generating QR code:', err);
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
  }

  return canvas;
}


}