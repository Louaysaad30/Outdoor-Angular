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
import { ToastrService } from 'ngx-toastr';

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
    CurrentUser:any;// Replace with actual user ID from your auth service
    expressDelivery: boolean = false;
    expressDeliveryFee: number = 10; // $10 for express delivery

    // Add new properties for additional services
    environmentFriendly: boolean = false;
    carePackage: boolean = false;
    environmentFriendlyFee: number = 15;
    carePackageFee: number = 15;

    checkoutForm!: FormGroup;
    submitted = false;

    // Add these properties
    selectedPaymentMethod = 'cod'; // Default to cash on delivery
    processingPayment = false;

    constructor(
        private formBuilder: FormBuilder,
        private ligneCommandeService: LignedecommandeService,
        private productService: ProductService,
        private panierService: PanierService,
        private checkoutService: CheckoutService,
        private router: Router,
        private toastr: ToastrService
    ) {
        this.initForm(); // Initialize form in constructor
    }

    ngOnInit(): void {
      this.CurrentUser = JSON.parse(localStorage.getItem('user')!);
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

    redirectToOverviewOrProcessOrder() {
        if (this.selectedPaymentMethod === 'stripe') {
            // For Stripe payment, first save the order with pending status
            const order = this.createOrderObject();
            order.etat = Status.IN_PROGRESS; // Set status to pending for Stripe

            this.processingPayment = true;

            this.checkoutService.addCommande(order).subscribe({
                next: (savedOrder) => {
                    // Associate each ligne commande with the new order
                    const orderAssociationPromises = this.cartData.map(item => {
                        if (!item.idLigneCommande) {
                            console.error('Missing idLigneCommande for item:', item);
                            return Promise.reject('Missing required ligne commande ID');
                        }
                        if (!savedOrder.idCommande) {
                          console.error('Missing idCommande in savedOrder:', savedOrder);
                          return Promise.reject('Missing required order ID');
                      }
                        return this.ligneCommandeService.affecterCommandeToLigneCommande(
                            item.idLigneCommande,
                            savedOrder.idCommande
                        ).toPromise();
                    });

                    Promise.all(orderAssociationPromises)
                        .then(() => {
                            this.processingPayment = false;
                            this.confirmOrderModal?.hide();

                            // Store the order ID in session storage for later use
                            sessionStorage.setItem('pendingOrderId', savedOrder.idCommande?.toString() || '0');

                            // Redirect to overview page
                            this.router.navigate(['/marketplacefront/user/overview'], {
                                queryParams: {
                                    pendingPayment: true,
                                    orderId: savedOrder.idCommande,
                                    amount: this.getDisplayTotal()
                                }
                            });
                        })
                        .catch(error => {
                            this.processingPayment = false;
                            console.error('Error associating line items with order:', error);
                            this.toastr.error('There was an error finalizing your order. Please try again.', 'Order Error');
                        });
                },
                error: (error) => {
                    this.processingPayment = false;
                    console.error('Error saving order:', error);
                    this.toastr.error('There was an error processing your order. Please try again.', 'Order Failed');
                }
            });
        } else {
            // For COD, process normally
            this.submitOrder();
        }
    }

    // Update your existing submitOrder method to handle only COD
    submitOrder() {
        this.processingPayment = true;

        // Create order object from form and cart data
        const order = this.createOrderObject();

        if (this.selectedPaymentMethod === 'cod') {
            // Process normal COD order
            this.checkoutService.addCommande(order).subscribe({
                next: (response) => {
                    // After order is created, associate each ligne commande with the order
                    const orderAssociationPromises = this.cartData.map(item => {
                      if (!item.idLigneCommande) {
                        console.error('Missing idLigneCommande for item:', item);
                        return Promise.reject('Missing required ligne commande ID');
                    }
                    if (!response.idCommande) {
                      console.error('Missing idCommande in savedOrder:', response);
                      return Promise.reject('Missing required order ID');
                  }
                        return this.ligneCommandeService.affecterCommandeToLigneCommande(

                            item.idLigneCommande,
                            response.idCommande
                        ).toPromise();
                    });

                    // Wait for all ligne commande associations to complete
                    Promise.all(orderAssociationPromises)
                        .then(() => {
                            this.processingPayment = false;
                            this.confirmOrderModal?.hide();
                            // Show success message
                            this.toastr.success('Your order has been placed successfully!', 'Order Confirmed');

                            // Redirect to overview page instead of order success page for COD orders
                            this.router.navigate(['/marketplacefront/user/overview'], {
                                queryParams: {
                                    orderComplete: true,
                                    orderId: response.idCommande,
                                    paymentMethod: 'cod'
                                }
                            });
                        })
                        .catch(error => {
                            this.processingPayment = false;
                            console.error('Error associating line items with order:', error);
                            this.toastr.error('There was an error finalizing your order. Please try again.', 'Order Error');
                        });
                },
                error: (error) => {
                    this.processingPayment = false;
                    console.error('Error placing order:', error);
                    this.toastr.error('There was an error processing your order. Please try again.', 'Order Failed');
                }
            });
        } else if (this.selectedPaymentMethod === 'stripe') {
            // Create a Stripe checkout session with order details
            order.etat = Status.ON_HOLD;

            this.checkoutService.addCommande(order).subscribe({
                next: (savedOrder) => {
                    // Associate each ligne commande with the new order
                    const orderAssociationPromises = this.cartData.map(item => {
                      if (!item.idLigneCommande) {
                        console.error('Missing idLigneCommande for item:', item);
                        return Promise.reject('Missing required ligne commande ID');
                    }
                    if (!savedOrder.idCommande) {
                      console.error('Missing idCommande in savedOrder:', savedOrder);
                      return Promise.reject('Missing required order ID');
                  }
                        return this.ligneCommandeService.affecterCommandeToLigneCommande(
                            item.idLigneCommande,
                            savedOrder.idCommande
                        ).toPromise();
                    });

                    Promise.all(orderAssociationPromises)
                        .then(() => {
                            // Now create the Stripe session with the order ID
                            const stripeData = {
                                orderId: savedOrder.idCommande,
                                orderAmount: this.getDisplayTotal(),
                                orderItems: this.cartData.map(item => ({
                                    productId: item.produit.idProduit,
                                    productName: item.produit.nomProduit,
                                    quantity: item.quantite,
                                    price: item.produit.prixProduit
                                })),
                                customerEmail: this.checkoutForm.value.email,
                                customerName: this.checkoutForm.value.name,
                                successUrl: `${window.location.origin}/marketplacefront/payment-success?orderId=${savedOrder.idCommande}`,
                                cancelUrl: `${window.location.origin}/marketplacefront/user/overview?orderId=${savedOrder.idCommande}`
                            };

                            this.checkoutService.createStripeCheckoutSession(stripeData).subscribe({
                                next: (checkoutUrl) => {
                                    // Redirect to Stripe checkout
                                    window.location.href = checkoutUrl;
                                },
                                error: (error) => {
                                    this.processingPayment = false;
                                    console.error('Error creating Stripe session:', error);
                                    this.toastr.error('There was an error setting up the payment. Please try again.', 'Payment Setup Failed');
                                }
                            });
                        })
                        .catch(error => {
                            this.processingPayment = false;
                            console.error('Error associating line items with order:', error);
                            this.toastr.error('There was an error finalizing your order. Please try again.', 'Order Error');
                        });
                },
                error: (error) => {
                    this.processingPayment = false;
                    console.error('Error saving order before payment:', error);
                    this.toastr.error('There was an error saving your order details. Please try again.', 'Order Failed');
                }
            });
        }
    }

    // Helper method to create the order object
    private createOrderObject(): Commande {
        // Create a new order object with form data
        const order: Commande = {
            idCommande: 0, // New order, ID will be assigned by server
            nom: this.checkoutForm.value.name,
            phone: this.checkoutForm.value.phoneNumber,
            email: this.checkoutForm.value.email,
            city: this.checkoutForm.value.city,
            gouvernement: this.checkoutForm.value.gouvernorate,
            adresse: this.checkoutForm.value.address,
            shippingMethod: this.expressDelivery ? 'EXPRESS' : 'STANDARD',
            AdditionalService: this.getAdditionalServices(),
            montantCommande: this.getDisplayTotal(),
            dateCommande: new Date(),
            ligneCommande: this.cartData.map(item => {
                const ligneCmd = new LigneCommande();
                ligneCmd.quantite = item.quantite;
                ligneCmd.prix = item.produit.prixProduit;
                ligneCmd.produit = item.produit; // Use the full Product object
                ligneCmd.idProduit = item.produit.idProduit;
                return ligneCmd;
            }),
            userId: this.CurrentUser.id, // Use the actual user ID from your auth service
            etat: Status.ON_HOLD, // Default status
            OrderNumber: this.generateOrderNumber(),
            paymentMethod: this.selectedPaymentMethod // Add the selected payment method

        };

        return order;
    }

    // Helper method to generate a unique order number
    private generateOrderNumber(): string {
        const timestamp = new Date().getTime();
        const randomPart = Math.floor(Math.random() * 1000);
        return `ORD-${timestamp}-${randomPart}`;
    }

    // Helper method to get additional services as a number
    private getAdditionalServices(): number {
        // Convert service selections to a numeric code
        // 0: No services, 1: Environment friendly only, 2: Care package only, 3: Both services
        let serviceCode = 0;
        if (this.environmentFriendly) serviceCode += 1;
        if (this.carePackage) serviceCode += 2;
        return serviceCode;
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
        this.panierService.getAllPaniersByUserId(this.CurrentUser.id).pipe(
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
