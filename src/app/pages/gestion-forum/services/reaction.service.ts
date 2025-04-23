import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ReactionType} from "../models/reaction-type.enum";
import {Observable} from "rxjs";
import {Reaction} from "../models/reaction.model";

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private baseUrl = 'http://localhost:9090/reaction';

  constructor(private http: HttpClient) { }

  addReaction(postId: string, userId: number, reactionType: ReactionType): Observable<Reaction> {
    return this.http.post<Reaction>(
      `${this.baseUrl}/post/${postId}?userId=${userId}&reactionType=${reactionType}`,
      {}
    );
  }

  updateReaction(reactionId: string, reactionType: ReactionType): Observable<Reaction> {
    return this.http.put<Reaction>(
      `${this.baseUrl}/${reactionId}?reactionType=${reactionType}`,
      {}
    );
  }

  getReactionsByPostId(postId: string): Observable<Reaction[]> {
    return this.http.get<Reaction[]>(`${this.baseUrl}/post/${postId}`);
  }
  deleteReaction(reactionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reactionId}`);
  }
}
