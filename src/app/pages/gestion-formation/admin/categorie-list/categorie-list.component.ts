import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaginationModule, PageChangedEvent } from 'ngx-bootstrap/pagination';
import { ModalDirective, ModalModule } from 'ngx-bootstrap/modal';
import { Categorie } from '../../models/categorie.model';
import { CategorieService } from '../../services/categorie-list.service';
import { DropzoneModule, DropzoneConfigInterface } from 'ngx-dropzone-wrapper';
import { SharedModule } from "../../../../shared/shared.module";
import { FastAverageColor } from 'fast-average-color';
@Component({
  selector: 'app-categorie-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationModule,
    ModalModule,
    DropzoneModule,
    SharedModule
  ],
  templateUrl: './categorie-list.component.html',
  styleUrls: ['./categorie-list.component.scss']
})
export class CategorieListComponent implements OnInit, AfterViewInit {
  breadCrumbItems!: Array<{}>;
  categories: Categorie[] = [];
  categorieslist: Categorie[] = [];

  categoryForm!: FormGroup;
  uploadedFiles: any[] = [];
  selectedFile?: File;

  term: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 15;
  deleteId: number | null = null;

  cardColors = [
    'bg-primary-subtle border-primary-subtle',
    'bg-success-subtle border-success-subtle',
    'bg-danger-subtle border-danger-subtle',
    'bg-warning-subtle border-warning-subtle',
    'bg-info-subtle border-info-subtle',
    'bg-secondary-subtle border-secondary-subtle'
  ];

  @ViewChild('addCategory') addCategory?: ModalDirective;
  @ViewChild('deleteRecordModal') deleteRecordModal?: ModalDirective;

  public dropzoneConfig: DropzoneConfigInterface = {
    url: 'https://httpbin.org/post', // dummy URL
    clickable: true,
    addRemoveLinks: true,
    autoProcessQueue: false,
    previewsContainer: false
  };

  constructor(private fb: FormBuilder, private categorieService: CategorieService) {}

  ngOnInit(): void {
    this.breadCrumbItems = [
      { label: 'Gestion de Formation', active: true },
      { label: 'Categories', active: true }
    ];
    this.initForm();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    const modalEl = document.querySelector('#addCategory');
    modalEl?.addEventListener('hide.bs.modal', () => {
      console.warn('Modal is being closed!');
    });
  }

  initForm() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  loadCategories(): void {
    this.categorieService.getCategories().subscribe((data: Categorie[]) => {
      this.categorieslist = data;
      this.pageChanged({ page: 1, itemsPerPage: this.itemsPerPage });
    });
  }

  filterdata(): void {
    const filtered = this.categorieslist.filter(c =>
      c.nom.toLowerCase().includes(this.term.toLowerCase())
    );
    this.categories = filtered.slice(0, this.itemsPerPage);
  }

  pageChanged(event: PageChangedEvent): void {
    const start = (event.page - 1) * event.itemsPerPage;
    const end = event.page * event.itemsPerPage;
    const filteredList = this.term
      ? this.categorieslist.filter(c =>
          c.nom.toLowerCase().includes(this.term.toLowerCase())
        )
      : this.categorieslist;

    this.categories = filteredList.slice(start, end);
  }

  getCardColorClass(index: number): string {
    return this.cardColors[index % this.cardColors.length];
  }

  onFileAdded(file: File) {
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

  openAddModal() {
    this.categoryForm.reset();
    this.uploadedFiles = [];
    this.selectedFile = undefined;
    this.addCategory?.show();
  }

  saveCategory(): void {
    if (this.categoryForm.valid && this.selectedFile) {
      const category = {
        nom: this.categoryForm.value.name,
        description: this.categoryForm.value.description,
        formations: [],
        imageUrl: ''
      };

      const formData = new FormData();
      formData.append('categorie', new Blob([
        JSON.stringify(category)
      ], { type: 'application/json' }));
      formData.append('image', this.selectedFile);

      this.categorieService.addCategory(formData).subscribe({
        next: () => {
          this.loadCategories();
          this.addCategory?.hide();
        },
        error: () => {
          console.error("Erreur lors de l'ajout de la catégorie.");
        }
      });
    }
  }

  removeItem(id: number) {
    this.deleteId = id;
    this.deleteRecordModal?.show();
  }

  confirmDelete() {
    if (this.deleteId != null) {
      this.categorieService.deleteCategory(this.deleteId).subscribe(() => {
        this.loadCategories();
        this.deleteId = null;
        this.deleteRecordModal?.hide();
      });
    }
  }

  trackById(index: number, item: Categorie): number {
    return item.id;
  }

  applyBackgroundFromImage(imageUrl: string, index: number): void {
    const fac = new FastAverageColor();
  
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  
    img.onload = () => {
      const color = fac.getColor(img).hex;
      const el = document.querySelector(`#category-card-${index}`) as HTMLElement;
      if (el) {
        el.style.backgroundColor = color;
      }
    };
  
    img.onerror = () => {
      console.warn('Image could not be loaded:', imageUrl);
    };
  }
    
}