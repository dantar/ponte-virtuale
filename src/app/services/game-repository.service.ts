import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameRepositoryService {

  uuid: string;

  constructor(
    private http: HttpClient,
  ) { 
    this.uuid = crypto.randomUUID();
  }

  async fetchResource(uri: string): Promise<string> {
    const xx = this.http
    .get<string>(uri, {responseType: 'text' as 'json'})
    .pipe(take(1));
    return lastValueFrom<string>(xx);
  }

  observeResource(uri: string): Observable<string> {
    return this.http
    .get(uri, {responseType: 'text', params: {uuid: this.uuid}});
  }

}
