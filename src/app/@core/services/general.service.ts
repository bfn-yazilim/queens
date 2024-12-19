import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  constructor(public httpClient: HttpClient) { }

  Get<G>(page: string): Promise<G> {
    console.log('Get', page);

    return lastValueFrom(
      this.httpClient.get<G>(`${page}`).pipe(
        map((result: G) => {
          return result;
        })
      )
    );
  }
}
