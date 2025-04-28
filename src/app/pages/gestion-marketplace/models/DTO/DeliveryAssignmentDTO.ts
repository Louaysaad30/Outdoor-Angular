export class DeliveryAssignmentDTO {
  commandeId: number;
  livraisonId: number;

  constructor(commandeId: number, livraisonId: number) {
    this.commandeId = commandeId;
    this.livraisonId = livraisonId;
  }
}
