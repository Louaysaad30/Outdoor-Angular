import { Status } from "../Status";

export interface UpdateStateCommand {
    idCommande: number;
    etat: Status;
  }
