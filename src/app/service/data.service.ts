import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TemplateRequest, TemplateResponse } from '../models/template.model';
import { Product } from '../models/product.model';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    constructor(private http: HttpClient) {}

    getAllTemplates(): Observable<TemplateResponse[]> {
        return this.http.get<TemplateResponse[]>('https://localhost:7132/api/template/all');
    }

    getTemplateById(templateReferenceId: string): Observable<TemplateResponse> {
        return this.http.get<TemplateResponse>(`https://localhost:7132/api/template/${templateReferenceId}`);
    }

    createTemplate(template: TemplateRequest): Observable<TemplateResponse> {
        return this.http.post<any>('https://localhost:7132/api/template', template);
    }

    deleteTemplate(templateReferenceId: string): Observable<void> {
        return this.http.delete<any>(`https://localhost:7132/api/template/${templateReferenceId}`);
    }

    createProduct(product: Product): Observable<Product> {
        return this.http.post<any>('https://localhost:7132/api/product', product);
    }
}
