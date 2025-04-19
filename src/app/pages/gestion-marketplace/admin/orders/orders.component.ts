import { Component, QueryList, ViewChild, ViewChildren, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { CheckoutService } from '../../services/checkout.service';
import { Commande } from '../../models/Commande';
import { PageChangedEvent } from 'ngx-bootstrap/pagination';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Status } from '../../models/Status';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  providers: [DecimalPipe, DatePipe]
})
export class OrdersComponent implements OnInit {
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

  @ViewChild('showModal', { static: false }) showModal?: ModalDirective;
  @ViewChild('deleteRecordModal', { static: false }) deleteRecordModal?: ModalDirective;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private checkoutService: CheckoutService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    /**
     * BreadCrumb
     */
    this.breadCrumbItems = [
      { label: 'Ecommerce', active: true },
      { label: 'Orders', active: true }
    ];

    /**
     * Form Validation
     */
    this.orderForm = this.formBuilder.group({
      id: [''],
      nom: ['', [Validators.required]],
      product: ['', [Validators.required]],
      dateCommande: ['', [Validators.required]],
      montantCommande: ['', [Validators.required]],
      shippingMethod: ['', [Validators.required]],
      etat: ['', [Validators.required]]
    });

    // Initialize chart
    this._linebasicChart('["--tb-primary", "--tb-secondary"]');

    // Fetch real data from API
    this.loadRealOrderData();
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

      console.log('Calculating order statistics...',orders);
      this.calculateOrderStatistics(orders);

      this._linebasicChart('["--tb-primary", "--tb-secondary"]');
      this.prepareChartData(orders);

      // Précharger les noms de produits pour les commandes affichées
      this.preloadProductNames(this.Order);

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

    const shippedOrders = orders.filter(order =>
      order.etat === Status.SHIPPED || order.etat?.toString() === Status.SHIPPED.toString());

    const deliveredOrders = orders.filter(order =>
      order.etat === Status.DELIVERED || order.etat?.toString() === Status.DELIVERED.toString());

    const canceledOrders = orders.filter(order =>
      order.etat === Status.CANCELED || order.etat?.toString() === Status.CANCELED.toString());

    console.log("Pending orders count:", pendingOrders.length);
    console.log("Shipped orders count:", shippedOrders.length);
    console.log("Delivered orders count:", deliveredOrders.length);
    console.log("Canceled orders count:", canceledOrders.length);

    // Set counts
    this.pendingOrders = pendingOrders.length;
    this.shippedOrders = shippedOrders.length;
    this.completedOrders = deliveredOrders.length;
    this.canceledOrders = canceledOrders.length;

