import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
        const gameUrl = atob(p['b64url']);
        console.log(gameUrl);
        if (!this.shared.gameUrl || this.shared.gameUrl != gameUrl ) {
          this.shared.setGameUrl(gameUrl);
          this.shared.initGame();
          if (! this.shared.play) {
            this.shared.startGame();
          }
        }
        this.router.navigate(['']);
      }
    });
  }


  
}
