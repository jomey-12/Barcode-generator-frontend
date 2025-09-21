import { Directive, Input, ElementRef, AfterViewInit, OnChanges } from '@angular/core';

declare var QRCode: any;

@Directive({
  selector: '[appQrCode]'
})
export class QrCodeDirective implements AfterViewInit, OnChanges {
  @Input() qrData!: any; // Accepts JSON or string

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.generateQr();
  }

  ngOnChanges() {
    this.generateQr();
  }

  private generateQr() {
    if (this.qrData && typeof QRCode !== 'undefined') {
      // Use setTimeout to ensure element is rendered
      setTimeout(() => {
        try {
          // Convert JSON to string if needed
          const dataString = typeof this.qrData === 'object' ? JSON.stringify(this.qrData) : String(this.qrData);

          // Clear any previous QR code
          this.el.nativeElement.innerHTML = '';

          // Generate QR code
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
