import { Component, OnInit, ViewChild } from '@angular/core';
import { countries } from '../country-data';
import { LigneCommande } from '../../models/LigneCommande';
import { LignedecommandeService } from '../../services/lignedecommande.service';
import { ProductService } from '../../services/product.service';
import { PanierService } from '../../services/panier/panier.service';
import { Commande } from '../../models/Commande';
import { CheckoutService } from '../../services/checkout.service';
import { of, EMPTY } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { Product } from '../../models/product';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Router } from '@angular/router';
import { Status } from '../../models/Status';

@Component({
    selector: 'app-checkout',
    templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
    @ViewChild('confirmOrderModal') confirmOrderModal?: ModalDirective;
    countries = countries;
    cartData: LigneCommande[] = [];
    subtotal: number = 0;
    flatFee: number = 1;
    userId: number = 1; // Replace with actual user ID from your auth service
    expressDelivery: boolean = false;
    expressDeliveryFee: number = 10; // $10 for express delivery


    // Add new properties for additional services
    environmentFriendly: boolean = false;
    carePackage: boolean = false;
    environmentFriendlyFee: number = 15;
    carePackageFee: number = 15;

    checkoutForm!: FormGroup;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private ligneCommandeService: LignedecommandeService,
        private productService: ProductService,
        private panierService: PanierService,
        private checkoutService: CheckoutService,
        private router: Router
    ) {
        this.initForm(); // Initialize form in constructor
    }

    ngOnInit(): void {
        this.loadCartData();
    }

    private initForm(): void {
        this.checkoutForm = this.formBuilder.group({
            name: ['', [
                Validators.required,
                Validators.pattern(/^[a-zA-Z\s]*$/)
            ]],
            phoneNumber: ['', [
                Validators.required,
                Validators.pattern(/^[0-9]{8}$/)
            ]],
            email: ['', [
                Validators.required,
                Validators.email
            ]],
            city: ['', [
                Validators.required,
                Validators.pattern(/^[a-zA-Z\s]*$/)
            ]],
            gouvernorate: ['', [
                Validators.required
            ]],
            address: ['', [
                Validators.required,
                Validators.minLength(5)
            ]]
        });

        // Monitor form changes
        this.checkoutForm.valueChanges.subscribe(() => {
            console.log('Form valid:', this.checkoutForm.valid);
            console.log('Form values:', this.checkoutForm.value);
            console.log('Form errors:', this.getFormValidationErrors());
        });

        // Mark all fields as touched when they lose focus
        Object.keys(this.checkoutForm.controls).forEach(key => {
            const control = this.checkoutForm.get(key);
            control?.valueChanges.subscribe(() => {
                if (control.dirty || control.touched) {
                    control.markAsTouched();
                }
            });
        });
    }

    public getFormValidationErrors() {
        const errors: any = {};
        Object.keys(this.checkoutForm.controls).forEach(key => {
            const controlErrors = this.checkoutForm.get(key)?.errors;
            if (controlErrors) {
                errors[key] = controlErrors;
            }
        });
        return errors;
    }

    // Getter for easy access to form fields
    get f() {
        return this.checkoutForm.controls;
    }

    public get formValidationErrors() {
        const errors: any = {};
        Object.keys(this.checkoutForm.controls).forEach(key => {
            const controlErrors = this.checkoutForm.get(key)?.errors;
            if (controlErrors) {
                errors[key] = controlErrors;
            }
        });
        return errors;
    }

    validateAndShowConfirmation(): void {
        this.submitted = true;

        if (this.checkoutForm.invalid) {
            return;
        }

        // If form is valid, show confirmation modal
        this.confirmOrderModal?.show();
    }

    submitOrder(): void {
        const formValues = this.checkoutForm.value;
        const newOrder = new Commande();

        // Personal Information with direct form values
        newOrder.nom = formValues.name;
        newOrder.phone = Number(formValues.phoneNumber);
        newOrder.email = formValues.email;
        newOrder.city = formValues.city;
        newOrder.gouvernement = formValues.gouvernorate;
        newOrder.adresse = formValues.address;
        newOrder.userId = this.userId; // Static user ID for testing
        newOrder.etat = Status.IN_PROGRESS; // Set initial status to IN_PROGRESS
        newOrder.OrderNumber = this.generateComplexOrderNumber(this.userId); // Complex order number to avoid duplication

        // Shipping Method
        newOrder.shippingMethod = this.expressDelivery ? 'ExpressDelivery' : 'FreeDelivery';

        // Additional Services
        if (this.environmentFriendly && this.carePackage) {
            newOrder.AdditionalService = 3;
        } else if (this.carePackage) {
            newOrder.AdditionalService = 2;
        } else if (this.environmentFriendly) {
            newOrder.AdditionalService = 1;
        } else {
            newOrder.AdditionalService = 0;
        }

        // Order total and date
        newOrder.montantCommande = Number(this.getDisplayTotal().toFixed(2));
        newOrder.dateCommande = new Date();

        // Set ligne commande
        newOrder.ligneCommande = this.cartData;

        this.checkoutService.addCommande(newOrder).subscribe({
            next: (response) => {
                console.log('Order created successfully:', response);

                // After order creation, affect each ligne commande to the order
                const affectationPromises = this.cartData.map(ligne =>
                    this.ligneCommandeService.affecterCommandeToLigneCommande(
                        ligne.idLigneCommande!,
                        response.idCommande!
                    ).toPromise()
                );

                // Find the panier ID from the cart data
                if (this.cartData.length > 0 && this.cartData[0].panier && this.cartData[0].panier.idPanier) {
                    const panierId = this.cartData[0].panier.idPanier;
                    console.log('Panier ID:', panierId);
                    // Mark the panier as validated using the existping validatePanier method
                    this.panierService.validatePanier(panierId).subscribe({
                        next: (validatedPanier) => {
                            console.log('Panier marked as validated:', validatedPanier);
                        },
                        error: (error) => {
                            console.error('Error validating panier:', error);
                        }
                    });
                }

                // Wait for all affectations to complete
                Promise.all(affectationPromises)
                    .then(() => {
                        console.log('All ligne commandes affected successfully');
                        this.confirmOrderModal?.hide();
                        // Redirect after successful order and affectations
                        this.router.navigate(['/marketplacefront/user/overview']);
                    })
                    .catch(error => {
                        console.error('Error affecting ligne commandes:', error);
                        alert('Error finalizing order. Please try again.');
                    });
            },
            error: (error) => {
                console.error('Error creating order:', error);
                alert('Error creating order. Please try again.');
            }
        });
    }

    private generateComplexOrderNumber(userId: number): string {
        // Get current date components
        const now = new Date();
        const timestamp = now.getTime(); // Unix timestamp in milliseconds

        // Generate 4 random alphanumeric characters
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();

        // Use last 2 digits of userId
        const userPart = userId.toString().padStart(2, '0').slice(-2);

        // Format: OD-{YearMonth}{Day}-{Random4}-{UserID}
        const dateFormat = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

        return `OD-${dateFormat}-${random}-${userPart}`;
    }

    loadCartData(): void {
        this.panierService.getAllPaniersByUserId(this.userId).pipe(
            tap(paniers => console.log('All paniers received:', paniers)),
            switchMap(paniers => {
                // Filter for non-validated paniers
                const activePaniers = paniers.filter(p => p.validated !== true);
                console.log('Active (non-validated) paniers:', activePaniers);

                if (!activePaniers || activePaniers.length === 0) {
                    console.log('No active paniers found');
                    return of([] as LigneCommande[]);
                }

                // Use the first active panier
                const panier = activePaniers[0];

                if (!panier.idPanier) {
                    console.log('Active panier has no ID');
                    return of([] as LigneCommande[]);
                }

                console.log('Using panier with ID:', panier.idPanier);

                return this.ligneCommandeService.getLigneCommandesByPanierId(panier.idPanier).pipe(
                    tap(lignes => {
                        console.log('Raw lignes:', lignes);
                        lignes.forEach(ligne => console.log('Ligne details:', ligne));
                    }),
                    switchMap(lignes => this.productService.getAllProducts().pipe(
                        map(products => {
                            console.log('Products loaded:', products);

                            return lignes.map(ligne => {
                                // Filter out lignes that are already associated with a commande
                                if (ligne.commande) {
                                    console.log(`Ligne ${ligne.idLigneCommande} already has a commande, skipping`);
                                    return null;
                                }

                                let product = products.find(p => p.idProduit === ligne.idProduit);

                                if (!product) {
                                    product = products.reduce<Product | undefined>((closest, current) => {
                                        const currentDiff = Math.abs(current.prixProduit - ligne.prix);
                                        const closestDiff = closest ? Math.abs(closest.prixProduit - ligne.prix) : Infinity;
                                        return currentDiff < closestDiff ? current : closest;
                                    }, undefined);
                                }

                                if (!product) {
                                    console.warn(`No product found for ligne ${ligne.idLigneCommande}`);
                                    return null;
                                }

                                const mappedLigne = new LigneCommande();
                                mappedLigne.idLigneCommande = ligne.idLigneCommande;
                                mappedLigne.quantite = ligne.quantite;
                                mappedLigne.prix = ligne.prix;
                                mappedLigne.produit = product;
                                mappedLigne.panier = panier;
                                mappedLigne.idProduit = product.idProduit;

                                return mappedLigne;
                            }).filter((ligne): ligne is LigneCommande => ligne !== null);
                        })
                    ))
                );
            })
        ).subscribe({
            next: (lignes: LigneCommande[]) => {
                this.cartData = lignes;
                console.log('Final checkout data:', this.cartData);
                this.calculateTotals();
            },
            error: (error) => {
                console.error('Error loading checkout data:', error);
                this.cartData = [];
                this.calculateTotals();
            }
        });
    }

    private calculateTotals(): void {
        this.subtotal = this.cartData.reduce((sum, item) =>
            sum + (item.produit.prixProduit * item.quantite), 0);
    }

    toggleExpressDelivery(value: boolean): void {
        this.expressDelivery = value;
    }

    toggleEnvironmentFriendly(value: boolean): void {
        this.environmentFriendly = value;
    }

    toggleCarePackage(value: boolean): void {
        this.carePackage = value;
    }

    getDisplayTotal(): number {
        const deliveryFee = this.expressDelivery ? this.expressDeliveryFee : 0;
        const ecoFee = this.environmentFriendly ? this.environmentFriendlyFee : 0;
        const careFee = this.carePackage ? this.carePackageFee : 0;
        return this.subtotal + this.flatFee + deliveryFee + ecoFee + careFee;
    }
}
