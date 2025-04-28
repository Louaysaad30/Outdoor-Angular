import { Component, QueryList, ViewChild, ViewChildren, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CheckoutService } from '../../services/checkout.service';
import { Commande } from '../../models/Commande';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { forkJoin, of, Subject } from 'rxjs';
import { debounceTime, take, switchMap, catchError, map } from 'rxjs/operators';
import { Status } from '../../models/Status';
import { UserService } from '../../services/user-service/user.service';
import { ToastrService } from 'ngx-toastr';
import { DeliveryService } from '../../services/livraison/delivery.service';
import { Livraison } from '../../models/Livraison';
import { BehaviorSubject } from 'rxjs';
import { MailerService } from '../../services/mail/mailer.service';
@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  providers: [DecimalPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersComponent implements OnInit, AfterViewInit {
  currentStartDate: Date = new Date(new Date().setMonth(new Date().getMonth() - 1));
  currentEndDate: Date = new Date();
  Status = Status;
  term: any;
  // bread crumb items
  breadCrumbItems!: Array<{}>;
  linebasicChart: any;
  orderForm!: UntypedFormGroup;
  submitted: boolean = false;
  masterSelected!: boolean;
  Orderlist: Commande[] = [];
  Order: Commande[] = [];
  deliveryPersons: any[] = [];

  // Table data
  deleteId: any;
  sortValue: any = 'dateCommande';
  endItem: any;
  loading: boolean = true;

  // Statistics
  totalOrders: number = 0;
  totalAmount: number = 0;
  pendingOrders: number = 0;
  completedOrders: number = 0;
  shippedOrders: number = 0;
  canceledOrders: number = 0;

  // Add these properties
  revenuePending: number = 0;
  revenueShipped: number = 0;
  revenueDelivered: number = 0;
  revenueCancelled: number = 0;


  // Chart data
  ordersByDate: Map<string, number> = new Map();

  // Recent orders for activity feed
  recentOrders: Commande[] = [];

  @ViewChild('showModal', { static: false }) showModal?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private checkoutService: CheckoutService,
    private datePipe: DatePipe,
    private userService: UserService,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private mailerService: MailerService, // Add this line
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.loadDeliveryPersons();
      this.loadRealOrderData();
    });
    this.breadCrumbItems = [
      { label: 'Ecommerce', active: true },
      { label: 'Orders', active: true }
    ];
    this.orderForm = this.formBuilder.group({
      id: [''],
      nom: ['', [Validators.required]],
      product: ['', [Validators.required]],
      dateCommande: ['', [Validators.required]],
      montantCommande: ['', [Validators.required]],
      shippingMethod: ['', [Validators.required]],
      etat: ['', [Validators.required]]
    });

    // Add this to your existing ngOnInit
    this.setupProductNameLoader();
  }

  ngAfterViewInit() {
    // Force chart update after view is initialized
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  loadDeliveryPersons(): void {
    this.userService.getUsersByRoleLivreur().subscribe({
      next: (data) => {
        console.log('Delivery persons:', data);
        this.deliveryPersons = data;
        this.cdr.detectChanges(); // Add this line to trigger change detection
      },
      error: (error) => {
        console.error('Error loading delivery persons:', error);
      }
    });
  }

  /**
   * Load real order data from API
   */
  loadRealOrderData() {
    this.loading = true;
    this.checkoutService.getAllCommandes().pipe(
      catchError(error => {
        console.error('Error fetching orders:', error);
        return of([]);
      })
    ).subscribe(orders => {
      this.Orderlist = orders;
      console.log('Orders:', this.Orderlist);
      this.Order = orders.slice(0, 8);

      // Get the 5 most recent orders for the activity feed
      this.recentOrders = [...orders]
        .sort((a, b) => new Date(b.dateCommande || 0).getTime() - new Date(a.dateCommande || 0).getTime())
        .slice(0, 5);

      console.log('Calculating order statistics...', orders);
      this.calculateOrderStatistics(orders);

      // Précharger les noms de produits pour les commandes affichées
      this.preloadProductNames(this.Order);
      // Also preload product names for recent orders
      this.preloadProductNames(this.recentOrders);

      this.loading = false;
      document.getElementById('elmLoader')?.classList.add('d-none');
    });
  }

  /**
   * Calculate order statistics
   */
  calculateOrderStatistics(orders: Commande[]) {
    console.log("Raw orders data:", orders); // For debugging

    // First check if we have orders
    if (!orders || orders.length === 0) {
      console.log("No orders to calculate statistics");
      return;
    }

    this.totalOrders = orders.length;
    this.totalAmount = orders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);

    // Log the first order's status for debugging
    if (orders.length > 0) {
      console.log("First order status:", orders[0].etat);
      console.log("Status enum IN_PROGRESS:", Status.IN_PROGRESS);
    }

    // Count orders by status - convert string to enum if needed
    const pendingOrders = orders.filter(order =>
      order.etat === Status.IN_PROGRESS || order.etat?.toString() === Status.IN_PROGRESS.toString());

    const ONHOLDOrders = orders.filter(order =>
      order.etat === Status.ON_HOLD || order.etat?.toString() === Status.ON_HOLD.toString());

    const deliveredOrders = orders.filter(order =>
      order.etat === Status.DELIVERED || order.etat?.toString() === Status.DELIVERED.toString());

    const canceledOrders = orders.filter(order =>
      order.etat === Status.CANCELED || order.etat?.toString() === Status.CANCELED.toString());

    console.log("Pending orders count:", pendingOrders.length);
    console.log("Shipped orders count:", ONHOLDOrders.length);
    console.log("Delivered orders count:", deliveredOrders.length);
    console.log("Canceled orders count:", canceledOrders.length);

    // Set counts
    this.pendingOrders = pendingOrders.length;
    this.shippedOrders = ONHOLDOrders.length;
    this.completedOrders = deliveredOrders.length;
    this.canceledOrders = canceledOrders.length;

    // Calculate revenue by status
    this.revenuePending = pendingOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueShipped = ONHOLDOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueDelivered = deliveredOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueCancelled = canceledOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
  }

  /**
   * Get array of last 28 days formatted for chart
   */
  getLast28Days(): Date[] {
    const result: Date[] = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      result.push(date);
    }

    return result;
  }

  // Add Sorting
  direction: any = 'asc';
  sortKey: any = '';

  sortBy(column: keyof Commande, value: any) {
    this.sortValue = value;
    this.onSort(column);
  }

  onSort(column: keyof Commande) {
    if (this.direction == 'asc') {
      this.direction = 'desc';
    } else {
      this.direction = 'asc';
    }
    const sortedArray = [...this.Order];
    sortedArray.sort((a, b) => {
      const res = this.compare(a[column], b[column]);
      return this.direction === 'asc' ? res : -res;
    });
    this.Order = sortedArray;
  }

  compare(v1: any, v2: any) {
    // Handle date comparison
    if (v1 instanceof Date && v2 instanceof Date) {
      return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
    }

    // Handle string dates
    if (typeof v1 === 'string' && typeof v2 === 'string' &&
        v1.includes('-') && v2.includes('-')) {
      const date1 = new Date(v1);
      const date2 = new Date(v2);
      if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
        return date1 < date2 ? -1 : date1 > date2 ? 1 : 0;
      }
    }

    // Handle arrays (like LigneCommande[])
    if (Array.isArray(v1) && Array.isArray(v2)) {
      return v1.length < v2.length ? -1 : v1.length > v2.length ? 1 : 0;
    }

    // Handle undefined/null values
    if (v1 === undefined || v1 === null) return -1;
    if (v2 === undefined || v2 === null) return 1;

    // Default string/number comparison
    return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
  }

  // Edit Order
  editOrder(id: any) {
    this.showModal?.show();
    var modaltitle = document.querySelector('.modal-title') as HTMLAreaElement;
    modaltitle.innerHTML = 'Edit Order';
    var modalbtn = document.getElementById('add-btn') as HTMLAreaElement;
    modalbtn.innerHTML = 'Update';

    const order = this.Order[id];
    this.orderForm.patchValue({
      id: order.idCommande,
      product: order.ligneCommande ? order.ligneCommande[0]?.produit?.nomProduit || 'Product' : 'Product',
      dateCommande: order.dateCommande ? new Date(order.dateCommande) : null,
      montantCommande: order.montantCommande,
      shippingMethod: order.shippingMethod || 'Standard',
      etat: order.etat || 'Pending'
    });
  }

  // Save Order
  saveOrder() {
    if (this.orderForm.valid) {
      const formValue = this.orderForm.value;
      const orderId = formValue.id;

      if (orderId) {
        // Get the existing order
        this.checkoutService.getCommande(orderId).subscribe(order => {
          // Update only editable fields
          order.etat = formValue.etat;
          order.shippingMethod = formValue.shippingMethod;

          // Save the updated order
          this.checkoutService.updateCommande(order).subscribe(
            updatedOrder => {
              // Find and replace the order in our local arrays
              const index = this.Orderlist.findIndex(o => o.idCommande === updatedOrder.idCommande);
              if (index !== -1) {
                this.Orderlist[index] = updatedOrder;

                // If the updated order is in the current view, update it there too
                const viewIndex = this.Order.findIndex(o => o.idCommande === updatedOrder.idCommande);
                if (viewIndex !== -1) {
                  this.Order[viewIndex] = updatedOrder;
                }
              }

              // Recalculate statistics
              this.calculateOrderStatistics(this.Orderlist);
            },
            error => console.error('Error updating order:', error)
          );
        });
      }

      this.showModal?.hide();
      setTimeout(() => {
        this.orderForm.reset();
      }, 1000);
      this.submitted = true;
    }
  }

  // Delete Order
  removeOrder(id: any) {
    this.deleteId = this.Order[id].idCommande;
    this.deleteRecordModal?.show();
  }

  checkedValGet: any[] = [];
  // The master checkbox will check/ uncheck all items
  checkUncheckAll(ev: any) {
    this.Order = this.Order.map((x: any) => ({ ...x, etat: ev.target.checked }));

    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.Order.length; i++) {
      if (this.Order[i].etat === Status.IN_PROGRESS) {
        result = this.Order[i].idCommande;
        checkedVal.push(result);
      }
    }

    this.checkedValGet = checkedVal;
    checkedVal.length > 0 ? document.getElementById("remove-actions")?.classList.remove('d-none') : document.getElementById("remove-actions")?.classList.add('d-none');
  }

  // Select Checkbox value Get
  onCheckboxChange(e: any) {
    var checkedVal: any[] = [];
    var result;
    for (var i = 0; i < this.Order.length; i++) {
      if (this.Order[i].etat ==  Status.IN_PROGRESS) {
        result = this.Order[i].idCommande;
        checkedVal.push(result);
      }
    }
    this.checkedValGet = checkedVal;
    checkedVal.length > 0 ? document.getElementById("remove-actions")?.classList.remove('d-none') : document.getElementById("remove-actions")?.classList.add('d-none');
  }

  // deletedata
  deleteData() {
    this.deleteRecordModal?.hide();

    if (this.deleteId) {
      // Delete single order
      this.checkoutService.deleteCommande(this.deleteId).subscribe(
        () => {
          // Remove from Orderlist
          this.Orderlist = this.Orderlist.filter(o => o.idCommande !== this.deleteId);
          // Remove from current view
          this.Order = this.Order.filter(o => o.idCommande !== this.deleteId);
          // Recalculate statistics
          this.calculateOrderStatistics(this.Orderlist);
        },
        error => console.error('Error deleting order:', error)
      );
    } else if (this.checkedValGet.length > 0) {
      // Delete multiple orders
      const deleteObservables = this.checkedValGet.map(id =>
        this.checkoutService.deleteCommande(id).pipe(
          catchError(error => {
            console.error(`Error deleting order ${id}:`, error);
            return of(null);
          })
        )
      );

      forkJoin(deleteObservables).subscribe(() => {
        // Remove deleted orders from Orderlist
        this.Orderlist = this.Orderlist.filter(o => !this.checkedValGet.includes(o.idCommande));
        // Remove from current view
        this.Order = this.Order.filter(o => !this.checkedValGet.includes(o.idCommande));
        // Recalculate statistics
        this.calculateOrderStatistics(this.Orderlist);
        // Reset checked values
        this.checkedValGet = [];
        document.getElementById("remove-actions")?.classList.add('d-none');
      });
    }

    this.masterSelected = false;
  }

  // filterdata
  filterdata() {
    if (this.term) {
      this.Order = this.Orderlist.filter((order: Commande) => {
        // Search by order number
        if (order.OrderNumber && order.OrderNumber.toLowerCase().includes(this.term.toLowerCase())) {
          return true;
        }

        // Search by product name in ligne commandes
        if (order.ligneCommande?.some(lc =>
          lc.produit?.nomProduit?.toLowerCase().includes(this.term.toLowerCase())
        )) {
          return true;
        }

        // Search by status
        if (order.etat?.toString().toLowerCase().includes(this.term.toLowerCase())) {
          return true;
        }

        return false;
      });
    } else {
      this.Order = this.Orderlist.slice(0, 10);
    }

    this.updateNoResultDisplay();
  }

  // no result
  updateNoResultDisplay() {
    const noResultElement = document.querySelector('.noresult') as HTMLElement;
    const paginationElement = document.getElementById('pagination-element') as HTMLElement;
    if (this.term && this.Order.length === 0) {
      noResultElement.classList.remove('d-none');
      paginationElement.classList.add('d-none');
    } else {
      noResultElement.classList.add('d-none');
      paginationElement.classList.remove('d-none');
    }
  }

  // pagechanged
  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    this.endItem = event.page * event.itemsPerPage;
    this.Order = this.Orderlist.slice(startItem, this.endItem);
  }

  // Format date for display
  formatDate(date: string | Date): string {
    if (!date) return '--';
    return this.datePipe.transform(new Date(date), 'dd MMM, yyyy') || '--';
  }


  /**
   * Get formatted list of all product names for tooltip
   */
  getProductNamesList(order: Commande): string {
    if (!order.idCommande || !this.productNamesCache.has(order.idCommande)) {
      return 'Liste de produits non disponible';
    }

    const names = this.productNamesCache.get(order.idCommande);
    if (!names || names.length === 0) {
      return 'Aucun produit dans cette commande';
    }

    // Format the names as a numbered list for better readability
    return names.map((name, index) => `${index + 1}. ${name}`).join('\n');
  }

  /**
   * Check if order has multiple products
   */
  hasMultipleProducts(order: Commande): boolean {
    if (!order.idCommande || !this.productNamesCache.has(order.idCommande)) {
      return false;
    }

    const names = this.productNamesCache.get(order.idCommande);
    return !!names && names.length > 1;
  }

  /**
   * Get product name from order's ligne commande
   */
  productNamesCache: Map<number, string[]> = new Map();

  // Replace the getProductName method with this optimized version
  getProductName(order: Commande): string {
    // If the order ID is not valid, return a default value
    if (!order.idCommande) {
      return 'Aucun produit';
    }

    // Check if product names are already in cache
    if (this.productNamesCache.has(order.idCommande)) {
      const names = this.productNamesCache.get(order.idCommande);
      if (names && names.length > 0) {
        // Don't show loading indicator in the UI
        if (names[0] === 'Chargement...') {
          return '⌛'; // Show a simple loading indicator
        }
        return names.length === 1
          ? names[0]
          : `${names[0]} (+${names.length - 1} plus)`;
      }
      return 'Aucun produit';
    }

    // Request this product name (will be batched)
    this.productNamesCache.set(order.idCommande, ['Chargement...']);
    this.productLoadingSubject.next([order.idCommande]);

    // Return loading indicator
    return '⌛';
  }

  private productLoadingSubject = new BehaviorSubject<number[]>([]);
  private productNamesBatchSize = 10;
  private productNamesLoading = false;
  private lastRequestedOrderIds: number[] = []; // Track last requested order IDs

  private setupProductNameLoader() {
    this.productLoadingSubject.pipe(
      debounceTime(100), // Wait 100ms after latest request
      switchMap(orderIds => {
        if (orderIds.length === 0) return of([]);

        // Store the order IDs for later use
        this.lastRequestedOrderIds = [...orderIds];

        console.log(`Batch loading product names for ${orderIds.length} orders`);
        this.productNamesLoading = true;

        // Create an array of observables for each order ID
        const requests = orderIds.map(id =>
          this.checkoutService.getProductNamesByCommandeId(id).pipe(
            take(1),
            catchError(err => {
              console.error(`Error loading products for order ${id}:`, err);
              return of([]);
            })
          )
        );

        // Execute all requests in parallel
        return forkJoin(requests).pipe(
          catchError(err => {
            console.error('Error in batch loading products:', err);
            return of(Array(orderIds.length).fill([]));
          })
        );
      })
    ).subscribe({
      next: (results) => {
        const orderIds = this.productLoadingSubject.getValue();

        // Update cache with results
        results.forEach((names, index) => {
          if (orderIds[index]) {
            this.productNamesCache.set(orderIds[index], names);
          }
        });

        this.productNamesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Product name loader error:', err);
        this.productNamesLoading = false;
      }
    });
  }

  // Méthode pour précharger les noms de produits
  preloadProductNames(orders: Commande[]) {
    // Skip if already loading or no orders
    if (this.productNamesLoading || !orders || orders.length === 0) {
      return;
    }

    // Filter only orders with valid IDs and not already in cache
    const orderIdsToLoad = orders
      .filter(order =>
        order.idCommande !== undefined &&
        !this.productNamesCache.has(order.idCommande) &&
        // Don't include orders with loading placeholder
        !(order.idCommande &&
          this.productNamesCache.has(order.idCommande) &&
          this.productNamesCache.get(order.idCommande)?.[0] === 'Chargement...')
      )
      .map(order => order.idCommande!);

    if (orderIdsToLoad.length === 0) {
      return;
    }

    console.log(`Requesting product names for ${orderIdsToLoad.length} orders`);

    // Add loading placeholders
    orderIdsToLoad.forEach(id => {
      this.productNamesCache.set(id, ['Chargement...']);
    });

    // Trigger batch loading
    this.productLoadingSubject.next(orderIdsToLoad);
  }

  fileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      // Process the file as needed
      console.log('File selected:', file.name);

      // Example file reading logic
      // const reader = new FileReader();
      // reader.onload = () => {
      //   // Do something with reader.result
      // };
      // reader.readAsDataURL(file);
    }
  }

  trackByOrderId(index: number, item: Commande): number {
    return item.idCommande || index;
  }


  assignDeliveryPerson(orderId: number, livreurId: string): void {
    console.log('Assigning delivery person - Order ID:', orderId, 'Delivery Person ID:', livreurId);

    if (!orderId) {
      this.toastr.error('Missing order ID');
      return;
    }

    if (!livreurId || livreurId === '') {
      this.toastr.warning('Please select a delivery person');
      return;
    }

    // Convert livreurId to number - add explicit logging
    const livreurIdNumber = Number(livreurId);
    console.log('Converted livreurId to number:', livreurIdNumber, 'Original value:', livreurId);

    if (isNaN(livreurIdNumber)) {
      this.toastr.error('Invalid delivery person ID');
      return;
    }

    this.toastr.info('Assigning delivery person...', 'Processing');

    // First get all delivery persons, then filter by ID
    this.userService.getUsersByRoleLivreur().pipe(
      switchMap(deliveryPersons => {
        // Find the specific delivery person by ID
        const deliveryPerson = deliveryPersons.find(person => person.id === livreurIdNumber);

        if (!deliveryPerson) {
          throw new Error(`Delivery person with ID ${livreurIdNumber} not found`);
        }

        console.log('Found delivery person:', deliveryPerson);

        // Now get the order details
        return this.checkoutService.getCommande(orderId).pipe(
          map((order): { order: any; deliveryPerson: any } => ({ order, deliveryPerson }))
        );
      }),
      switchMap(({ order, deliveryPerson }) => {
        // Create a new Livraison object
        const newLivraison = new Livraison();
        newLivraison.dateLivraison = new Date(); // Current date
        newLivraison.adresseLivraison = order.adresse || 'Address not provided';
        newLivraison.etatLivraison = Status.ON_HOLD; // Initial status
        newLivraison.livreurId = livreurIdNumber;
        newLivraison.LivreurId = livreurIdNumber; // Uppercase version
        newLivraison.montantCommande = order.montantCommande || 0;
        newLivraison.paymentMethod = order.paymentMethod || 'cod';
        newLivraison.OrderNumber = order.OrderNumber || `ORD-${order.idCommande}`;

        console.log('Creating delivery record with data:', newLivraison);

        // Add the livraison first
        return this.deliveryService.addLivraison(newLivraison).pipe(
          map(createdLivraison => ({ order, deliveryPerson, createdLivraison }))
        );
      }),
      switchMap(({ order, deliveryPerson, createdLivraison }) => {
        console.log('Livraison created successfully:', createdLivraison);

        // Now assign the livraison to the order
        return this.checkoutService.affecterLivraisonACommande(orderId, createdLivraison.idLivraison!).pipe(
          map(updatedOrder => ({ updatedOrder, deliveryPerson, createdLivraison }))
        );
      }),
      switchMap(({ updatedOrder, deliveryPerson, createdLivraison }) => {
        console.log('Order updated with livraison:', updatedOrder);
        this.updateOrderInLists(updatedOrder);

        // Send notification email to the delivery person
        return this.sendDeliveryAssignmentEmail(
          deliveryPerson.email,
          deliveryPerson.name || deliveryPerson.username || 'Delivery Partner',
          updatedOrder,
          createdLivraison
        ).pipe(
          map(() => 'Success'),
          catchError(error => {
            console.warn('Email notification failed, but delivery assignment succeeded:', error);
            return of('Email Failed');
          })
        );
      })
    ).subscribe({
      next: (result) => {
        this.toastr.success('Delivery person assigned successfully');
        if (result === 'Email Failed') {
          this.toastr.warning('Delivery assigned but notification email could not be sent');
        }
      },
      error: (error) => {
        console.error('Error in delivery assignment process:', error);
        this.toastr.error('Failed to assign delivery: ' + (error.message || 'Unknown error'));
      }
    });
  }

  // Helper method to update order in both Order and Orderlist arrays
  private updateOrderInLists(updatedOrder: Commande): void {
    const index = this.Order.findIndex(o => o.idCommande === updatedOrder.idCommande);
    if (index !== -1) {
      this.Order[index] = updatedOrder;
    }

    // Also update in the full orders list
    const fullIndex = this.Orderlist.findIndex(o => o.idCommande === updatedOrder.idCommande);
    if (fullIndex !== -1) {
      this.Orderlist[fullIndex] = updatedOrder;
    }

    // Recalculate statistics
    this.calculateOrderStatistics(this.Orderlist);

    // Force update with OnPush change detection
    this.Order = [...this.Order];
    this.cdr.detectChanges();
  }

  getPercentage(count: number): number {
    return this.totalOrders > 0 ? (count / this.totalOrders) * 100 : 0;
  }

  /**
   * Send delivery assignment email notification to the delivery person
   */
  private sendDeliveryAssignmentEmail(
    email: string,
    deliveryPersonName: string,
    order: Commande,
    livraison: Livraison
  ) {
    const subject = `New Delivery Assignment - Order #${order.OrderNumber || order.idCommande}`;

    // Format the order products
    let productItems = '<p>Products not available</p>';
    if (order.idCommande && this.productNamesCache.has(order.idCommande)) {
      const products = this.productNamesCache.get(order.idCommande);
      if (products && products.length > 0) {
        productItems = products.map(name =>
          `<div class="product-item">
          <div class="product-icon">📦</div>
          <div class="product-name">${name}</div>
          </div>`
        ).join('');
      }
    }

    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>New Delivery Assignment</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        body {
          font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .email-container {
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
          background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          color: white;
          margin: 10px 0;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .content {
          padding: 40px 30px;
          background-color: #fff;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
        }
        .highlight-box {
          background-color: #f9f9f9;
          border-left: 4px solid #4CAF50;
          padding: 20px;
          margin: 25px 0;
          border-radius: 0 8px 8px 0;
        }
        .order-details {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 15px;
        }
        .detail-item {
          flex: 1 1 45%;
          min-width: 200px;
        }
        .detail-label {
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .detail-value {
          font-size: 15px;
          color: #333;
        }
        .product-section {
          margin-top: 30px;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 20px;
        }
        .product-heading {
          font-size: 16px;
          color: #2E7D32;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .product-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .product-item {
          display: flex;
          align-items: center;
          padding: 10px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
        }
        .product-icon {
          margin-right: 10px;
          font-size: 20px;
        }
        .product-name {
          font-size: 14px;
        }
        .footer {
          background-color: #f7f7f7;
          padding: 25px 20px;
          text-align: center;
          font-size: 13px;
          color: #666;
        }
        .cta-button {
          display: block;
          text-align: center;
          margin: 30px auto 10px;
        }
        .btn {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(to right, #4CAF50, #2E7D32);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .divider {
          height: 1px;
          background-color: #eaeaea;
          margin: 30px 0;
        }
        .signature {
          margin-top: 25px;
          font-size: 14px;
        }
        .company-name {
          font-weight: 600;
        }
        .social-links {
          margin-top: 15px;
        }
        .social-link {
          display: inline-block;
          margin: 0 5px;
          color: #666;
          text-decoration: none;
        }
        @media only screen and (max-width: 550px) {
          .content {
            padding: 30px 20px;
          }
          .detail-item {
            flex: 1 1 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>OUTDOOR ADVENTURES</h1>
        </div>

        <div class="content">
          <h2 style="color: #2E7D32; margin-bottom: 20px; font-weight: 600;">🚚 New Delivery Assignment</h2>

          <p class="greeting">Hello ${deliveryPersonName},</p>

          <p>You have been assigned a new delivery. Please find the details below:</p>

          <div class="highlight-box">
            <div class="order-details">
              <div class="detail-item">
                <div class="detail-label">Order Number</div>
                <div class="detail-value">#${order.OrderNumber || order.idCommande}</div>
              </div>

              <div class="detail-item">
                <div class="detail-label">Delivery Date</div>
                <div class="detail-value">${this.formatDate(livraison.dateLivraison || new Date())}</div>
              </div>

              <div class="detail-item">
                <div class="detail-label">Customer</div>
                <div class="detail-value">${order.nom || 'Not specified'}</div>
              </div>
               <div class="detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${order.phone || 'Not specified'}</div>
              </div>

              <div class="detail-item">
                <div class="detail-label">Amount</div>
                <div class="detail-value">${order.montantCommande || 0} TND</div>
              </div>

              <div class="detail-item">
                <div class="detail-label">Payment Method</div>
                <div class="detail-value">${livraison.paymentMethod === 'cod' ? 'Cash on Delivery' : livraison.paymentMethod || 'Cash on Delivery'}</div>
              </div>

              <div class="detail-item">
                <div class="detail-label">Delivery Address</div>
                <div class="detail-value">${livraison.adresseLivraison || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div class="product-section">
            <div class="product-heading">📋 Products to Deliver</div>
            <div class="product-list">
              ${productItems}
            </div>
          </div>

          <p>Please log in to your delivery dashboard to see complete details and manage this delivery.</p>

          <div class="cta-button">
            <a href="https://outdoor.com/delivery-dashboard" class="btn">VIEW DELIVERY DETAILS</a>
          </div>

          <div class="signature">
            <p>Thank you,<br><span class="company-name">The Outdoor Management Team</span></p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Outdoor - All Rights Reserved</p>
          <p style="margin: 5px 0;">Tunisia, Africa Mall</p>

          <div class="social-links">
            <a href="#" class="social-link">Facebook</a> •
            <a href="#" class="social-link">Instagram</a> •
            <a href="#" class="social-link">Twitter</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

    // Send the email with HTML content
    return this.mailerService.sendEmail(email, subject, emailContent);
  }
}
