import { Directive, Input, ElementRef, AfterViewInit, OnChanges } from '@angular/core';

declare var QRCode: any;

@Directive({
  selector: '[appQrCode]'
})
export class QrCodeDirective implements AfterViewInit, OnChanges {
  @Input() qrData!: any; 

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.generateQr();
  }

  ngOnChanges() {
    this.generateQr();
  }

  private generateQr() {
    if (this.qrData && typeof QRCode !== 'undefined') {
      setTimeout(() => {
        try {
          const dataString = typeof this.qrData === 'object' ? JSON.stringify(this.qrData) : String(this.qrData);

          this.el.nativeElement.innerHTML = '';

          new QRCode(this.el.nativeElement, {
            text: dataString,
            width: 150,
            height: 150,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
          });
        } catch (e) {
          console.error('QR code generation error:', e);
        }
      }, 50);
    }
  }
}
