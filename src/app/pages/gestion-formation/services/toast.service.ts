import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr'; // ⚡ On utilise ngx-toastr qui est déjà dans la template

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Succès'): void {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

  error(message: string, title: string = 'Erreur'): void {
    this.toastr.error(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

  warning(message: string, title: string = 'Attention'): void {
    this.toastr.warning(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }

  info(message: string, title: string = 'Info'): void {
    this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      closeButton: true
    });
  }
}