    // Calculate revenue by status
    this.revenuePending = pendingOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueShipped = shippedOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueDelivered = deliveredOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
    this.revenueCancelled = canceledOrders.reduce((sum, order) => sum + (order.montantCommande || 0), 0);
  }

  /**
   * Prepare chart data from orders
   */
  prepareChartData(orders: Commande[]) {
    // Group orders by date
    const ordersByDate = new Map<string, number>();
    const returnsByDate = new Map<string, number>();

    // Initialize last 28 days
    const today = new Date();
    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const formattedDate = this.datePipe.transform(date, 'MM/dd/yyyy') || '';
      ordersByDate.set(formattedDate, 0);
      returnsByDate.set(formattedDate, 0);
    }

    // Count orders by date
    orders.forEach(order => {
      if (order.dateCommande) {
        const orderDate = this.datePipe.transform(new Date(order.dateCommande), 'MM/dd/yyyy') || '';
        if (ordersByDate.has(orderDate)) {
          ordersByDate.set(orderDate, (ordersByDate.get(orderDate) || 0) + 1);
        }

        // Count returns (orders with canceled status)
        if (order.etat === Status.CANCELED) {
          returnsByDate.set(orderDate, (returnsByDate.get(orderDate) || 0) + 1);
        }
      }
    });

    // Convert to arrays for chart
    const dates = Array.from(ordersByDate.keys());
    const orderCounts = Array.from(ordersByDate.values());
    const returnCounts = Array.from(returnsByDate.values());

    // Update chart data safely
    if (this.linebasicChart && this.linebasicChart.series) {
      this.linebasicChart.series[0].data = orderCounts;
      this.linebasicChart.series[1].data = returnCounts;

      if (this.linebasicChart.xaxis) {
        this.linebasicChart.xaxis.categories = dates;
      }
    }
  }

  // Chart Colors Set
  private getChartColorsArray(colors: any) {
    colors = JSON.parse(colors);
    return colors.map(function (value: any) {
      var newValue = value.replace(" ", "");
      if (newValue.indexOf(",") === -1) {
        var color = getComputedStyle(document.documentElement).getPropertyValue(newValue);
        if (color) {
          color = color.replace(" ", "");
          return color;
        }
        else return newValue;;
      } else {
        var val = value.split(',');
        if (val.length == 2) {
          var rgbaColor = getComputedStyle(document.documentElement).getPropertyValue(val[0]);
          rgbaColor = "rgba(" + rgbaColor + "," + val[1] + ")";
          return rgbaColor;
        } else {
          return newValue;
        }
      }
    });
  }

  /**
  * Sale Charts
  */
  private _linebasicChart(colors: any) {
    colors = this.getChartColorsArray(colors);
    this.linebasicChart = {
      series: [
        {
          name: "New Orders",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
          name: "Return Orders",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      ],
      chart: {
        height: 350,
        type: 'line',
        toolbar: {
          show: false
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
      },
      grid: {
        yaxis: {
          lines: {
            show: false
          }
        },
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 4
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      colors: colors,
      xaxis: {
        type: 'datetime',
        categories: this.getLast28Days()
      },
      yaxis: {
        show: false,
      }
    };

    const attributeToMonitor = 'data-theme';

    const observer = new MutationObserver(() => {
      this._linebasicChart('["--tb-primary", "--tb-secondary"]');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [attributeToMonitor]
    });
  }

  /**
   * Get array of last 28 days formatted for chart
   */
  getLast28Days(): string[] {
    const result = [];
    const today = new Date();

    for (let i = 27; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      result.push(this.datePipe.transform(date, 'MM/dd/yyyy GMT') || '');
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

  getProductName(order: Commande): string {
    // Si l'ID de commande n'est pas valide, retourner une valeur par défaut
    if (!order.idCommande) {
      return 'Aucun produit';
    }

    // Vérifier si nous avons déjà les noms de produits en cache
    if (this.productNamesCache.has(order.idCommande)) {
      const names = this.productNamesCache.get(order.idCommande);
      if (names && names.length > 0) {
        if (names.length === 1) {
          return names[0];
        } else {
          return `${names[0]} +${names.length - 1} autre(s)`;
        }
      } else {
        return 'Aucun produit';
      }
    }

    // Sinon, charger les noms de produits depuis l'API
    this.checkoutService.getProductNamesByCommandeId(order.idCommande).subscribe({
      next: (names: string[]) => {
        this.productNamesCache.set(order.idCommande!, names);
        // Forcer la mise à jour de l'affichage
        this.Order = [...this.Order];
      },
      error: (error) => {
        console.error('Error loading product names:', error);
        this.productNamesCache.set(order.idCommande!, []);
      }
    });

    // Retourner un message de chargement en attendant la réponse de l'API
    return 'Chargement...';
  }

  // Méthode pour précharger les noms de produits
  preloadProductNames(orders: Commande[]) {
    // Filtrer uniquement les commandes avec un ID valide
    const orderIds = orders
      .filter(order => order.idCommande !== undefined)
      .map(order => order.idCommande!);

    // Pour chaque ID de commande, charger les noms de produits
    orderIds.forEach(id => {
      this.checkoutService.getProductNamesByCommandeId(id).subscribe({
        next: (names) => {
          this.productNamesCache.set(id, names);
          // Forcer la mise à jour de l'affichage
          this.Order = [...this.Order];
        },
        error: (err) => {
          console.error(`Error loading product names for order ${id}:`, err);
          this.productNamesCache.set(id, []);
        }
      });
    });
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
}
