import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-import-template-dialog',
  templateUrl: './app-import-template-dialog.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./app-import-template-dialog.scss']
})
export class ImportTemplateDialogComponent {
  selectedFile: File | null = null;
  @Input() jsonPreview!: string;
  @Output() importConfirmed = new EventEmitter<any>(); // emit imported data
  @Output() cancel = new EventEmitter<void>();
  @Output() updatePreview = new EventEmitter<void>();

  public headerLabels: string[] = [];
  previewData: any[][] = [];  // <-- Defined here
  imageColumnMappings: { [key: string]: boolean } = {};
  constructor(private _cdr: ChangeDetectorRef) { }
  downloadSample() {
    this.headerLabels = [];

    try {
      if (this.jsonPreview) {
        const jsonObject = JSON.parse(this.jsonPreview);

        // Get all keys except 'timestamp'
        this.headerLabels = Object.keys(jsonObject).filter(key => key !== 'timestamp' && key !== 'productId');
      }
    } catch (e) {
      console.warn('Failed to parse jsonPreview:', e);
      this.headerLabels = [];
    }

    const fileName = 'SampleTemplate.xlsx';

    const ws = XLSX.utils.aoa_to_sheet([this.headerLabels]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, fileName);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  confirmImport() {
    if (!this.selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      this.previewData.unshift(this.headerLabels);
      this.importConfirmed.emit(this.previewData);
      this.close();
    };

    reader.onerror = () => {
      alert('Failed to read file!');
      this.close();
    };

    reader.readAsArrayBuffer(this.selectedFile);
  }

  close() {
    this.cancel.emit();
  }

  selectedImages: File[] = [];
  imageMapping: 'sequential' | 'filename' = 'filename';
  showImageUpload = false;

  async onFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    try {
      this.selectedFile = file;
      const data = await this.readExcel(file);
      if (data.length > 0) {
        this.headerLabels = data[0];
        this.previewData = data.slice(1);
        this.showImageUpload = !!this.selectedFile && this.headerLabels.some((label) => label.includes("image")); // Show image upload section

        this.headerLabels.forEach(header => {
          if (header.toLowerCase().includes('image')) {
            this.imageColumnMappings[header] = true;
          }
        });
        this._cdr.detectChanges();
      }
    } catch (error) {
      alert('Error reading Excel file: ' + error);
    }
  }

  async onImagesSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    this.selectedImages = files;

    if (files.length > 0) {
      await this.processMultipleImages();
    }
  }

  async processMultipleImages() {
    if (this.selectedImages.length === 0 || this.previewData.length === 0) return;

    this.ensureImageColumns();

    await this.mapImagesToRows();

    this.updatePreview.emit();

  }

  private ensureImageColumns() {
    const imageColumnCount = Object.keys(this.imageColumnMappings).filter(
      key => this.imageColumnMappings[key]
    ).length;

    const imagesPerRow = Math.ceil(this.selectedImages.length / this.previewData.length);
    const neededColumns = Math.max(imageColumnCount, imagesPerRow);

    // Add image columns if needed
    for (let i = imageColumnCount + 1; i <= neededColumns; i++) {
      const columnName = `image${i}`;
      if (!this.headerLabels.includes(columnName)) {
        this.headerLabels.push(columnName);
        this.imageColumnMappings[columnName] = true;

        // Extend all data rows
        this.previewData.forEach(row => {
          if (row.length < this.headerLabels.length) {
            row.push('');
          }
        });
      }
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Add this helper method
  private async readExcel(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
          });

          resolve(jsonData as any[][]);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  getImageCount(): number {
    let count = 0;
    this.previewData.forEach(row => {
      row.forEach(cell => {
        if (typeof cell === 'string' && cell.startsWith('data:image/')) {
          count++;
        }
      });
    });
    return count;
  }


  private async mapImagesToRows() {
    const imageColumns = this.headerLabels
      .map((header, index) => ({ header, index }))
      .filter(item => this.imageColumnMappings[item.header]);

    if (this.imageMapping === 'sequential') {
      let imageIndex = 0;

      for (let rowIndex = 0; rowIndex < this.previewData.length; rowIndex++) {
        const row = this.previewData[rowIndex];

        for (const { index: colIndex } of imageColumns) {
          if (imageIndex < this.selectedImages.length) {
            const base64 = await this.fileToBase64(this.selectedImages[imageIndex]);
            row[colIndex] = base64;
            imageIndex++;
          }

          if (imageIndex >= this.selectedImages.length) break;
        }

        if (imageIndex >= this.selectedImages.length) break;
      }
    } else {
      for (let rowIndex = 0; rowIndex < this.previewData.length; rowIndex++) {
        const row = this.previewData[rowIndex];

        for (const { header, index: colIndex } of imageColumns) {
          const expectedFilename = row[colIndex]?.toString().trim();

          if (expectedFilename && expectedFilename !== '') {
            const matchingFile = this.findFileByName(expectedFilename);

            if (matchingFile) {
              const base64 = await this.fileToBase64(matchingFile);
              row[colIndex] = base64;
              console.log(`Mapped ${matchingFile.name} to row ${rowIndex + 1}, column ${header}`);
            } else {
              console.warn(`No uploaded file matches "${expectedFilename}" for row ${rowIndex + 1}, column ${header}`);
            }
          }
        }
      }
    }
  }

  private findFileByName(expectedFilename: string): File | null {
    const expected = expectedFilename.toLowerCase().trim();

    const exactMatch = this.selectedImages.find(file => {
      const fileName = file.name.toLowerCase();
      const fileNameNoExt = fileName.replace(/\.[^/.]+$/, "");
      const expectedNoExt = expected.replace(/\.[^/.]+$/, "");

      return fileName === expected ||
        fileNameNoExt === expected ||
        fileNameNoExt === expectedNoExt ||
        fileName === expectedNoExt;
    });

    if (exactMatch) return exactMatch;

    const partialMatch = this.selectedImages.find(file => {
      const fileName = file.name.toLowerCase();
      return fileName.includes(expected) || expected.includes(fileName.replace(/\.[^/.]+$/, ""));
    });

    return partialMatch || null;
  }
}