import { Component, OnInit } from '@angular/core';
import { SharedDataService } from './services/shared-data.service';
import { CameraSettingsService } from './services/camera-settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Ponte Virtuale';

  constructor(
    private shared: SharedDataService,
    private camera: CameraSettingsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.shared.scenarioReadyObs.subscribe((scenario) => {
      this.startOrResumePlay();
    });
    this.shared.initGame();
    this.camera.initSettings();
  }

  private startOrResumePlay() {
    if (! this.shared.play) {
      this.shared.startGame();
    }
    if (this.shared.play.currentPage) {
      this.router.navigate(['page', this.shared.play.currentPage]);
    } else {
      this.router.navigate(['']);
    }
  }

}
