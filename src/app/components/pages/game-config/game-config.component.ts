import { Component, OnInit } from '@angular/core';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-game-config',
  templateUrl: './game-config.component.html',
  styleUrls: ['./game-config.component.scss']
})
export class GameConfigComponent implements OnInit {

  gameUrl: string;

  constructor(public shared: SharedDataService) {
  }

  ngOnInit(): void {
    this.gameUrl = this.shared.gameUrl || '';
  }

  saveUrl() {
    this.shared.setGameUrl(this.gameUrl);
    console.log('salvato');
  }

}
