import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb/dist/pouchdb';

@Injectable({
  providedIn: 'root'
})
export class DbService {

  db: PouchDB.Database;

  constructor() {
  }

  init() {
    this.db = new PouchDB('photos');
  }

}
