import { Injectable } from '@angular/core';
import { Template } from './template.model';

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

  exportTemplate(template: Template, templateName: string) {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_template.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}