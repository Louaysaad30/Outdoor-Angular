import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
import { Sponsor } from '../../models/sponsor.model';
import { SponsorListService } from '../../services/sponsor-list.service';
import { DropzoneModule, DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { SharedModule } from '../../../../shared/shared.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

@Component({
  selector: 'app-sponsor-list',
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, DropzoneModule, ModalModule, BsDropdownModule],
  templateUrl: './sponsor-list.component.html',
  styleUrl: './sponsor-list.component.scss'
})
export class SponsorListComponent implements OnInit {
  breadCrumbItems!: Array<{}>;
  sponsors: Sponsor[] = [];
  sponsorList: Sponsor[] = [];
  sponsorForm!: FormGroup;
  uploadedFiles: any[] = [];
  selectedFile?: File;
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  deleteId: number | null = null;
  editingSponsorId: number | null = null;
  @ViewChild('addSponsorModal') addSponsorModal?: ModalDirective;
  @ViewChild('deleteRecordModal') deleteRecordModal?: ModalDirective;

  public dropzoneConfig: DropzoneConfigInterface = {
    url: 'https://httpbin.org/post',
    clickable: true,
    addRemoveLinks: true,
    autoProcessQueue: false,
    previewsContainer: false,
    maxFiles: 1,
    acceptedFiles: 'image/*',
    maxFilesize: 2
  };

  constructor(private fb: FormBuilder, private sponsorService: SponsorListService) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Gestion de la formation', active: true },
      { label: 'Liste des sponsors', active: true }
    ];
    this.initForm();
    this.loadSponsors();
  }

  initForm(): void {
    this.sponsorForm = this.fb.group({
      nom: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[+][0-9]{1,3}[0-9]{4,14}$/)]],
      typeSponsor: ['', Validators.required],
      niveauSponsor: ['', Validators.required],
      adresse: [''],
      pays: ['']
    });
  }

  loadSponsors(): void {
    this.sponsorService.getSponsors().subscribe({
      next: (data) => {
        console.log('Sponsors fetched:', data); // ✅ VOIR SI LE BACKEND RÉPOND
        this.sponsorList = data;
      },
      error: (err) => {
        console.error('Failed to load sponsors', err); // 🔥 voir erreur API
      }
    });
  }
  
  onFileAdded(file: File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    const maxSizeMB = 2;

    if (!allowedTypes.includes(file.type)) {
      alert('Only image files (JPG, PNG, WEBP, AVIF) are allowed.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      alert('Image exceeds maximum size of 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const previewedFile = file as any;
      previewedFile.dataURL = reader.result;
      this.uploadedFiles = [previewedFile];
      this.selectedFile = file;
    };
    reader.readAsDataURL(file);
  }

  removeFile(file: any) {
    const index = this.uploadedFiles.indexOf(file);
    if (index > -1) {
      this.uploadedFiles.splice(index, 1);
    }
    this.selectedFile = undefined;
  }


  saveSponsor(): void {
    if (this.sponsorForm.invalid) return;
  
    const sponsor = this.sponsorForm.value;
    const formData = new FormData();
    formData.append('sponsor', new Blob([JSON.stringify(sponsor)], { type: 'application/json' }));
  
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile);
    }
  
    if (this.editingSponsorId) {
      this.sponsorService.updateSponsor(this.editingSponsorId, formData).subscribe({
        next: () => {
          this.loadSponsors();
          this.addSponsorModal?.hide();
          this.resetForm();
        },
        error: err => {
          console.error('Update error:', err);
          alert(err?.error || 'Update failed');
        }
      });
    } else {
      this.sponsorService.addSponsor(formData).subscribe({
        next: () => {
          this.loadSponsors();
          this.addSponsorModal?.hide();
          this.resetForm();
        },
        error: err => {
          console.error('Create error:', err);
          alert(err?.error || 'Creation failed');
        }
      });
    }
  }  
  
  editSponsor(sponsor: Sponsor): void {
    this.editingSponsorId = sponsor.id; // important!
    this.sponsorForm.patchValue(sponsor);
    this.uploadedFiles = [];
    this.selectedFile = undefined;
    this.addSponsorModal?.show();
  }
    
  resetForm(): void {
    this.sponsorForm.reset();
    this.uploadedFiles = [];
    this.selectedFile = undefined;
    this.editingSponsorId = null;
  }
  
  
  removeSponsor(id: number): void {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  confirmDelete(): void {
    if (this.deleteId !== null) {
      this.sponsorService.deleteSponsor(this.deleteId).subscribe(() => {
        this.loadSponsors();
        this.deleteRecordModal?.hide();
        this.deleteId = null;
      });
    }
  }

  openAddModal(): void {
    this.sponsorForm.reset();
    this.uploadedFiles = [];
    this.selectedFile = undefined;
    this.addSponsorModal?.show();
  }

  performSearch(): void {
    this.sponsorList = this.sponsors.filter(s =>
      s.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  whatsappLink(phone: string): string {
    return `https://wa.me/${phone.replace('+', '')}`;
  }

  emailLink(email: string): string {
    return `mailto:${email}`;
  }
  getBadgeLabel(level: string): string {
    switch (level) {
      case 'GOLD':
        return '🥇 GOLD';
      case 'SILVER':
        return '🥈 SILVER';
      case 'BRONZE':
        return '🥉 BRONZE';
      case 'PLATINUM':
        return '🏆 PLATINUM';
      default:
        return level;
    }
  }
  
  getBadgeClass(level: string): string {
    switch (level) {
      case 'GOLD':
        return 'bg-warning';
      case 'SILVER':
        return 'bg-secondary';
      case 'BRONZE':
        return 'bg-bronze';
      case 'PLATINUM':
        return 'bg-dark';
      default:
        return 'bg-secondary';
    }
  }
  
  getBadgeIconOnly(level: string): string {
    switch (level?.toUpperCase()) {
      case 'GOLD':
        return '🥇';
      case 'SILVER':
        return '🥈';
      case 'BRONZE':
        return '🥉';
      case 'PLATINUM':
        return '🏆';
      default:
        return '';
    }
  }
  
}
 