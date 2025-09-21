import { Directive, Input, ElementRef, AfterViewInit, OnChanges, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { TemplateService } from '../service/template.service';
import { BarcodeType } from '../models/template.model';

declare var JsBarcode: any;

@Directive({
  selector: '[appBarcode]'
})
export class BarcodeDirective implements OnChanges {
  @Input() productId!: string;
  @Input() barcodeType: BarcodeType = 'CODE128';

  @Output() productIdChange = new EventEmitter<string>();

  constructor(private el: ElementRef, private templateService: TemplateService) { }

  ngOnChanges(changes: SimpleChanges) {
    let idToRender = this.productId;
    if (changes['barcodeType'] && !changes['barcodeType'].firstChange) {
      const newProductId = this.templateService.generateProductIdByFormat(this.barcodeType);
      this.productIdChange.emit(newProductId);
      idToRender = newProductId;
    }

    this.generateBarcode(idToRender);
  }

  private generateBarcode(id: string) {
    if (this.productId && typeof JsBarcode !== 'undefined') {
      setTimeout(() => {
        try {
          JsBarcode(this.el.nativeElement, id, {
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