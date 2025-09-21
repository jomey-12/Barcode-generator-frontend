import { Directive, Input, ElementRef, AfterViewInit, OnChanges } from '@angular/core';
import { TemplateService } from '../service/template.service';
import { BarcodeType } from '../models/template.model';

declare var JsBarcode: any;

@Directive({
  selector: '[appBarcode]'
})
export class BarcodeDirective implements AfterViewInit, OnChanges {
  @Input() productId!: string;
  @Input() barcodeType: BarcodeType = 'CODE128';

  constructor(private el: ElementRef, private templateService: TemplateService) {}

  ngAfterViewInit() {
    this.generateBarcode();
  }

  ngOnChanges() {
    this.productId = this.templateService.generateProductIdByFormat(this.barcodeType);
    this.generateBarcode();
  }

  private generateBarcode() {
    if (this.productId && typeof JsBarcode !== 'undefined') {
      setTimeout(() => {
        try {
          JsBarcode(this.el.nativeElement, this.productId, {
            format: this.barcodeType,
            width: 2,
            height: 50,
            displayValue: true
          });
        } catch (e) {
          console.error('Barcode generation error:', e);
        }
      }, 50);
    }
  }
}