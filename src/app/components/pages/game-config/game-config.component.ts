import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedDataService } from 'src/app/services/shared-data.service';

@Component({
  selector: 'app-game-config',
  templateUrl: './game-config.component.html',
  styleUrls: ['./game-config.component.scss']
})
export class GameConfigComponent implements OnInit {

  gameUrl: string;

  constructor(
    public shared: SharedDataService,
    private route: ActivatedRoute,
    private router: Router,
    ) {
  }

  ngOnInit(): void {
    this.gameUrl = this.shared.gameUrl || '';
    this.route.params.subscribe(p => {
      if (p['b64url']) {
        this.shared.setGameUrl(atob(p['b64url']));
        this.shared.startGame();
        this.router.navigate(['']);
      }
    });
  }

  saveUrl() {
    this.shared.setGameUrl(this.gameUrl);
    console.log('salvato');
  }

}
