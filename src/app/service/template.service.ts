import { Injectable } from '@angular/core';
import { Template } from '../models/template.model';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly STORAGE_KEY = 'templates';

  getTemplates(): Template[] {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  saveTemplate(template: Template): Template[] {
    const templates = this.getTemplates();
    templates.push(template);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    return templates;
  }

  deleteTemplate(templateId: number): Template[] {
    const templates = this.getTemplates();
    const filteredTemplates = templates.filter(t => t.id !== templateId);
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

  // Save original border style
  const originalBorder = canvasElement.style.border;
  let inputElementOriginalBorder: string;
  if(inputElement){
     inputElementOriginalBorder = inputElement.style.border;
  }

  // Remove border before capture
  canvasElement.style.border = 'none';
  if(inputElement){
    inputElement.style.setProperty('border', 'none', 'important');
  }

  html2canvas(element).then(canvas => {
    // Restore border after capture
    canvasElement.style.border = originalBorder;
    if(inputElement){
      inputElement.style.border = inputElementOriginalBorder;
    }

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
  });
}

}
