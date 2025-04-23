import { Status } from "../Status";

export interface DeliveryStatusUpdateDto {
  idLivraison: number;
  etatLivraison: Status;
  updateDate?: Date;
}
