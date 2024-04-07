import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IfTypeOf } from 'src/app/services/if-type-of.service';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-play-new-game',
  templateUrl: './play-new-game.component.html',
  styleUrls: ['./play-new-game.component.scss']
})
export class PlayNewGameComponent implements OnInit {

  loading: boolean;

  constructor(
    private route: ActivatedRoute, 
    private shared: SharedDataService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.route.params.subscribe(p => {
      this.loading = false;
      let gameUrl: string = '';
      if (p['folder']) {
        gameUrl = `../${p['folder']}`;
      }
      if (p['asset']) {
        gameUrl = `./assets/${p['asset']}`;
      }
      if (p['b64url']) {
        try {
          gameUrl = atob(p['b64url']);
        } catch (error) {
          throw new Error('indicare il b64url del gioco');
        }
      }
      if (gameUrl) {
        console.log("Now playing", gameUrl);
        this.shared.setGameUrl(gameUrl);
        this.shared.scenarioReadyObs.subscribe(() => this.takeactions(p));
        this.shared.initGame();
      }
  });
  }
  takeactions(p: Params) {
    if (p['qr']) {
      const qr = p['qr'];
      this.shared.triggerAction(qr);
    }
  }

}
