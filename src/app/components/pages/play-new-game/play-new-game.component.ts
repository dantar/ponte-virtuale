import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
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
      if (p['b64url']) {
        let gameUrl: string;
        try {
          gameUrl = atob(p['b64url']);
        } catch (error) {
          gameUrl = `../${p['b64url']}`;
        }
        console.log("Now playing", gameUrl);
        if (!this.shared.gameUrl) {
          this.shared.setGameUrl(gameUrl);
        }
        this.shared.scenarioReadyObs.subscribe(() => this.takeactions(p));
        this.shared.initGame();
      } else {
        throw new Error('indicare il b64url del gioco');
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
