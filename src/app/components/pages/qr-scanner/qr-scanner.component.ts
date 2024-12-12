import { AfterViewInit, Component, EventEmitter, Input, NgZone, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgxScannerQrcodeComponent, ScannerQRCodeConfig, ScannerQRCodeDevice, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import { ClickableHandlerService } from 'src/app/services/clickable-handler.service';
import { GameQrScanner } from 'src/app/services/ponte-virtuale.service';
import { SharedDataService } from 'src/app/services/shared-data.service';
import { Optional } from 'src/app/services/utils';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss']
})
export class QrScannerComponent implements OnInit, AfterViewInit {

  // https://stackblitz.com/edit/angular-ngx-scanner-qrcode?file=src%2Fapp%2Fapp.component.ts
  // https://www.npmjs.com/package/ngx-scanner-qrcode

  @Input() scanner: string;
  @Output() qrcode = new EventEmitter<string>();
  @Output() event = new EventEmitter<string>();

  @ViewChild('action') action!: NgxScannerQrcodeComponent;
  public config: ScannerQRCodeConfig = {
    constraints: {
      video: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    },
  }
  devs: ScannerQRCodeDevice[] = [];
  qrScanner: GameQrScanner;

  constructor(
    private ng: NgZone,
    private shared: SharedDataService,
    private clickable: ClickableHandlerService,
    ) {
  
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refreshHtml();
  }

  ngOnInit() {
    this.refreshHtml();
  }

  private refreshHtml() {
    this.qrScanner = this.shared.getScanner(this.scanner);
    if (this.qrScanner.data) {
      this.qrScanner.data = {...{id: this.qrScanner.id}, ...this.qrScanner.data};
    } else {
      this.qrScanner.data = {id: this.qrScanner.id};
    }
  }

  ngAfterViewInit(): void {
    this.action.isReady.subscribe(res => this.ng.run(() => this.qrReady(res)));
    this.action.devices.subscribe(devs => this.devs = devs);
  }

  qrReady(res: boolean) {
    console.log('qrReady', res);
    if (res) {
      this.action.start().subscribe((device: InputDeviceInfo) => {
        console.log("using device", device);
      });
    }
  }

  onScannerEvent(results: ScannerQRCodeResult[]) {
    if (results.length) {
      this.action.stop();
      this.qrcode.emit(results[0].value);
    };
  }

  toggleCamera(): void {
    let index = this.action.deviceIndexActive >= (this.devs.length -1 ) ? 0 : this.action.deviceIndexActive+1 ;
    this.action.playDevice(this.devs[index].deviceId).subscribe(pd => console.log('pd', pd));
  }

  cancelScan(): void {
    this.action.stop();
    this.event.emit('cancel');
  }

  handleClickable(event: any) {
    this.clickable.handleClickable(event.target);
    this.clickable.handleTarget(event.target, 'data-close', (a) => this.cancelScan());
    this.clickable.handleTarget(event.target, 'data-camera', (a) => this.toggleCamera());
  }

}
