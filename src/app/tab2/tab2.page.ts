import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { S3 } from 'aws-sdk';
import PouchDB from 'pouchdb/dist/pouchdb';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  coords: any;
  base64Image: string;
  documents: PouchDB.Core.Document<any>[];
  db: PouchDB.Database;
  imageData: string;


  constructor(
    private geolocation: Geolocation,
    private camera: Camera,
  ) {
    this.db = new PouchDB('photos');
    this.loadDocs();
  }

  geolocate() {
    return this.geolocation.getCurrentPosition().then(resp => {
      this.coords = resp.coords;
    });
  }

  private loadDocs() {
    return this.db.allDocs({
      include_docs: true,
      attachments: true
    }).then(res => {
      this.documents = res.rows.map(r => r.doc);
    });
  }

  upload() {
    const s3 = new S3({
      accessKeyId: 'AKIAQEWWE3BEABL4BV6V',
      secretAccessKey: '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',
      region: 'eu-west-1'
    });

    this.loadDocs().then(() => {
      this.documents.forEach(doc => {
        s3.putObject({
          Bucket: 'corso-ionic-immagini',
          Key: `photo-${doc._id}.jpg`,
          ContentEncoding: 'base64',
          ContentType: doc._attachments['photo.jpg'].content_type,
          Body: doc._attachments['photo.jpg'].data,
          ACL: 'public-read'
        }, (err, data) => {
          if (!err) {
            this.db.remove(doc._id, doc._rev);
          }
          console.log(err);
        });
      });
    });

  }

  photo() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    };

    this.camera.getPicture(options).then((imageData) => {
      this.base64Image = 'data:image/jpeg;base64,' + imageData;
      this.imageData = imageData;
    }, (err) => {
      // Handle error
    }).then(() => this.geolocate())
      .then(() => {
        const mydata = {
          lat: this.coords.latitude,
          lng: this.coords.longitude,
          _attachments: {
            'photo.jpg': {
              content_type: 'image/jpg',
              data: this.imageData
            }
          }
        };
        return this.db.post(mydata);
      })
      .then(() => this.loadDocs())
      .catch(err => console.log);
  }

}
