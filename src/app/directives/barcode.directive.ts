import { Directive, Input, ElementRef, AfterViewInit, OnChanges } from '@angular/core';

declare var JsBarcode: any;

@Directive({
  selector: '[appBarcode]'
})
export class BarcodeDirective implements AfterViewInit, OnChanges {
  @Input() productId!: string;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.generateBarcode();
  }

  ngOnChanges() {
    this.generateBarcode();
  }

  private generateBarcode() {
    if (this.productId && typeof JsBarcode !== 'undefined') {
      setTimeout(() => {
        try {
          JsBarcode(this.el.nativeElement, this.productId, {
            format: 'CODE128',
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