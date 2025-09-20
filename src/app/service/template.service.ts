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
  getTemplates(): Template[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  saveTemplate(template: Template): Template[] {
  const templates = this.getTemplates();

  // Create a copy of the template to avoid mutating the original
  const templateCopy: Template = {
    ...template,
    widgets: template.widgets.map(widget => ({
      ...widget,
      inputValue: undefined,   // reset input value
      productId: undefined,    // reset productId
      imageData: undefined,    // reset image data
      imageName: undefined,    // reset image name
      hasBarcode: undefined
    }))
  };

    templates.push(templateCopy);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    return templates;
  }

  deleteTemplate(templateId: number): Template[] {
    const templates = this.getTemplates();
    const filteredTemplates = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTemplates));
    return filteredTemplates;
  }

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

}
