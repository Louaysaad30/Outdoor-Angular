import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[zoomHover]'
})
export class ZoomHoverDirective {
  @Input() zoomScale: number = 1.15;

  constructor(private el: ElementRef) {
    this.el.nativeElement.style.transition = 'transform 0.3s ease';
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.el.nativeElement.style.transform = `scale(${this.zoomScale})`;
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.el.nativeElement.style.transform = 'scale(1)';
  }
}
